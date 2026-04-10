import mongoose from 'mongoose';

const loyaltyTierSchema = new mongoose.Schema({
    name: {
        type: String,
        enum: ['silver', 'gold', 'platinum'],
        required: true,
        unique: true
    },
    minPoints: {
        type: Number,
        required: true,
        unique: true
    },
    maxPoints: Number,
    cashbackRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    benefits: [
        {
            type: String,
            description: String
        }
    ],
    icon: String,
    iconColor: String,
    welcomeBonus: {
        type: Number,
        default: 0
    },
    features: {
        freeDeliveryDays: [String], // ['monday', 'tuesday', 'wednesday']
        birthdayBonus: Number,
        milestoneBonus: {
            ordersRequired: Number,
            pointsReward: Number
        },
        referralBonus: Number,
        earningsMultiplier: {
            type: Number,
            default: 1.0
        }
    },
    requirements: {
        minOrdersPerMonth: Number,
        minSpendPerMonth: Number
    },
    autoDowngradeAfterMonths: {
        type: Number,
        default: 12
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

// Indexes
loyaltyTierSchema.index({ minPoints: 1 });
loyaltyTierSchema.index({ cashbackRate: -1 });

export const LoyaltyTier = mongoose.model('LoyaltyTier', loyaltyTierSchema);
