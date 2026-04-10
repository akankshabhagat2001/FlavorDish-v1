import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatConversation',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['customer', 'restaurant', 'driver'],
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    attachments: [{
        type: String,
        url: String
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

const chatConversationSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true,
        index: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastMessage: {
        text: String,
        timestamp: Date,
        from: String
    },
    unreadCount: {
        customer: {
            type: Number,
            default: 0
        },
        restaurant: {
            type: Number,
            default: 0
        },
        driver: {
            type: Number,
            default: 0
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for quick lookups
chatConversationSchema.index({ customerId: 1, createdAt: -1 });
chatConversationSchema.index({ restaurantId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export const ChatConversation = mongoose.model('ChatConversation', chatConversationSchema);