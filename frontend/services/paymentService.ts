import api from './authService';

export const paymentService = {
  createRazorpayOrder: async (orderId: string) => {
    const response = await api.post('/payments/razorpay/create-order', { orderId });
    return response.data;
  },

  verifyRazorpayPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await api.post('/payments/razorpay/verify', payload);
    return response.data;
  },

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
