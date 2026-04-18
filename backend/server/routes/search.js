import express from 'express';
import Restaurant from '../models/Restaurant.js';
import Food from '../models/Food.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';;
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Advanced restaurant search
router.get('/restaurants', async(req, res) => {
    try {
        const {
            q, // general search query
            cuisine,
            priceRange,
            rating,
            location,
            deliveryTime,
            openNow,
            sortBy = 'rating',
            sortOrder = 'desc',
            page = 1,
            limit = 20,
            latitude,
            longitude,
            radius = 10 // km
        } = req.query;

        let query = { isApproved: true };

        // Text search
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { cuisine: { $in: [new RegExp(q, 'i')] } },
                { 'menu.name': { $regex: q, $options: 'i' } }
            ];
        }

        // Cuisine filter
        if (cuisine) {
            const cuisines = Array.isArray(cuisine) ? cuisine : [cuisine];
            query.cuisine = { $in: cuisines };
        }

        // Price range filter
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(Number);
            query.averagePrice = { $gte: min || 0, $lte: max || 10000 };
        }

        // Rating filter
        if (rating) {
            query.rating = { $gte: parseFloat(rating) };
        }

        // Location-based search
        if (latitude && longitude) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            const rad = parseFloat(radius);

            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: rad * 1000 // Convert km to meters
                }
            };
        } else if (location) {
            query.$or = [
                { address: { $regex: location, $options: 'i' } },
                { city: { $regex: location, $options: 'i' } },
                { locality: { $regex: location, $options: 'i' } }
            ];
        }

        // Delivery time filter
        if (deliveryTime) {
            query.deliveryTime = { $lte: parseInt(deliveryTime) };
        }

        // Open now filter
        if (openNow === 'true') {
            const now = new Date();
            const currentHour = now.getHours();
            const currentDay = now.toLocaleLowerCase('en-US', { weekday: 'long' });

            query[`hours.${currentDay}`] = {
                $elemMatch: {
                    isOpen: true,
                    openTime: { $lte: currentHour },
                    closeTime: { $gt: currentHour }
                }
            };
        }

        // Sorting
        let sortOptions = {};
        switch (sortBy) {
            case 'rating':
                sortOptions = { rating: sortOrder === 'desc' ? -1 : 1 };
                break;
            case 'deliveryTime':
                sortOptions = { deliveryTime: sortOrder === 'desc' ? -1 : 1 };
                break;
            case 'price':
                sortOptions = { averagePrice: sortOrder === 'desc' ? -1 : 1 };
                break;
            case 'distance':
                if (latitude && longitude) {
                    // For distance sorting, we'll handle this after the query
                    sortOptions = {};
                } else {
                    sortOptions = { rating: -1 }; // fallback
                }
                break;
            default:
                sortOptions = { rating: -1 };
        }

        const restaurants = await Restaurant.find(query)
            .select('name description image rating cuisine averagePrice deliveryTime address location hours')
            .sort(sortOptions)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await Restaurant.countDocuments(query);

        // Add distance calculation if coordinates provided
        if (latitude && longitude) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);

            restaurants.forEach(restaurant => {
                if (restaurant.location && restaurant.location.coordinates) {
                    const [resLng, resLat] = restaurant.location.coordinates;
                    restaurant._doc.distance = calculateDistance(lat, lng, resLat, resLng);
                }
            });

            // Sort by distance if requested
            if (sortBy === 'distance') {
                restaurants.sort((a, b) => {
                    const distA = a._doc.distance || Infinity;
                    const distB = b._doc.distance || Infinity;
                    return sortOrder === 'desc' ? distB - distA : distA - distB;
                });
            }
        }

        res.json({
            restaurants,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            filters: {
                applied: {
                    q,
                    cuisine,
                    priceRange,
                    rating,
                    location,
                    deliveryTime,
                    openNow,
                    latitude,
                    longitude,
                    radius
                }
            }
        });
    } catch (error) {
        console.error('Restaurant search error:', error);
        res.status(500).json({ message: 'Search failed.' });
    }
});

// Advanced food search
router.get('/food', async(req, res) => {
    try {
        const {
            q, // general search query
            restaurant,
            cuisine,
            category,
            priceRange,
            isVeg,
            isAvailable = true,
            sortBy = 'name',
            sortOrder = 'asc',
            page = 1,
            limit = 20
        } = req.query;

        let query = { isAvailable };

        // Text search
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ];
        }

        // Restaurant filter
        if (restaurant) {
            query.restaurant = restaurant;
        }

        // Cuisine filter
        if (cuisine) {
            query.cuisine = { $in: Array.isArray(cuisine) ? cuisine : [cuisine] };
        }

        // Category filter
        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        // Price range filter
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(Number);
            query.price = { $gte: min || 0, $lte: max || 10000 };
        }

        // Veg/Non-veg filter
        if (isVeg !== undefined) {
            query.isVeg = isVeg === 'true';
        }

        // Sorting
        let sortOptions = {};
        switch (sortBy) {
            case 'name':
                sortOptions = { name: sortOrder === 'desc' ? -1 : 1 };
                break;
            case 'price':
                sortOptions = { price: sortOrder === 'desc' ? -1 : 1 };
                break;
            case 'rating':
                sortOptions = { rating: sortOrder === 'desc' ? -1 : 1 };
                break;
            case 'popularity':
                sortOptions = { orderCount: sortOrder === 'desc' ? -1 : 1 };
                break;
            default:
                sortOptions = { name: 1 };
        }

        const foods = await Food.find(query)
            .populate('restaurant', 'name image rating')
            .sort(sortOptions)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await Food.countDocuments(query);

        res.json({
            foods,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            filters: {
                applied: { q, restaurant, cuisine, category, priceRange, isVeg, isAvailable }
            }
        });
    } catch (error) {
        console.error('Food search error:', error);
        res.status(500).json({ message: 'Search failed.' });
    }
});

