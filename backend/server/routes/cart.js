import express from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';;
import Cart from '../models/Cart.js';
import Food from '../models/Food.js';

const router = express.Router();

const populateCart = (query) => query.populate({
    path: 'items.food',
    select: 'name price images isVeg isAvailable restaurant',
    populate: { path: 'restaurant', select: 'name rating' }
});

const getOrCreateCart = async(userId) => {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
    }
    return cart;
};

router.get('/', authenticate, async(req, res) => {
    const cart = await getOrCreateCart(req.user._id);
    const hydrated = await populateCart(Cart.findById(cart._id));
    return res.json({ cart: hydrated });
});

router.post('/items', authenticate, [
    body('foodId').isMongoId().withMessage('Valid foodId is required'),
    body('quantity').optional().isInt({ min: 1, max: 50 }).withMessage('Quantity must be between 1 and 50')
], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { foodId, quantity = 1 } = req.body;
    const food = await Food.findById(foodId);
    if (!food || !food.isAvailable) {
        return res.status(400).json({ message: 'Food is not available' });
    }

    const cart = await getOrCreateCart(req.user._id);
    const existingItem = cart.items.find((item) => item.food.toString() === foodId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({ food: foodId, quantity });
    }

    await cart.save();
    const hydrated = await populateCart(Cart.findById(cart._id));
    return res.status(201).json({ message: 'Item added to cart', cart: hydrated });
});

router.put('/items/:foodId', authenticate, [
    body('quantity').isInt({ min: 1, max: 50 }).withMessage('Quantity must be between 1 and 50')
], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((entry) => entry.food.toString() === req.params.foodId);
    if (!item) {
        return res.status(404).json({ message: 'Cart item not found' });
    }

    item.quantity = Number(req.body.quantity);
    await cart.save();
    const hydrated = await populateCart(Cart.findById(cart._id));
    return res.json({ message: 'Cart updated', cart: hydrated });
});

router.delete('/items/:foodId', authenticate, async(req, res) => {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter((item) => item.food.toString() !== req.params.foodId);
    await cart.save();
    const hydrated = await populateCart(Cart.findById(cart._id));
    return res.json({ message: 'Item removed from cart', cart: hydrated });
});

router.delete('/', authenticate, async(req, res) => {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    return res.json({ message: 'Cart cleared', cart });
});

export default router;
