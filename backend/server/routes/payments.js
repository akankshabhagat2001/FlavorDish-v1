import express from 'express';
import crypto from 'crypto';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Payment from '../models/Payment.js';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles as authorize } from '../middleware/roleMiddleware.js';;

const router = express.Router();

let razorpayInstance = null;
const getRazorpay = async () => {
    if (razorpayInstance) return razorpayInstance;
    try {
        const Razorpay = (await import('razorpay')).default;
        razorpayInstance = new Razorpay({
            key_id:     process.env.RAZORPAY_KEY_ID || 'rzp_test_1234',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret'
        });
        return razorpayInstance;
    } catch {
        return null;
    }
};

// Razorpay: Create Order
router.post('/razorpay/create-order', authenticate, authorize('customer'), async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ message: 'orderId is required.' });

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found.' });
        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not allowed to pay for this order.' });
        }

        const rzp = await getRazorpay();
        if (!rzp) return res.status(500).json({ message: 'Payment gateway not ready.' });

        const rzpOrder = await rzp.orders.create({
            amount:   Math.round(order.total * 100), // paise
            currency: 'INR',
            receipt:  order.orderNumber,
            notes:    { orderId: order._id.toString() },
        });

        order.paymentGateway = 'razorpay';
        order.paymentTransactionId = rzpOrder.id;
        await order.save();
        await Payment.findOneAndUpdate({ orderId: order._id, userId: req.user._id }, {
            orderId: order._id,
            userId: req.user._id,
            amount: order.total,
            paymentType: 'prepaid',
            paymentMethod: 'upi',
            paymentGateway: 'razorpay',
            status: 'pending',
            razorpayOrderId: rzpOrder.id
        }, { upsert: true, new: true, setDefaultsOnInsert: true });

        return res.json({
            rzpOrderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            orderNumber: order.orderNumber,
        });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to create Razorpay order.', detail: err.message });
    }
});

// Razorpay: Verify Payment
router.post('/razorpay/verify', authenticate, authorize('customer'), async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ message: 'RAZORPAY_KEY_SECRET is not configured.' });
        }
        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSig !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment signature verification failed.' });
        }

        const order = await Order.findOneAndUpdate(
            { paymentTransactionId: razorpay_order_id, customer: req.user._id },
            {
                paymentStatus: 'paid',
                status: 'confirmed',
                $push: {
                    statusHistory: { status: 'confirmed', note: `Razorpay verified. Payment ID: ${razorpay_payment_id}`, timestamp: new Date() }
                }
            },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({ message: 'Order not found for this payment.' });
        }
        await Payment.findOneAndUpdate({ orderId: order._id, userId: req.user._id }, {
            orderId: order._id,
            userId: req.user._id,
            amount: order.total,
            paymentType: 'prepaid',
            paymentMethod: 'upi',
            paymentGateway: 'razorpay',
            status: 'completed',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            transactionId: razorpay_payment_id,
            completedAt: new Date()
        }, { upsert: true, new: true });

        return res.json({ verified: true, message: 'Payment verified successfully.', orderId: order._id });
    } catch (err) {
        return res.status(500).json({ message: 'Payment verification error.' });
    }
});