// Global search (combines restaurants and food)
router.get('/global', async(req, res) => {
    try {
        const { q, type, page = 1, limit = 10 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({
                restaurants: [],
                foods: [],
                total: 0
            });
        }

        const searchRegex = new RegExp(q, 'i');
        let restaurants = [];
        let foods = [];

        // Search restaurants
        if (!type || type === 'restaurants') {
            restaurants = await Restaurant.find({
                    isApproved: true,
                    $or: [
                        { name: searchRegex },
                        { description: searchRegex },
                        { cuisine: { $in: [searchRegex] } }
                    ]
                })
                .select('name description image rating cuisine')
                .limit(parseInt(limit));
        }

        // Search foods
        if (!type || type === 'foods') {
            foods = await Food.find({
                    isAvailable: true,
                    $or: [
                        { name: searchRegex },
                        { description: searchRegex },
                        { category: searchRegex }
                    ]
                })
                .populate('restaurant', 'name image')
                .select('name description price image restaurant')
                .limit(parseInt(limit));
        }

        res.json({
            query: q,
            restaurants,
            foods,
            total: restaurants.length + foods.length
        });
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ message: 'Search failed.' });
    }
});

// Search user orders (authenticated users only)
router.get('/orders', authenticate, async(req, res) => {
    try {
        const {
            q, // search in restaurant name, food items, order ID
            status,
            dateFrom,
            dateTo,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        let query = { customer: req.user._id };

        // Status filter
        if (status) {
            query.status = status;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        // Text search in restaurant name or food items
        if (q) {
            query.$or = [
                { 'restaurant.name': { $regex: q, $options: 'i' } },
                { 'items.name': { $regex: q, $options: 'i' } },
                { orderId: { $regex: q, $options: 'i' } }
            ];
        }

        // Sorting
        let sortOptions = {};
        switch (sortBy) {
            case 'createdAt':
                sortOptions = { createdAt: sortOrder === 'desc' ? -1 : 1 };
                break;
            case 'totalAmount':
                sortOptions = { finalAmount: sortOrder === 'desc' ? -1 : 1 };
                break;
            case 'status':
                sortOptions = { status: sortOrder === 'desc' ? -1 : 1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
        }

        const orders = await Order.find(query)
            .populate('restaurant', 'name image')
            .populate('deliveryPartner', 'name')
            .sort(sortOptions)
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
        console.error('Order search error:', error);
        res.status(500).json({ message: 'Search failed.' });
    }
});

// Autocomplete suggestions
router.get('/autocomplete', async(req, res) => {
    try {
        const { q, type = 'all', limit = 5 } = req.query;

        if (!q || q.length < 2) {
            return res.json({ suggestions: [] });
        }

        const suggestions = [];
        const regex = new RegExp(`^${q}`, 'i');

        if (type === 'all' || type === 'restaurants') {
            const restaurants = await Restaurant.find({
                    isApproved: true,
                    name: regex
                })
                .select('name cuisine')
                .limit(parseInt(limit));

            suggestions.push(...restaurants.map(r => ({
                text: r.name,
                type: 'restaurant',
                cuisine: r.cuisine,
                id: r._id
            })));
        }

        if (type === 'all' || type === 'foods') {
            const foods = await Food.find({
                    isAvailable: true,
                    name: regex
                })
                .populate('restaurant', 'name')
                .select('name restaurant')
                .limit(parseInt(limit));

            suggestions.push(...foods.map(f => ({
                text: f.name,
                type: 'food',
                restaurant: f.restaurant.name,
                id: f._id
            })));
        }

        if (type === 'all' || type === 'cuisine') {
            const cuisines = await Restaurant.distinct('cuisine', {
                isApproved: true,
                cuisine: regex
            });

            suggestions.push(...cuisines.slice(0, parseInt(limit)).map(c => ({
                text: c,
                type: 'cuisine'
            })));
        }

        res.json({ suggestions });
    } catch (error) {
        console.error('Autocomplete error:', error);
        res.status(500).json({ message: 'Autocomplete failed.' });
    }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default router;
