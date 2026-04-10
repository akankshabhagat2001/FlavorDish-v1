import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ReferralData {
  referralCode: string;
  discountPercentage: number;
  bonusPoints: number;
  totalReferrals: number;
  successfulReferrals: number;
  totalBonusPointsEarned: number;
  totalBonusAmountEarned: number;
}

class ReferralService {
  /**
   * Get user's referral profile
   */
  async getReferralProfile(userId: string): Promise<ReferralData> {
    try {
      const response = await axios.get(`${API_URL}/referral/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching referral profile:', error);
      throw error;
    }
  }

  /**
   * Generate referral code
   */
  async generateReferralCode(userId: string): Promise<{ referralCode: string }> {
    try {
      const response = await axios.post(`${API_URL}/referral/generate-code`, { userId });
      return response.data;
    } catch (error) {
      console.error('Error generating referral code:', error);
      throw error;
    }
  }

  /**
   * Apply referral code during registration
   */
  async applyReferralCode(referralCode: string, newUserId: string): Promise<{ bonusPoints: number; discount: number }> {
    try {
      const response = await axios.post(`${API_URL}/referral/apply-code`, {
        referralCode,
        newUserId
      });
      return response.data;
    } catch (error) {
      console.error('Error applying referral code:', error);
      throw error;
    }
  }

  /**
   * Track referred user order
   */
  async trackReferredUserOrder(referralCode: string, orderId: string, orderAmount: number): Promise<{ bonusEarned: boolean; pointsAwarded: number }> {
    try {
      const response = await axios.post(`${API_URL}/referral/track-order`, {
        referralCode,
        orderId,
        orderAmount
      });
      return response.data;
    } catch (error) {
      console.error('Error tracking referred user order:', error);
      throw error;
    }
  }

  /**
   * Get referred users list
   */
  async getReferredUsersList(userId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/referral/referred-users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching referred users:', error);
      return [];
    }
  }

  /**
   * Get referral earnings
   */
  async getReferralEarnings(userId: string): Promise<{ totalEarnings: number; pendingBonus: number; historyCount: number }> {
    try {
      const response = await axios.get(`${API_URL}/referral/earnings/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching referral earnings:', error);
      throw error;
    }
  }

  /**
   * Share referral link
   */
  shareReferralLink(referralCode: string): string {
    const appUrl = window.location.origin;
    return `${appUrl}?ref=${encodeURIComponent(referralCode)}`;
  }

  /**
   * Copy referral link to clipboard
   */
  async copyToClipboard(referralCode: string): Promise<boolean> {
    try {
      const shareLink = this.shareReferralLink(referralCode);
      await navigator.clipboard.writeText(shareLink);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }

  /**
   * Share via social media
   */
  sharViaSocialMedia(referralCode: string, platform: 'whatsapp' | 'facebook' | 'twitter'): void {
    const message = `Join me on FlavourFinder and get ₹50 discount! Use code: ${referralCode}`;
    const link = this.shareReferralLink(referralCode);

    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + ' ' + link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(link)}`
    };

    window.open(urls[platform], '_blank');
  }
}

export const referralService = new ReferralService();
