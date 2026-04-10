import mongoose from 'mongoose';

const restaurantSuggestionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    cuisine: [{
        type: String,
        trim: true
    }],
    description: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    contactPerson: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    suggestedBy: {
        type: String,
        trim: true,
        default: 'anonymous'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export default mongoose.model('RestaurantSuggestion', restaurantSuggestionSchema);