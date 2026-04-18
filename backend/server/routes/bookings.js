import express from 'express';
import { body, validationResult } from 'express-validator';
import TableBooking from '../models/TableBooking.js';
import Restaurant from '../models/Restaurant.js';
import { authMiddleware as authenticate } from '../middleware/authMiddleware.js';;
import { io } from '../server.js';

const router = express.Router();

// Create new Table Booking
router.post('/', authenticate, [
    body('restaurantId').isMongoId().withMessage('Valid restaurant ID is required'),
    body('bookingDate').isISO8601().toDate().withMessage('Valid date is required'),
    body('timeSlot.startTime').exists().withMessage('Start time is required'),
    body('timeSlot.endTime').exists().withMessage('End time is required'),
    body('numberOfGuests').isInt({ min: 1, max: 100 }).withMessage('Valid number of guests is required'),
    body('customerDetails.name').exists().withMessage('Customer name is required'),
    body('customerDetails.phone').exists().withMessage('Customer phone is required'),
    body('paymentType').optional().isIn(['prepaid', 'postpaid']).withMessage('Payment Type must be prepaid or postpaid')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
             return res.status(400).json({ errors: errors.array() });
        }

        const restaurant = await Restaurant.findById(req.body.restaurantId);
        if (!restaurant) {
             return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Calculate estimated bill based on number of guests just as a placeholder
        const estimatedBill = req.body.numberOfGuests * 500;
        const isPrepaid = req.body.paymentType === 'prepaid';

        const newBooking = new TableBooking({
            restaurantId: req.body.restaurantId,
            userId: req.user._id,
            bookingDate: req.body.bookingDate,
            timeSlot: req.body.timeSlot,
            numberOfGuests: req.body.numberOfGuests,
            specialRequests: req.body.specialRequests || '',
            customerDetails: req.body.customerDetails,
            estimatedBill,
            reservationFee: isPrepaid ? estimatedBill : 0,
            paymentStatus: isPrepaid ? 'paid' : 'pending',
            status: 'confirmed'
        });

        await newBooking.save();

        io.to(`restaurant-${restaurant._id}`).emit('new-booking', newBooking);

        res.status(201).json({
            message: 'Table booked successfully',
            booking: newBooking
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get My Bookings
router.get('/my-bookings', authenticate, async (req, res) => {
    try {
        const bookings = await TableBooking.find({ userId: req.user._id })
            .populate('restaurantId', 'name address images')
            .sort({ bookingDate: -1, createdAt: -1 });
        
        res.json({ bookings });
    } catch (error) {
        console.error('Fetch bookings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
