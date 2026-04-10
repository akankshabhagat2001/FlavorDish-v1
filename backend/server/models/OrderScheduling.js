import mongoose from 'mongoose';
const orderSchedulingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    scheduledFor: {
        type: Date,
        required: true,
        index: true
    },
    orderDetails: {
        items: [{
            itemId: mongoose.Schema.Types.ObjectId,
            itemName: String,
            quantity: Number,
            price: Number,
            notes: String
        }],
        totalAmount: Number,
        deliveryAddress: String,
        specialInstructions: String,
        estimatedDeliveryTime: Date
    },
    recurrence: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly'],
        default: 'none'
    },
    recurrenceEndDate: Date,
    schedule: [{
        dayOfWeek: Number, // 0-6 for weekly
        dayOfMonth: Number, // 1-31 for monthly
        time: String // HH:mm format
    }],
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'upi', 'wallet', 'cash'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'failed'],
        default: 'pending'
    },
    autoConfirm: {
        type: Boolean,
        default: true
    },
    reminderSettings: {
        emailReminder: Boolean,
        smsReminder: Boolean,
        appReminder: Boolean,
        reminderTime: String // minutes before order
    },
    subscriptionRequired: {
        type: Boolean,
        default: false
    },
    discountApplied: Number,
    discountPercentage: Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
orderSchedulingSchema.index({ userId: 1, status: 1 });
orderSchedulingSchema.index({ restaurantId: 1 });
orderSchedulingSchema.index({ scheduledFor: 1 });
orderSchedulingSchema.index({ recurrence: 1 });

export const OrderScheduling = mongoose.model('OrderScheduling', orderSchedulingSchema);