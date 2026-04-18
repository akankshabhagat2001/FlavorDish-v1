import express from 'express';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import Food from '../models/Food.js';
import { FraudReport } from '../models/FormModels.js';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin, authorizeRoles as authorize } from '../middleware/roleMiddleware.js';;
import AdminLogin from '../models/AdminLogin.js';

const router = express.Router();

// Admin signup endpoint
router.post('/signup', async(req, res) => {
    const { email, password } = req.body;
    try {
        // Check if admin already exists
        const existing = await AdminLogin.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Admin already exists' });
        }
        const admin = new AdminLogin({ email, password });
        await admin.save();
        res.json({ message: 'Admin registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin login verification endpoint
router.post('/login', async(req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await AdminLogin.findOne({ email, password });
        if (!admin) {
            return res.status(401).json({ message: 'Admin not found' });
        }
        // You can add JWT or session logic here if needed
        res.json({ message: 'Login successful', admin: { email: admin.email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get dashboard stats
router.get('/stats', authenticate, requireAdmin, async(req, res) => {
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
                totalRevenue: totalRevenue[0] ? totalRevenue[0].total || 0 : 0,
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

// ===== USER MANAGEMENT =====

// Get all users with pagination and filters
router.get('/users', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { page = 1, limit = 20, role, status, search } = req.query;

        let query = {};
        if (role) query.role = role;
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update user status (activate/deactivate)
router.put('/users/:id/status', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id, { isActive }, { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`,
            user
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update user role
router.put('/users/:id/role', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['customer', 'restaurant_owner', 'delivery_partner', 'admin'];

        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role.' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id, { role }, { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            message: 'User role updated successfully.',
            user
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Delete user
router.delete('/users/:id', authenticate, authorize('admin'), async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Don't allow deleting admin users
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot delete admin users.' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ===== RESTAURANT APPROVAL SYSTEM =====

// Get pending restaurant approvals
router.get('/restaurants/pending', authenticate, authorize('admin'), async(req, res) => {
    try {
        const restaurants = await Restaurant.find({ isActive: false })
            .populate('owner', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ restaurants });
    } catch (error) {
        console.error('Get pending restaurants error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Approve or reject restaurant
router.put('/restaurants/:id/approval', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { approved, rejectionReason } = req.body;

        const updateData = {
            isActive: approved,
            ...(approved ? {} : { rejectionReason })
        };

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            updateData, { new: true }
        ).populate('owner', 'name email');

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        res.json({
            message: `Restaurant ${approved ? 'approved' : 'rejected'} successfully.`,
            restaurant
        });
    } catch (error) {
        console.error('Restaurant approval error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ===== FRAUD REPORT MANAGEMENT =====

// Get all fraud reports
router.get('/fraud-reports', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;

        let query = {};
        if (status) query.status = status;

        const reports = await FraudReport.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await FraudReport.countDocuments(query);

        res.json({
            reports,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get fraud reports error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update fraud report status
router.put('/fraud-reports/:id/status', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { status, notes } = req.body;

        const report = await FraudReport.findByIdAndUpdate(
            req.params.id, { status, notes }, { new: true }
        ).populate('userId', 'name email');

        if (!report) {
            return res.status(404).json({ message: 'Fraud report not found.' });
        }

        res.json({
            message: 'Fraud report updated successfully.',
            report
        });
    } catch (error) {
        console.error('Update fraud report error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ===== COMMISSION MANAGEMENT =====

// Get commission settings
router.get('/commission', authenticate, authorize('admin'), async(req, res) => {
    try {
        // For now, return hardcoded commission rates
        // In production, this would be stored in database
        const commissionRates = {
            platformFee: 10, // 10%
            deliveryFee: 20, // 20 INR per delivery
            gstRate: 18, // 18%
            lastUpdated: new Date()
        };

        res.json({ commissionRates });
    } catch (error) {
        console.error('Get commission error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update commission settings
router.put('/commission', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { platformFee, deliveryFee, gstRate } = req.body;

        // Validate inputs
        if (platformFee < 0 || platformFee > 50) {
            return res.status(400).json({ message: 'Platform fee must be between 0-50%.' });
        }
        if (deliveryFee < 0 || deliveryFee > 100) {
            return res.status(400).json({ message: 'Delivery fee must be between 0-100 INR.' });
        }
        if (gstRate < 0 || gstRate > 30) {
            return res.status(400).json({ message: 'GST rate must be between 0-30%.' });
        }

        // In production, save to database
        const commissionRates = {
            platformFee,
            deliveryFee,
            gstRate,
            lastUpdated: new Date()
        };

        res.json({
            message: 'Commission settings updated successfully.',
            commissionRates
        });
    } catch (error) {
        console.error('Update commission error:', error);
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

        const validStatuses = ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

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