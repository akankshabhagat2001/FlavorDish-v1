import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';

// Get restaurant menu
export const getRestaurantMenu = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { category, search, sortBy } = req.query;

        let filter = { restaurantId, isAvailable: true };

        if (category) {
            filter.categoryId = category;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        let sortOption = { createdAt: -1 };
        if (sortBy === 'price') {
            sortOption = { price: 1 };
        } else if (sortBy === 'rating') {
            sortOption = { ratings: -1 };
        }

        const menuItems = await MenuItem.find(filter).sort(sortOption);

        res.status(200).json({
            success: true,
            message: 'Menu retrieved successfully',
            data: menuItems
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching menu',
            error: error.message
        });
    }
};

// Add menu item
export const addMenuItem = async (req, res) => {
    try {
        const {
            restaurantId,
            name,
            description,
            categoryId,
            price,
            image,
            variants,
            addons
        } = req.body;

        if (!restaurantId || !name || !categoryId || !price) {
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing'
            });
        }

        // Verify restaurant exists and belongs to user
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        const newMenuItem = new MenuItem({
            restaurantId,
            name,
            description,
            categoryId,
            price,
            image: image || 'https://via.placeholder.com/300x200',
            variants: variants || [],
            addons: addons || [],
            isAvailable: true
        });

        await newMenuItem.save();

        res.status(201).json({
            success: true,
            message: 'Menu item added successfully',
            data: newMenuItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding menu item',
            error: error.message
        });
    }
};

// Update menu item
export const updateMenuItem = async (req, res) => {
    try {
        const { menuItemId } = req.params;
        const updates = req.body;

        const menuItem = await MenuItem.findByIdAndUpdate(
            menuItemId, {...updates, updatedAt: new Date() }, { new: true }
        );

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Menu item updated successfully',
            data: menuItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating menu item',
            error: error.message
        });
    }
};

// Toggle menu item availability
export const toggleMenuItemAvailability = async (req, res) => {
    try {
        const { menuItemId } = req.params;

        const menuItem = await MenuItem.findById(menuItemId);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        menuItem.isAvailable = !menuItem.isAvailable;
        await menuItem.save();

        res.status(200).json({
            success: true,
            message: `Menu item is now ${menuItem.isAvailable ? 'available' : 'unavailable'}`,
            data: menuItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error toggling availability',
            error: error.message
        });
    }
};

// Delete menu item
export const deleteMenuItem = async (req, res) => {
    try {
        const { menuItemId } = req.params;

        const menuItem = await MenuItem.findByIdAndDelete(menuItemId);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting menu item',
            error: error.message
        });
    }
};

// Get menu item details
export const getMenuItemDetails = async (req, res) => {
    try {
        const { menuItemId } = req.params;

        const menuItem = await MenuItem.findById(menuItemId);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Menu item details retrieved successfully',
            data: menuItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching menu item',
            error: error.message
        });
    }
};

// Get popular menu items from a restaurant
export const getPopularMenuItems = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { limit = 5 } = req.query;

        const popularItems = await MenuItem.find({
                restaurantId,
                isAvailable: true
            })
            .sort({ orderCount: -1, ratings: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            message: 'Popular menu items retrieved successfully',
            data: popularItems
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching popular items',
            error: error.message
        });
    }
};
