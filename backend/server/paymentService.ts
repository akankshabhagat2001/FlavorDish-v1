import express from 'express';
import crypto from 'crypto';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────
// RAZORPAY SETUP — lazy-load so server starts even without SDK
// ─────────────────────────────────────────────────────────
let razorpayInstance = null;

const getRazorpay = async () => {
    if (razorpayInstance) return razorpayInstance;
    try {
        const Razorpay = (await import('razorpay')).default;
        razorpayInstance = new Razorpay({
            key_id:     process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        return razorpayInstance;
    } catch {
        console.warn('Razorpay SDK missing — run: npm install razorpay');
        return null;
    }
};

// ─────────────────────────────────────────────────────────
// STEP 1 — Create a Razorpay order
//   Frontend calls this right after our order is saved in DB
// ─────────────────────────────────────────────────────────
router.post('/razorpay/create-order', authenticate, authorize('customer'), async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ message: 'orderId is required.' });

        const order = await Order.findById(orderId);
        if (!order)
            return res.status(404).json({ message: 'Order not found.' });
        if (order.customer.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Access denied.' });
        if (order.paymentStatus === 'paid')
            return res.status(400).json({ message: 'Order already paid.' });

        const rzp = await getRazorpay();
        if (!rzp)
            return res.status(500).json({ message: 'Payment gateway not ready. Run: npm install razorpay in backend/server' });

        const rzpOrder = await rzp.orders.create({
            amount:   Math.round(order.total * 100), // paise
            currency: 'INR',
            receipt:  order.orderNumber,
            notes:    { orderId: order._id.toString() },
        });

        order.paymentGateway        = 'razorpay';
        order.paymentTransactionId  = rzpOrder.id;
        await order.save();

        return res.json({
            rzpOrderId:  rzpOrder.id,
            amount:      rzpOrder.amount,      // paise — Razorpay checkout needs this
            currency:    rzpOrder.currency,
            keyId:       process.env.RAZORPAY_KEY_ID,
            orderNumber: order.orderNumber,
        });
    } catch (err) {
        console.error('create-order error:', err);
        return res.status(500).json({ message: 'Failed to create Razorpay order.', detail: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// STEP 2 — Verify payment (HMAC-SHA256 on key_secret)
//   No webhook secret needed — uses RAZORPAY_KEY_SECRET only.
//   Razorpay calls handler() on frontend after payment → 
//   frontend sends the 3 fields here.
// ─────────────────────────────────────────────────────────
router.post('/razorpay/verify', authenticate, authorize('customer'), async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
            return res.status(400).json({ message: 'Missing: razorpay_order_id, razorpay_payment_id, razorpay_signature.' });

        // Standard Razorpay HMAC — uses KEY_SECRET (not webhook secret)
        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSig !== razorpay_signature)
            return res.status(400).json({ message: 'Payment signature verification failed. Do not trust this payment.' });

        // Mark order paid
        const order = await Order.findOneAndUpdate(
            { paymentTransactionId: razorpay_order_id },
            {
                paymentStatus: 'paid',
                status:        'confirmed',
                $push: {
                    statusHistory: {
                        status:    'confirmed',
                        note:      `Razorpay verified. Payment ID: ${razorpay_payment_id}`,
                        timestamp: new Date(),
                    },
                },
            },
            { new: true }
        );

        if (!order)
            return res.status(404).json({ message: 'No order found for this Razorpay order ID.' });

        return res.json({
            verified:    true,
            message:     'Payment verified successfully.',
            orderId:     order._id,
            orderNumber: order.orderNumber,
        });
    } catch (err) {
        console.error('verify error:', err);
        return res.status(500).json({ message: 'Payment verification error.' });
    }
});

// ─────────────────────────────────────────────────────────
// WEBHOOK — completely optional for testing.
//   Only set RAZORPAY_WEBHOOK_SECRET if you configure a
//   webhook in the Razorpay dashboard. Safe to leave as
//   placeholder in .env for now — this route just skips
//   sig check when the env var is not set.
// ─────────────────────────────────────────────────────────
router.post('/razorpay/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        try {
            const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
            const body = req.body.toString();

            // Only verify signature if a real webhook secret is configured
            if (webhookSecret && webhookSecret !== 'XXXXXXXXXXXXXXXXXXXXXXXXXX') {
                const sig = req.headers['x-razorpay-signature'];
                const expected = crypto
                    .createHmac('sha256', webhookSecret)
                    .update(body)
                    .digest('hex');
                if (sig !== expected) {
                    console.warn('Webhook sig mismatch — ignoring.');
                    return res.status(400).json({ message: 'Invalid webhook signature.' });
                }
            } else {
                console.log('ℹ️  Webhook secret not set — skipping signature check (OK for testing).');
            }

            const event = JSON.parse(body);
            console.log('Razorpay webhook event:', event.event);

            if (event.event === 'payment.captured') {
                const { order_id, id: payment_id } = event.payload.payment.entity;
                await Order.findOneAndUpdate(
                    { paymentTransactionId: order_id, paymentStatus: { $ne: 'paid' } },
                    {
                        paymentStatus: 'paid',
                        status:        'confirmed',
                        $push: { statusHistory: { status: 'confirmed', note: `Webhook: payment.captured. ID: ${payment_id}`, timestamp: new Date() } },
                    }
                );
            }

            if (event.event === 'payment.failed') {
                const { order_id } = event.payload.payment.entity;
                await Order.findOneAndUpdate({ paymentTransactionId: order_id }, { paymentStatus: 'failed' });
            }

            return res.json({ received: true });
        } catch (err) {
            console.error('Webhook error:', err);
            return res.status(500).json({ message: 'Webhook error.' });
        }
    }
);

