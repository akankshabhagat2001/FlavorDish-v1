import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    specialInstructions: {
        type: String,
        trim: true
    }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    items: [orderItemSchema],
    status: {
        type: String,
        enum: ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'],
        default: 'placed'
    },
    paymentType: {
        type: String,
        enum: ['prepaid', 'postpaid'],
        default: 'prepaid',
        description: 'Prepaid = payment before order, Postpaid = payment on delivery'
    },
    paymentMethod: {
        type: String,
        enum: ['cash_on_delivery', 'online', 'upi', 'card', 'wallet'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    deliveryFee: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        min: 0,
        default: 0
    },
    discount: {
        type: Number,
        min: 0,
        default: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    specialInstructions: {
        type: String,
        trim: true
    },
    estimatedDeliveryTime: {
        type: Date
    },
    actualDeliveryTime: {
        type: Date
    },
    placedAt: {
        type: Date,
        default: Date.now
    },
    statusHistory: [{
        status: {
            type: String,
            enum: ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }],
    restaurantPayout: {
        type: Number,
        min: 0,
        default: 0
    },
    deliveryPayout: {
        type: Number,
        min: 0,
        default: 0
    },
    settlementStatus: {
        type: String,
        enum: ['pending', 'restaurant_paid', 'delivery_paid', 'settled'],
        default: 'pending'
    },
    paymentGateway: String,
    paymentTransactionId: String,
    ratings: {
        food: {
            type: Number,
            min: 1,
            max: 5
        },
        delivery: {
            type: Number,
            min: 1,
            max: 5
        },
        review: {
            type: String,
            trim: true
        }
    }
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
    if (!this.orderNumber) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `FF${timestamp}${random}`;
    }
    next();
});

export default mongoose.model('Order', orderSchema);