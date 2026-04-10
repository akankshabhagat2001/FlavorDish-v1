import express from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Delivery from '../models/Delivery.js';

const router = express.Router();

// Middleware to verify user
const verifyUser = async(req, res, next) => {
    const userId = req.headers['user-id'];
    if (!userId) return res.status(401).json({ error: 'User ID required' });
    req.userId = userId;
    next();
};

router.use(verifyUser);

// Create a new review
router.post('/', async(req, res) => {
    try {
        const { orderId, restaurantId, ratings, reviewText, photos } = req.body;

        // Verify order exists and belongs to user
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ orderId, userId: req.userId });
        if (existingReview) {
            return res.status(400).json({ error: 'Review already submitted' });
        }

        // Get user info for review
        const user = await User.findById(req.userId);

        // Create review
        const review = new Review({
            orderId,
            restaurantId,
            userId: req.userId,
            type: 'restaurant',
            targetId: restaurantId,
            rating: (ratings.foodQuality + ratings.deliverySpeed + ratings.packaging + ratings.restaurant) / 4,
            categories: {
                foodQuality: ratings.foodQuality,
                packaging: ratings.packaging,
                delivery: ratings.deliverySpeed,
                punctuality: ratings.restaurant
            },
            comment: reviewText,
            photos: photos?.map(url => ({ url, uploadedAt: new Date() })) || [],
            isVerifiedPurchase: true,
            status: 'approved'
        });

        await review.save();

        // Update restaurant rating
        await Review.updateRestaurantRating(restaurantId);

        // Mark order as reviewed
        order.ratings = { food: ratings.foodQuality, delivery: ratings.deliverySpeed };
        await order.save();

        res.json({
            success: true,
            review,
            message: 'Review submitted successfully'
        });
    } catch (error) {
        console.error('Review creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get reviews for a restaurant
router.get('/restaurant/:restaurantId', async(req, res) => {
    try {
        const { rating, sort = 'recent', limit = 10, page = 1 } = req.query;

        let query = { restaurantId: req.params.restaurantId, status: 'approved' };
        if (rating) query.rating = { $gte: parseInt(rating) };

        let sortOption = { createdAt: -1 };
        if (sort === 'helpful') sortOption = { 'helpful.count': -1, createdAt: -1 };
        if (sort === 'highest') sortOption = { rating: -1, createdAt: -1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reviews = await Review.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('userId', 'name email photos')
            .exec();

        const total = await Review.countDocuments(query);

        res.json({
            reviews,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get rating breakdown for restaurant
router.get('/restaurant/:restaurantId/breakdown', async(req, res) => {
    try {
        const reviews = await Review.find({
            restaurantId: req.params.restaurantId,
            status: 'approved'
        });

        const breakdown = {
            total: reviews.length,
            average: 0,
            foodQuality: 0,
            delivery: 0,
            packaging: 0,
            punctuality: 0,
            distribution: {
                5: 0,
                4: 0,
                3: 0,
                2: 0,
                1: 0
            }
        };

        if (reviews.length > 0) {
            let totalRating = 0;
            let currentBreakdown = { foodQuality: 0, delivery: 0, packaging: 0, punctuality: 0 };

            reviews.forEach(review => {
                totalRating += review.rating;
                currentBreakdown.foodQuality += review.categories?.foodQuality || 0;
                currentBreakdown.delivery += review.categories?.delivery || 0;
                currentBreakdown.packaging += review.categories?.packaging || 0;
                currentBreakdown.punctuality += review.categories?.punctuality || 0;
                breakdown.distribution[Math.floor(review.rating)]++;
            });

            breakdown.average = (totalRating / reviews.length).toFixed(1);
            breakdown.foodQuality = (currentBreakdown.foodQuality / reviews.length).toFixed(1);
            breakdown.delivery = (currentBreakdown.delivery / reviews.length).toFixed(1);
            breakdown.packaging = (currentBreakdown.packaging / reviews.length).toFixed(1);
            breakdown.punctuality = (currentBreakdown.punctuality / reviews.length).toFixed(1);
        }

        res.json(breakdown);
    } catch (error) {
        console.error('Get breakdown error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark review as helpful
router.post('/:reviewId/helpful', async(req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        const userId = req.userId;
        const alreadyMarked = review.helpful.users.includes(userId);

        if (alreadyMarked) {
            review.helpful.users = review.helpful.users.filter(id => id.toString() !== userId);
            review.helpful.count = review.helpful.users.length;
        } else {
            review.helpful.users.push(userId);
            review.helpful.count = review.helpful.users.length;
        }

        await review.save();
        res.json({ success: true, helpful: review.helpful.count });
    } catch (error) {
        console.error('Mark helpful error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user's own review for an order
router.get('/order/:orderId/my-review', async(req, res) => {
    try {
        const review = await Review.findOne({
            orderId: req.params.orderId,
            userId: req.userId
        });

        res.json({ review: review || null });
    } catch (error) {
        console.error('Get review error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update review (only if not locked for long)
router.put('/:reviewId', async(req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ error: 'Review not found' });
        if (review.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { ratings, reviewText, photos } = req.body;

        if (ratings) {
            review.rating = (ratings.foodQuality + ratings.deliverySpeed + ratings.packaging + ratings.restaurant) / 4;
            review.categories = {
                foodQuality: ratings.foodQuality,
                packaging: ratings.packaging,
                delivery: ratings.deliverySpeed,
                punctuality: ratings.restaurant
            };
        }
        if (reviewText) review.comment = reviewText;
        if (photos) review.photos = photos.map(url => ({ url, uploadedAt: new Date() }));

        review.updatedAt = new Date();
        await review.save();

        // Update restaurant rating
        await Review.updateRestaurantRating(review.restaurantId);

        res.json({ success: true, review });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
