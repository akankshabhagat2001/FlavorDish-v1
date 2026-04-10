import Delivery from '../models/Delivery.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

// Accept delivery request
export const acceptDelivery = async (req, res) => {
        try {
            const { orderId } = req.params;

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Check if delivery already exists
            let delivery = await Delivery.findOne({ orderId });

            if (!delivery) {
                delivery = new Delivery({
                    orderId,
                    deliveryPartnerId: req.user.id,
                    restaurantId: order.restaurantId,
                    customerId: order.userId,
                    status: 'accepted',
                    pickupLocation: order.restaurantId,
                    deliveryLocation: order.deliveryAddress,
                    estimatedDeliveryTime: new Date(Date.now() + 45 * 60000) // 45 mins
                });
            } else if (delivery.status === 'accepted') {
                return res.status(400).json({
                    success: false,
                    message: 'Delivery already accepted by another partner'
                });
            } else {
                delivery.status = 'accepted';
                delivery.deliveryPartnerId = req.user.id;
                delivery.acceptedAt = new Date();
            }

            await delivery.save();

            // Update order with delivery partner
            order.deliveryPartnerId = req.user.id;
            order.status = 'confirmed';
            await order.save();

            res.status(200).json({
                success: true,
                message: 'Delivery accepted successfully',
                data: delivery
            });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error accepting delivery',
            error: error.message
        });
    }
};

// Update delivery location (real-time tracking)
export const updateDeliveryLocation = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const { latitude, longitude } = req.body;
        
        const delivery = await Delivery.findById(deliveryId);
        
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }
        
        // Update current location
        delivery.currentLocation = {
            latitude,
            longitude,
            timestamp: new Date()
        };
        
        // Add to location history
        delivery.locationHistory.push({
            latitude,
            longitude,
            timestamp: new Date()
        });
        
        await delivery.save();
        
        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            data: delivery
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating location',
            error: error.message
        });
    }
};

// Update delivery status
export const updateDeliveryStatus = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }
        
        const delivery = await Delivery.findById(deliveryId);
        
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }
        
        delivery.status = status;
        
        if (status === 'picked_up') {
            delivery.pickedUpAt = new Date();
        } else if (status === 'delivered') {
            delivery.deliveredAt = new Date();
            delivery.actualDeliveryTime = new Date();
            
            // Update order status
            const order = await Order.findById(delivery.orderId);
            if (order) {
                order.status = 'delivered';
                order.actualDeliveryTime = new Date();
                await order.save();
            }
        }
        
        await delivery.save();
        
        res.status(200).json({
            success: true,
            message: 'Delivery status updated successfully',
            data: delivery
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating delivery status',
            error: error.message
        });
    }
};

// Get active deliveries for partner
export const getActiveDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find({
            deliveryPartnerId: req.user.id,
            status: { $in: ['accepted', 'picked_up', 'on_the_way'] }
        }).populate('customerId', 'name phone').sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: 'Active deliveries retrieved successfully',
            data: deliveries
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching deliveries',
            error: error.message
        });
    }
};

// Get delivery details
export const getDeliveryDetails = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        
        const delivery = await Delivery.findById(deliveryId)
            .populate('customerId', 'name phone')
            .populate('deliveryPartnerId', 'name rating phone');
        
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Delivery details retrieved successfully',
            data: delivery
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching delivery details',
            error: error.message
        });
    }
};

// Get delivery partner earnings
export const getDeliveryEarnings = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let filter = { 
            deliveryPartnerId: req.user.id,
            status: 'delivered'
        };
        
        if (startDate && endDate) {
            filter.deliveredAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const deliveries = await Delivery.find(filter);
        
        const totalEarnings = deliveries.reduce((sum, d) => sum + (d.earnings || d.baseRate), 0);
        const totalDeliveries = deliveries.length;
        const averageEarning = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;
        
        res.status(200).json({
            success: true,
            message: 'Earnings summary retrieved successfully',
            data: {
                totalEarnings,
                totalDeliveries,
                averageEarning,
                deliveries
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching earnings',
            error: error.message
        });
    }
};

// Rate delivery partner
export const rateDeliveryPartner = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const { rating, review } = req.body;
        
        if (!rating || rating < 0 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 0 and 5'
            });
        }
        
        const delivery = await Delivery.findByIdAndUpdate(
            deliveryId,
            { rating, review },
            { new: true }
        );
        
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }
        
        // Update delivery partner's rating
        const partner = await User.findById(delivery.deliveryPartnerId);
        if (partner) {
            const allDeliveries = await Delivery.find({ 
                deliveryPartnerId: delivery.deliveryPartnerId,
                rating: { $exists: true }
            });
            
            const avgRating = allDeliveries.reduce((sum, d) => sum + d.rating, 0) / allDeliveries.length;
            partner.rating = parseFloat(avgRating.toFixed(1));
            await partner.save();
        }
        
        res.status(200).json({
            success: true,
            message: 'Delivery partner rated successfully',
            data: delivery
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error rating delivery',
            error: error.message
        });
    }
};
