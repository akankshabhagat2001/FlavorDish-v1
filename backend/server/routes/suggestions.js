import express from 'express';
import RestaurantSuggestion from '../models/RestaurantSuggestion.js';
import User from '../models/User.js';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles as authorize } from '../middleware/roleMiddleware.js';;
import { body, validationResult } from 'express-validator';
import { logActivity } from './activity.js';

const router = express.Router();

// Submit a new restaurant suggestion
router.post('/', authenticate, authorize('customer'), [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('cuisine').isArray({ min: 1 }).withMessage('At least one cuisine is required'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('location').trim().isLength({ min: 10, max: 200 }).withMessage('Location must be 10-200 characters'),
    body('contactPerson').trim().isLength({ min: 2, max: 50 }).withMessage('Contact person name is required'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid Indian phone number required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('website').optional().isURL().withMessage('Valid website URL required'),
    body('images').optional().isArray().withMessage('Images must be an array'),
    body('estimatedCost').optional().isIn(['low', 'medium', 'high']).withMessage('Estimated cost must be low, medium, or high')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name,
            cuisine,
            description,
            location,
            contactPerson,
            phone,
            email,
            website,
            images,
            estimatedCost
        } = req.body;

        const suggestion = new RestaurantSuggestion({
            name,
            cuisine,
            description,
            location,
            contactPerson,
            phone,
            email,
            website,
            images: images || [],
            estimatedCost,
            suggestedBy: req.user._id,
            status: 'pending',
            createdAt: new Date(),
            votes: {
                upvotes: 0,
                downvotes: 0,
                voters: []
            },
            comments: []
        });

        await suggestion.save();
        await suggestion.populate('suggestedBy', 'name');

        await logActivity(req.user._id, req.user.role, 'SUGGESTION_SUBMITTED', { suggestionId: suggestion._id, name: suggestion.name }, req);

        res.status(201).json({
            message: 'Restaurant suggestion submitted successfully.',
            suggestion
        });
    } catch (error) {
        console.error('Create restaurant suggestion error:', error);
        res.status(500).json({ message: 'Failed to save restaurant suggestion.' });
    }
});

// Get restaurant suggestions with enhanced filtering
router.get('/', async(req, res) => {
    try {
        const {
            status = 'approved',
                cuisine,
                location,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                page = 1,
                limit = 10
        } = req.query;

        let query = {};
        if (status) query.status = status;
        if (cuisine) query.cuisine = { $in: [cuisine] };
        if (location) query.location = { $regex: location, $options: 'i' };

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const suggestions = await RestaurantSuggestion.find(query)
            .populate('suggestedBy', 'name')
            .populate('comments.user', 'name')
            .sort(sortOptions)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await RestaurantSuggestion.countDocuments(query);

        res.json({
            suggestions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get restaurant suggestions error:', error);
        res.status(500).json({ message: 'Failed to retrieve restaurant suggestions.' });
    }
});

// Get single suggestion details
router.get('/:id', async(req, res) => {
    try {
        const suggestion = await RestaurantSuggestion.findById(req.params.id)
            .populate('suggestedBy', 'name')
            .populate('comments.user', 'name')
            .populate('comments.replies.user', 'name');

        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found.' });
        }

        res.json(suggestion);
    } catch (error) {
        console.error('Get suggestion details error:', error);
        res.status(500).json({ message: 'Failed to retrieve suggestion details.' });
    }
});

// Vote on suggestion (upvote/downvote)
router.post('/:id/vote', authenticate, authorize('customer'), [
    body('voteType').isIn(['upvote', 'downvote']).withMessage('Vote type must be upvote or downvote')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const suggestion = await RestaurantSuggestion.findById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found.' });
        }

        const { voteType } = req.body;
        const userId = req.user._id.toString();
        const existingVoteIndex = suggestion.votes.voters.findIndex(v => v.user.toString() === userId);

        if (existingVoteIndex !== -1) {
            const existingVote = suggestion.votes.voters[existingVoteIndex];
            // Remove existing vote
            if (existingVote.type === 'upvote') suggestion.votes.upvotes--;
            else suggestion.votes.downvotes--;

            if (existingVote.type === voteType) {
                // User is removing their vote
                suggestion.votes.voters.splice(existingVoteIndex, 1);
            } else {
                // User is changing their vote
                existingVote.type = voteType;
                if (voteType === 'upvote') suggestion.votes.upvotes++;
                else suggestion.votes.downvotes++;
            }
        } else {
            // New vote
            suggestion.votes.voters.push({ user: userId, type: voteType });
            if (voteType === 'upvote') suggestion.votes.upvotes++;
            else suggestion.votes.downvotes++;
        }

        await suggestion.save();

        await logActivity(req.user._id, req.user.role, 'SUGGESTION_VOTED', { suggestionId: suggestion._id, voteType }, req);

        res.json({
            message: 'Vote recorded successfully.',
            votes: suggestion.votes
        });
    } catch (error) {
        console.error('Vote suggestion error:', error);
        res.status(500).json({ message: 'Failed to record vote.' });
    }
});

