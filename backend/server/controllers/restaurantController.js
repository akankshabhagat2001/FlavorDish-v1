import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import Review from '../models/Review.js';

// Get all restaurants with filters
export const getAllRestaurants = async (req, res) => {
    try {
        const {
            search,
            cuisine,
            minRating,
            maxPrice,
            sortBy,
            page = 1,
            limit = 10,
            isOpen
        } = req.query;

        let filter = { isActive: true };

        // Search filter
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { cuisines: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Cuisine filter
        if (cuisine) {
            filter.cuisines = { $in: Array.isArray(cuisine) ? cuisine : [cuisine] };
        }

        // Rating filter
        if (minRating) {
            filter.rating = { $gte: parseFloat(minRating) };
        }

        // Price filter
        if (maxPrice) {
            filter.averagePrice = { $lte: parseInt(maxPrice) };
        }

        // Open now filter
        if (isOpen === 'true') {
            const now = new Date();
            const currentDay = now.toLocaleLowerCase().split(' ')[0];
            const currentHour = now.getHours();

            filter[`operatingHours.${currentDay}`] = {
                $exists: true
            };
        }

        // Sorting
        let sortOption = {};
        switch (sortBy) {
            case 'rating':
                sortOption = { rating: -1 };
                break;
            case 'deliveryTime':
                sortOption = { estimatedDeliveryTime: 1 };
                break;
            case 'price':
                sortOption = { averagePrice: 1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }

        const skip = (page - 1) * limit;

        const restaurants = await Restaurant.find(filter)
            .sort(sortOption)
            .limit(limit * 1)
            .skip(skip)
            .lean();

        const total = await Restaurant.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Restaurants retrieved successfully',
            data: restaurants,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalResults: total,
                resultsPerPage: limit
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

// Get restaurant by ID
export const getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Get menu items
        const menuItems = await MenuItem.find({ restaurantId: id, isAvailable: true });

        // Get reviews
        const reviews = await Review.find({
            restaurantId: id,
            type: 'restaurant',
            status: 'approved'
        }).limit(10);

        const restaurantData = restaurant.toObject();
        restaurantData.menuItems = menuItems;
        restaurantData.reviews = reviews;

        res.status(200).json({
            success: true,
            message: 'Restaurant details retrieved successfully',
            data: restaurantData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching restaurant',
            error: error.message
        });
    }
};

// Create new restaurant
export const createRestaurant = async (req, res) => {
    try {
        const {
            name,
            description,
            cuisines,
            address,
            minDeliveryOrder,
            deliveryFee,
            estimatedDeliveryTime,
            image,
            operatingHours,
            ownerId
        } = req.body;

        if (!name || !cuisines || !address || !ownerId) {
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing'
            });
        }

        const newRestaurant = new Restaurant({
            name,
            description,
            cuisines,
            address,
            minDeliveryOrder: minDeliveryOrder || 0,
            deliveryFee: deliveryFee || 50,
            estimatedDeliveryTime: estimatedDeliveryTime || 30,
            image: image || 'https://via.placeholder.com/300x200',
            operatingHours: operatingHours || {},
            ownerId,
            isActive: true
        });

        await newRestaurant.save();

        res.status(201).json({
            success: true,
            message: 'Restaurant created successfully',
            data: newRestaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating restaurant',
            error: error.message
        });
    }
};

// Update restaurant
export const updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const restaurant = await Restaurant.findByIdAndUpdate(
            id, {...updates, updatedAt: new Date() }, { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Restaurant updated successfully',
            data: restaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating restaurant',
            error: error.message
        });
    }
};

// Toggle restaurant status
export const toggleRestaurantStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        restaurant.isOpen = !restaurant.isOpen;
        await restaurant.save();

        res.status(200).json({
            success: true,
            message: `Restaurant is now ${restaurant.isOpen ? 'open' : 'closed'}`,
            data: restaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error toggling restaurant status',
            error: error.message
        });
    }
};

// Get restaurant analytics
export const getRestaurantAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        const analytics = {
            totalOrders: restaurant.totalOrders || 0,
            totalRevenue: restaurant.totalRevenue || 0,
            averageRating: restaurant.rating || 0,
            totalReviews: restaurant.reviewCount || 0,
            menuItemsCount: await MenuItem.countDocuments({ restaurantId: id }),
            activeMenuItems: await MenuItem.countDocuments({ restaurantId: id, isAvailable: true })
        };

        res.status(200).json({
            success: true,
            message: 'Analytics retrieved successfully',
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
