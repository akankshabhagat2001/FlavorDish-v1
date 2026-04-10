import express from 'express';
import { ChatConversation, ChatMessage } from '../models/Chat.js';
import Order from '../models/Order.js';

const router = express.Router();

// Middleware to verify user
const verifyUser = async(req, res, next) => {
    const userId = req.headers['user-id'];
    if (!userId) return res.status(401).json({ error: 'User ID required' });
    req.userId = userId;
    next();
};

router.use(verifyUser);

// Get or create chat conversation for an order
router.post('/conversation/:orderId', async(req, res) => {
    try {
        const { orderId } = req.params;
        const { restaurantId } = req.body;

        // Check if conversation exists
        let conversation = await ChatConversation.findOne({ orderId });

        if (!conversation) {
            conversation = new ChatConversation({
                orderId,
                restaurantId,
                customerId: req.userId,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await conversation.save();
        }

        res.json({ conversation });
    } catch (error) {
        console.error('Create conversation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get chat messages for a conversation
router.get('/conversation/:conversationId/messages', async(req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await ChatMessage.find({
                conversationId: req.params.conversationId
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('senderId', 'name email photos')
            .exec();

        // Mark messages as read for current user
        const userRole = req.headers['user-role'] || 'customer';
        await ChatMessage.updateMany({
            conversationId: req.params.conversationId,
            senderId: { $ne: req.userId },
            isRead: false
        }, { isRead: true });

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

// Send a chat message
router.post('/message', async(req, res) => {
    try {
        const { conversationId, message, attachments } = req.body;
        const userRole = req.headers['user-role'] || 'customer';

        // Verify conversation exists and user has access
        const conversation = await ChatConversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const chatMessage = new ChatMessage({
            conversationId,
            senderId: req.userId,
            senderRole: userRole,
            message,
            attachments: attachments || [],
            isRead: false,
            createdAt: new Date()
        });

        await chatMessage.save();

        // Update conversation
        conversation.lastMessage = {
            text: message.substring(0, 100),
            timestamp: new Date(),
            from: userRole
        };
        conversation.updatedAt = new Date();

        // Increment unread for other parties
        if (userRole === 'customer') {
            conversation.unreadCount.restaurant += 1;
            if (conversation.driverId) conversation.unreadCount.driver += 1;
        } else if (userRole === 'restaurant') {
            conversation.unreadCount.customer += 1;
        } else if (userRole === 'driver') {
            conversation.unreadCount.customer += 1;
            conversation.unreadCount.restaurant += 1;
        }

        await conversation.save();

        res.json({
            success: true,
            message: chatMessage
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get unread count for a user
router.get('/unread-count', async(req, res) => {
    try {
        const userRole = req.headers['user-role'] || 'customer';
        let query = {};

        if (userRole === 'customer') {
            query.customerId = req.userId;
        } else if (userRole === 'restaurant') {
            query.restaurantId = req.userId;
        } else if (userRole === 'driver') {
            query.driverId = req.userId;
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

// Get all conversations for a user
router.get('/conversations', async(req, res) => {
    try {
        const userRole = req.headers['user-role'] || 'customer';
        let query = {};

        if (userRole === 'customer') {
            query.customerId = req.userId;
        } else if (userRole === 'restaurant') {
            query.restaurantId = req.userId;
        }

        const conversations = await ChatConversation.find(query)
            .sort({ updatedAt: -1 })
            .populate('orderId', 'status totalAmount')
            .populate('restaurantId', 'name')
            .populate('customerId', 'name')
            .exec();

        res.json({ conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;