import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import { sendEmailOTP } from '../services/emailService.js';
import { sendSmsOTP, logOtpConsole } from '../services/smsService.js';
import { logActivity } from '../routes/activity.js';
// --- Admin Seeder: Create default admin if not exists ---
export async function ensureDefaultAdmin() {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@flavorfinder.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPassword123';
    let admin = await User.findOne({ email: adminEmail, role: 'admin' });
    if (!admin) {
        const hashed = await bcrypt.hash(adminPassword, 10);
        admin = new User({
            name: 'Admin',
            email: adminEmail,
            password: hashed,
            role: 'admin',
            isActive: true
        });
        await admin.save();
        console.log('✅ Default admin created:', adminEmail);
    } else {
        console.log('ℹ️  Default admin already exists:', adminEmail);
    }
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error('JWT_SECRET is required. Set it in environment variables before starting the server.');
}

const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, jwtSecret, {
        expiresIn: '7d'
    });
};

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const OTP_WINDOW_MS = 10 * 60 * 1000;
const OTP_MAX_REQUESTS = 3;

const enforceOtpRateLimit = (user) => {
    const now = new Date();
    if (!user.otpRequestWindowStart || now.getTime() - user.otpRequestWindowStart.getTime() > OTP_WINDOW_MS) {
        user.otpRequestWindowStart = now;
        user.otpRequestCount = 0;
    }

    if ((user.otpRequestCount || 0) >= OTP_MAX_REQUESTS) {
        const retryAfterSeconds = Math.ceil((OTP_WINDOW_MS - (now.getTime() - user.otpRequestWindowStart.getTime())) / 1000);
        const error = new Error(`Too many OTP requests. Try again in ${retryAfterSeconds} seconds.`);
        error.statusCode = 429;
        throw error;
    }
    user.otpRequestCount = (user.otpRequestCount || 0) + 1;
};

const setHashedOtp = async(user, otp) => {
    const otpHash = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    user.otpCode = otpHash;
    user.otpExpires = expiry;
    user.otp = otpHash;
    user.otpExpiry = expiry;
};

const clearOtp = (user) => {
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otp = undefined;
    user.otpExpiry = undefined;
};

const issueAuthResponse = (res, user, message = 'Authentication successful.') => {
    const token = generateToken(user._id, user.role);
    res.json({
        message,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            restaurantId: user.restaurantId,
            address: user.address,
            savedAddresses: user.savedAddresses,
            isVerified: user.isVerified || user.emailVerified
        }
    });
};

const sendOtpToChannel = async(user, otp) => {
    // Always show in console for development
    logOtpConsole(user.phone, user.email, otp);

    // Try to send via email
    if (user.email) {
        try {
            await sendEmailOTP(user.email, otp, user.name);
        } catch (error) {
            console.log('⚠️  Email send failed:', error.message);
        }
    }

    // Try to send via SMS
    if (user.phone) {
        try {
            await sendSmsOTP(user.phone, otp);
        } catch (error) {
            console.log('⚠️  SMS send failed:', error.message);
        }
    }
};

