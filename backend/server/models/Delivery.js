import mongoose from 'mongoose';
const deliverySchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    deliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled'],
        default: 'accepted'
    },
    pickupLocation: {
        address: String,
        latitude: Number,
        longitude: Number
    },
    deliveryLocation: {
        address: String,
        latitude: Number,
        longitude: Number
    },
    currentLocation: {
        latitude: Number,
        longitude: Number,
        timestamp: Date
    },
    estimatedDeliveryTime: {
        type: Date
    },
    actualDeliveryTime: {
        type: Date
    },
    distance: {
        type: Number,
        description: 'Distance in kilometers'
    },
    deliveryCharge: {
        type: Number,
        default: 50
    },
    baseRate: {
        type: Number,
        default: 50,
        description: 'Base delivery charge'
    },
    acceptedAt: {
        type: Date,
        default: Date.now
    },
    pickedUpAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    rating: {
        type: Number,
        min: 0,
        max: 5
    },
    review: {
        type: String
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    earnings: {
        type: Number,
        default: 0
    },
    locationHistory: [{
        latitude: Number,
        longitude: Number,
        timestamp: Date
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

deliverySchema.index({ orderId: 1 });
deliverySchema.index({ deliveryPartnerId: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ createdAt: -1 });

export default mongoose.model('Delivery', deliverySchema);