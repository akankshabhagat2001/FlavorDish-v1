import express from 'express';
import RestaurantSuggestion from '../models/RestaurantSuggestion.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity } from './activity.js';

const router = express.Router();

// Submit a new restaurant suggestion
router.post('/', async(req, res) => {
    try {
        const {
            name,
            cuisine,
            description,
            location,
            contactPerson,
            phone,
            email,
            website,
            suggestedBy
        } = req.body;

        if (!name || !location || !contactPerson || !Array.isArray(cuisine) || cuisine.length === 0) {
            return res.status(400).json({ message: 'Name, location, contact person and at least one cuisine are required.' });
        }

        const suggestion = new RestaurantSuggestion({
            name,
            cuisine,
            description,
            location,
            contactPerson,
            phone,
            email,
            website,
            suggestedBy: suggestedBy || 'anonymous',
            status: 'pending',
            createdAt: new Date()
        });

        await suggestion.save();
        res.status(201).json({ suggestion });
    } catch (error) {
        console.error('Create restaurant suggestion error:', error);
        res.status(500).json({ message: 'Failed to save restaurant suggestion.' });
    }
});

// Get approved restaurant suggestions (or filter by status)
router.get('/', async(req, res) => {
    try {
        const status = req.query.status || 'approved';
        const query = status ? { status } : {};
        const suggestions = await RestaurantSuggestion.find(query).sort({ createdAt: -1 });
        res.json({ suggestions });
    } catch (error) {
        console.error('Get restaurant suggestions error:', error);
        res.status(500).json({ message: 'Failed to retrieve restaurant suggestions.' });
    }
});

// Admin update suggestion status
router.put('/:id/status', authenticate, authorize('admin'), async(req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const suggestion = await RestaurantSuggestion.findById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found' });
        }

        suggestion.status = status;
        await suggestion.save();

        await logActivity(req.user._id, req.user.role, `SUGGESTION_${status.toUpperCase()}`, { suggestionId: suggestion._id, name: suggestion.name }, req);

        res.json({ message: `Suggestion ${status} successfully`, suggestion });
    } catch (error) {
        console.error('Update suggestion status error:', error);
        res.status(500).json({ message: 'Failed to update suggestion status.' });
    }
});

export default router;