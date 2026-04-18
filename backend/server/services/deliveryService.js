import Delivery from '../models/Delivery.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

const ZONES = {
    Satellite: { lat: 23.0163, lng: 72.5190 },
    Bopal: { lat: 23.0135, lng: 72.4640 },
    Maninagar: { lat: 22.9961, lng: 72.5997 },
    Navrangpura: { lat: 23.0366, lng: 72.5606 },
    Chandkheda: { lat: 23.1098, lng: 72.5857 }
};

class DeliveryService {
    /**
     * Haversine formula to calculate distance between two lat/lng pairs in kilometers
     */
    static getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    static deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    /**
     * Finds the nearest available delivery partner for an order
     */
    static async findBestPartner(restaurantLocation) {
        // Find all delivery partners (assume role 'driver', 'delivery', or 'delivery_partner')
        const partners = await User.find({ role: { $in: ['driver', 'delivery_partner'] } });
        
        if (!partners || partners.length === 0) return null;

        let bestPartner = null;
        let shortestDistance = Infinity;

        // In a real app, drivers constantly update their location.
        // For Phase 1, we simulate driver locations based on hardcoded Ahmedabad zones
        // or a default location if not set.
        for (const partner of partners) {
            // Check active deliveries for this partner to ensure they're not overloaded
            const activeDeliveries = await Delivery.countDocuments({
                deliveryPartnerId: partner._id,
                status: { $in: ['accepted', 'picked_up', 'on_the_way'] }
            });

            // Skip partners with 3 or more active deliveries
            if (activeDeliveries >= 3) continue;

            const lat = partner?.location?.coordinates?.[1] || ZONES.Satellite.lat; // Default to Satellite temporarily
            const lng = partner?.location?.coordinates?.[0] || ZONES.Satellite.lng;

            const dist = this.getDistance(
                restaurantLocation.latitude,
                restaurantLocation.longitude,
                lat,
                lng
            );

            // Factor in current load as a penalty (+ 1km per active delivery)
            const weightedScore = dist + (activeDeliveries * 1);

            if (weightedScore < shortestDistance) {
                shortestDistance = weightedScore;
                bestPartner = partner;
            }
        }

        return bestPartner;
    }

    /**
     * Create delivery and assign partner
     */
    static async assignDelivery(orderId) {
        const order = await Order.findById(orderId).populate('restaurant');
        if (!order) throw new Error('Order not found');
        if (order.status === 'delivered' || order.status === 'cancelled') {
            throw new Error('Order cannot be assigned in current status');
        }

        // Validate state progression (REST -> CONFIRMED -> ASSIGNED)
        // Adjusting slightly to fit existing enum (pending, confirmed, preparing, ready, out_for_delivery, delivered)
        if (order.status !== 'ready' && order.status !== 'preparing' && order.status !== 'confirmed') {
            throw new Error(`Order status ${order.status} is not valid for assignment.`);
        }

        const restaurantLocation = {
            latitude: order.restaurant?.location?.coordinates?.[1] || ZONES.Navrangpura.lat,
            longitude: order.restaurant?.location?.coordinates?.[0] || ZONES.Navrangpura.lng
        };

        const deliveryLocation = {
            address: order.deliveryAddress?.address || 'Ahmedabad',
            latitude: order.deliveryAddress?.coordinates?.[1] || ZONES.Bopal.lat,
            longitude: order.deliveryAddress?.coordinates?.[0] || ZONES.Bopal.lng
        };

        const partner = await this.findBestPartner(restaurantLocation);
        if (!partner) throw new Error('No available delivery partners found');

        const distance = this.getDistance(
            restaurantLocation.latitude, restaurantLocation.longitude,
            deliveryLocation.latitude, deliveryLocation.longitude
        );

        const delivery = new Delivery({
            orderId: order._id,
            deliveryPartnerId: partner._id,
            restaurantId: order.restaurant._id,
            customerId: order.userId,
            status: 'accepted',
            pickupLocation: {
                address: order.restaurant.address,
                ...restaurantLocation
            },
            deliveryLocation,
            currentLocation: {
                ...restaurantLocation, // start at restaurant roughly
                timestamp: new Date()
            },
            estimatedDeliveryTime: new Date(Date.now() + 45 * 60000), // 45 mins
            distance: distance.toFixed(2),
            deliveryCharge: order.deliveryFee || 50,
            baseRate: 50
        });

        await delivery.save();

        // Update Order state
        order.status = 'out_for_delivery';
        order.driverId = partner._id;
        await order.save();

        return delivery;
    }

    /**
     * State Machine Updater
     */
    static async updateStatus(deliveryId, newStatus) {
        const validTransitions = {
            'accepted': ['picked_up', 'cancelled'],
            'picked_up': ['on_the_way', 'cancelled'],
            'on_the_way': ['delivered', 'cancelled'],
            'delivered': [],
            'cancelled': []
        };

        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) throw new Error('Delivery not found');

        const currentAllowed = validTransitions[delivery.status];
        if (!currentAllowed.includes(newStatus) && newStatus !== delivery.status) {
            throw new Error(`Invalid state transition from ${delivery.status} to ${newStatus}`);
        }

        delivery.status = newStatus;
        if (newStatus === 'picked_up') delivery.pickedUpAt = new Date();
        if (newStatus === 'delivered') delivery.deliveredAt = new Date();

        await delivery.save();

        // Sync order status
        if (newStatus === 'delivered') {
            await Order.findByIdAndUpdate(delivery.orderId, { status: 'delivered' });
        } else if (newStatus === 'picked_up' || newStatus === 'on_the_way') {
            await Order.findByIdAndUpdate(delivery.orderId, { status: 'out_for_delivery' });
        }

        return delivery;
    }
}

export default DeliveryService;
