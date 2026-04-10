import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import restaurantRoutes from './routes/restaurants.js';
import foodRoutes from './routes/food.js';
import orderRoutes from './routes/orders.js';
import bookingRoutes from './routes/bookings.js';
import suggestionRoutes from './routes/suggestions.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';
import reviewRoutes from './routes/reviews.js';
import chatRoutes from './routes/chat.js';
import formRoutes from './routes/forms.js';
import activityRoutes from './routes/activity.js';
import { ChatConversation, ChatMessage } from './models/Chat.js';
import Order from './models/Order.js';

dotenv.config();

const app = express();
const server = createServer(app);
const corsOrigin = process.env.FRONTEND_URL || '*';
const corsOptions = {
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
};

const io = new Server(server, {
    cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/activity', activityRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!', timestamp: new Date() });
});

// Socket.io for real-time order tracking, delivery location, and chat
const activeDeliveries = new Map(); // Track active deliveries
const userSockets = new Map(); // Map user IDs to socket IDs for notifications

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Register user socket
    const userId = socket.handshake.query.userId;
    if (userId) {
        userSockets.set(userId, socket.id);
    }

    // ============ CHAT HANDLERS ============

    // Join chat room for an order
    socket.on('join-chat', async(data) => {
        const { orderId, userId, userRole } = data;
        const roomId = `chat-${orderId}`;
        socket.join(roomId);
        console.log(`User ${userId} (${userRole}) joined chat for order ${orderId}`);
    });

    // Send chat message
    socket.on('send-message', async(data) => {
        try {
            const { conversationId, message, userId, userRole, orderId } = data;

            // Create chat message in database
            const chatMessage = new ChatMessage({
                conversationId,
                senderId: userId,
                senderRole: userRole,
                message,
                isRead: false,
                createdAt: new Date()
            });

            await chatMessage.save();

            // Update conversation
            const conversation = await ChatConversation.findById(conversationId);
            if (conversation) {
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
            }

            // Broadcast to chat room
            io.to(`chat-${orderId}`).emit('new-message', {
                id: chatMessage._id,
                sender: userId,
                senderRole: userRole,
                message,
                timestamp: chatMessage.createdAt,
                isRead: false
            });

            console.log(`Message sent in order ${orderId} by ${userRole}`);
        } catch (error) {
            console.error('Send message error:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Typing indicator
    socket.on('typing', (data) => {
        const { orderId, userId, userRole, isTyping } = data;
        io.to(`chat-${orderId}`).emit('user-typing', {
            userId,
            userRole,
            isTyping
        });
    });

    // Mark messages as read
    socket.on('mark-read', async(data) => {
        try {
            const { conversationId, userRole } = data;
            await ChatMessage.updateMany({ conversationId, isRead: false }, { isRead: true });

            const conversation = await ChatConversation.findById(conversationId);
            if (conversation) {
                conversation.unreadCount[userRole] = 0;
                await conversation.save();
            }

            io.to(`chat-${conversationId}`).emit('messages-read', { userRole });
        } catch (error) {
            console.error('Mark read error:', error);
        }
    });

    // ============ DELIVERY TRACKING HANDLERS ============

    // Customer joins order room to receive updates
    socket.on('join-order', (orderId) => {
        socket.join(`order-${orderId}`);
        console.log(`User ${socket.id} joined order ${orderId}`);
    });

    // Delivery boy sends live location
    socket.on('send-location', (data) => {
        const { orderId, location, status, timestamp } = data;

        // Store delivery location
        activeDeliveries.set(orderId, {
            location,
            status,
            timestamp,
            deliveryBoyId: socket.id
        });

        console.log(`Location update for order ${orderId}:`, location);

        // Broadcast to all users in the order room
        io.to(`order-${orderId}`).emit('delivery-location-update', {
            lat: location.lat,
            lng: location.lng,
            status,
            timestamp
        });
    });

    // Get delivery status
    socket.on('get-delivery-status', (orderId, callback) => {
        const delivery = activeDeliveries.get(orderId);
        if (delivery) {
            callback(delivery);
        }
    });

    // Update order status
    socket.on('update-order-status', async(data) => {
        try {
            const { orderId, status, userId } = data;

            // Update order in database
            await Order.findByIdAndUpdate(orderId, { status });

            // Broadcast status update
            io.to(`order-${orderId}`).emit('order-status-update', {
                status,
                timestamp: Date.now()
            });

            // Send notifications based on status
            const order = await Order.findById(orderId).populate('userId');
            if (order) {
                const notificationMessage = getNotificationMessage(status, orderId);
                io.to(`order-${orderId}`).emit('notification', notificationMessage);
            }

            console.log(`Order ${orderId} status updated to ${status}`);
        } catch (error) {
            console.error('Update status error:', error);
        }
    });

    // ============ RESTAURANT REAL-TIME HANDLERS ============

    // Subscribe to restaurant updates
    socket.on('subscribe_restaurants', () => {
        socket.join('restaurants_room');
        console.log(`Client ${socket.id} subscribed to restaurant updates`);
    });

    // Unsubscribe from restaurant updates
    socket.on('unsubscribe_restaurants', () => {
        socket.leave('restaurants_room');
        console.log(`Client ${socket.id} unsubscribed from restaurant updates`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove from user sockets map
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
            }
        }

        // Remove from active deliveries
        for (const [orderId, delivery] of activeDeliveries.entries()) {
            if (delivery.deliveryBoyId === socket.id) {
                activeDeliveries.delete(orderId);
            }
        }
    });
});

// Helper function to get notification message based on order status
function getNotificationMessage(status, orderId) {
    const messages = {
        'confirmed': {
            title: 'Order Confirmed',
            body: 'Your order has been confirmed! Your food is being prepared.',
            icon: '✅'
        },
        'preparing': {
            title: 'Preparing Your Order',
            body: 'Your delicious food is being prepared now.',
            icon: '👨‍🍳'
        },
        'ready': {
            title: 'Ready for Pickup',
            body: 'Your order is ready! Driver will pick it up soon.',
            icon: '📦'
        },
        'out_for_delivery': {
            title: 'Out for Delivery',
            body: 'Your order is on its way!',
            icon: '🏍️'
        },
        'delivered': {
            title: 'Order Delivered',
            body: 'Your order has been delivered. Rate your experience!',
            icon: '🎉'
        },
        'cancelled': {
            title: 'Order Cancelled',
            body: 'Your order has been cancelled.',
            icon: '❌'
        }
    };

    return messages[status] || {
        title: 'Order Update',
        body: `Your order status: ${status}`,
        icon: 'ℹ️'
    };
}

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB and start the server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flavorfinder';
const START_PORT = parseInt(process.env.PORT, 10) || 5000;
let currentPort = START_PORT;
let portAttempts = 0;
const MAX_PORT_ATTEMPTS = 3;

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && portAttempts < MAX_PORT_ATTEMPTS) {
        console.warn(`⚠️ Port ${currentPort} is already in use. Trying port ${currentPort + 1}...`);
        currentPort += 1;
        portAttempts += 1;
        server.listen(currentPort, '0.0.0.0');
        return;
    }

    console.error('❌ Server failed to start:', err);
    process.exit(1);
});

async function startServer() {
    try {
        await mongoose.connect(MONGODB_URI, {
            retryWrites: true,
            w: 'majority'
        });

        console.log('✅ MongoDB connected successfully');
        console.log(`Database: ${MONGODB_URI.split('/').pop()}`);

        server.listen(currentPort, '0.0.0.0', () => {
            console.log(`🚀 Server running on http://localhost:${currentPort}`);
            console.log(`🔗 API: http://localhost:${currentPort}/api`);
            console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message || err);
        console.log('ℹ️  Make sure MongoDB is running:');
        console.log('   - Local: mongod (ensure service is running)');
        console.log('   - Atlas: Check connection string and network access');
        process.exit(1);
    }
}

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
});

startServer();

async function closeMongoConnection() {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError);
    }
}

process.on('SIGINT', async() => {
    console.log('\n📍 Server shutting down...');
    await closeMongoConnection();
    process.exit(0);
});

process.on('SIGTERM', async() => {
    console.log('\n📍 Server terminating...');
    await closeMongoConnection();
    process.exit(0);
});

export { io };