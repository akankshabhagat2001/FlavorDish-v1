import api from './authService';

export const deliveryPartnerService = {
  getDeliveryOrders: async () => {
    // Falls back to /active if /api/deliveries/active isn't directly responding over standard routes
    // For Phase 1 we built `router.get('/active'...)` inside `deliveryRoutes.js`
    const response = await api.get('/deliveries/active');
    return response.data;
  },

  updateDeliveryStatus: async (deliveryId: string, status: string) => {
    const response = await api.patch(`/deliveries/${deliveryId}/status`, { status });
    return response.data;
  },

  updateLocation: async (deliveryId: string, lat: number, lng: number) => {
    const response = await api.patch(`/deliveries/${deliveryId}/location`, { deliveryId, lat, lng });
    return response.data;
  },

  getEarnings: async () => {
    const response = await api.get('/deliveries/earnings');
    return response.data;
  }
};
