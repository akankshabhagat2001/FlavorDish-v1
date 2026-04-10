import express from 'express';
import { ChatConversation, ChatMessage } from '../models/Chat.js';
import Order from '../models/Order.js';
import { authenticate } from '../middleware/auth.js';

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
        const { restaurantId } = req.body;

        // Check if conversation exists
        let conversation = await ChatConversation.findOne({ orderId });

        if (!conversation) {
            conversation = new ChatConversation({
                orderId,
                restaurantId,
                customerId: req.user._id,
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
        const userRole = getChatRole(req.user?.role);
        await ChatMessage.updateMany({
            conversationId: req.params.conversationId,
            senderId: { $ne: req.user._id },
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
        const userRole = getChatRole(req.user?.role);

        // Verify conversation exists and user has access
        const conversation = await ChatConversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const chatMessage = new ChatMessage({
            conversationId,
            senderId: req.user._id,
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
        const userRole = getChatRole(req.user?.role);
        let query = {};

        if (userRole === 'customer') {
            query.customerId = req.user._id;
        } else if (userRole === 'restaurant') {
            query.restaurantId = req.user._id;
        } else if (userRole === 'driver') {
            query.driverId = req.user._id;
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
        const userRole = getChatRole(req.user?.role);
        let query = {};

        if (userRole === 'customer') {
            query.customerId = req.user._id;
        } else if (userRole === 'restaurant') {
            query.restaurantId = req.user._id;
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