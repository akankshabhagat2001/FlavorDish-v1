import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentType: {
        type: String,
        enum: ['prepaid', 'postpaid'],
        default: 'prepaid',
        description: 'Prepaid = payment before order, Postpaid = payment on delivery/completion'
    },
    paymentMethod: {
        type: String,
        enum: ['upi', 'card', 'wallet', 'cod', 'net_banking', 'google_pay', 'apple_pay'],
        default: 'upi'
    },
    paymentGateway: {
        type: String,
        enum: ['razorpay', 'stripe', 'paypal', 'cod'],
        description: 'Payment gateway used'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    razorpayPaymentId: {
        type: String
    },
    razorpayOrderId: {
        type: String
    },
    razorpaySignature: {
        type: String
    },
    cardDetails: {
        last4: String,
        brand: String,
        expiryMonth: Number,
        expiryYear: Number
    },
    upiDetails: {
        upiId: String,
        identifier: String
    },
    walletDetails: {
        walletId: String,
        previousBalance: Number,
        newBalance: Number
    },
    breakdown: {
        subtotal: Number,
        taxes: Number,
        deliveryFee: Number,
        discount: Number,
        couponDiscount: Number,
        totalAfterDiscount: Number
    },
    couponApplied: {
        couponId: String,
        code: String,
        discountAmount: Number
    },
    failureReason: {
        type: String,
        description: 'Reason for payment failure if status is failed'
    },
    errorCode: {
        type: String
    },
    errorDescription: {
        type: String
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    refundTransactionId: {
        type: String
    },
    refundInitiatedAt: {
        type: Date
    },
    refundCompletedAt: {
        type: Date
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        description: 'Additional metadata for payment processing'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
});

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentType: 1 });
paymentSchema.index({ createdAt: -1 });

export default mongoose.model('Payment', paymentSchema);