// Process an online payment for an order
router.post('/process', authenticate, authorize('customer'), async(req, res) => {
    try {
        const { orderId, amount, method } = req.body;

        if (!orderId || !amount || !method) {
            return res.status(400).json({ message: 'Missing payment details.' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Order already paid.' });
        }

        // Simulated gateway flow
        order.paymentStatus = 'paid';
        order.paymentMethod = 'online';
        order.paymentGateway = method;
        order.paymentTransactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        await order.save();

        return res.json({ message: 'Payment successful.', order });
    } catch (error) {
        console.error('Payment processing error:', error);
        return res.status(500).json({ message: 'Payment processing failed.' });
    }
});

const calculateShares = (order) => {
    const deliveryShare = Math.round(order.total * 0.05); // 5% delivery partner fee
    const platformFee = Math.round(order.total * 0.03); // 3% platform fee
    const restaurantShare = Math.max(0, Math.round(order.total - deliveryShare - platformFee));
    return { restaurantShare, deliveryShare, platformFee };
};

// Auto release pending settlements once order is delivered + 10 days passed
const releasePendingSettlements = async() => {
    try {
        const tenDaysAgo = new Date(Date.now() - (10 * 24 * 60 * 60 * 1000));
        const pendingOrders = await Order.find({
            status: 'delivered',
            actualDeliveryTime: { $lte: tenDaysAgo },
            settlementStatus: 'pending'
        });

        for (const ord of pendingOrders) {
            const { restaurantShare, deliveryShare } = calculateShares(ord);
            // restaurant wallet
            const restaurant = await Restaurant.findById(ord.restaurant);
            if (restaurant) {
                restaurant.walletBalance = (restaurant.walletBalance || 0) + restaurantShare;
                await restaurant.save();
            }
            // delivery partner wallet
            if (ord.deliveryPartner) {
                const partner = await User.findById(ord.deliveryPartner);
                if (partner) {
                    partner.walletBalance = (partner.walletBalance || 0) + deliveryShare;
                    await partner.save();
                }
            }
            ord.restaurantPayout = restaurantShare;
            ord.deliveryPayout = deliveryShare;
            ord.settlementStatus = 'settled';
            await ord.save();
        }

        return pendingOrders;
    } catch (error) {
        console.error('Auto release settlements error:', error);
        return [];
    }
};

// Schedule it when module is loaded
setInterval(releasePendingSettlements, 6 * 60 * 60 * 1000); // every 6 hours

// Manual trigger for admin/restaurant
router.post('/release/auto', authenticate, authorize('restaurant_owner', 'admin'), async(req, res) => {
    try {
        const releasedOrders = await releasePendingSettlements();
        res.json({ message: 'Auto settlements processed.', releasedOrdersCount: releasedOrders.length });
    } catch (error) {
        console.error('Auto release manual trigger:', error);
        res.status(500).json({ message: 'Failed to perform auto release.' });
    }
});

// Release restaurant payout
router.post('/release/restaurant/:orderId', authenticate, authorize('restaurant_owner', 'admin'), async(req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found.' });
        if (order.status !== 'delivered') return res.status(400).json({ message: 'Only delivered orders are eligible for settlements.' });

        const restaurant = await Restaurant.findById(order.restaurant);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });

        // Authorization check for owner
        if (req.user.role === 'restaurant_owner' && restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const { restaurantShare } = calculateShares(order);

        restaurant.walletBalance = (restaurant.walletBalance || 0) + restaurantShare;
        await restaurant.save();

        order.settlementStatus = 'restaurant_paid';
        order.restaurantPayout = restaurantShare;
        await order.save();

        return res.json({ message: 'Restaurant payout released.', restaurant, order });
    } catch (error) {
        console.error('Restaurant payout error:', error);
        return res.status(500).json({ message: 'Failed to release restaurant payout.' });
    }
});

// Release delivery partner payout
router.post('/release/delivery/:orderId', authenticate, authorize('delivery_partner', 'admin'), async(req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found.' });
        if (order.status !== 'delivered') return res.status(400).json({ message: 'Only delivered orders are eligible for settlements.' });

        if (!order.deliveryPartner) return res.status(400).json({ message: 'No delivery partner assigned.' });

        const partner = await User.findById(order.deliveryPartner);
        if (!partner) return res.status(404).json({ message: 'Delivery partner not found.' });

        const { deliveryShare } = calculateShares(order);

        partner.walletBalance = (partner.walletBalance || 0) + deliveryShare;
        await partner.save();

        order.deliveryPayout = deliveryShare;
        await order.save();

        return res.json({ message: 'Delivery partner payout released.', partner, order });
    } catch (error) {
        console.error('Delivery payout error:', error);
        return res.status(500).json({ message: 'Failed to release delivery partner payout.' });
    }
});

// Get aggregated balance for logged-in partner/restaurant
router.get('/balances', authenticate, async(req, res) => {
    try {
        if (req.user.role === 'restaurant_owner') {
            const restaurant = await Restaurant.findOne({ owner: req.user._id });
            return res.json({ walletBalance: restaurant?.walletBalance || 0 });
        }
        if (req.user.role === 'delivery_partner') {
            const partner = await User.findById(req.user._id);
            return res.json({ walletBalance: partner?.walletBalance || 0 });
        }
        return res.json({ walletBalance: 0 });
    } catch (error) {
        console.error('Balance fetch error:', error);
        return res.status(500).json({ message: 'Failed to retrieve balances.' });
    }
});

export default router;
