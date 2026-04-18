import api from './authService';

export const foodService = {
  getFoods: async (params?: {
    search?: string;
    category?: string;
    cuisine?: string;
    minPrice?: number;
    maxPrice?: number;
    restaurant?: string;
    showUnavailable?: boolean;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/food', { params });
    return response.data?.foods || response.data || [];
  },

  getFoodById: async (id: string) => {
    const response = await api.get(`/food/${id}`);
    return response.data?.food || response.data || null;
  },

  createFood: async (foodData: {
    name: string;
    description: string;
    price: number;
    category: string;
    cuisine?: string;
    images?: { url: string; alt?: string }[];
    isVeg: boolean;
    isAvailable: boolean;
    preparationTime?: number;
    nutritionalInfo?: any;
    tags?: string[];
    restaurant: string;
  }) => {
    const response = await api.post('/food', foodData);
    return response.data;
  },

  updateFood: async (id: string, foodData: Partial<{
    name: string;
    description: string;
    price: number;
    category: string;
    cuisine?: string;
    images?: { url: string; alt?: string }[];
    isVeg: boolean;
    isAvailable: boolean;
    preparationTime?: number;
    nutritionalInfo: any;
    tags: string[];
  }>) => {
    const response = await api.put(`/food/${id}`, foodData);
    return response.data;
  },

  deleteFood: async (id: string) => {
    const response = await api.delete(`/food/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/food/categories/all');
    return response.data;
  },

  getCuisines: async () => {
    const response = await api.get('/restaurants/cuisines/all');
    return response.data;
  },

  getPopularFoods: async () => {
    const response = await api.get('/food', { params: { sortBy: 'rating', sortOrder: 'desc', limit: 20 } });
    return response.data?.foods || [];
  }
};