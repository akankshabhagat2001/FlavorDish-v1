import express from 'express';
import { body } from 'express-validator';
import { register, login, adminLogin, requestOtp, verifyOtp, getProfile, updateProfile, changePassword, sendEmailOtp, verifyEmailOtp, sendSmsOtp, verifySmsOtp } from '../controllers/authController.js';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';;

const router = express.Router();

// Validation rules
const registerValidation = [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters long'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').optional().isIn(['customer', 'restaurant_owner', 'delivery_partner', 'restaurant', 'delivery']).withMessage('Invalid role')
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Password is required')
];

const updateProfileValidation = [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters long'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
];

const changePasswordValidation = [
    body('currentPassword').exists().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/admin-login', loginValidation, adminLogin);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/send-email-otp', [body('email').isEmail().withMessage('Valid email is required')], sendEmailOtp);
router.post('/verify-email-otp', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('6-digit OTP is required')
], verifyEmailOtp);
router.post('/send-sms-otp', [body('phone').trim().notEmpty().withMessage('Phone number is required')], sendSmsOtp);
router.post('/verify-sms-otp', [
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('6-digit OTP is required')
], verifySmsOtp);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, changePassword);

export default router;
