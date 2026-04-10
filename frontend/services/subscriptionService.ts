import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface SubscriptionPlan {
  name: 'basic' | 'premium' | 'elite';
  monthlyFee: number;
  benefits: string[];
  freeDeliveries: number;
  discountPercentage: number;
}

export interface UserSubscription {
  plan: string;
  monthlyFee: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  freeDeliveriesUsed: number;
  autoRenew: boolean;
}

class SubscriptionService {
  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await axios.get(`${API_URL}/subscription/plans`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const response = await axios.get(`${API_URL}/subscription/user/${userId}`);
      return response.data;
    } catch (error) {
      if ((error as any).response?.status === 404) {
        return null;
      }
      console.error('Error fetching user subscription:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a plan
   */
  async subscribeToPlan(userId: string, plan: 'basic' | 'premium' | 'elite', paymentMethodId: string): Promise<{ subscriptionId: string; startDate: Date; endDate: Date }> {
    try {
      const response = await axios.post(`${API_URL}/subscription/subscribe`, {
        userId,
        plan,
        paymentMethodId
      });
      return response.data;
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      throw error;
    }
  }

  /**
   * Upgrade subscription plan
   */
  async upgradeSubscription(userId: string, newPlan: 'basic' | 'premium' | 'elite'): Promise<{ newPlan: string; proratedAmount?: number; newEndDate: Date }> {
    try {
      const response = await axios.post(`${API_URL}/subscription/upgrade`, {
        userId,
        newPlan
      });
      return response.data;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Downgrade subscription plan
   */
  async downgradeSubscription(userId: string, newPlan: 'basic' | 'premium' | 'elite'): Promise<{ newPlan: string; refundAmount?: number; effectiveDate: Date }> {
    try {
      const response = await axios.post(`${API_URL}/subscription/downgrade`, {
        userId,
        newPlan
      });
      return response.data;
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, reason?: string): Promise<{ cancelledAt: Date; refundAmount?: number }> {
    try {
      const response = await axios.post(`${API_URL}/subscription/cancel`, {
        userId,
        cancellationReason: reason
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Use free delivery
   */
  async useFreeDelivery(userId: string, orderId: string): Promise<{ used: boolean; remainingFreeDeliveries: number }> {
    try {
      const response = await axios.post(`${API_URL}/subscription/use-free-delivery`, {
        userId,
        orderId
      });
      return response.data;
    } catch (error) {
      console.error('Error using free delivery:', error);
      throw error;
    }
  }

  /**
   * Renew subscription
   */
  async renewSubscription(userId: string): Promise<{ renewedAt: Date; nextBillingDate: Date }> {
    try {
      const response = await axios.post(`${API_URL}/subscription/renew`, { userId });
      return response.data;
    } catch (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription benefits summary
   */
  async getSubscriptionBenefits(userId: string): Promise<{ plan: string; benefits: string[]; redeemableUntil: Date }> {
    try {
      const response = await axios.get(`${API_URL}/subscription/benefits/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription benefits:', error);
      throw error;
    }
  }

  /**
   * Apply subscription discount to order
   */
  async applySubscriptionDiscount(userId: string, orderAmount: number): Promise<{ discount: number; finalAmount: number; discountType: string }> {
    try {
      const response = await axios.post(`${API_URL}/subscription/apply-discount`, {
        userId,
        orderAmount
      });
      return response.data;
    } catch (error) {
      console.error('Error applying subscription discount:', error);
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService();