// ─────────────────────────────────────────────────────────
// COD — Cash on Delivery confirm
// ─────────────────────────────────────────────────────────
router.post('/process', authenticate, authorize('customer'), async (req, res) => {
    try {
        const { orderId, method } = req.body;
        if (!orderId) return res.status(400).json({ message: 'orderId required.' });

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found.' });
        if (order.customer.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Access denied.' });

        if (method !== 'cash_on_delivery')
            return res.status(400).json({ message: 'Use /razorpay/create-order for online payments.' });

        order.paymentMethod = 'cash_on_delivery';
        order.paymentStatus = 'pending';
        order.status        = 'confirmed';
        order.statusHistory.push({ status: 'confirmed', note: 'COD confirmed', timestamp: new Date() });
        await order.save();

        return res.json({ message: 'COD order confirmed.', order });
    } catch (err) {
        console.error('COD error:', err);
        return res.status(500).json({ message: 'Failed to confirm COD order.' });
    }
});

// ─────────────────────────────────────────────────────────
// SETTLEMENTS
// ─────────────────────────────────────────────────────────
const calculateShares = (order) => {
    const deliveryShare  = Math.round(order.total * 0.05);
    const platformFee    = Math.round(order.total * 0.03);
    const restaurantShare = Math.max(0, Math.round(order.total - deliveryShare - platformFee));
    return { restaurantShare, deliveryShare, platformFee };
};

export const releasePendingSettlements = async () => {
    try {
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        const pendingOrders = await Order.find({
            status:           'delivered',
            actualDeliveryTime: { $lte: tenDaysAgo },
            settlementStatus: 'pending',
            paymentStatus:    'paid',
        });
        for (const ord of pendingOrders) {
            const { restaurantShare, deliveryShare } = calculateShares(ord);
            const restaurant = await Restaurant.findById(ord.restaurant);
            if (restaurant) { restaurant.walletBalance = (restaurant.walletBalance || 0) + restaurantShare; await restaurant.save(); }
            if (ord.deliveryPartner) {
                const partner = await User.findById(ord.deliveryPartner);
                if (partner) { partner.walletBalance = (partner.walletBalance || 0) + deliveryShare; await partner.save(); }
            }
            ord.restaurantPayout = restaurantShare;
            ord.deliveryPayout   = deliveryShare;
            ord.settlementStatus = 'settled';
            await ord.save();
        }
        return pendingOrders;
    } catch (err) { console.error('Settlement error:', err); return []; }
};

router.post('/release/restaurant/:orderId', authenticate, authorize('restaurant_owner', 'admin'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found.' });
        if (order.status !== 'delivered') return res.status(400).json({ message: 'Only delivered orders eligible.' });
        const restaurant = await Restaurant.findById(order.restaurant);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });
        if (req.user.role === 'restaurant_owner' && restaurant.owner.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Access denied.' });
        const { restaurantShare } = calculateShares(order);
        restaurant.walletBalance = (restaurant.walletBalance || 0) + restaurantShare;
        await restaurant.save();
        order.settlementStatus = 'restaurant_paid'; order.restaurantPayout = restaurantShare;
        await order.save();
        return res.json({ message: 'Restaurant payout released.', walletBalance: restaurant.walletBalance });
    } catch (err) { return res.status(500).json({ message: 'Payout failed.' }); }
});

router.post('/release/delivery/:orderId', authenticate, authorize('delivery_partner', 'admin'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found.' });
        if (order.status !== 'delivered') return res.status(400).json({ message: 'Only delivered orders eligible.' });
        if (!order.deliveryPartner) return res.status(400).json({ message: 'No delivery partner assigned.' });
        const partner = await User.findById(order.deliveryPartner);
        if (!partner) return res.status(404).json({ message: 'Partner not found.' });
        const { deliveryShare } = calculateShares(order);
        partner.walletBalance = (partner.walletBalance || 0) + deliveryShare;
        await partner.save();
        order.deliveryPayout = deliveryShare; await order.save();
        return res.json({ message: 'Delivery payout released.', walletBalance: partner.walletBalance });
    } catch (err) { return res.status(500).json({ message: 'Payout failed.' }); }
});

router.get('/balances', authenticate, async (req, res) => {
    try {
        if (req.user.role === 'restaurant_owner') {
            const r = await Restaurant.findOne({ owner: req.user._id });
            return res.json({ walletBalance: r?.walletBalance || 0 });
        }
        const u = await User.findById(req.user._id);
        return res.json({ walletBalance: u?.walletBalance || 0 });
    } catch { return res.status(500).json({ message: 'Failed to fetch balance.' }); }
});

export default router;