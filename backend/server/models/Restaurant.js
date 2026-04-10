import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cuisine: [{
        type: String,
        trim: true
    }],
    address: {
        street: String,
        area: String, // Locality/Area name
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
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
    images: [{
        url: String,
        alt: String
    }],
    logo: {
        type: String
    },
    imageUrl: {
        type: String,
        default: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80'
    },
    thumbnailUrl: {
        type: String,
        default: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&q=80'
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    deliveryTime: {
        type: String,
        default: '30-45 mins'
    },
    costForTwo: {
        type: Number,
        min: 0
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    openingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    deliveryFee: {
        type: Number,
        min: 0,
        default: 40
    },
    minimumOrder: {
        type: Number,
        min: 0,
        default: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    categories: [{
        type: String,
        trim: true
    }],
    type: {
        type: String,
        enum: ['restaurant', 'cafe', 'foodTruck', 'bakery', 'fast_food', 'fine_dining'],
        default: 'restaurant'
    },
    dine_in: {
        type: Boolean,
        default: true
    },
    delivery: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for location-based queries
restaurantSchema.index({ 'address.coordinates': '2dsphere' });

// Index for preventing duplicate restaurants (name + area + city)
restaurantSchema.index({ name: 1, 'address.area': 1, 'address.city': 1 }, { unique: false });

// Index for owner (one restaurant per owner)
restaurantSchema.index({ owner: 1 });

// Index for city searches
restaurantSchema.index({ 'address.city': 1, isActive: 1 });

// Index for cuisine searches
restaurantSchema.index({ cuisine: 1, isActive: 1 });

export default mongoose.model('Restaurant', restaurantSchema);