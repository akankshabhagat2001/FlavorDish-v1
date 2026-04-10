import api from './authService';

export const userService = {
  getUsers: async (params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<{
    name: string;
    email: string;
    phone: string;
    address: any;
    isActive: boolean;
    role: string;
  }>) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  updateUserStatus: async (id: string, isActive: boolean) => {
    const response = await api.put(`/users/${id}/status`, { isActive });
    return response.data;
  },

  updateUserRole: async (id: string, role: string) => {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  getDeliveryPartners: async () => {
    const response = await api.get('/users/delivery-partners');
    return response.data;
  },

  getRestaurantOwners: async () => {
    const response = await api.get('/users/restaurant-owners');
    return response.data;
  }
};