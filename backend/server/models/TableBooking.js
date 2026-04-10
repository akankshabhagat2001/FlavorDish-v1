import mongoose from 'mongoose';
const tableBookingSchema = new mongoose.Schema({
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
    bookingDate: {
        type: Date,
        required: true
    },
    timeSlot: {
        startTime: {
            type: String,
            required: true,
            description: 'Time in HH:MM format (24-hour)'
        },
        endTime: {
            type: String,
            required: true,
            description: 'Time in HH:MM format (24-hour)'
        },
        duration: {
            type: Number,
            default: 120,
            description: 'Duration in minutes'
        }
    },
    numberOfGuests: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    tableNumber: {
        type: String
    },
    tableType: {
        type: String,
        enum: ['table-2', 'table-4', 'table-6', 'table-8', 'large'],
        description: 'Type of table based on seating capacity'
    },
    specialRequests: {
        type: String,
        trim: true
    },
    customerDetails: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String
        }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'check-in', 'completed', 'cancelled', 'no-show'],
        default: 'pending'
    },
    confirmationCode: {
        type: String,
        unique: true
    },
    checkInTime: {
        type: Date
    },
    checkOutTime: {
        type: Date
    },
    paymentType: {
        type: String,
        enum: ['prepaid', 'postpaid'],
        default: 'prepaid',
        description: 'Prepaid = advance payment, Postpaid = payment at checkout'
    },
    paymentMethod: {
        type: String,
        enum: ['upi', 'card', 'wallet', 'cash'],
        description: 'Payment method for booking confirmation'
    },
    reservationFee: {
        type: Number,
        default: 0,
        description: 'Advance amount to be paid for prepaid bookings'
    },
    totalAmount: {
        type: Number,
        description: 'Total estimated bill amount (for postpaid display)'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'partially_paid'],
        default: 'pending'
    },
    paymentTransactionId: {
        type: String,
        description: 'Transaction ID from payment gateway'
    },
    cancellationReason: {
        type: String
    },
    cancellationBy: {
        type: String,
        enum: ['customer', 'restaurant', 'admin']
    },
    cancellationTime: {
        type: Date
    },
    refundAmount: {
        type: Number
    },
    refundStatus: {
        type: String,
        enum: ['pending', 'processed', 'failed'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true,
        description: 'Internal notes by restaurant staff'
    },
    estimatedBill: {
        type: Number,
        description: 'Estimated bill amount based on guest count'
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

tableBookingSchema.index({ restaurantId: 1, bookingDate: 1 });
tableBookingSchema.index({ userId: 1 });
tableBookingSchema.index({ status: 1 });
tableBookingSchema.index({ bookingDate: 1 });
tableBookingSchema.index({ createdAt: -1 });

tableBookingSchema.pre('save', async function(next) {
    if (!this.confirmationCode) {
        this.confirmationCode = 'BK' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    next();
});

export default mongoose.model('TableBooking', tableBookingSchema);