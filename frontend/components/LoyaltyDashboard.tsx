import React, { useState, useEffect } from 'react';
import { loyaltyService, LoyaltyData } from '../services/loyaltyService';
import { Heart, Gift, TrendingUp } from 'lucide-react';

interface LoyaltyDashboardProps {
  userId: string;
}

const LoyaltyDashboard: React.FC<LoyaltyDashboardProps> = ({ userId }) => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRedemption, setSelectedRedemption] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchLoyaltyData();
  }, [userId]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      const data = await loyaltyService.getLoyaltyProfile(userId);
      setLoyaltyData(data);
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'gold':
        return '#FFD700';
      case 'platinum':
        return '#E5E4E2';
      default:
        return '#C0C0C0';
    }
  };

  const getTierLabel = (tier: string) => {
    const icons = { silver: '🥉', gold: '🥈', platinum: '🏆' };
    return `${icons[tier as keyof typeof icons]} ${tier.toUpperCase()}`;
  };

  const getTierBenefits = (tier: string) => {
    const benefits = {
      silver: ['1% Cashback on all orders', '100 pts = ₹5', 'Member badge'],
      gold: ['2% Cashback on all orders', '₹50 birthday bonus', 'Free delivery Mon-Wed', 'Priority support'],
      platinum: ['5% Cashback on all orders', '₹200 birthday bonus', 'Free delivery every day', 'Premium support', 'Exclusive offers']
    };
    return benefits[tier as keyof typeof benefits] || [];
  };

  const calculatePointsToNextTier = () => {
    if (!loyaltyData) return 0;
    const tierThresholds = { silver: 2500, gold: 7500, platinum: 20000 };
    const current = loyaltyData.totalPoints;
    const nextThreshold = tierThresholds[loyaltyData.tier as keyof typeof tierThresholds];
    return Math.max(0, nextThreshold - current);
  };

  const handleRedeem = async (points: number) => {
    try {
      if (loyaltyData && loyaltyData.availableBalance >= points) {
        const result = await loyaltyService.redeemPoints(userId, points);
        setLoyaltyData(prev => prev ? { ...prev, availableBalance: result.remainingPoints } : null);
        alert(`Successfully redeemed ${points} points for ₹${(points / 100) * 5} credit!`);
        setSelectedRedemption(null);
      } else {
        alert('Insufficient points to redeem');
      }
    } catch (error) {
      console.error('Error redeeming points:', error);
      alert('Failed to redeem points');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!loyaltyData) {
    return <div className="text-center p-8 text-red-600">Failed to load loyalty data</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Rewards</h1>
          <button className="text-2xl">≡</button>
        </div>

        {/* Tier Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-4xl mb-2">{getTierLabel(loyaltyData.tier)}</h2>
            <p className="text-gray-600 text-lg">Member</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {Math.min(loyaltyData.totalPoints, 20000)} / 20,000 pts to Platinum
              </span>
              <span className="text-sm text-gray-500">
                {Math.min(Math.floor((loyaltyData.totalPoints / 20000) * 100), 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${Math.min((loyaltyData.totalPoints / 20000) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-right text-sm text-gray-600 mt-2">
              {calculatePointsToNextTier()} pts needed
            </p>
          </div>
        </div>

        {/* Points Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-purple-600 text-2xl font-bold">{loyaltyData.availableBalance}</div>
            <p className="text-gray-600 text-sm">Available Points</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-green-600 text-2xl font-bold">
              {loyaltyData.transactionHistory
                .filter(t => t.type === 'earned')
                .reduce((sum, t) => sum + t.points, 0)}
            </div>
            <p className="text-gray-600 text-sm">Earned This Month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-red-600 text-2xl font-bold">100</div>
            <p className="text-gray-600 text-sm">Expiring in 3 days ⚠️</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Heart className="text-red-500" /> Benefits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getTierBenefits(loyaltyData.tier).map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-green-600 text-lg">✅</span>
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Redeem Points */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Gift className="text-purple-600" /> Redeem Points
          </h3>
          <div className="space-y-3">
            {[
              { points: 100, amount: 5 },
              { points: 250, amount: 15 },
              { points: 1000, amount: 75 }
            ].map(({ points, amount }) => (
              <div key={points} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-300">
                <span className="font-medium">{points} pts = ₹{amount}</span>
                <button
                  onClick={() => handleRedeem(points)}
                  disabled={loyaltyData.availableBalance < points}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition"
                >
                  Redeem
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-600" /> Recent Activity
          </h3>
          {showHistory ? (
            <div className="space-y-3">
              {loyaltyData.transactionHistory.slice(0, 10).map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium">
                      {tx.type === 'earned' ? '✅' : '🔄'} +{tx.points} pts ({tx.source})
                    </p>
                    <p className="text-xs text-gray-500">{tx.description}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    📅 {new Date(tx.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              <button
                onClick={() => setShowHistory(false)}
                className="mt-4 text-center w-full text-purple-600 hover:text-purple-700 font-medium"
              >
                Hide History
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">View your reward points history</p>
              <button
                onClick={() => setShowHistory(true)}
                className="px-6 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition"
              >
                View All History
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyDashboard;
