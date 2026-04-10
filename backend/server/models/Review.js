import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['restaurant', 'delivery_partner', 'food'],
        description: 'Type of review - restaurant, delivery, or food item'
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        description: 'ID of restaurant, delivery partner, or food item being reviewed'
    },
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },
    title: {
        type: String,
        trim: true
    },
    comment: {
        type: String,
        trim: true
    },
    photos: [{
        url: String,
        uploadedAt: Date
    }],
    tags: [String],
    helpful: {
        count: {
            type: Number,
            default: 0
        },
        users: [mongoose.Schema.Types.ObjectId]
    },
    unhelpful: {
        count: {
            type: Number,
            default: 0
        },
        users: [mongoose.Schema.Types.ObjectId]
    },
    restaurantResponse: {
        comment: String,
        respondedAt: Date,
        respondedBy: mongoose.Schema.Types.ObjectId
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: true
    },
    categories: {
        foodQuality: Number,
        packaging: Number,
        delivery: Number,
        punctuality: Number
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

reviewSchema.index({ restaurantId: 1, rating: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ orderId: 1 });
reviewSchema.index({ type: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });

// Calculate restaurant rating from reviews
reviewSchema.statics.updateRestaurantRating = async function(restaurantId) {
    const reviews = await this.find({ restaurantId, status: 'approved' });
    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await mongoose.model('Restaurant').findByIdAndUpdate(
        restaurantId, {
            rating: parseFloat(averageRating.toFixed(1)),
            reviewCount: reviews.length
        }
    );
};

export default mongoose.model('Review', reviewSchema);