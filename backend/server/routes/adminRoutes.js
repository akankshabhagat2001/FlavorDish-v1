/**
 * adminRoutes.js — Complete Admin REST API
 * Adds all missing endpoints to the existing admin.js route:
 *  - Delivery partner management
 *  - Payment/transaction history
 *  - Notifications (send + list)
 *  - Activity logs (detailed)
 *  - Analytics (charts data)
 *  - CSV export
 *  - Restaurant CRUD
 *  - System health
 */

import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import ActivityLog from '../models/ActivityLog.js';
import Review from '../models/Review.js';
import { Subscription } from '../models/Subscription.js';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles as authorize } from '../middleware/roleMiddleware.js';;

const router = express.Router();
const adminOnly = [authenticate, authorize('admin')];

/* ─────────────────────────── helpers ─────────────────────────── */
const logAdminAction = async (req, action, details = {}) => {
  try {
    await ActivityLog.create({
      userId: req.user._id,
      userRole: 'admin',
      action,
      details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (_) {}
};

const paginationPipeline = (page, limit) => [
  { $skip: (Number(page) - 1) * Number(limit) },
  { $limit: Number(limit) },
];

/* ══════════════════════════════════════════════════════════════
   DASHBOARD STATS
══════════════════════════════════════════════════════════════ */
router.get('/dashboard', ...adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalUsers,
      newUsersToday,
      totalRestaurants,
      activeRestaurants,
      pendingRestaurants,
      totalOrders,
      ordersToday,
      revenueAgg,
      revenueTodayAgg,
      revenueMonthAgg,
      revenueLastMonthAgg,
      ordersByStatus,
      usersByRole,
      recentOrders,
      topRestaurants,
      deliveryPartners,
      activeDeliveries,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ isOpen: true }),
      Restaurant.countDocuments({ isApproved: false, isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: todayStart } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Order.find().populate('customer', 'name email').populate('restaurant', 'name').sort({ createdAt: -1 }).limit(8).lean(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: '$restaurant', revenue: { $sum: '$total' }, orderCount: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
        { $unwind: '$restaurant' },
        { $project: { name: '$restaurant.name', revenue: 1, orderCount: 1 } },
      ]),
      User.countDocuments({ role: 'delivery_partner' }),
      User.countDocuments({ role: 'delivery_partner', isAvailable: true }),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const revenueToday = revenueTodayAgg[0]?.total || 0;
    const revenueThisMonth = revenueMonthAgg[0]?.total || 0;
    const revenueLastMonth = revenueLastMonthAgg[0]?.total || 0;
    const revenueGrowth = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : 0;

    res.json({
      overview: {
        totalUsers, newUsersToday,
        totalRestaurants, activeRestaurants, pendingRestaurants,
        totalOrders, ordersToday,
        totalRevenue, revenueToday, revenueThisMonth, revenueGrowth,
        deliveryPartners, activeDeliveries,
      },
      ordersByStatus,
      usersByRole,
      recentOrders,
      topRestaurants,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════════
   ANALYTICS — Charts data
══════════════════════════════════════════════════════════════ */
router.get('/analytics/orders', ...adminOnly, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const since = new Date(Date.now() - days * 86400000);

    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/analytics/revenue', ...adminOnly, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const since = new Date(Date.now() - days * 86400000);

    const data = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/analytics/users', ...adminOnly, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = period === '90d' ? 90 : period === '7d' ? 7 : 30;
    const since = new Date(Date.now() - days * 86400000);

    const data = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════════
   USER MANAGEMENT
══════════════════════════════════════════════════════════════ */
router.get('/users', ...adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      User.countDocuments(query),
    ]);

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users/:id', ...adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const orderCount = await Order.countDocuments({ customer: user._id });
    const totalSpent = await Order.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(user._id), paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    res.json({ user: { ...user, orderCount, totalSpent: totalSpent[0]?.total || 0 } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/status', ...adminOnly, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logAdminAction(req, isActive ? 'USER_UNBLOCKED' : 'USER_BLOCKED', { targetUserId: user._id, userName: user.name });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/role', ...adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['customer', 'restaurant_owner', 'delivery_partner', 'admin'];
    if (!validRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    await logAdminAction(req, 'USER_ROLE_CHANGED', { targetUserId: user._id, newRole: role });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/users/:id', ...adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logAdminAction(req, 'USER_DELETED', { targetUserId: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════════
   RESTAURANT MANAGEMENT
══════════════════════════════════════════════════════════════ */
router.get('/restaurants', ...adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, approved } = req.query;
    const query = {};
    if (status === 'open') query.isOpen = true;
    if (status === 'closed') query.isOpen = false;
    if (approved === 'true') query.isApproved = true;
    if (approved === 'false') query.isApproved = false;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { 'address.city': { $regex: search, $options: 'i' } }];

    const [restaurants, total] = await Promise.all([
      Restaurant.find(query).populate('owner', 'name email').sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      Restaurant.countDocuments(query),
    ]);

    res.json({ restaurants, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/restaurants/pending', ...adminOnly, async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isApproved: false })
      .populate('owner', 'name email phone').lean();
    res.json({ restaurants });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/restaurants/:id/approval', ...adminOnly, async (req, res) => {
  try {
    const { isApproved, reason } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id, { isApproved, isActive: isApproved }, { new: true }
    );
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    await logAdminAction(req, isApproved ? 'RESTAURANT_APPROVED' : 'RESTAURANT_REJECTED', {
      restaurantId: restaurant._id, name: restaurant.name, reason,
    });
    res.json({ restaurant });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/restaurants/:id', ...adminOnly, async (req, res) => {
  try {
    const allowed = ['name', 'description', 'cuisine', 'isOpen', 'isActive', 'isApproved', 'phone', 'email', 'commissionRate'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    await logAdminAction(req, 'RESTAURANT_UPDATED', { restaurantId: restaurant._id });
    res.json({ restaurant });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/restaurants/:id', ...adminOnly, async (req, res) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.id);
    await logAdminAction(req, 'RESTAURANT_DELETED', { restaurantId: req.params.id });
    res.json({ message: 'Restaurant deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════════
   ORDER MANAGEMENT
══════════════════════════════════════════════════════════════ */
router.get('/orders', ...adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, from, to } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to + 'T23:59:59');
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email phone')
        .populate('restaurant', 'name address')
        .populate('deliveryPartner', 'name phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      Order.countDocuments(query),
    ]);

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/orders/:id', ...adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name address phone')
      .populate('deliveryPartner', 'name phone currentLocation')
      .lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const payment = await Payment.findOne({ orderId: order._id }).lean();
    res.json({ order: { ...order, payment } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/orders/:id/status', ...adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await logAdminAction(req, 'ORDER_STATUS_UPDATED', { orderId: order._id, status });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════════
   DELIVERY PARTNER MANAGEMENT
══════════════════════════════════════════════════════════════ */
router.get('/delivery/partners', ...adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = { role: 'delivery_partner' };
    if (status === 'active') query.isActive = true;
    if (status === 'available') query.isAvailable = true;
    if (status === 'busy') query.isAvailable = false;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const [partners, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      User.countDocuments(query),
    ]);

    const partnersWithStats = await Promise.all(partners.map(async (p) => {
      const [totalDeliveries, activeOrder] = await Promise.all([
        Order.countDocuments({ deliveryPartner: p._id, status: 'delivered' }),
        Order.findOne({ deliveryPartner: p._id, status: { $in: ['picked_up', 'ready'] } })
          .populate('restaurant', 'name').populate('customer', 'name').lean(),
      ]);
      return { ...p, totalDeliveries, activeOrder };
    }));

    res.json({ partners: partnersWithStats, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/delivery/active', ...adminOnly, async (req, res) => {
  try {
    const activeOrders = await Order.find({ status: { $in: ['picked_up', 'ready', 'confirmed'] } })
      .populate('deliveryPartner', 'name phone currentLocation isAvailable')
      .populate('customer', 'name address')
      .populate('restaurant', 'name address')
      .lean();
    res.json({ activeOrders });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/delivery/assign', ...adminOnly, async (req, res) => {
  try {
    const { orderId, partnerId } = req.body;
    const [order, partner] = await Promise.all([
      Order.findById(orderId),
      User.findOne({ _id: partnerId, role: 'delivery_partner' }),
    ]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!partner) return res.status(404).json({ message: 'Delivery partner not found' });

    order.deliveryPartner = partnerId;
    order.status = 'confirmed';
    await order.save();
    await User.findByIdAndUpdate(partnerId, { isAvailable: false });
    await logAdminAction(req, 'DELIVERY_ASSIGNED', { orderId, partnerId });
    res.json({ message: 'Delivery partner assigned', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/delivery/partners/:id/status', ...adminOnly, async (req, res) => {
  try {
    const { isActive, isAvailable } = req.body;
    const update = {};
    if (isActive !== undefined) update.isActive = isActive;
    if (isAvailable !== undefined) update.isAvailable = isAvailable;
    const partner = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'delivery_partner' }, update, { new: true }
    ).select('-password');
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    res.json({ partner });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════════
   PAYMENT MANAGEMENT
══════════════════════════════════════════════════════════════ */
router.get('/payments', ...adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, method, from, to, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (method && method !== 'all') query.paymentMethod = method;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to + 'T23:59:59');
    }
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { razorpayPaymentId: { $regex: search, $options: 'i' } },
      ];
    }

    const [payments, total, summaryAgg] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'name email')
        .populate('orderId', 'orderNumber total status')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      Payment.countDocuments(query),
      Payment.aggregate([
        { $match: query },
        { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const summary = {};
    summaryAgg.forEach(s => { summary[s._id] = { total: s.total, count: s.count }; });

    res.json({ payments, total, page: Number(page), pages: Math.ceil(total / limit), summary });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/payments/:id', ...adminOnly, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('orderId').lean();
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ payment });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/payments/:id/refund', ...adminOnly, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'completed') return res.status(400).json({ message: 'Can only refund completed payments' });

    payment.status = 'refunded';
    payment.refundAmount = amount || payment.amount;
    payment.refundInitiatedAt = new Date();
    await payment.save();

    await logAdminAction(req, 'PAYMENT_REFUNDED', { paymentId: payment._id, amount: payment.refundAmount, reason });
    res.json({ payment, message: 'Refund initiated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════════════════════════════ */

// In-memory store (replace with DB model in production)
const adminNotifications = [];

router.get('/notifications', ...adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const sorted = adminNotifications.sort((a, b) => b.createdAt - a.createdAt);
    const paged = sorted.slice((page - 1) * limit, page * limit);
    res.json({ notifications: paged, total: adminNotifications.length, unread: adminNotifications.filter(n => !n.read).length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/notifications/send', ...adminOnly, async (req, res) => {
  try {
    const { title, message, targetRole, targetUserId } = req.body;
    if (!title || !message) return res.status(400).json({ message: 'Title and message required' });

    let targetCount = 0;
    if (targetRole) targetCount = await User.countDocuments({ role: targetRole, isActive: true });
    else if (targetUserId) targetCount = 1;
    else targetCount = await User.countDocuments({ isActive: true });

    const notif = {
      _id: new mongoose.Types.ObjectId().toString(),
      title, message, targetRole, targetUserId,
      sentBy: req.user._id,
      targetCount,
      createdAt: Date.now(),
      read: false,
      type: 'broadcast',
    };
    adminNotifications.unshift(notif);

    await logAdminAction(req, 'NOTIFICATION_SENT', { title, targetRole, targetCount });
    res.json({ message: 'Notification sent', notification: notif });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/notifications/:id/read', ...adminOnly, async (req, res) => {
  try {
    const notif = adminNotifications.find(n => n._id === req.params.id);
    if (notif) notif.read = true;
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/notifications/read-all', ...adminOnly, async (req, res) => {
  try {
    adminNotifications.forEach(n => { n.read = true; });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════════
   ACTIVITY LOGS
══════════════════════════════════════════════════════════════ */
router.get('/activity', ...adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 30, action, role, userId, from, to } = req.query;
    const query = {};
    if (action) query.action = { $regex: action, $options: 'i' };
    if (role) query.userRole = role;
    if (userId) query.userId = userId;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to + 'T23:59:59');
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      ActivityLog.countDocuments(query),
    ]);

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════════
   CSV EXPORT
══════════════════════════════════════════════════════════════ */
const toCSV = (rows, headers) => {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headerRow = headers.map(h => escape(h.label)).join(',');
  const dataRows = rows.map(row => headers.map(h => {
    const val = h.key.split('.').reduce((o, k) => o?.[k], row);
    return escape(val);
  }).join(','));
  return [headerRow, ...dataRows].join('\n');
};

router.get('/export/:type', ...adminOnly, async (req, res) => {
  try {
    const { type } = req.params;
    const { from, to } = req.query;
    const dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(to + 'T23:59:59');
    }

    let csv = '';
    const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'users') {
      const users = await User.find(dateFilter).select('-password').lean();
      csv = toCSV(users, [
        { key: '_id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' }, { key: 'phone', label: 'Phone' },
        { key: 'isActive', label: 'Active' }, { key: 'createdAt', label: 'Joined' },
      ]);
    } else if (type === 'orders') {
      const orders = await Order.find(dateFilter)
        .populate('customer', 'name email').populate('restaurant', 'name').lean();
      csv = toCSV(orders, [
        { key: 'orderNumber', label: 'Order#' }, { key: 'customer.name', label: 'Customer' },
        { key: 'customer.email', label: 'Email' }, { key: 'restaurant.name', label: 'Restaurant' },
        { key: 'total', label: 'Total (₹)' }, { key: 'status', label: 'Status' },
        { key: 'paymentStatus', label: 'Payment' }, { key: 'createdAt', label: 'Date' },
      ]);
    } else if (type === 'restaurants') {
      const restaurants = await Restaurant.find(dateFilter)
        .populate('owner', 'name email').lean();
      csv = toCSV(restaurants, [
        { key: '_id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'owner.name', label: 'Owner' },
        { key: 'owner.email', label: 'Owner Email' }, { key: 'address.city', label: 'City' },
        { key: 'rating', label: 'Rating' }, { key: 'isOpen', label: 'Open' },
        { key: 'isApproved', label: 'Approved' }, { key: 'createdAt', label: 'Created' },
      ]);
    } else if (type === 'payments') {
      const payments = await Payment.find(dateFilter)
        .populate('userId', 'name email').lean();
      csv = toCSV(payments, [
        { key: '_id', label: 'ID' }, { key: 'userId.name', label: 'User' },
        { key: 'userId.email', label: 'Email' }, { key: 'amount', label: 'Amount (₹)' },
        { key: 'paymentMethod', label: 'Method' }, { key: 'status', label: 'Status' },
        { key: 'transactionId', label: 'Transaction ID' }, { key: 'createdAt', label: 'Date' },
      ]);
    } else {
      return res.status(400).json({ message: 'Invalid export type' });
    }

    await logAdminAction(req, 'DATA_EXPORTED', { type, rows: csv.split('\n').length - 1 });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════════
   SYSTEM HEALTH
══════════════════════════════════════════════════════════════ */
router.get('/system-health', ...adminOnly, async (req, res) => {
  try {
    const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const memUsage = process.memoryUsage();
    res.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      database: { state: dbState[mongoose.connection.readyState] },
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      },
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════════
   REVIEWS (ADMIN OVERVIEW)
══════════════════════════════════════════════════════════════ */
router.get('/reviews', ...adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('userId', 'name email')
        .populate('restaurantId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      Review.countDocuments(query),
    ]);

    res.json({ reviews, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/reviews/:id', ...adminOnly, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    // Update restaurant rating
    await Review.updateRestaurantRating(review.restaurantId);
    await logAdminAction(req, 'REVIEW_DELETED', { reviewId: req.params.id, restaurantId: review.restaurantId });
    
    res.json({ message: 'Review deleted', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════════
   SUBSCRIPTIONS (ADMIN OVERVIEW)
══════════════════════════════════════════════════════════════ */
router.get('/subscriptions', ...adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, plan } = req.query;
    const query = {};
    if (plan && plan !== 'all') query.plan = plan;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      Subscription.countDocuments(query),
    ]);

    res.json({ subscriptions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
