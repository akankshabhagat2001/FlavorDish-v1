import api from './authService';

export const restaurantService = {
  getRestaurants: async (params?: {
    search?: string;
    cuisine?: string;
    location?: string;
    rating?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/restaurants', { params });
    return response.data?.data || response.data?.restaurants || response.data || [];
  },

  getRestaurantById: async (id: string) => {
    const response = await api.get(`/restaurants/${id}`);
    return response.data?.data || response.data || null;
  },

  createRestaurant: async (restaurantData: {
    name: string;
    description: string;
    cuisine: string[];
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      coordinates: [number, number];
    };
    phone: string;
    email: string;
    image?: string;
    openingHours: {
      [key: string]: {
        open: string;
        close: string;
        isOpen: boolean;
      };
    };
    deliveryRadius: number;
    deliveryFee: number;
    minimumOrder: number;
    isActive: boolean;
  }) => {
    const response = await api.post('/restaurants', restaurantData);
    return response.data;
  },

  updateRestaurant: async (id: string, restaurantData: Partial<{
    name: string;
    description: string;
    cuisine: string[];
    address: any;
    phone: string;
    email: string;
    image: string;
    openingHours: any;
    deliveryRadius: number;
    deliveryFee: number;
    minimumOrder: number;
    isActive: boolean;
  }>) => {
    const response = await api.put(`/restaurants/${id}`, restaurantData);
    return response.data;
  },

  deleteRestaurant: async (id: string) => {
    const response = await api.delete(`/restaurants/${id}`);
    return response.data;
  },

  getRestaurantMenu: async (id: string) => {
    const response = await api.get(`/restaurants/${id}/menu`);
    return response.data?.menu || response.data?.data?.menu || response.data?.data?.menuItems || response.data?.menuItems || response.data || [];
  },

  getMyRestaurants: async () => {
    const response = await api.get('/restaurants/my-restaurants');
    return response.data;
  },

  getTopRatedRestaurants: async () => {
    const response = await api.get('/restaurants/top-rated');
    return response.data;
  },

  getNearbyRestaurants: async (coordinates: [number, number], radius?: number) => {
    const response = await api.get('/restaurants/nearby', {
      params: { lat: coordinates[0], lng: coordinates[1], radius }
    });
    return response.data;
  }
};