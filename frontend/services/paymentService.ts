import api from './authService';

export const paymentService = {
  processPayment: async (orderId: string, amount: number, method: 'card' | 'upi' | 'cash_on_delivery') => {
    const response = await api.post('/payments/process', {
      orderId,
      amount,
      method
    });
    return response.data;
  },

  releaseRestaurant: async (orderId: string) => {
    const response = await api.post(`/payments/release/restaurant/${orderId}`);
    return response.data;
  },

  releaseDeliveryPartner: async (orderId: string) => {
    const response = await api.post(`/payments/release/delivery/${orderId}`);
    return response.data;
  },

  getBalances: async () => {
    const response = await api.get('/payments/balances');
    return response.data;
  }
};
