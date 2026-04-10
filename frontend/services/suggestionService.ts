import api from './apiClient';
import { RestaurantSuggestion } from '../types.ts';

export const suggestionService = {
  submitSuggestion: async (suggestion: Omit<RestaurantSuggestion, '_id' | 'createdAt' | 'status'>) => {
    const response = await api.post('/suggestions', suggestion);
    return response.data;
  },
  getSuggestions: async (status = 'approved') => {
    const response = await api.get('/suggestions', { params: { status } });
    return response.data;
  }
};
