import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
    referrerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    referralCode: {
        type: String,
        unique: true,
        required: true,
        uppercase: true
    },
    discountPercentage: {
        type: Number,
        default: 10, // 10% discount for referral
        min: 0,
        max: 100
    },
    bonusPoints: {
        type: Number,
        default: 500 // Points earned for successful referral
    },
    referredUsers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        referredAt: Date,
        convertedAt: Date,
        minimumOrderValue: Number,
        orderCount: Number,
        totalSpent: Number,
        bonusPoints: Number,
        bonusEarned: Boolean,
        conversionStatus: {
            type: String,
            enum: ['pending', 'converted', 'expired'],
            default: 'pending'
        }
    }],
    totalReferrals: {
        type: Number,
        default: 0
    },
    successfulReferrals: {
        type: Number,
        default: 0
    },
    totalBonusPointsEarned: {
        type: Number,
        default: 0
    },
    totalBonusAmountEarned: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiryDate: Date,
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
referralSchema.index({ referrerId: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ createdAt: -1 });

export const Referral = mongoose.model('Referral', referralSchema);