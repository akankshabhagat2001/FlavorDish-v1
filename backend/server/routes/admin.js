import express from 'express';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import Food from '../models/Food.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticate, authorize('admin'), async(req, res) => {
    try {
        const [
            totalUsers,
            totalRestaurants,
            totalOrders,
            totalRevenue,
            recentOrders,
            userStats,
            orderStats
        ] = await Promise.all([
            User.countDocuments(),
            Restaurant.countDocuments({ isActive: true }),
            Order.countDocuments(),
            Order.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            Order.find()
            .populate('customer', 'name')
            .populate('restaurant', 'name')
            .sort({ createdAt: -1 })
            .limit(10),
            User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            stats: {
                totalUsers,
                totalRestaurants,
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                recentOrders,
                userStats,
                orderStats
            }
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get all orders with filters
router.get('/orders', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { page = 1, limit = 20, status, startDate, endDate } = req.query;

        let query = {};
        if (status) {
            query.status = status;
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(query)
            .populate('customer', 'name email')
            .populate('restaurant', 'name')
            .populate('deliveryPartner', 'name')
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

// Update order status (Admin override)
router.put('/orders/:id/status', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { status, note } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        order.status = status;
        order.statusHistory.push({
            status,
            note: note || 'Updated by admin',
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

        res.json({
            message: 'Order status updated successfully.',
            order
        });
    } catch (error) {
        console.error('Admin update order status error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get revenue analytics
router.get('/revenue', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { period = 'month' } = req.query;

        let groupBy;
        switch (period) {
            case 'day':
                groupBy = {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                };
                break;
            case 'month':
                groupBy = {
                    $dateToString: { format: '%Y-%m', date: '$createdAt' }
                };
                break;
            case 'year':
                groupBy = {
                    $dateToString: { format: '%Y', date: '$createdAt' }
                };
                break;
            default:
                groupBy = {
                    $dateToString: { format: '%Y-%m', date: '$createdAt' }
                };
        }

        const revenue = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            {
                $group: {
                    _id: groupBy,
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: '$total' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        res.json({ revenue });
    } catch (error) {
        console.error('Get revenue analytics error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get top restaurants
router.get('/top-restaurants', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { limit = 10 } = req.query;

        const topRestaurants = await Order.aggregate([
            { $match: { status: 'delivered' } },
            {
                $group: {
                    _id: '$restaurant',
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$total' }
                }
            },
            {
                $lookup: {
                    from: 'restaurants',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'restaurant'
                }
            },
            { $unwind: '$restaurant' },
            {
                $project: {
                    name: '$restaurant.name',
                    totalOrders: 1,
                    totalRevenue: 1,
                    rating: '$restaurant.rating'
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: parseInt(limit) }
        ]);

        res.json({ topRestaurants });
    } catch (error) {
        console.error('Get top restaurants error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get top food items
router.get('/top-foods', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { limit = 10 } = req.query;

        const topFoods = await Order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.food',
                    totalOrdered: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            {
                $lookup: {
                    from: 'foods',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'food'
                }
            },
            { $unwind: '$food' },
            {
                $project: {
                    name: '$food.name',
                    category: '$food.category',
                    totalOrdered: 1,
                    totalRevenue: 1,
                    restaurant: '$food.restaurant'
                }
            },
            { $sort: { totalOrdered: -1 } },
            { $limit: parseInt(limit) }
        ]);

        res.json({ topFoods });
    } catch (error) {
        console.error('Get top foods error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;