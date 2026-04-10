import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import Delivery from '../models/Delivery.js';

// Create new order
export const createOrder = async (req, res) => {
    try {
        const { restaurantId, items, deliveryAddress, paymentMethod, specialInstructions } = req.body;

        if (!restaurantId || !items || items.length === 0 || !deliveryAddress) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant, items, and delivery address are required'
            });
        }

        // Verify restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Calculate totals
        let subtotal = 0;
        const processedItems = [];

        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItemId);

            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: `Menu item ${item.menuItemId} not found`
                });
            }

            if (!menuItem.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `${menuItem.name} is not available`
                });
            }

            const itemTotal = (menuItem.discountedPrice || menuItem.price) * item.quantity;
            subtotal += itemTotal;

            processedItems.push({
                menuItemId: item.menuItemId,
                name: menuItem.name,
                price: menuItem.discountedPrice || menuItem.price,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions || ''
            });
        }

        // Check minimum order value
        if (subtotal < restaurant.minDeliveryOrder) {
            return res.status(400).json({
                success: false,
                message: `Minimum order value is ₹${restaurant.minDeliveryOrder}`
            });
        }

        // Calculate charges
        const deliveryFee = subtotal > 500 ? 0 : restaurant.deliveryFee;
        const taxes = Math.round(subtotal * 0.05); // 5% taxes
        const totalAmount = subtotal + deliveryFee + taxes;

        // Create order
        const newOrder = new Order({
            userId: req.user.id,
            restaurantId,
            items: processedItems,
            subtotal,
            taxes,
            deliveryFee,
            totalAmount,
            deliveryAddress,
            paymentMethod: paymentMethod || 'cod',
            specialInstructions,
            status: 'placed',
            estimatedDeliveryTime: new Date(Date.now() + restaurant.estimatedDeliveryTime * 60000)
        });

        await newOrder.save();

        // Update restaurant order count
        restaurant.totalOrders = (restaurant.totalOrders || 0) + 1;
        await restaurant.save();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: newOrder
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

// Get user orders
export const getUserOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let filter = { userId: req.user.id };

        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(filter)
            .populate('restaurantId', 'name image rating')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip(skip);

        const total = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalResults: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Get order details
export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('restaurantId')
            .populate('deliveryPartnerId', 'name phone rating');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Verify ownership
        if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        // Get delivery tracking if exists
        const delivery = await Delivery.findOne({ orderId });

        const orderData = order.toObject();
        orderData.delivery = delivery;

        res.status(200).json({
            success: true,
            message: 'Order details retrieved successfully',
            data: orderData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
};

// Cancel order
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Can only cancel placed or confirmed orders
        if (!['placed', 'confirmed'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order with status: ${order.status}`
            });
        }

        order.status = 'cancelled';
        order.cancellationReason = reason || 'User cancelled';
        order.cancellationTime = new Date();

        // Refund if paid
        if (order.paymentStatus === 'paid') {
            order.refundInitiated = true;
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling order',
            error: error.message
        });
    }
};

// Update order status (for restaurant)
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId, { status, updatedAt: new Date() }, { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Notify user via Socket.io
        // io.to(`order-${orderId}`).emit('order-status-updated', { status, orderId });

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
};
