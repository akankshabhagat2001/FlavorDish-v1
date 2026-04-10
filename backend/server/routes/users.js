import express from 'express';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity } from './activity.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;

        let query = {};
        if (role) {
            query.role = role;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update user status (Admin only)
router.put('/:id/status', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { isActive } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.isActive = isActive;
        await user.save();

        await logActivity(req.user._id, req.user.role, 'USER_STATUS_UPDATED', { targetUserId: user._id, targetUserEmail: user.email, isActive }, req);

        res.json({
            message: 'User status updated successfully.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update user role (Admin only)
router.put('/:id/role', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { role } = req.body;

        if (!['customer', 'restaurant_owner', 'delivery_partner', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.role = role;
        await user.save();

        await logActivity(req.user._id, req.user.role, 'USER_ROLE_UPDATED', { targetUserId: user._id, targetUserEmail: user.email, newRole: role }, req);

        res.json({
            message: 'User role updated successfully.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Prevent deleting admin users
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot delete admin users.' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Follow a restaurant (Customer only)
router.post('/follow/:restaurantId', authenticate, authorize('customer'), async(req, res) => {
    try {
        const { restaurantId } = req.params;
        const userId = req.user.id;

        // Check if restaurant exists
        const Restaurant = (await
            import ('../models/Restaurant.js')).default;
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Check if already following
        const user = await User.findById(userId);
        if (user.followingRestaurants.includes(restaurantId)) {
            return res.status(400).json({ message: 'Already following this restaurant.' });
        }

        // Add to following list
        user.followingRestaurants.push(restaurantId);
        await user.save();

        res.json({
            message: 'Restaurant followed successfully.',
            followingRestaurants: user.followingRestaurants
        });
    } catch (error) {
        console.error('Follow restaurant error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Unfollow a restaurant (Customer only)
router.delete('/follow/:restaurantId', authenticate, authorize('customer'), async(req, res) => {
    try {
        const { restaurantId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Remove from following list
        user.followingRestaurants = user.followingRestaurants.filter(
            id => id.toString() !== restaurantId
        );
        await user.save();

        res.json({
            message: 'Restaurant unfollowed successfully.',
            followingRestaurants: user.followingRestaurants
        });
    } catch (error) {
        console.error('Unfollow restaurant error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get user's following restaurants (Customer only)
router.get('/following', authenticate, authorize('customer'), async(req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).populate('followingRestaurants', 'name description images logo cuisine address');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            followingRestaurants: user.followingRestaurants
        });
    } catch (error) {
        console.error('Get following restaurants error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;