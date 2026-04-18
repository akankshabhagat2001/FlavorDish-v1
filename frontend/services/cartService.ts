import api from './authService';

export const cartService = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data?.cart || { items: [] };
  },
  addItem: async (foodId: string, quantity = 1) => {
    const response = await api.post('/cart/items', { foodId, quantity });
    return response.data?.cart;
  },
  updateItemQuantity: async (foodId: string, quantity: number) => {
    const response = await api.put(`/cart/items/${foodId}`, { quantity });
    return response.data?.cart;
  },
  removeItem: async (foodId: string) => {
    const response = await api.delete(`/cart/items/${foodId}`);
    return response.data?.cart;
  },
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data?.cart;
  }
};
