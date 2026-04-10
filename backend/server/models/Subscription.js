import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    plan: {
        type: String,
        enum: ['basic', 'premium', 'elite'],
        required: true
    },
    monthlyFee: {
        type: Number,
        required: true
    },
    benefits: [String],
    freeDeliveries: {
        type: Number,
        default: 0
    },
    discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    prioritySupport: {
        type: Boolean,
        default: false
    },
    exclusiveOffers: {
        type: Boolean,
        default: false
    },
    bonusPoints: {
        type: Number,
        default: 0
    },
    freeDeliveriesUsed: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: Date,
    autoRenew: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    payments: [{
        paymentId: mongoose.Schema.Types.ObjectId,
        amount: Number,
        paymentStatus: {
            type: String,
            enum: ['pending', 'success', 'failed'],
            default: 'pending'
        },
        paidAt: Date,
        nextBillingDate: Date
    }],
    cancelledAt: Date,
    cancellationReason: String,
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
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ isActive: 1 });
subscriptionSchema.index({ endDate: 1 });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);