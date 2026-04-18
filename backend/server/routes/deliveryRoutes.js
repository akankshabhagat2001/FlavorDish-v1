import express from 'express';
import { 
    getAllDeliveries,
    assignDelivery,
    updateDeliveryStatus,
    updateDeliveryLocation,
    getActiveDeliveries,
    getDeliveryDetails,
    getDeliveryEarnings,
    rateDeliveryPartner,
    acceptDelivery
} from '../controllers/deliveryController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Admin Routes
router.get('/', authorizeRoles('admin'), getAllDeliveries);
router.post('/assign', authorizeRoles('admin'), assignDelivery);

// Partner Routes
router.get('/active', authorizeRoles('delivery_partner', 'driver'), getActiveDeliveries);
router.get('/earnings', authorizeRoles('delivery_partner', 'driver'), getDeliveryEarnings);
router.post('/:orderId/accept', authorizeRoles('delivery_partner', 'driver'), acceptDelivery);
router.patch('/:deliveryId/location', authorizeRoles('delivery_partner', 'driver', 'admin'), updateDeliveryLocation);
router.patch('/:deliveryId/status', authorizeRoles('delivery_partner', 'driver', 'admin'), updateDeliveryStatus);

// Common/Customer Routes
router.get('/:deliveryId', getDeliveryDetails);
router.post('/:deliveryId/rating', authorizeRoles('customer', 'admin'), rateDeliveryPartner);

export default router;
