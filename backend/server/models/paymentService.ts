import api from './authService';

// Razorpay checkout.js is loaded dynamically — no npm install needed on frontend
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Load Razorpay checkout script once
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export interface RazorpayOptions {
  orderId: string;         // Our DB order _id
  amount: number;          // Total in rupees (we convert to paise on backend)
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: (paymentDetails: RazorpayPaymentResult) => void;
  onFailure: (error: string) => void;
}

export interface RazorpayPaymentResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const paymentService = {
  // ─────────────────────────────────────────────
  // Open Razorpay checkout modal
  // Call this for UPI / card / netbanking payments
  // ─────────────────────────────────────────────
  openRazorpayCheckout: async (options: RazorpayOptions): Promise<void> => {
    // 1. Load Razorpay script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      options.onFailure('Payment gateway failed to load. Check your internet connection.');
      return;
    }

    // 2. Create Razorpay order on our backend
    let rzpOrderId: string;
    let amount: number;
    let keyId: string;

    try {
      const { data } = await api.post('/payments/razorpay/create-order', {
        orderId: options.orderId,
      });
      rzpOrderId = data.rzpOrderId;
      amount = data.amount;       // already in paise from backend
      keyId = data.keyId;
    } catch (err: any) {
      options.onFailure(err?.response?.data?.message || 'Failed to initiate payment.');
      return;
    }

    // 3. Open Razorpay modal
    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency: 'INR',
      order_id: rzpOrderId,
      name: 'FlavorFinder',
      description: 'Food Order Payment',
      image: '/favicon.ico',
      prefill: {
        name: options.customerName,
        email: options.customerEmail,
        contact: options.customerPhone,
      },
      theme: {
        color: '#EF4F5F',
      },
      handler: async (response: RazorpayPaymentResult) => {
        // 4. Verify signature on backend
        try {
          await api.post('/payments/razorpay/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          options.onSuccess(response);
        } catch (err: any) {
          options.onFailure(err?.response?.data?.message || 'Payment verification failed.');
        }
      },
      modal: {
        ondismiss: () => {
          options.onFailure('Payment cancelled by user.');
        },
      },
    });

    rzp.on('payment.failed', (response: any) => {
      options.onFailure(response.error?.description || 'Payment failed.');
    });

    rzp.open();
  },

  // ─────────────────────────────────────────────
  // Confirm a Cash on Delivery order
  // ─────────────────────────────────────────────
  confirmCOD: async (orderId: string) => {
    const response = await api.post('/payments/process', {
      orderId,
      method: 'cash_on_delivery',
    });
    return response.data;
  },

  // ─────────────────────────────────────────────
  // Settlements & balances
  // ─────────────────────────────────────────────
  releaseRestaurantPayout: async (orderId: string) => {
    const response = await api.post(`/payments/release/restaurant/${orderId}`);
    return response.data;
  },

  releaseDeliveryPayout: async (orderId: string) => {
    const response = await api.post(`/payments/release/delivery/${orderId}`);
    return response.data;
  },

  getWalletBalance: async () => {
    const response = await api.get('/payments/balances');
    return response.data;
  },
};
