import axios from 'axios';
import { API_URL } from './runtimeConfig';

export interface PointsTransaction {
  type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  points: number;
  source: 'order' | 'referral' | 'birthday' | 'milestone' | 'admin' | 'redemption';
  description?: string;
  referenceId?: string;
}

export interface LoyaltyData {
  userId: string;
  tier: 'silver' | 'gold' | 'platinum';
  totalPoints: number;
  availableBalance: number;
  transactionHistory: Array<{
    type: string;
    points: number;
    source: string;
    description?: string;
    createdAt: Date;
  }>;
}

class LoyaltyService {
  /**
   * Get user's loyalty profile
   */
  async getLoyaltyProfile(userId: string): Promise<LoyaltyData> {
    try {
      const response = await axios.get(`${API_URL}/loyalty/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty profile:', error);
      throw error;
    }
  }

  /**
   * Earn points on order
   * Formula: orderAmount * 10 = points
   */
  async earnPointsOnOrder(userId: string, orderAmount: number, orderId: string): Promise<number> {
    try {
      const points = Math.floor(orderAmount * 10);
      const response = await axios.post(`${API_URL}/loyalty/earn-points`, {
        userId,
        points,
        source: 'order',
        referenceId: orderId,
        description: `Order earning - ₹${orderAmount}`
      });
      return response.data.totalPoints;
    } catch (error) {
      console.error('Error earning points:', error);
      throw error;
    }
  }

  /**
   * Earn bonus points on first order
   */
  async earnFirstOrderBonus(userId: string): Promise<number> {
    try {
      const response = await axios.post(`${API_URL}/loyalty/earn-points`, {
        userId,
        points: 500,
        source: 'milestone',
        description: 'First order bonus'
      });
      return response.data.totalPoints;
    } catch (error) {
      console.error('Error earning first order bonus:', error);
      throw error;
    }
  }

  /**
   * Redeem points for cashback
   * 100 points = ₹5
   */
  async redeemPoints(userId: string, points: number): Promise<{ cashback: number; remainingPoints: number }> {
    try {
      const cashback = (points / 100) * 5;
      const response = await axios.post(`${API_URL}/loyalty/redeem-points`, {
        userId,
        points,
        cashback,
        description: `Redeemed ${points} points for ₹${cashback} credit`
      });
      return {
        cashback,
        remainingPoints: response.data.availableBalance
      };
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  }

  /**
   * Get tier benefits
   */
  async getTierBenefits(tier: 'silver' | 'gold' | 'platinum'): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/loyalty/tier-benefits/${tier}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tier benefits:', error);
      throw error;
    }
  }

  /**
   * Check if user is eligible for tier upgrade
   */
  async checkTierUpgrade(userId: string): Promise<{ eligible: boolean; nextTier?: string; pointsNeeded?: number }> {
    try {
      const response = await axios.get(`${API_URL}/loyalty/check-upgrade/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking tier upgrade:', error);
      return { eligible: false };
    }
  }

  /**
   * Apply loyalty discount at checkout
   */
  async applyLoyaltyDiscount(userId: string, orderAmount: number): Promise<{ discount: number; finalAmount: number }> {
    try {
      const response = await axios.post(`${API_URL}/loyalty/apply-discount`, {
        userId,
        orderAmount
      });
      return response.data;
    } catch (error) {
      console.error('Error applying loyalty discount:', error);
      throw error;
    }
  }

  /**
   * Get loyalty transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/loyalty/transactions/${userId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  /**
   * Get points expiry information
   */
  async getPointsExpiry(userId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/loyalty/points-expiry/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching points expiry:', error);
      return [];
    }
  }
}

export const loyaltyService = new LoyaltyService();