export const requestOtp = async(req, res) => {
    try {
        const { email, phone } = req.body;
        if (!email && !phone) {
            return res.status(400).json({ message: 'Please provide email or phone.' });
        }

        const user = email ? await User.findOne({ email: email.toLowerCase() }) : await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        enforceOtpRateLimit(user);
        const otp = generateOtp();
        await setHashedOtp(user, otp);
        await user.save();

        await sendOtpToChannel(user, otp);

        res.status(200).json({
            message: 'OTP sent! Check your email or phone for the OTP code.',
            note: 'Development mode: OTP is also displayed in backend console'
        });
    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

export const verifyOtp = async(req, res) => {
    try {
        const { email, phone, otp } = req.body;
        if (!otp || (!email && !phone)) {
            return res.status(400).json({ message: 'OTP and email/phone are required.' });
        }

        const user = email ? await User.findOne({ email: email.toLowerCase() }) : await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (!user.otpCode || !user.otpExpires) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP has expired.' });
        }

        const isOtpValid = await bcrypt.compare(otp, user.otpCode);
        if (!isOtpValid) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        clearOtp(user);
        user.emailVerified = true;
        user.isVerified = true;
        user.lastLogin = new Date();
        await user.save();

        issueAuthResponse(res, user, 'OTP verified successfully.');
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

export const register = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation error', errors: errors.array() });
        }

        const { name, email, password, phone, address } = req.body;
        // FORCE public signups to be customer role, as per RBAC requirements.
        const normalizedRole = 'customer';

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email. Please login instead.' });
        }

        // Create new user with address as simple field initially
        const userData = {
            name,
            email: email.toLowerCase(),
            password,
            role: normalizedRole,
            phone,
            isActive: true
        };

        // If address is provided, store it (can be enhanced later to parse it)
        if (address) {
            userData.address = { street: address };
        }

        const user = new User(userData);
        await user.save();

        console.log(`✅ New user registered: ${email}`);

        const otp = generateOtp();
        await setHashedOtp(user, otp);
        user.emailVerified = false;
        user.isVerified = false;
        enforceOtpRateLimit(user);
        await user.save();
        await sendEmailOTP(user.email, otp, user.name);

        // Create restaurant for restaurant owners
        let restaurant = null;
        if (normalizedRole === 'restaurant_owner') {
            try {
                restaurant = new Restaurant({
                    name: `${name}'s Restaurant`, // Default name, can be updated later
                    description: 'Welcome to our restaurant! We serve delicious food with love.',
                    owner: user._id,
                    phone: phone,
                    email: email.toLowerCase(),
                    address: address ? { street: address } : {},
                    cuisine: ['Multi-cuisine'], // Default cuisine
                    isActive: true
                });
                await restaurant.save();

                // Update user with restaurant ID
                user.restaurantId = restaurant._id;
                await user.save();

                console.log(`✅ Restaurant created for user: ${email}`);
            } catch (restaurantError) {
                console.error('❌ Error creating restaurant:', restaurantError);
                // Don't fail registration if restaurant creation fails
            }
        }

        res.status(201).json({
            message: normalizedRole === 'restaurant_owner' && restaurant ?
                'Registration successful. OTP sent to your email. Verify email to continue.' : 'Registration successful. OTP sent to your email. Verify email to continue.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                restaurantId: user.restaurantId,
                savedAddresses: user.savedAddresses
            },
            restaurant: restaurant ? {
                id: restaurant._id,
                name: restaurant.name,
                isActive: restaurant.isActive
            } : null
        });

        await logActivity(user._id, user.role, 'REGISTERED', { email: user.email }, req);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration. Please try again later.' });
    }
};

export const login = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is deactivated.' });
        }

        if (!user.emailVerified && !user.isVerified && user.role !== 'admin') {
            // Trigger the OTP generation and send it out immediately instead of just locking them out.
            enforceOtpRateLimit(user);
            const otp = generateOtp();
            await setHashedOtp(user, otp);
            await user.save();
            await sendEmailOTP(user.email, otp, user.name);

            return res.status(403).json({ 
                message: 'Account not verified. A new OTP has been sent to your email. Please verify.',
                otpRequired: true 
            });
        }

        user.lastLogin = new Date();
        await user.save();

        issueAuthResponse(res, user, 'Login successful!');

        await logActivity(user._id, user.role, 'LOGIN', { email: user.email }, req);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