// Add comment to suggestion
router.post('/:id/comments', authenticate, authorize('customer'), [
    body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const suggestion = await RestaurantSuggestion.findById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found.' });
        }

        const { content } = req.body;

        const newComment = {
            user: req.user._id,
            content,
            createdAt: new Date(),
            replies: []
        };

        suggestion.comments.push(newComment);
        await suggestion.save();
        await suggestion.populate('comments.user', 'name');

        await logActivity(req.user._id, req.user.role, 'COMMENT_ADDED', { suggestionId: suggestion._id }, req);

        res.status(201).json({
            message: 'Comment added successfully.',
            comment: suggestion.comments[suggestion.comments.length - 1]
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Failed to add comment.' });
    }
});

// Reply to comment
router.post('/:id/comments/:commentId/reply', authenticate, authorize('customer'), [
    body('content').trim().isLength({ min: 1, max: 300 }).withMessage('Reply must be 1-300 characters')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const suggestion = await RestaurantSuggestion.findById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found.' });
        }

        const comment = suggestion.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        const { content } = req.body;

        const newReply = {
            user: req.user._id,
            content,
            createdAt: new Date()
        };

        comment.replies.push(newReply);
        await suggestion.save();
        await suggestion.populate('comments.replies.user', 'name');

        res.status(201).json({
            message: 'Reply added successfully.',
            reply: comment.replies[comment.replies.length - 1]
        });
    } catch (error) {
        console.error('Add reply error:', error);
        res.status(500).json({ message: 'Failed to add reply.' });
    }
});

// Admin update suggestion status
router.put('/:id/status', authenticate, authorize('admin'), [
    body('status').isIn(['approved', 'rejected', 'pending']).withMessage('Invalid status'),
    body('adminNote').optional().trim().isLength({ max: 500 }).withMessage('Admin note must be less than 500 characters')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const suggestion = await RestaurantSuggestion.findById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found.' });
        }

        const { status, adminNote } = req.body;

        suggestion.status = status;
        if (adminNote) suggestion.adminNote = adminNote;
        suggestion.reviewedAt = new Date();
        suggestion.reviewedBy = req.user._id;

        await suggestion.save();
        await suggestion.populate('reviewedBy', 'name');

        await logActivity(req.user._id, req.user.role, `SUGGESTION_${status.toUpperCase()}`, { suggestionId: suggestion._id, name: suggestion.name }, req);

        res.json({
            message: `Suggestion ${status} successfully.`,
            suggestion
        });
    } catch (error) {
        console.error('Update suggestion status error:', error);
        res.status(500).json({ message: 'Failed to update suggestion status.' });
    }
});

// Get trending suggestions (most voted)
router.get('/trending/suggestions', async(req, res) => {
    try {
        const { limit = 10 } = req.query;

        const suggestions = await RestaurantSuggestion.find({ status: 'approved' })
            .populate('suggestedBy', 'name')
            .sort({ 'votes.upvotes': -1, createdAt: -1 })
            .limit(parseInt(limit));

        res.json(suggestions);
    } catch (error) {
        console.error('Get trending suggestions error:', error);
        res.status(500).json({ message: 'Failed to retrieve trending suggestions.' });
    }
});

// Get user's suggestions
router.get('/user/suggestions', authenticate, authorize('customer'), async(req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const suggestions = await RestaurantSuggestion.find({ suggestedBy: req.user._id })
            .populate('comments.user', 'name')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await RestaurantSuggestion.countDocuments({ suggestedBy: req.user._id });

        res.json({
            suggestions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get user suggestions error:', error);
        res.status(500).json({ message: 'Failed to retrieve user suggestions.' });
    }
});

// Report inappropriate content
router.post('/:id/report', authenticate, authorize('customer'), [
    body('reason').isIn(['spam', 'inappropriate', 'offensive', 'misleading', 'other']).withMessage('Invalid report reason'),
    body('description').optional().trim().isLength({ max: 300 }).withMessage('Description must be less than 300 characters')
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const suggestion = await RestaurantSuggestion.findById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found.' });
        }

        const { reason, description } = req.body;

        const report = {
            reportedBy: req.user._id,
            reason,
            description,
            createdAt: new Date()
        };

        if (!suggestion.reports) suggestion.reports = [];
        suggestion.reports.push(report);
        await suggestion.save();

        await logActivity(req.user._id, req.user.role, 'CONTENT_REPORTED', { suggestionId: suggestion._id, reason }, req);

        res.json({ message: 'Content reported successfully.' });
    } catch (error) {
        console.error('Report content error:', error);
        res.status(500).json({ message: 'Failed to report content.' });
    }
});

export default router;
