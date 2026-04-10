import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Helper function to log activity
export const logActivity = async (userId, userRole, action, details = {}, req = null) => {
    try {
        const log = new ActivityLog({
            userId,
            userRole,
            action,
            details,
            ipAddress: req ? (req.ip || req.connection.remoteAddress) : undefined,
            userAgent: req ? req.headers['user-agent'] : undefined
        });
        
        await log.save();
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};

// Route to fetch activity logs (Admin Only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 50, action, role } = req.query;
        
        let query = {};
        if (action) {
            query.action = action;
        }
        if (role) {
            query.userRole = role;
        }

        const logs = await ActivityLog.find(query)
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await ActivityLog.countDocuments(query);

        res.json({
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ message: 'Server error while fetching activity logs.' });
    }
});

export default router;
