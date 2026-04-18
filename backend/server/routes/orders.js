import express from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order.js';
import Food from '../models/Food.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles as authorize } from '../middleware/roleMiddleware.js';;
import { io } from '../server.js';
import { logActivity } from './activity.js';

const router = express.Router();

// Create order (Customer only)
router.post('/', authenticate, authorize('customer'), [
    body('restaurant').isMongoId().withMessage('Valid restaurant ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.food').isMongoId().withMessage('Valid food ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('paymentMethod').isIn(['cash_on_delivery', 'online']).withMessage('Invalid payment method'),
    body('deliveryAddress').exists().withMessage('Delivery address is required')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { restaurant: restaurantId, items, paymentMethod, deliveryAddress, specialInstructions } = req.body;

        // Verify restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        if (!restaurant.isOpen) {
            return res.status(400).json({ message: 'Restaurant is currently closed.' });
        }

        // Process order items
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const food = await Food.findById(item.food);
            if (!food) {
                return res.status(404).json({ message: `Food item ${item.food} not found.` });
            }

            if (!food.isAvailable) {
                return res.status(400).json({ message: `${food.name} is currently unavailable.` });
            }

            if (food.restaurant.toString() !== restaurantId) {
                return res.status(400).json({ message: 'All items must be from the same restaurant.' });
            }

            const itemTotal = food.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                food: food._id,
                name: food.name,
                price: food.price,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions
            });
        }

        // Calculate totals
        const deliveryFee = restaurant.deliveryFee || 40;
        const tax = Math.round(subtotal * 0.05); // 5% tax
        const total = subtotal + deliveryFee + tax;

        // Check minimum order
        const minimumOrder = restaurant.minimumOrder || 100;
        if (subtotal < minimumOrder) {
            return res.status(400).json({
                message: `Minimum order amount is ₹${minimumOrder}.`
            });
        }

        // Validate and normalize delivery address
        const deliveryAddressData = {
            street: deliveryAddress.street || '',
            city: deliveryAddress.city || '',
            state: deliveryAddress.state || 'Gujarat',
            zipCode: deliveryAddress.zipCode || '',
            coordinates: {
                latitude: deliveryAddress.coordinates?.latitude || 23.0225,
                longitude: deliveryAddress.coordinates?.longitude || 72.5714
            }
        };

        // Create order
        const order = new Order({
            customer: req.user._id,
            restaurant: restaurantId,
            items: orderItems,
            paymentMethod,
            paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid',
            subtotal,
            deliveryFee,
            tax,
            total,
            deliveryAddress: deliveryAddressData,
            specialInstructions,
            estimatedDeliveryTime: new Date(Date.now() + (restaurant.deliveryTime ? parseInt(restaurant.deliveryTime.split('-')[0]) : 45) * 60000)
        });

        await order.save();
        await order.populate([
            { path: 'customer', select: 'name phone' },
            { path: 'restaurant', select: 'name phone address' },
            { path: 'items.food', select: 'name images' }
        ]);

        // Emit socket event for real-time updates
        io.to(`restaurant-${restaurantId}`).emit('new-order', order);

        await logActivity(req.user._id, req.user.role, 'ORDER_PLACED', { orderId: order._id, total: order.total }, req);

        res.status(201).json({
            message: 'Order placed successfully.',
            order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get user's orders (Customer only)
router.get('/my-orders', authenticate, authorize('customer'), async(req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        let query = { customer: req.user._id };
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('restaurant', 'name rating deliveryTime')
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
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get order by ID
router.get('/:id', authenticate, async(req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'name phone')
            .populate('restaurant', 'name phone address')
            .populate('deliveryPartner', 'name phone')
            .populate('items.food', 'name images category');

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Check if user has permission to view this order
        if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (req.user.role === 'restaurant_owner') {
            const restaurant = await Restaurant.findOne({ owner: req.user._id });
            if (!restaurant || order.restaurant._id.toString() !== restaurant._id.toString()) {
                return res.status(403).json({ message: 'Access denied.' });
            }
        }

        res.json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update order status (Restaurant Owner or Delivery Partner)
router.put('/:id/status', authenticate, [
    body('status').isIn(['confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled']).withMessage('Invalid status'),
    body('note').optional().trim()
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status, note } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Check permissions
        if (req.user.role === 'restaurant_owner') {
            const restaurant = await Restaurant.findOne({ owner: req.user._id });
            if (!restaurant || order.restaurant.toString() !== restaurant._id.toString()) {
                return res.status(403).json({ message: 'Access denied.' });
            }

            // Restaurant can only update to certain statuses
            if (!['confirmed', 'preparing', 'ready', 'cancelled'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status for restaurant.' });
            }
        } else if (req.user.role === 'delivery_partner') {
            if (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'You are not assigned to this order.' });
            }

            // Delivery partner can only update to certain statuses
            if (!['picked_up', 'delivered'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status for delivery partner.' });
            }
        } else {
            return res.status(403).json({ message: 'Access denied.' });
        }

        // Update order
        order.status = status;
        order.statusHistory.push({
            status,
            note,
            timestamp: new Date()
        });

        if (status === 'delivered') {
            order.actualDeliveryTime = new Date();
        }

        await order.save();
        await order.populate([
            { path: 'customer', select: 'name phone' },
            { path: 'restaurant', select: 'name phone address' },
            { path: 'deliveryPartner', select: 'name phone' }
        ]);

        // Emit socket event for real-time updates
        io.to(`order-${order._id}`).emit('order-status-update', order);
        io.to(`restaurant-${order.restaurant}`).emit('order-status-update', order);

        await logActivity(req.user._id, req.user.role, 'ORDER_STATUS_UPDATED', { orderId: order._id, status }, req);

        res.json({
            message: 'Order status updated successfully.',
            order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Assign delivery partner (Restaurant Owner or Admin)
router.put('/:id/assign-delivery', authenticate, authorize('restaurant_owner', 'admin'), [
    body('deliveryPartner').isMongoId().withMessage('Valid delivery partner ID is required')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { deliveryPartner: partnerId } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Check restaurant ownership
        if (req.user.role === 'restaurant_owner') {
            const restaurant = await Restaurant.findOne({ owner: req.user._id });
            if (!restaurant || order.restaurant.toString() !== restaurant._id.toString()) {
                return res.status(403).json({ message: 'Access denied.' });
            }
        }

        // Verify delivery partner exists and is available
        const partner = await User.findById(partnerId);
        if (!partner || partner.role !== 'delivery_partner' || !partner.isAvailable) {
            return res.status(400).json({ message: 'Invalid or unavailable delivery partner.' });
        }

        order.deliveryPartner = partnerId;
        await order.save();

        await order.populate('deliveryPartner', 'name phone');

        // Emit socket event
        io.to(`order-${order._id}`).emit('delivery-assigned', order);

        await logActivity(req.user._id, req.user.role, 'DELIVERY_ASSIGNED', { orderId: order._id, partnerId }, req);

        res.json({
            message: 'Delivery partner assigned successfully.',
            order
        });
    } catch (error) {
        console.error('Assign delivery error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Rate order (Customer only)
router.put('/:id/rate', authenticate, authorize('customer'), [
    body('foodRating').optional().isInt({ min: 1, max: 5 }).withMessage('Food rating must be 1-5'),
    body('deliveryRating').optional().isInt({ min: 1, max: 5 }).withMessage('Delivery rating must be 1-5'),
    body('review').optional().trim().isLength({ max: 500 }).withMessage('Review must be less than 500 characters')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (order.status !== 'delivered') {
            return res.status(400).json({ message: 'Can only rate delivered orders.' });
        }

        const { foodRating, deliveryRating, review } = req.body;

        order.ratings = {
            food: foodRating,
            delivery: deliveryRating,
            review
        };

        await order.save();

        res.json({
            message: 'Order rated successfully.',
            order
        });
    } catch (error) {
        console.error('Rate order error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get restaurant orders (Restaurant Owner)
router.get('/restaurant/orders', authenticate, authorize('restaurant_owner'), async(req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        // Find restaurant owned by user
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        let query = { restaurant: restaurant._id };
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('customer', 'name phone')
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

// Get delivery orders (Delivery Partner)
router.get('/delivery/orders', authenticate, authorize('delivery_partner'), async(req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        let query = { deliveryPartner: req.user._id };
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('customer', 'name phone')
            .populate('restaurant', 'name phone address')
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
        console.error('Get delivery orders error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Accept delivery order (Delivery Partner)
router.put('/:id/accept-delivery', authenticate, authorize('delivery_partner'), async(req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (order.deliveryPartner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (order.status !== 'confirmed') {
            return res.status(400).json({ message: 'Order is not available for acceptance.' });
        }

        order.status = 'picked_up';
        order.deliveryAcceptedAt = new Date();
        await order.save();

        await order.populate('customer', 'name phone');
        await order.populate('restaurant', 'name phone address');

        // Emit socket event
        io.to(`order-${order._id}`).emit('delivery-accepted', order);

        await logActivity(req.user._id, req.user.role, 'DELIVERY_ACCEPTED', { orderId: order._id }, req);

        res.json({
            message: 'Order accepted for delivery.',
            order
        });
    } catch (error) {
        console.error('Accept delivery error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Reject delivery order (Delivery Partner)
router.put('/:id/reject-delivery', authenticate, authorize('delivery_partner'), [
    body('reason').trim().notEmpty().withMessage('Rejection reason is required')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (order.deliveryPartner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (order.status !== 'confirmed') {
            return res.status(400).json({ message: 'Order is not available for rejection.' });
        }

        const { reason } = req.body;

        order.status = 'confirmed';
        order.deliveryPartner = null;
        order.deliveryRejectedAt = new Date();
        order.deliveryRejectionReason = reason;
        await order.save();

        await order.populate('customer', 'name phone');
        await order.populate('restaurant', 'name phone address');

        // Emit socket event
        io.to(`order-${order._id}`).emit('delivery-rejected', order);

        await logActivity(req.user._id, req.user.role, 'DELIVERY_REJECTED', { orderId: order._id, reason }, req);

        res.json({
            message: 'Order rejected for delivery.',
            order
        });
    } catch (error) {
        console.error('Reject delivery error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update delivery location (Delivery Partner)
router.put('/:id/location', authenticate, authorize('delivery_partner'), [
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (order.deliveryPartner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (!['picked_up', 'out_for_delivery'].includes(order.status)) {
            return res.status(400).json({ message: 'Order is not in delivery.' });
        }

        const { latitude, longitude } = req.body;

        order.deliveryLocation = {
            latitude,
            longitude,
            updatedAt: new Date()
        };

        await order.save();

        // Emit socket event for real-time tracking
        io.to(`order-${order._id}`).emit('delivery-location-update', {
            orderId: order._id,
            location: order.deliveryLocation
        });

        res.json({
            message: 'Delivery location updated.',
            location: order.deliveryLocation
        });
    } catch (error) {
        console.error('Update delivery location error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Mark order as out for delivery (Delivery Partner)
router.put('/:id/out-for-delivery', authenticate, authorize('delivery_partner'), async(req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (order.deliveryPartner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (order.status !== 'picked_up') {
            return res.status(400).json({ message: 'Order must be picked up first.' });
        }

        order.status = 'out_for_delivery';
        order.outForDeliveryAt = new Date();
        await order.save();

        await order.populate('customer', 'name phone');
        await order.populate('restaurant', 'name phone address');

        // Emit socket event
        io.to(`order-${order._id}`).emit('out-for-delivery', order);

        await logActivity(req.user._id, req.user.role, 'OUT_FOR_DELIVERY', { orderId: order._id }, req);

        res.json({
            message: 'Order marked as out for delivery.',
            order
        });
    } catch (error) {
        console.error('Out for delivery error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Mark order as delivered (Delivery Partner)
router.put('/:id/deliver', authenticate, authorize('delivery_partner'), async(req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (order.deliveryPartner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (order.status !== 'out_for_delivery') {
            return res.status(400).json({ message: 'Order must be out for delivery.' });
        }

        order.status = 'delivered';
        order.deliveredAt = new Date();
        await order.save();

        await order.populate('customer', 'name phone');
        await order.populate('restaurant', 'name phone address');

        // Emit socket event
        io.to(`order-${order._id}`).emit('order-delivered', order);

        await logActivity(req.user._id, req.user.role, 'ORDER_DELIVERED', { orderId: order._id }, req);

        res.json({
            message: 'Order delivered successfully.',
            order
        });
    } catch (error) {
        console.error('Deliver order error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get delivery partner earnings (Delivery Partner)
router.get('/delivery/earnings', authenticate, authorize('delivery_partner'), async(req, res) => {
    try {
        const { period = 'month' } = req.query; // day, week, month, year

        let startDate;
        const now = new Date();

        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const deliveredOrders = await Order.find({
            deliveryPartner: req.user._id,
            status: 'delivered',
            deliveredAt: { $gte: startDate }
        });

        const totalEarnings = deliveredOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
        const totalOrders = deliveredOrders.length;
        const averageRating = deliveredOrders.length > 0 ?
            deliveredOrders.reduce((sum, order) => sum + (order.ratings?.delivery || 0), 0) / deliveredOrders.length :
            0;

        // Get earnings breakdown by day
        const earningsByDay = await Order.aggregate([{
                $match: {
                    deliveryPartner: req.user._id,
                    status: 'delivered',
                    deliveredAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' }
                    },
                    earnings: { $sum: '$deliveryFee' },
                    orders: { $sum: 1 }
                }
            },
            {
                $sort: { '_id': 1 }
            }
        ]);

        res.json({
            period,
            totalEarnings,
            totalOrders,
            averageRating: Math.round(averageRating * 10) / 10,
            earningsByDay,
            startDate
        });
    } catch (error) {
        console.error('Get delivery earnings error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get delivery partner statistics (Delivery Partner)
router.get('/delivery/stats', authenticate, authorize('delivery_partner'), async(req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalDelivered,
            thisMonthDelivered,
            averageRating,
            totalEarnings
        ] = await Promise.all([
            Order.countDocuments({
                deliveryPartner: req.user._id,
                status: 'delivered'
            }),
            Order.countDocuments({
                deliveryPartner: req.user._id,
                status: 'delivered',
                deliveredAt: { $gte: startOfMonth }
            }),
            Order.aggregate([{
                    $match: {
                        deliveryPartner: req.user._id,
                        status: 'delivered',
                        'ratings.delivery': { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: null,
                        average: { $avg: '$ratings.delivery' }
                    }
                }
            ]),
            Order.aggregate([{
                    $match: {
                        deliveryPartner: req.user._id,
                        status: 'delivered'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$deliveryFee' }
                    }
                }
            ])
        ]);

        const avgRating = averageRating.length > 0 ? Math.round(averageRating[0].average * 10) / 10 : 0;
        const totalEarned = totalEarnings.length > 0 ? totalEarnings[0].total : 0;

        // Get current active deliveries
        const activeDeliveries = await Order.countDocuments({
            deliveryPartner: req.user._id,
            status: { $in: ['picked_up', 'out_for_delivery'] }
        });

        res.json({
            totalDelivered,
            thisMonthDelivered,
            averageRating: avgRating,
            totalEarnings: totalEarned,
            activeDeliveries
        });
    } catch (error) {
        console.error('Get delivery stats error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get delivery partner availability (Delivery Partner)
router.get('/delivery/availability', authenticate, authorize('delivery_partner'), async(req, res) => {
    try {
        const partner = await User.findById(req.user._id).select('isAvailable');
        res.json({
            isAvailable: partner.isAvailable
        });
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update delivery partner availability (Delivery Partner)
router.put('/delivery/availability', authenticate, authorize('delivery_partner'), [
    body('isAvailable').isBoolean().withMessage('isAvailable must be boolean')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { isAvailable } = req.body;

        await User.findByIdAndUpdate(req.user._id, { isAvailable });

        await logActivity(req.user._id, req.user.role, 'AVAILABILITY_UPDATE', { isAvailable }, req);

        res.json({
            message: 'Availability updated successfully.',
            isAvailable
        });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get delivery history (Delivery Partner)
router.get('/delivery/history', authenticate, authorize('delivery_partner'), async(req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const orders = await Order.find({
                deliveryPartner: req.user._id,
                status: 'delivered'
            })
            .populate('customer', 'name phone')
            .populate('restaurant', 'name phone address')
            .sort({ deliveredAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await Order.countDocuments({
            deliveryPartner: req.user._id,
            status: 'delivered'
        });

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
        console.error('Get delivery history error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get all orders (Admin only)
router.get('/admin/orders', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const query = {};
        if (status) {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { 'restaurant.name': { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'items.name': { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(query)
            .populate('customer', 'name phone')
            .populate('restaurant', 'name phone address')
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
        console.error('Get admin orders error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
