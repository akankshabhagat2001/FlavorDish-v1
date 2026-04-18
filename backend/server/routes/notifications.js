import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles as authorize } from '../middleware/roleMiddleware.js';;
import { body, validationResult } from 'express-validator';
import { logActivity } from './activity.js';

const router = express.Router();

router.use(authenticate);

// Get user notification preferences
router.get('/preferences', async(req, res) => {
    try {
        const user = await User.findById(req.user._id).select('notificationPreferences');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user.notificationPreferences || {
            email: {
                orderUpdates: true,
                promotions: true,
                security: true,
                chatMessages: true
            },
            push: {
                orderUpdates: true,
                promotions: false,
                chatMessages: true,
                deliveryUpdates: true
            },
            sms: {
                orderUpdates: true,
                security: true,
                deliveryUpdates: true
            }
        });
    } catch (error) {
        console.error('Get notification preferences error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update notification preferences
router.put('/preferences', [
    body('email').optional().isObject().withMessage('Email preferences must be an object'),
    body('push').optional().isObject().withMessage('Push preferences must be an object'),
    body('sms').optional().isObject().withMessage('SMS preferences must be an object')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, push, sms } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (!user.notificationPreferences) {
            user.notificationPreferences = {};
        }

        if (email) user.notificationPreferences.email = {...user.notificationPreferences.email, ...email };
        if (push) user.notificationPreferences.push = {...user.notificationPreferences.push, ...push };
        if (sms) user.notificationPreferences.sms = {...user.notificationPreferences.sms, ...sms };

        await user.save();

        await logActivity(req.user._id, req.user.role, 'NOTIFICATION_PREFERENCES_UPDATED', {}, req);

        res.json({
            message: 'Notification preferences updated successfully.',
            preferences: user.notificationPreferences
        });
    } catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get user notifications
router.get('/', async(req, res) => {
    try {
        const { page = 1, limit = 20, read, type } = req.query;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        let notifications = user.notifications || [];

        // Filter by read status
        if (read !== undefined) {
            const isRead = read === 'true';
            notifications = notifications.filter(n => n.isRead === isRead);
        }

        // Filter by type
        if (type) {
            notifications = notifications.filter(n => n.type === type);
        }

        // Sort by created date (newest first)
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Paginate
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedNotifications = notifications.slice(startIndex, endIndex);

        res.json({
            notifications: paginatedNotifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: notifications.length,
                pages: Math.ceil(notifications.length / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Mark notification as read
router.put('/:notificationId/read', async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const notificationIndex = user.notifications.findIndex(n => n._id.toString() === req.params.notificationId);
        if (notificationIndex === -1) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        user.notifications[notificationIndex].isRead = true;
        user.notifications[notificationIndex].readAt = new Date();

        await user.save();

        res.json({
            message: 'Notification marked as read.',
            notification: user.notifications[notificationIndex]
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Mark all notifications as read
router.put('/read-all', async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.notifications.forEach(notification => {
            if (!notification.isRead) {
                notification.isRead = true;
                notification.readAt = new Date();
            }
        });

        await user.save();

        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Delete notification
router.delete('/:notificationId', async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.notifications = user.notifications.filter(n => n._id.toString() !== req.params.notificationId);
        await user.save();

        res.json({ message: 'Notification deleted successfully.' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Clear all notifications
router.delete('/', async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.notifications = [];
        await user.save();

        res.json({ message: 'All notifications cleared.' });
    } catch (error) {
        console.error('Clear notifications error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get unread notification count
router.get('/unread-count', async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const unreadCount = user.notifications.filter(n => !n.isRead).length;

        res.json({ unreadCount });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Send test notification (Admin only)
router.post('/test', authorize('admin'), [
    body('userId').isMongoId().withMessage('Valid user ID required'),
    body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required'),
    body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message is required'),
    body('type').isIn(['order', 'promotion', 'security', 'chat', 'system']).withMessage('Invalid notification type')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId, title, message, type } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const notification = {
            _id: require('mongoose').Types.ObjectId(),
            type,
            title,
            message,
            data: {},
            isRead: false,
            createdAt: new Date()
        };

        user.notifications.unshift(notification);
        await user.save();

        // Emit real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${userId}`).emit('notification', notification);
        }

        res.json({
            message: 'Test notification sent successfully.',
            notification
        });
    } catch (error) {
        console.error('Send test notification error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Broadcast notification to all users (Admin only)
router.post('/broadcast', authorize('admin'), [
    body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required'),
    body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message is required'),
    body('type').isIn(['promotion', 'system', 'maintenance']).withMessage('Invalid broadcast type'),
    body('targetRoles').optional().isArray().withMessage('Target roles must be an array')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, message, type, targetRoles } = req.body;

        let query = {};
        if (targetRoles && targetRoles.length > 0) {
            query.role = { $in: targetRoles };
        }

        const users = await User.find(query);
        const notification = {
            _id: require('mongoose').Types.ObjectId(),
            type,
            title,
            message,
            data: { isBroadcast: true },
            isRead: false,
            createdAt: new Date()
        };

        const io = req.app.get('io');
        let sentCount = 0;

        for (const user of users) {
            user.notifications.unshift({...notification });
            await user.save();
            sentCount++;

            // Emit real-time notification
            if (io) {
                io.to(`user-${user._id}`).emit('notification', notification);
            }
        }

        await logActivity(req.user._id, req.user.role, 'NOTIFICATION_BROADCAST', { sentCount, type }, req);

        res.json({
            message: `Notification broadcasted to ${sentCount} users.`,
            sentCount
        });
    } catch (error) {
        console.error('Broadcast notification error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Helper function to create notification
export const createNotification = async(userId, type, title, message, data = {}) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        const notification = {
            _id: require('mongoose').Types.ObjectId(),
            type,
            title,
            message,
            data,
            isRead: false,
            createdAt: new Date()
        };

        user.notifications.unshift(notification);

        // Keep only last 100 notifications
        if (user.notifications.length > 100) {
            user.notifications = user.notifications.slice(0, 100);
        }

        await user.save();

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
    }
};

// Helper function to send real-time notification
export const sendRealTimeNotification = (io, userId, notification) => {
    if (io) {
        io.to(`user-${userId}`).emit('notification', notification);
    }
};

export default router;
