import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error('JWT_SECRET is required. Set it in environment variables before starting the server.');
}

/**
 * Verify JWT token and attach user to request object
 */
export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;
        if (!token) {
            return res.status(401).json({ message: 'Authorization token missing.' });
        }

        const decoded = jwt.verify(token, jwtSecret);
        // Support both { id } (authController) and legacy { userId }
        const user = await User.findById(decoded.id || decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'Invalid user token.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

/**
 * Optional authentication that doesn't block unauthenticated requests
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;

        if (token) {
            const decoded = jwt.verify(token, jwtSecret);
            const user = await User.findById(decoded.id || decoded.userId);
            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // If token is invalid or expired, just continue without auth
        next();
    }
};
