import express from 'express';
import { body, validationResult } from 'express-validator';
import Restaurant from '../models/Restaurant.js';
import Food from '../models/Food.js';
import User from '../models/User.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { io } from '../server.js';

const router = express.Router();

// Helper function to transform restaurant data
const transformRestaurantForAPI = (restaurant) => {
    const doc = restaurant.toObject ? restaurant.toObject() : restaurant;

    // Transform address object to location object
    if (doc.address && doc.coordinates === undefined) {
        const { street, area, city, zipCode, coordinates } = doc.address;
        doc.location = {
            address: `${street}${area ? ', ' + area : ''}${city ? ', ' + city : ''}`,
            area,
            city,
            zipCode,
            latitude: coordinates ? (coordinates.latitude || 0) : 0,
            longitude: coordinates ? (coordinates.longitude || 0) : 0
        };
        // Keep address for backward compatibility
        doc.address = `${street}${area ? ', ' + area : ''}${city ? ', ' + city : ''}`;
    }
    return doc;
};

// Get all restaurants
router.get('/', optionalAuth, async(req, res) => {
    try {
        const {
            search,
            cuisine,
            isOpen,
            minRating,
            sortBy = 'name',
            sortOrder = 'asc',
            page = 1,
            limit = 20
        } = req.query;

        let query = { isActive: true };

        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { cuisine: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Filters
        if (cuisine) {
            query.cuisine = { $in: [cuisine] };
        }

        if (isOpen !== undefined) {
            query.isOpen = isOpen === 'true';
        }

        if (minRating) {
            query.rating = { $gte: parseFloat(minRating) };
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const restaurants = await Restaurant.find(query)
            .populate('owner', 'name')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Restaurant.countDocuments(query);

        // Transform restaurants
        const transformedRestaurants = restaurants.map(transformRestaurantForAPI);

        res.json({
            restaurants: transformedRestaurants,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get restaurants error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get current user's restaurant(s)
router.get('/my-restaurants', authenticate, authorize('restaurant_owner', 'admin'), async(req, res) => {
    try {
        let restaurants;
        if (req.user.role === 'admin') {
            restaurants = await Restaurant.find({});
        } else {
            restaurants = await Restaurant.find({ owner: req.user._id });
        }
        res.json({ restaurants });
    } catch (error) {
        console.error('Get my restaurants error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get menu items for a restaurant
router.get('/:id/menu', optionalAuth, async(req, res) => {
    try {
        const restaurantId = req.params.id;
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        const foods = await Food.find({ restaurant: restaurantId });
        res.json({ menu: foods, menuItems: foods, data: { menu: foods } });
    } catch (error) {
        console.error('Get restaurant menu error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Create restaurant (Restaurant Owner or Admin)
router.post('/', authenticate, authorize('restaurant_owner', 'admin'), [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('cuisine').isArray({ min: 1 }).withMessage('At least one cuisine is required'),
    body('address.street').trim().isLength({ min: 1 }).withMessage('Street address is required'),
    body('address.city').trim().isLength({ min: 1 }).withMessage('City is required'),
    body('address.state').trim().isLength({ min: 1 }).withMessage('State is required'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name,
            description,
            cuisine,
            address,
            phone,
            email,
            images,
            costForTwo,
            deliveryFee,
            minimumOrder
        } = req.body;

        // Check if non-admin user already has a restaurant
        let existingRestaurant = null;
        if (req.user.role !== 'admin') {
            existingRestaurant = await Restaurant.findOne({ owner: req.user._id });
        }
        if (existingRestaurant) {
            return res.status(400).json({ message: 'You already have a restaurant registered.' });
        }

        // Check for duplicate restaurant (same name in same area/city)
        const duplicateCheck = await Restaurant.findOne({
            name: { $regex: `^${name}$`, $options: 'i' },
            'address.area': address.area,
            'address.city': address.city,
            isActive: true
        });
        if (duplicateCheck) {
            return res.status(400).json({
                message: `A restaurant with the name "${name}" already exists in ${address.city}. Please use a different name or location.`
            });
        }

        const restaurant = new Restaurant({
            name,
            description,
            cuisine,
            address,
            phone,
            email,
            images,
            costForTwo,
            deliveryFee,
            minimumOrder,
            owner: req.user._id
        });

        await restaurant.save();
        await restaurant.populate('owner', 'name email phone');

        // Update user with restaurant ID
        await User.findByIdAndUpdate(req.user._id, { restaurantId: restaurant._id });

        // Emit real-time event
        io.to('restaurants_room').emit('restaurant_created', {
            restaurant: transformRestaurantForAPI(restaurant),
            timestamp: new Date()
        });
        console.log('📡 Emitted restaurant_created event');

        res.status(201).json({
            message: 'Restaurant created successfully.',
            restaurant
        });
    } catch (error) {
        console.error('Create restaurant error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update restaurant (Restaurant Owner only)
router.put('/:id', authenticate, authorize('restaurant_owner'), async(req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only update your own restaurant.' });
        }

        const updates = req.body;
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                restaurant[key] = updates[key];
            }
        });

        await restaurant.save();
        await restaurant.populate('owner', 'name email phone');

        // Emit real-time event
        io.to('restaurants_room').emit('restaurant_updated', {
            restaurant: transformRestaurantForAPI(restaurant),
            timestamp: new Date()
        });
        console.log('📡 Emitted restaurant_updated event for:', restaurant.name);

        res.json({
            message: 'Restaurant updated successfully.',
            restaurant
        });
    } catch (error) {
        console.error('Update restaurant error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Delete restaurant (Restaurant Owner or Admin)
router.delete('/:id', authenticate, authorize('restaurant_owner', 'admin'), async(req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Check ownership (for restaurant owners)
        if (req.user.role === 'restaurant_owner' && restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own restaurant.' });
        }

        await Restaurant.findByIdAndDelete(req.params.id);

        // Update user
        await User.findByIdAndUpdate(restaurant.owner, { $unset: { restaurantId: 1 } });

        // Emit real-time event
        io.to('restaurants_room').emit('restaurant_deleted', {
            restaurantId: restaurant._id,
            restaurantName: restaurant.name,
            timestamp: new Date()
        });
        console.log('📡 Emitted restaurant_deleted event for:', restaurant.name);

        res.json({ message: 'Restaurant deleted successfully.' });
    } catch (error) {
        console.error('Delete restaurant error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get restaurant menu (Food items)
router.get('/:id/menu', optionalAuth, async(req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        const Food = (await
            import ('../models/Food.js')).default;
        const menu = await Food.find({
            restaurant: req.params.id,
            isAvailable: true
        }).sort({ category: 1, name: 1 });

        res.json({ menu });
    } catch (error) {
        console.error('Get menu error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get cuisines
router.get('/cuisines/all', async(req, res) => {
    try {
        const cuisines = await Restaurant.distinct('cuisine', { isActive: true });
        res.json({ cuisines: cuisines.flat() });
    } catch (error) {
        console.error('Get cuisines error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get restaurant by ID
router.get('/:id', optionalAuth, async(req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id)
            .populate('owner', 'name email phone');

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        res.json({ restaurant: transformRestaurantForAPI(restaurant) });
    } catch (error) {
        console.error('Get restaurant error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;