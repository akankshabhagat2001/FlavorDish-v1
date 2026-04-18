import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['customer', 'restaurant_owner', 'delivery_partner', 'admin'],
        default: 'customer'
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    savedAddresses: [{
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        label: { type: String, default: 'Home' },
        details: { type: String },
        isDefault: { type: Boolean, default: false }
    }],
    profileImage: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    // For delivery partners
    isAvailable: {
        type: Boolean,
        default: true
    },
    currentLocation: {
        latitude: Number,
        longitude: Number
    },
    otpCode: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    otpRequestCount: {
        type: Number,
        default: 0
    },
    otpRequestWindowStart: {
        type: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    // For restaurant owners
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    // For customers - following restaurants
    followingRestaurants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!candidatePassword) {
        throw new Error('Password is required');
    }
    if (!this.password) {
        throw new Error('Stored password is missing');
    }
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

export default mongoose.model('User', userSchema);