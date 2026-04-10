import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Get current user profile
export const getCurrentUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User profile retrieved successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message
        });
    }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
        try {
            const { name, phone, address, profileImage } = req.body;

            const updates = {};
            if (name) updates.name = name;
            if (phone) updates.phone = phone;
            if (address) updates.address = address;
            if (profileImage) updates.profileImage = profileImage;

            const user = await User.findByIdAndUpdate(
                req.user.id, {...updates, updatedAt: new Date() }, { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'User profile updated successfully',
                data: user
            });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error updating user profile',
            error: error.message 
        });
    }
};

// Get all addresses for user
export const getUserAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('addresses');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Addresses retrieved successfully',
            data: user.addresses || [] 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching addresses',
            error: error.message 
        });
    }
};

// Add new address
export const addAddress = async (req, res) => {
    try {
        const { street, city, state, zipCode, label } = req.body;
        
        if (!street || !city || !state || !zipCode || !label) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        const newAddress = {
            street,
            city,
            state,
            zipCode,
            label,
            _id: new Date().getTime()
        };
        
        user.addresses.push(newAddress);
        await user.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Address added successfully',
            data: newAddress 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error adding address',
            error: error.message 
        });
    }
};

// Delete address
export const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
        await user.save();
        
        res.status(200).json({ 
            success: true, 
            message: 'Address deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting address',
            error: error.message 
        });
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current and new password are required' 
            });
        }
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.updatedAt = new Date();
        
        await user.save();
        
        res.status(200).json({ 
            success: true, 
            message: 'Password changed successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error changing password',
            error: error.message 
        });
    }
};

// Delete user account
export const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password is required to delete account' 
            });
        }
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password is incorrect' 
            });
        }
        
        // Mark user as inactive instead of deleting
        user.isActive = false;
        await user.save();
        
        res.status(200).json({ 
            success: true, 
            message: 'Account deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting account',
            error: error.message 
        });
    }
};
