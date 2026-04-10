import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import { sendEmailOTP } from '../services/emailService.js';
import { sendSmsOTP, logOtpConsole } from '../services/smsService.js';
import { logActivity } from '../routes/activity.js';

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '7d'
    });
};

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtpToChannel = async (user, otp) => {
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

export const requestOtp = async (req, res) => {
    try {
        const { email, phone } = req.body;
        if (!email && !phone) {
            return res.status(400).json({ message: 'Please provide email or phone.' });
        }

        const user = email ? await User.findOne({ email: email.toLowerCase() }) : await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const otp = generateOtp();
        user.otpCode = otp;
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
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

export const verifyOtp = async (req, res) => {
    try {
        const { email, phone, otp } = req.body;
        if (!otp || (!email && !phone)) {
            return res.status(400).json({ message: 'OTP and email/phone are required.' });
        }

        const user = email ? await User.findOne({ email: email.toLowerCase() }) : await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (!user.otpCode || !user.otpExpires || user.otpCode !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP has expired.' });
        }

        user.otpCode = undefined;
        user.otpExpires = undefined;
        user.emailVerified = true;
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);

        res.json({
            message: 'OTP verified successfully.',
            token,
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
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

export const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Validation error', errors: errors.array() });
        }

        const { name, email, password, role = 'customer', phone, address } = req.body;

        // Validate role
        const validRoles = ['customer', 'restaurant_owner', 'delivery_partner', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role selected. Please choose customer, restaurant_owner, delivery_partner, or admin.' });
        }

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
            role,
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

        // Auto-verify on register (no OTP needed)
        user.emailVerified = true;
        user.lastLogin = new Date();
        await user.save();

        // Create restaurant for restaurant owners
        let restaurant = null;
        if (role === 'restaurant_owner') {
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

        // Generate token for immediate login
        const token = generateToken(user._id);

        res.status(201).json({
            message: role === 'restaurant_owner' && restaurant ?
                'Registration successful! Your restaurant has been created. You can now login and complete your restaurant profile.' : 'Registration successful! You can now login.',
            token,
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

export const login = async (req, res) => {
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

        // Direct login without OTP (no email verification required)
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);

        res.json({
            message: 'Login successful!',
            token,
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

        await logActivity(user._id, user.role, 'LOGIN', { email: user.email }, req);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

export const getProfile = async (req, res) => {
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

export const updateProfile = async (req, res) => {
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

export const changePassword = async (req, res) => {
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

        if (user.otpCode !== otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        user.password = newPassword;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};
