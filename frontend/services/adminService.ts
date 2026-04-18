import api from './authService';

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getOrders: async (params?: {
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  getRevenue: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) => {
    const response = await api.get('/admin/revenue', { params });
    return response.data;
  },

  getTopRestaurants: async (params?: {
    limit?: number;
    period?: 'week' | 'month' | 'year';
  }) => {
    const response = await api.get('/admin/top-restaurants', { params });
    return response.data;
  },

  getTopFoods: async (params?: {
    limit?: number;
    period?: 'week' | 'month' | 'year';
  }) => {
    const response = await api.get('/admin/top-foods', { params });
    return response.data;
  },

  getUserGrowth: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) => {
    const response = await api.get('/admin/user-growth', { params });
    return response.data;
  },

  getOrderAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/admin/order-analytics', { params });
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await api.get('/admin/system-health');
    return response.data;
  },

  exportData: async (type: 'users' | 'orders' | 'restaurants' | 'foods', format: 'csv' | 'json') => {
    const response = await api.get(`/admin/export/${type}`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  getActivityLogs: async (params?: { page?: number; limit?: number; action?: string; role?: string }) => {
    const response = await api.get('/admin/activity', { params });
    return response.data;
  },

  // Fixed: use /admin/users/:id/role (not /users/:id/role)
  updateUserRole: async (userId: string, role: string) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Fixed: use /admin/users/:id/status (not /users/:id/status)
  updateUserStatus: async (userId: string, isActive: boolean) => {
    const response = await api.put(`/admin/users/${userId}/status`, { isActive });
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getSuggestions: async (status?: string) => {
    const response = await api.get('/suggestions', { params: { status } });
    return response.data;
  },

  updateSuggestionStatus: async (suggestionId: string, status: string) => {
    const response = await api.put(`/suggestions/${suggestionId}/status`, { status });
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.put(`/admin/orders/${orderId}/status`, { status });
    return response.data;
  },

  approveRestaurant: async (restaurantId: string, isApproved: boolean, reason?: string) => {
    const response = await api.put(`/admin/restaurants/${restaurantId}/approval`, { isApproved, reason });
    return response.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getRestaurants: async (params?: { page?: number; limit?: number; status?: string; search?: string; approved?: string }) => {
    const response = await api.get('/admin/restaurants', { params });
    return response.data;
  },

  getDeliveryPartners: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const response = await api.get('/admin/delivery/partners', { params });
    return response.data;
  },

  getActiveDeliveries: async () => {
    const response = await api.get('/admin/delivery/active');
    return response.data;
  },

  getAllDeliveries: async () => {
    const response = await api.get('/deliveries');
    return response.data;
  },

  assignDeliverySmart: async (orderId: string) => {
    const response = await api.post('/deliveries/assign', { orderId });
    return response.data;
  },

  assignDelivery: async (orderId: string, partnerId: string) => {
    const response = await api.post('/admin/delivery/assign', { orderId, partnerId });
    return response.data;
  },

  getPayments: async (params?: { page?: number; limit?: number; status?: string; method?: string; from?: string; to?: string; search?: string }) => {
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },

  getReviews: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/admin/reviews', { params });
    return response.data;
  },

  deleteReview: async (reviewId: string) => {
    const response = await api.delete(`/admin/reviews/${reviewId}`);
    return response.data;
  },

  getSubscriptions: async (params?: { page?: number; limit?: number; plan?: string }) => {
    const response = await api.get('/admin/subscriptions', { params });
    return response.data;
  },
};