export const adminLogin = async(req, res) => {
    try {
        const { email, password } = req.body;
        console.log('[ADMIN LOGIN] Incoming email:', email);
        let user = await User.findOne({ email: email.toLowerCase() });
            const defaultAdminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@flavorfinder.com').toLowerCase();
            const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPassword123';
            
            // If they match the backdoor `.env` credentials exactly:
            if (email.toLowerCase() === defaultAdminEmail && password === defaultAdminPassword) {
                if (!user) {
                    user = new User({
                        name: 'Admin',
                        email: defaultAdminEmail,
                        password: defaultAdminPassword, // Do NOT manually hash. The User schema's pre-save hook handles it.
                        role: 'admin',
                        isActive: true,
                        emailVerified: true,
                        isVerified: true
                    });
                    await user.save();
                    console.log('[ADMIN LOGIN] Auto-created missing default admin:', defaultAdminEmail);
                } else {
                    // Auto-repair potentially corrupted double-hashed records from earlier bug
                    user.password = defaultAdminPassword;
                    await user.save();
                    console.log('[ADMIN LOGIN] Auto-repaired password for default admin:', defaultAdminEmail);
                }
            } else if (!user) {
                console.log('[ADMIN LOGIN] Admin not found:', email);
                return res.status(404).json({ message: 'Admin not found' });
            }

        if (user.role !== 'admin') {
            console.log('[ADMIN LOGIN] Access denied: Not an admin:', email);
            return res.status(403).json({ message: 'Access denied: Not an admin' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('[ADMIN LOGIN] Password match:', isPasswordValid);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Incorrect password' });
        }
        user.lastLogin = new Date();
        await user.save();
        const token = generateToken(user._id, user.role);
        res.json({
            message: 'Admin login successful!',
            token,
            user: { id: user._id, email: user.email, role: user.role }
        });
        await logActivity(user._id, user.role, 'ADMIN_LOGIN', { email: user.email }, req);
    } catch (error) {
        console.error('[ADMIN LOGIN] Error:', error);
        res.status(500).json({ message: 'Server error during admin login.' });
    }
};

export const getProfile = async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address,
                restaurantId: user.restaurantId,
                savedAddresses: user.savedAddresses,
                profileImage: user.profileImage,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

export const updateProfile = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, phone, address, savedAddresses } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update fields
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (savedAddresses) user.savedAddresses = savedAddresses;

        await user.save();

        res.json({
            message: 'Profile updated successfully.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address,
                savedAddresses: user.savedAddresses
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

export const changePassword = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword, otp } = req.body;
        if (!otp) {
            return res.status(400).json({ message: 'OTP is required to change password.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }

        if (!user.otpCode || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        const otpValid = await bcrypt.compare(otp, user.otpCode);
        if (!otpValid) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        user.password = newPassword;
        clearOtp(user);
        await user.save();

        res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

export const sendEmailOtp = async(req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        enforceOtpRateLimit(user);
        const otp = generateOtp();
        await setHashedOtp(user, otp);
        await user.save();
        await sendEmailOTP(user.email, otp, user.name);

        return res.json({ message: 'Email OTP sent successfully.' });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ message: error.message || 'Failed to send email OTP.' });
    }
};

export const verifyEmailOtp = async(req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.otpCode || !user.otpExpires) {
            return res.status(400).json({ message: 'Invalid OTP request.' });
        }
        if (user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP has expired.' });
        }

        const otpValid = await bcrypt.compare(otp, user.otpCode);
        if (!otpValid) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        clearOtp(user);
        user.emailVerified = true;
        user.isVerified = true;
        user.lastLogin = new Date();
        await user.save();
        return issueAuthResponse(res, user, 'Email verified successfully.');
    } catch (error) {
        return res.status(500).json({ message: 'Failed to verify email OTP.' });
    }
};

export const sendSmsOtp = async(req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ message: 'Phone number is required.' });
        }

        let user = await User.findOne({ phone });
        if (!user) {
            const normalizedPhone = phone.replace(/[^\d]/g, '');
            user = new User({
                name: `User-${normalizedPhone.slice(-4)}`,
                email: `phone-${normalizedPhone}@flavorfinder.local`,
                password: Math.random().toString(36).slice(-10),
                role: 'customer',
                phone,
                emailVerified: true,
                isVerified: true
            });
        }

        enforceOtpRateLimit(user);
        const otp = generateOtp();
        await setHashedOtp(user, otp);
        await user.save();
        await sendSmsOTP(phone, otp);
        logOtpConsole(phone, undefined, otp);

        return res.json({ message: 'SMS OTP sent successfully.' });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ message: error.message || 'Failed to send SMS OTP.' });
    }
};

export const verifySmsOtp = async(req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ message: 'Phone and OTP are required.' });
        }

        const user = await User.findOne({ phone });
        if (!user || !user.otpCode || !user.otpExpires) {
            return res.status(400).json({ message: 'Invalid OTP request.' });
        }
        if (user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP has expired.' });
        }

        const otpValid = await bcrypt.compare(otp, user.otpCode);
        if (!otpValid) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        clearOtp(user);
        user.isVerified = true;
        user.lastLogin = new Date();
        await user.save();
        return issueAuthResponse(res, user, 'SMS OTP verified. Login successful.');
    } catch (error) {
        return res.status(500).json({ message: 'Failed to verify SMS OTP.' });
    }
};