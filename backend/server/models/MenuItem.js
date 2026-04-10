import mongoose from 'mongoose';
const menuItemSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    categoryId: {
        type: String,
        enum: ['veg', 'non-veg', 'vegan', 'dessert', 'beverage'],
        default: 'veg'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discountedPrice: {
        type: Number,
        min: 0
    },
    image: {
        type: String
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    prepariationTime: {
        type: Number,
        default: 20,
        description: 'Time in minutes to prepare'
    },
    spicyLevel: {
        type: Number,
        enum: [0, 1, 2, 3],
        default: 0
    },
    allergens: [String],
    calories: {
        type: Number
    },
    ingredients: [String],
    ratings: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    orderCount: {
        type: Number,
        default: 0
    },
    variants: [{
        name: String,
        additionalPrice: Number
    }],
    addons: [{
        name: String,
        type: String,
        options: [{
            name: String,
            price: Number
        }]
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

menuItemSchema.index({ restaurantId: 1, isAvailable: 1 });
menuItemSchema.index({ categoryId: 1 });

export default mongoose.model('MenuItem', menuItemSchema);