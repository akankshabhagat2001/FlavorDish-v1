import express from 'express';
import { ChatConversation, ChatMessage } from '../models/Chat.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles as authorize } from '../middleware/roleMiddleware.js';;
import { body, validationResult } from 'express-validator';
import { logActivity } from './activity.js';

const router = express.Router();

router.use(authenticate);

const getChatRole = (role) => {
    if (role === 'restaurant_owner') return 'restaurant';
    if (role === 'delivery_partner') return 'driver';
    return role || 'customer';
};

// Get or create chat conversation for an order
router.post('/conversation/:orderId', async(req, res) => {
    try {
        const { orderId } = req.params;

        // Verify order exists and user has access
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if user is part of this order
        const userRole = getChatRole(req.user.role);
        const hasAccess = (
            order.customer.toString() === req.user._id.toString() ||
            (userRole === 'restaurant' && order.restaurant.toString() === req.user._id.toString()) ||
            (userRole === 'driver' && order.deliveryPartner ?.toString() === req.user._id.toString())
        );

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if conversation exists
        let conversation = await ChatConversation.findOne({ orderId });

        if (!conversation) {
            conversation = new ChatConversation({
                orderId,
                restaurantId: order.restaurant,
                customerId: order.customer,
                driverId: order.deliveryPartner,
                createdAt: new Date(),
                updatedAt: new Date(),
                unreadCount: { customer: 0, restaurant: 0, driver: 0 },
                participants: [
                    { userId: order.customer, role: 'customer' },
                    { userId: order.restaurant, role: 'restaurant' }
                ]
            });

            if (order.deliveryPartner) {
                conversation.participants.push({ userId: order.deliveryPartner, role: 'driver' });
            }

            await conversation.save();
        }

        await conversation.populate('orderId', 'status totalAmount');
        await conversation.populate('restaurantId', 'name image');
        await conversation.populate('customerId', 'name');
        await conversation.populate('driverId', 'name');

        res.json({ conversation });
    } catch (error) {
        console.error('Create conversation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get chat messages for a conversation with pagination
router.get('/conversation/:conversationId/messages', async(req, res) => {
    try {
        const { limit = 50, page = 1, before } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = { conversationId: req.params.conversationId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await ChatMessage.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('senderId', 'name')
            .populate('reactions.userId', 'name')
            .exec();

        // Mark messages as read for current user
        const userRole = getChatRole(req.user ?.role);
        await ChatMessage.updateMany({
            conversationId: req.params.conversationId,
            senderId: { $ne: req.user._id },
            isRead: false,
            'readBy.userId': { $ne: req.user._id }
        }, {
            $push: { readBy: { userId: req.user._id, readAt: new Date() } },
            isRead: true
        });

        // Update unread count in conversation
        const conversation = await ChatConversation.findById(req.params.conversationId);
        if (conversation) {
            conversation.unreadCount[userRole] = 0;
            await conversation.save();
        }

        res.json({ messages: messages.reverse() });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send a chat message with enhanced features
router.post('/message', [
    body('conversationId').isMongoId().withMessage('Valid conversation ID required'),
    body('message').optional().trim().isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters'),
    body('messageType').optional().isIn(['text', 'image', 'file', 'location']).withMessage('Invalid message type'),
    body('attachments').optional().isArray().withMessage('Attachments must be an array')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { conversationId, message, messageType = 'text', attachments = [] } = req.body;
        const userRole = getChatRole(req.user ?.role);

        // Verify conversation exists and user has access
        const conversation = await ChatConversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const hasAccess = conversation.participants.some(p => p.userId.toString() === req.user._id.toString());
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const chatMessage = new ChatMessage({
            conversationId,
            senderId: req.user._id,
            senderRole: userRole,
            message,
            messageType,
            attachments,
            reactions: [],
            readBy: [{ userId: req.user._id, readAt: new Date() }],
            isRead: false,
            createdAt: new Date()
        });

        await chatMessage.save();

        // Update conversation
        conversation.lastMessage = {
            text: message ? message.substring(0, 100) : `Sent ${messageType}`,
            timestamp: new Date(),
            from: userRole,
            senderId: req.user._id
        };
        conversation.updatedAt = new Date();

        // Increment unread for other parties
        conversation.participants.forEach(participant => {
            if (participant.userId.toString() !== req.user._id.toString()) {
                const role = participant.role;
                conversation.unreadCount[role] = (conversation.unreadCount[role] || 0) + 1;
            }
        });

        await conversation.save();

        await chatMessage.populate('senderId', 'name');

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.to(`conversation-${conversationId}`).emit('new-message', {
                message: chatMessage,
                conversation: conversation
            });
        }

        await logActivity(req.user._id, req.user.role, 'MESSAGE_SENT', { conversationId, messageType }, req);

        res.json({
            success: true,
            message: chatMessage
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add reaction to message
router.post('/message/:messageId/reaction', [
    body('emoji').isLength({ min: 1, max: 10 }).withMessage('Valid emoji required')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { emoji } = req.body;

        const message = await ChatMessage.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Check if user already reacted
        const existingReactionIndex = message.reactions.findIndex(r => r.userId.toString() === req.user._id.toString());

        if (existingReactionIndex !== -1) {
            // Update existing reaction
            message.reactions[existingReactionIndex].emoji = emoji;
            message.reactions[existingReactionIndex].createdAt = new Date();
        } else {
            // Add new reaction
            message.reactions.push({
                userId: req.user._id,
                emoji,
                createdAt: new Date()
            });
        }

        await message.save();
        await message.populate('reactions.userId', 'name');

        res.json({
            success: true,
            message: 'Reaction added successfully',
            reactions: message.reactions
        });
    } catch (error) {
        console.error('Add reaction error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove reaction from message
router.delete('/message/:messageId/reaction', async(req, res) => {
    try {
        const message = await ChatMessage.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        message.reactions = message.reactions.filter(r => r.userId.toString() !== req.user._id.toString());
        await message.save();

        res.json({
            success: true,
            message: 'Reaction removed successfully'
        });
    } catch (error) {
        console.error('Remove reaction error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get unread count for a user
router.get('/unread-count', async(req, res) => {
    try {
        const userRole = getChatRole(req.user ?.role);
        let query = {};

        if (userRole === 'customer') {
            query['participants.userId'] = req.user._id;
            query['participants.role'] = 'customer';
        } else if (userRole === 'restaurant') {
            query['participants.userId'] = req.user._id;
            query['participants.role'] = 'restaurant';
        } else if (userRole === 'driver') {
            query['participants.userId'] = req.user._id;
            query['participants.role'] = 'driver';
        }

        const conversations = await ChatConversation.find(query);

        let totalUnread = 0;
        conversations.forEach(conv => {
            totalUnread += conv.unreadCount[userRole] || 0;
        });

        res.json({ unreadCount: totalUnread });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all conversations for a user with enhanced info
router.get('/conversations', async(req, res) => {
    try {
        const userRole = getChatRole(req.user ?.role);
        const { page = 1, limit = 20 } = req.query;

        let query = {};
        query['participants.userId'] = req.user._id;
        query['participants.role'] = userRole;

        const conversations = await ChatConversation.find(query)
            .sort({ updatedAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .populate('orderId', 'status totalAmount items')
            .populate('restaurantId', 'name image rating')
            .populate('customerId', 'name')
            .populate('driverId', 'name')
            .populate('lastMessage.senderId', 'name')
            .exec();

        const total = await ChatConversation.countDocuments(query);

        res.json({
            conversations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark conversation as read
router.put('/conversation/:conversationId/read', async(req, res) => {
    try {
        const userRole = getChatRole(req.user ?.role);

        const conversation = await ChatConversation.findById(req.params.conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const hasAccess = conversation.participants.some(p => p.userId.toString() === req.user._id.toString());
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        conversation.unreadCount[userRole] = 0;
        await conversation.save();

        res.json({ success: true, message: 'Conversation marked as read' });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Search messages in conversation
router.get('/conversation/:conversationId/search', [
    body('query').trim().isLength({ min: 1 }).withMessage('Search query required')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { query } = req.query;

        const conversation = await ChatConversation.findById(req.params.conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const hasAccess = conversation.participants.some(p => p.userId.toString() === req.user._id.toString());
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const messages = await ChatMessage.find({
                conversationId: req.params.conversationId,
                message: { $regex: query, $options: 'i' }
            })
            .populate('senderId', 'name')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ messages });
    } catch (error) {
        console.error('Search messages error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete message (only by sender within 5 minutes)
router.delete('/message/:messageId', async(req, res) => {
    try {
        const message = await ChatMessage.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Can only delete your own messages' });
        }

        // Check if message is within 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (message.createdAt < fiveMinutesAgo) {
            return res.status(400).json({ error: 'Can only delete messages within 5 minutes' });
        }

        await ChatMessage.findByIdAndDelete(req.params.messageId);

        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get conversation participants
router.get('/conversation/:conversationId/participants', async(req, res) => {
    try {
        const conversation = await ChatConversation.findById(req.params.conversationId)
            .populate('participants.userId', 'name email phone');

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const hasAccess = conversation.participants.some(p => p.userId.toString() === req.user._id.toString());
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ participants: conversation.participants });
    } catch (error) {
        console.error('Get participants error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
