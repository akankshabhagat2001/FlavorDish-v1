import api from './authService';

export const orderService = {
  createOrder: async (orderData: {
    items: Array<{
      food: string;
      quantity: number;
      specialInstructions?: string;
    }>;
    restaurant: string;
    deliveryAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
    paymentMethod: string;
    totalAmount: number;
    deliveryFee: number;
    taxAmount: number;
  }) => {
    // Normalize payment method
    let normalizedPaymentMethod = 'cash_on_delivery';
    if (orderData.paymentMethod === 'online' || 
        orderData.paymentMethod === 'upi' || 
        orderData.paymentMethod === 'card') {
      normalizedPaymentMethod = 'online';
    }

    const payload = {
      ...orderData,
      paymentMethod: normalizedPaymentMethod,
    };

    const response = await api.post('/orders', payload);
    return response.data;
  },

  getMyOrders: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/orders/my-orders', { params });
    return response.data;
  },

  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string, notes?: string) => {
    const response = await api.put(`/orders/${id}/status`, { status, note: notes });
    return response.data;
  },

  cancelOrder: async (id: string, reason: string) => {
    const response = await api.put(`/orders/${id}/status`, { status: 'cancelled', note: reason });
    return response.data;
  },

  getRestaurantOrders: async (params?: {
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/orders/restaurant/orders', { params });
    return response.data;
  },

  getDeliveryOrders: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/orders/delivery/orders', { params });
    return response.data;
  },

  assignDeliveryPartner: async (orderId: string, partnerId: string) => {
    const response = await api.put(`/orders/${orderId}/assign-delivery`, { deliveryPartner: partnerId });
    return response.data;
  },

  updateDeliveryStatus: async (orderId: string, status: string, location?: [number, number]) => {
    if (status === 'out_for_delivery') {
      const response = await api.put(`/orders/${orderId}/out-for-delivery`);
      return response.data;
    }
    if (status === 'delivered') {
      const response = await api.put(`/orders/${orderId}/deliver`);
      return response.data;
    }
    if (location?.length === 2) {
      const response = await api.put(`/orders/${orderId}/location`, { latitude: location[0], longitude: location[1] });
      return response.data;
    }
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  rateOrder: async (orderId: string, rating: {
    foodRating: number;
    deliveryRating: number;
    restaurantRating: number;
    review?: string;
  }) => {
    const response = await api.put(`/orders/${orderId}/rate`, rating);
    return response.data;
  },

  getOrderHistory: async (params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/orders/my-orders', { params });
    return response.data;
  }
};