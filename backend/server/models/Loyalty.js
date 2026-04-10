import mongoose from 'mongoose';

const loyaltySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    tier: {
        type: String,
        enum: ['silver', 'gold', 'platinum'],
        default: 'silver'
    },
    totalPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    availableBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    transactionHistory: [{
        type: {
            type: String,
            enum: ['earned', 'redeemed', 'expired', 'bonus'],
            required: true
        },
        points: {
            type: Number,
            required: true
        },
        source: {
            type: String,
            enum: ['order', 'referral', 'birthday', 'milestone', 'admin', 'redemption'],
            required: true
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        description: String,
        createdAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    }],
    tierUpgradeDate: Date,
    lastPointsUpdate: {
        type: Date,
        default: Date.now
    },
    pointsExpiryDates: [{
        points: Number,
        expiresAt: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for queries
loyaltySchema.index({ userId: 1, tier: 1 });
loyaltySchema.index({ totalPoints: -1 }); // For leaderboards
loyaltySchema.index({ createdAt: -1 });

export const Loyalty = mongoose.model('Loyalty', loyaltySchema);
