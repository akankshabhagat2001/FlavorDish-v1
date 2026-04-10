import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';
import Payment from '../models/Payment.js';

// Get platform analytics
export const getPlatformAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'customer' });
        const totalRestaurants = await Restaurant.countDocuments({ isActive: true });
        const totalDeliveryPartners = await User.countDocuments({ role: 'delivery_partner' });
        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const completedDeliveries = await Delivery.countDocuments({ status: 'delivered' });
        const totalDeliveries = await Delivery.countDocuments();
        const deliverySuccessRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries * 100).toFixed(2) : 0;

        const analytics = {
            users: {
                total: totalUsers,
                active: await User.countDocuments({ role: 'customer', isActive: true })
            },
            restaurants: {
                total: totalRestaurants,
                active: await Restaurant.countDocuments({ isActive: true, isOpen: true })
            },
            deliveryPartners: {
                total: totalDeliveryPartners,
                active: await User.countDocuments({ role: 'delivery_partner', isActive: true })
            },
            orders: {
                total: totalOrders,
                delivered: completedDeliveries,
                pending: await Order.countDocuments({ status: { $in: ['placed', 'confirmed', 'preparing'] } }),
                cancelled: await Order.countDocuments({ status: 'cancelled' })
            },
            revenue: {
                total: totalRevenue[0] ? .total || 0,
                lastMonth: await getRevenueForPeriod('month'),
                lastWeek: await getRevenueForPeriod('week')
            },
            delivery: {
                total: totalDeliveries,
                successRate: deliverySuccessRate
            }
        };

        res.status(200).json({
            success: true,
            message: 'Platform analytics retrieved successfully',
            data: analytics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics',
            error: error.message
        });
    }
};

// Helper function to get revenue for period
const getRevenueForPeriod = async (period) => {
    const now = new Date();
    let startDate;

    if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const result = await Order.aggregate([{
            $match: {
                createdAt: { $gte: startDate },
                status: 'delivered'
            }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    return result[0] ? .total || 0;
};

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const { role, status, page = 1, limit = 10, search } = req.query;

        let filter = {};

        if (role) filter.role = role;
        if (status) filter.isActive = status === 'active';

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const users = await User.find(filter)
            .select('-password')
            .limit(limit * 1)
            .skip(skip)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalResults: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Toggle user status
export const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user status',
            error: error.message
        });
    }
};

// Get all restaurants for admin review
export const getAllRestaurantsForAdmin = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let filter = {};
        if (status === 'pending') {
            filter.isApproved = false;
        } else if (status === 'approved') {
            filter.isApproved = true;
        }

        const skip = (page - 1) * limit;

        const restaurants = await Restaurant.find(filter)
            .populate('ownerId', 'name email phone')
            .limit(limit * 1)
            .skip(skip)
            .sort({ createdAt: -1 });

        const total = await Restaurant.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Restaurants retrieved successfully',
            data: restaurants,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalResults: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching restaurants',
            error: error.message
        });
    }
};

// Approve/Reject restaurant
export const approveRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { approved } = req.body;

        const restaurant = await Restaurant.findByIdAndUpdate(
            restaurantId, { isApproved: approved, updatedAt: new Date() }, { new: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Restaurant ${approved ? 'approved' : 'rejected'} successfully`,
            data: restaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating restaurant status',
            error: error.message
        });
    }
};

// Get all orders
export const getAllOrders = async (req, res) => {
    try {
        const { status, restaurantId, page = 1, limit = 10 } = req.query;

        let filter = {};

        if (status) filter.status = status;
        if (restaurantId) filter.restaurantId = restaurantId;

        const skip = (page - 1) * limit;

        const orders = await Order.find(filter)
            .populate('userId', 'name email phone')
            .populate('restaurantId', 'name')
            .limit(limit * 1)
            .skip(skip)
            .sort({ createdAt: -1 });

        const total = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalResults: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Get top performing restaurants
export const getTopRestaurants = async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const topRestaurants = await Restaurant.find({ isActive: true })
            .sort({ rating: -1, totalOrders: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            message: 'Top restaurants retrieved successfully',
            data: topRestaurants
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching top restaurants',
            error: error.message
        });
    }
};

// Get platform stats
export const getPlatformStats = async (req, res) => {
    try {
        const stats = {
            ordersToday: await Order.countDocuments({
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            }),
            deliveriesToday: await Delivery.countDocuments({
                deliveredAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            }),
            averageOrderValue: await getAverageOrderValue(),
            userRetention: '85%', // Mock data
            topCuisine: 'Pizza' // Should be calculated
        };

        res.status(200).json({
            success: true,
            message: 'Platform stats retrieved successfully',
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching stats',
            error: error.message
        });
    }
};

// Helper to get average order value
const getAverageOrderValue = async () => {
    const result = await Order.aggregate([
        { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
    ]);
    return result[0] ? .avg || 0;
};
