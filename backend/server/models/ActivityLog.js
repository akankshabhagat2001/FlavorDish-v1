import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userRole: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        description: 'Type of action performed e.g., LOGIN, ORDER_PLACED, PROFILE_UPDATE, RESTAURANT_APPROVED'
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        description: 'JSON object containing specific metadata about the action (e.g. orderId, restaurantName)'
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
