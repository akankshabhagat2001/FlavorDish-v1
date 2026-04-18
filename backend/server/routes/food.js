import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Food from '../models/Food.js';
import Restaurant from '../models/Restaurant.js';
import { authMiddleware as authenticate, optionalAuth } from '../middleware/authMiddleware.js';
import { authorizeRoles as authorize } from '../middleware/roleMiddleware.js';;

const router = express.Router();

const generateSku = async(restaurantId) => {
    const suffix = String(restaurantId).slice(-6).toUpperCase();
    const existingCount = await Food.countDocuments({ restaurant: restaurantId });
    const sequence = String(existingCount + 1).padStart(4, '0');
    return `FOOD-${suffix}-${sequence}`;
};

// Get all foods with filtering and search
router.get('/', optionalAuth, async(req, res) => {
    try {
        const {
            search,
            category,
            restaurant,
            isVeg,
            minPrice,
            maxPrice,
            showUnavailable,
            sortBy = 'name',
            sortOrder = 'asc',
            page = 1,
            limit = 20
        } = req.query;

        const includeUnavailable = String(showUnavailable).toLowerCase() === 'true';
        let query = {};
        if (!includeUnavailable) {
            query.isAvailable = true;
        }

        // Search functionality
        if (search) {
            query.$text = { $search: search };
        }

        // Filters
        if (category) {
            query.category = category;
        }

        if (restaurant) {
            query.restaurant = restaurant;
        }

        if (isVeg !== undefined) {
            query.isVeg = isVeg === 'true';
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const foods = await Food.find(query)
            .populate('restaurant', 'name rating deliveryTime')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Food.countDocuments(query);

        res.json({
            foods,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get foods error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get categories
router.get('/categories/all', async(req, res) => {
    try {
        const categories = await Food.distinct('category', { isAvailable: true });
        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get food by ID
router.get('/:id', optionalAuth, async(req, res) => {
    try {
        const food = await Food.findById(req.params.id)
            .populate('restaurant', 'name rating deliveryTime address phone');

        if (!food) {
            return res.status(404).json({ message: 'Food item not found.' });
        }

        res.json({ food });
    } catch (error) {
        console.error('Get food error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Create food item (Restaurant Owner only)
router.post('/', authenticate, authorize('restaurant_owner', 'admin'), [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').trim().isLength({ min: 1 }).withMessage('Category is required'),
    body('restaurant').isMongoId().withMessage('Valid restaurant ID is required')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, price, category, subcategory, restaurant, images, isVeg, isAvailable, preparationTime, tags, sku, nutritionalInfo } = req.body;

        // Verify restaurant ownership
        const restaurantDoc = await Restaurant.findById(restaurant);
        if (!restaurantDoc) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        if (req.user.role !== 'admin' && restaurantDoc.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only add food to your own restaurant.' });
        }

        const generatedSku = sku || await generateSku(restaurant);
        const food = new Food({
            name,
            description,
            price,
            category,
            subcategory,
            restaurant,
            images,
            isVeg,
            isAvailable,
            preparationTime,
            tags,
            sku: generatedSku,
            nutritionalInfo
        });

        await food.save();

        await food.populate('restaurant', 'name rating deliveryTime');

        res.status(201).json({
            message: 'Food item created successfully.',
            food
        });
    } catch (error) {
        console.error('Create food error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update food item (Restaurant Owner only)
router.put('/:id', authenticate, authorize('restaurant_owner', 'admin'), [
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const food = await Food.findById(req.params.id);
        if (!food) {
            return res.status(404).json({ message: 'Food item not found.' });
        }

        // Verify restaurant ownership
        const restaurant = await Restaurant.findById(food.restaurant);
        if (req.user.role !== 'admin' && restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only update food from your own restaurant.' });
        }

        const updates = req.body;
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                food[key] = updates[key];
            }
        });

        await food.save();
        await food.populate('restaurant', 'name rating deliveryTime');

        res.json({
            message: 'Food item updated successfully.',
            food
        });
    } catch (error) {
        console.error('Update food error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Delete food item (Restaurant Owner only)
router.delete('/:id', authenticate, authorize('restaurant_owner', 'admin'), async(req, res) => {
    try {
        const food = await Food.findById(req.params.id);
        if (!food) {
            return res.status(404).json({ message: 'Food item not found.' });
        }

        // Verify restaurant ownership
        const restaurant = await Restaurant.findById(food.restaurant);
        if (req.user.role !== 'admin' && restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete food from your own restaurant.' });
        }

        await Food.findByIdAndDelete(req.params.id);

        res.json({ message: 'Food item deleted successfully.' });
    } catch (error) {
        console.error('Delete food error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;