import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Food from '../models/Food.js';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles as authorize } from '../middleware/roleMiddleware.js';;
import { body, validationResult } from 'express-validator';
import { logActivity } from './activity.js';

const router = express.Router();

// Get customer profile
router.get('/profile', authenticate, authorize('customer'), async(req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('addresses');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get customer profile error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update customer profile
router.put('/profile', authenticate, authorize('customer'), [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid Indian phone number required'),
    body('preferences').optional().isObject().withMessage('Preferences must be an object')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, phone, preferences } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (preferences) updateData.preferences = preferences;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData, { new: true }
        ).select('-password');

        await logActivity(req.user._id, req.user.role, 'PROFILE_UPDATE', updateData, req);

        res.json({
            message: 'Profile updated successfully.',
            user
        });
    } catch (error) {
        console.error('Update customer profile error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Add customer address
router.post('/addresses', authenticate, authorize('customer'), [
    body('type').isIn(['home', 'work', 'other']).withMessage('Type must be home, work, or other'),
    body('label').trim().isLength({ min: 1, max: 50 }).withMessage('Label is required'),
    body('address').trim().isLength({ min: 10, max: 200 }).withMessage('Address must be 10-200 characters'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid Indian phone number required')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { type, label, address, latitude, longitude, phone } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const newAddress = {
            type,
            label,
            address,
            latitude,
            longitude,
            phone,
            isDefault: user.addresses.length === 0 // First address is default
        };

        user.addresses.push(newAddress);
        await user.save();

        await logActivity(req.user._id, req.user.role, 'ADDRESS_ADDED', { type, label }, req);

        res.status(201).json({
            message: 'Address added successfully.',
            address: user.addresses[user.addresses.length - 1]
        });
    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get customer addresses
router.get('/addresses', authenticate, authorize('customer'), async(req, res) => {
    try {
        const user = await User.findById(req.user._id).select('addresses');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user.addresses);
    } catch (error) {
        console.error('Get addresses error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update customer address
router.put('/addresses/:addressId', authenticate, authorize('customer'), [
    body('type').optional().isIn(['home', 'work', 'other']).withMessage('Type must be home, work, or other'),
    body('label').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Label is required'),
    body('address').optional().trim().isLength({ min: 10, max: 200 }).withMessage('Address must be 10-200 characters'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid Indian phone number required')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === req.params.addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found.' });
        }

        const { type, label, address, latitude, longitude, phone } = req.body;

        if (type) user.addresses[addressIndex].type = type;
        if (label) user.addresses[addressIndex].label = label;
        if (address) user.addresses[addressIndex].address = address;
        if (latitude !== undefined) user.addresses[addressIndex].latitude = latitude;
        if (longitude !== undefined) user.addresses[addressIndex].longitude = longitude;
        if (phone) user.addresses[addressIndex].phone = phone;

        await user.save();

        await logActivity(req.user._id, req.user.role, 'ADDRESS_UPDATED', { addressId: req.params.addressId }, req);

        res.json({
            message: 'Address updated successfully.',
            address: user.addresses[addressIndex]
        });
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Delete customer address
router.delete('/addresses/:addressId', authenticate, authorize('customer'), async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === req.params.addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found.' });
        }

        user.addresses.splice(addressIndex, 1);
        await user.save();

        await logActivity(req.user._id, req.user.role, 'ADDRESS_DELETED', { addressId: req.params.addressId }, req);

        res.json({ message: 'Address deleted successfully.' });
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Set default address
router.put('/addresses/:addressId/default', authenticate, authorize('customer'), async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === req.params.addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found.' });
        }

        // Reset all addresses to non-default
        user.addresses.forEach(addr => addr.isDefault = false);
        // Set the selected address as default
        user.addresses[addressIndex].isDefault = true;

        await user.save();

        res.json({
            message: 'Default address updated successfully.',
            addresses: user.addresses
        });
    } catch (error) {
        console.error('Set default address error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Add to favorites (Restaurant)
router.post('/favorites/restaurants/:restaurantId', authenticate, authorize('customer'), async(req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.favoriteRestaurants.includes(req.params.restaurantId)) {
            return res.status(400).json({ message: 'Restaurant already in favorites.' });
        }

        user.favoriteRestaurants.push(req.params.restaurantId);
        await user.save();

        await logActivity(req.user._id, req.user.role, 'FAVORITE_ADDED', { restaurantId: req.params.restaurantId }, req);

        res.json({ message: 'Restaurant added to favorites.' });
    } catch (error) {
        console.error('Add favorite restaurant error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Remove from favorites (Restaurant)
router.delete('/favorites/restaurants/:restaurantId', authenticate, authorize('customer'), async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const index = user.favoriteRestaurants.indexOf(req.params.restaurantId);
        if (index === -1) {
            return res.status(404).json({ message: 'Restaurant not in favorites.' });
        }

        user.favoriteRestaurants.splice(index, 1);
        await user.save();

        await logActivity(req.user._id, req.user.role, 'FAVORITE_REMOVED', { restaurantId: req.params.restaurantId }, req);

        res.json({ message: 'Restaurant removed from favorites.' });
    } catch (error) {
        console.error('Remove favorite restaurant error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get favorite restaurants
router.get('/favorites/restaurants', authenticate, authorize('customer'), async(req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('favoriteRestaurants');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user.favoriteRestaurants);
    } catch (error) {
        console.error('Get favorite restaurants error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Add to favorites (Food item)
router.post('/favorites/food/:foodId', authenticate, authorize('customer'), async(req, res) => {
    try {
        const food = await Food.findById(req.params.foodId);
        if (!food) {
            return res.status(404).json({ message: 'Food item not found.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.favoriteFoods.includes(req.params.foodId)) {
            return res.status(400).json({ message: 'Food item already in favorites.' });
        }

        user.favoriteFoods.push(req.params.foodId);
        await user.save();

        await logActivity(req.user._id, req.user.role, 'FOOD_FAVORITE_ADDED', { foodId: req.params.foodId }, req);

        res.json({ message: 'Food item added to favorites.' });
    } catch (error) {
        console.error('Add favorite food error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Remove from favorites (Food item)
router.delete('/favorites/food/:foodId', authenticate, authorize('customer'), async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const index = user.favoriteFoods.indexOf(req.params.foodId);
        if (index === -1) {
            return res.status(404).json({ message: 'Food item not in favorites.' });
        }

        user.favoriteFoods.splice(index, 1);
        await user.save();

        await logActivity(req.user._id, req.user.role, 'FOOD_FAVORITE_REMOVED', { foodId: req.params.foodId }, req);

        res.json({ message: 'Food item removed from favorites.' });
    } catch (error) {
        console.error('Remove favorite food error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get favorite food items
router.get('/favorites/food', authenticate, authorize('customer'), async(req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('favoriteFoods');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user.favoriteFoods);
    } catch (error) {
        console.error('Get favorite food error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get customer order history
router.get('/orders', authenticate, authorize('customer'), async(req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        let query = { customer: req.user._id };
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('restaurant', 'name image rating')
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
        console.error('Get customer orders error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get customer order details
router.get('/orders/:orderId', authenticate, authorize('customer'), async(req, res) => {
    try {
        const order = await Order.findOne({
                _id: req.params.orderId,
                customer: req.user._id
            })
            .populate('restaurant', 'name image rating address phone')
            .populate('deliveryPartner', 'name phone')
            .populate('items.food', 'name image price');

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        res.json(order);
    } catch (error) {
        console.error('Get customer order details error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Reorder from previous order
router.post('/orders/:orderId/reorder', authenticate, authorize('customer'), async(req, res) => {
    try {
        const originalOrder = await Order.findOne({
            _id: req.params.orderId,
            customer: req.user._id
        });

        if (!originalOrder) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Create new order with same items
        const newOrder = new Order({
            customer: req.user._id,
            restaurant: originalOrder.restaurant,
            items: originalOrder.items,
            totalAmount: originalOrder.totalAmount,
            deliveryFee: originalOrder.deliveryFee,
            taxAmount: originalOrder.taxAmount,
            finalAmount: originalOrder.finalAmount,
            deliveryAddress: originalOrder.deliveryAddress,
            paymentMethod: originalOrder.paymentMethod,
            specialInstructions: originalOrder.specialInstructions,
            status: 'pending'
        });

        await newOrder.save();
        await newOrder.populate('restaurant', 'name image');
        await newOrder.populate('items.food', 'name image price');

        await logActivity(req.user._id, req.user.role, 'REORDER_PLACED', { orderId: newOrder._id, originalOrderId: req.params.orderId }, req);

        res.status(201).json({
            message: 'Reorder placed successfully.',
            order: newOrder
        });
    } catch (error) {
        console.error('Reorder error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get customer dashboard stats
router.get('/dashboard', authenticate, authorize('customer'), async(req, res) => {
    try {
        const userId = req.user._id;

        const [
            totalOrders,
            favoriteRestaurantsCount,
            favoriteFoodsCount,
            recentOrders
        ] = await Promise.all([
            Order.countDocuments({ customer: userId }),
            User.findById(userId).then(user => user.favoriteRestaurants.length),
            User.findById(userId).then(user => user.favoriteFoods.length),
            Order.find({ customer: userId })
            .populate('restaurant', 'name image')
            .sort({ createdAt: -1 })
            .limit(5)
        ]);

        const orderStats = await Order.aggregate([
            { $match: { customer: userId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusCounts = {};
        orderStats.forEach(stat => {
            statusCounts[stat._id] = stat.count;
        });

        res.json({
            totalOrders,
            favoriteRestaurantsCount,
            favoriteFoodsCount,
            orderStatusCounts: statusCounts,
            recentOrders
        });
    } catch (error) {
        console.error('Get customer dashboard error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
