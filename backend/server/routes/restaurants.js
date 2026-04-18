import express from 'express';
import { body, validationResult } from 'express-validator';
import Restaurant from '../models/Restaurant.js';
import Food from '../models/Food.js';
import User from '../models/User.js';
import { authMiddleware as authenticate, optionalAuth } from '../middleware/authMiddleware.js';
import { authorizeRoles as authorize } from '../middleware/roleMiddleware.js';;
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
            type,
            service,
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

        if (type) {
            query.type = type;
        }

        if (service) {
            if (service === 'delivery') query.delivery = true;
            if (service === 'dining') query.dine_in = true;
            if (service === 'nightlife') query.cuisine = { $in: ['Nightlife'] };
            if (service === 'street_food') query.cuisine = { $in: ['Street Food', 'Laris', 'Street Food & Laris'] };
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

// Get cuisines (must be declared before /:id routes)
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

        res.json({
            restaurant: transformRestaurantForAPI(restaurant),
            data: transformRestaurantForAPI(restaurant)
        });
    } catch (error) {
        console.error('Get restaurant error:', error);
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

// ===== MENU CRUD OPERATIONS (Restaurant Owner Only) =====

// Add menu item
router.post('/:restaurantId/menu', authenticate, authorize('restaurant_owner'), [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('category').trim().isLength({ min: 2 }).withMessage('Category is required'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only manage your own restaurant menu.' });
        }

        const Food = (await
            import ('../models/Food.js')).default;
        const menuItem = new Food({
            ...req.body,
            restaurant: req.params.restaurantId,
            isAvailable: true
        });

        await menuItem.save();

        res.status(201).json({
            message: 'Menu item added successfully.',
            menuItem
        });
    } catch (error) {
        console.error('Add menu item error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update menu item
router.put('/:restaurantId/menu/:itemId', authenticate, authorize('restaurant_owner'), [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('category').optional().trim().isLength({ min: 2 }).withMessage('Category is required'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only manage your own restaurant menu.' });
        }

        const Food = (await
            import ('../models/Food.js')).default;
        const menuItem = await Food.findById(req.params.itemId);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found.' });
        }

        // Check if item belongs to restaurant
        if (menuItem.restaurant.toString() !== req.params.restaurantId) {
            return res.status(403).json({ message: 'Menu item does not belong to this restaurant.' });
        }

        const updates = req.body;
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                menuItem[key] = updates[key];
            }
        });

        await menuItem.save();

        res.json({
            message: 'Menu item updated successfully.',
            menuItem
        });
    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Delete menu item
router.delete('/:restaurantId/menu/:itemId', authenticate, authorize('restaurant_owner'), async(req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only manage your own restaurant menu.' });
        }

        const Food = (await
            import ('../models/Food.js')).default;
        const menuItem = await Food.findById(req.params.itemId);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found.' });
        }

        // Check if item belongs to restaurant
        if (menuItem.restaurant.toString() !== req.params.restaurantId) {
            return res.status(403).json({ message: 'Menu item does not belong to this restaurant.' });
        }

        await Food.findByIdAndDelete(req.params.itemId);

        res.json({ message: 'Menu item deleted successfully.' });
    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Toggle menu item availability
router.put('/:restaurantId/menu/:itemId/toggle', authenticate, authorize('restaurant_owner'), async(req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only manage your own restaurant menu.' });
        }

        const Food = (await
            import ('../models/Food.js')).default;
        const menuItem = await Food.findById(req.params.itemId);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found.' });
        }

        // Check if item belongs to restaurant
        if (menuItem.restaurant.toString() !== req.params.restaurantId) {
            return res.status(403).json({ message: 'Menu item does not belong to this restaurant.' });
        }

        menuItem.isAvailable = !menuItem.isAvailable;
        await menuItem.save();

        res.json({
            message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'} successfully.`,
            menuItem
        });
    } catch (error) {
        console.error('Toggle menu item error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ===== ORDER MANAGEMENT (Restaurant Owner) =====

// Get restaurant orders
router.get('/:restaurantId/orders', authenticate, authorize('restaurant_owner'), async(req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only view your own restaurant orders.' });
        }

        const { status, page = 1, limit = 20 } = req.query;

        let query = { restaurant: req.params.restaurantId };
        if (status) query.status = status;

        const Order = (await
            import ('../models/Order.js')).default;
        const orders = await Order.find(query)
            .populate('customer', 'name phone')
            .populate('deliveryPartner', 'name phone')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        res.json({
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get restaurant orders error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update order status (Restaurant Owner)
router.put('/:restaurantId/orders/:orderId/status', authenticate, authorize('restaurant_owner'), async(req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only manage your own restaurant orders.' });
        }

        const { status } = req.body;
        const validStatuses = ['confirmed', 'preparing', 'ready', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status.' });
        }

        const Order = (await
            import ('../models/Order.js')).default;
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Check if order belongs to restaurant
        if (order.restaurant.toString() !== req.params.restaurantId) {
            return res.status(403).json({ message: 'Order does not belong to this restaurant.' });
        }

        order.status = status;
        await order.save();

        // Emit real-time update
        io.to(`order-${order._id}`).emit('order-status-update', {
            status,
            timestamp: new Date()
        });

        res.json({
            message: 'Order status updated successfully.',
            order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ===== EARNINGS TRACKING (Restaurant Owner) =====

// Get restaurant earnings
router.get('/:restaurantId/earnings', authenticate, authorize('restaurant_owner'), async(req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only view your own restaurant earnings.' });
        }

        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const Order = (await
            import ('../models/Order.js')).default;
        const orders = await Order.find({
            restaurant: req.params.restaurantId,
            status: { $in: ['delivered', 'ready'] },
            createdAt: { $gte: start, $lte: end }
        });

        const totalEarnings = orders.reduce((sum, order) => sum + order.subtotal, 0);
        const platformFee = totalEarnings * 0.1; // 10% platform fee
        const netEarnings = totalEarnings - platformFee;

        const dailyEarnings = orders.reduce((acc, order) => {
            const date = order.createdAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + order.subtotal;
            return acc;
        }, {});

        res.json({
            earnings: {
                totalEarnings,
                platformFee,
                netEarnings,
                totalOrders: orders.length,
                period: { start, end }
            },
            dailyEarnings: Object.entries(dailyEarnings).map(([date, amount]) => ({ date, amount }))
        });
    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ===== CUSTOMER REVIEWS MANAGEMENT =====

// Get restaurant reviews
router.get('/:restaurantId/reviews', authenticate, authorize('restaurant_owner'), async(req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only view your own restaurant reviews.' });
        }

        const Review = (await
            import ('../models/Review.js')).default;
        const reviews = await Review.find({ restaurantId: req.params.restaurantId })
            .populate('userId', 'name')
            .populate('orderId', 'orderNumber')
            .sort({ createdAt: -1 });

        res.json({ reviews });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Respond to review
router.put('/:restaurantId/reviews/:reviewId/response', authenticate, authorize('restaurant_owner'), async(req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only respond to your own restaurant reviews.' });
        }

        const { comment } = req.body;
        if (!comment || !comment.trim()) {
            return res.status(400).json({ message: 'Response comment is required.' });
        }

        const Review = (await
            import ('../models/Review.js')).default;
        const review = await Review.findById(req.params.reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        // Check if review belongs to restaurant
        if (review.restaurantId.toString() !== req.params.restaurantId) {
            return res.status(403).json({ message: 'Review does not belong to this restaurant.' });
        }

        review.restaurantResponse = {
            comment: comment.trim(),
            respondedAt: new Date(),
            respondedBy: req.user._id
        };

        await review.save();

        res.json({
            message: 'Response added successfully.',
            review
        });
    } catch (error) {
        console.error('Respond to review error:', error);
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