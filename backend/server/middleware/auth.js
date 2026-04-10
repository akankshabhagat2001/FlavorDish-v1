import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

export const authenticate = async(req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;
        if (!token) {
            return res.status(401).json({ message: 'Authorization token missing.' });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.userId);

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

const normalizeRole = (role) => {
    if (role === 'restaurant') return 'restaurant_owner';
    if (role === 'delivery') return 'delivery_partner';
    return role;
};

export const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    const userRole = normalizeRole(req.user.role);
    const allowedRoles = roles.map(normalizeRole);

    if (roles.length > 0 && !allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
    }

    next();
};

export const optionalAuth = async(req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;

        if (token) {
            const decoded = jwt.verify(token, jwtSecret);
            const user = await User.findById(decoded.userId);
            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // If token is invalid or expires, just continue without auth
        next();
    }
};