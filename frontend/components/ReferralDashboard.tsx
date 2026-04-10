import React, { useState, useEffect } from 'react';
import { referralService, ReferralData } from '../services/referralService';
import { Share2, Copy, Users } from 'lucide-react';

interface ReferralDashboardProps {
  userId: string;
}

const ReferralDashboard: React.FC<ReferralDashboardProps> = ({ userId }) => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, [userId]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const data = await referralService.getReferralProfile(userId);
      setReferralData(data);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (referralData) {
      const success = await referralService.copyToClipboard(referralData.referralCode);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleShareSocial = (platform: 'whatsapp' | 'facebook' | 'twitter') => {
    if (referralData) {
      referralService.sharViaSocialMedia(referralData.referralCode, platform);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!referralData) {
    return <div className="text-center p-8 text-red-600">Failed to load referral data</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
          <button className="text-2xl">≡</button>
        </div>

        {/* Referral Code Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Share & Earn</h2>
          <p className="text-gray-600 text-center mb-6">
            Share your code and earn ₹{referralData.bonusPoints} points for each successful referral
          </p>

          {/* Code Display */}
          <div className="bg-gradient-to-r from-green-100 to-teal-100 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Your Referral Code</p>
            <div className="flex items-center justify-between gap-4">
              <code className="text-3xl font-bold text-green-700">{referralData.referralCode}</code>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Copy size={20} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => handleShareSocial('whatsapp')}
              className="flex items-center justify-center gap-2 p-3 bg-green-100 hover:bg-green-200 rounded-lg text-green-700 transition"
            >
              <Share2 size={20} />
              WhatsApp
            </button>
            <button
              onClick={() => handleShareSocial('facebook')}
              className="flex items-center justify-center gap-2 p-3 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition"
            >
              <Share2 size={20} />
              Facebook
            </button>
            <button
              onClick={() => handleShareSocial('twitter')}
              className="flex items-center justify-center gap-2 p-3 bg-sky-100 hover:bg-sky-200 rounded-lg text-sky-700 transition"
            >
              <Share2 size={20} />
              Twitter
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Referrals</p>
                <p className="text-3xl font-bold text-gray-900">{referralData.totalReferrals}</p>
              </div>
              <Users className="text-green-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-600 text-sm">Successful Referrals</p>
              <p className="text-3xl font-bold text-green-600">{referralData.successfulReferrals}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-600 text-sm">Bonus Points Earned</p>
              <p className="text-3xl font-bold text-purple-600">{referralData.totalBonusPointsEarned}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div>
              <p className="text-gray-600 text-sm">Bonus Amount</p>
              <p className="text-3xl font-bold text-orange-600">₹{referralData.totalBonusAmountEarned}</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4">How It Works</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <span className="text-2xl font-bold text-green-600">1️⃣</span>
              <div>
                <h4 className="font-bold text-gray-900">Share Your Code</h4>
                <p className="text-gray-600 text-sm">Send your referral code to friends</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl font-bold text-green-600">2️⃣</span>
              <div>
                <h4 className="font-bold text-gray-900">They Sign Up</h4>
                <p className="text-gray-600 text-sm">Your friends use your code during registration</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl font-bold text-green-600">3️⃣</span>
              <div>
                <h4 className="font-bold text-gray-900">Both Earn Rewards</h4>
                <p className="text-gray-600 text-sm">
                  You get {referralData.bonusPoints} points, they get ₹50 discount
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl font-bold text-green-600">4️⃣</span>
              <div>
                <h4 className="font-bold text-gray-900">They Complete Order</h4>
                <p className="text-gray-600 text-sm">Bonus points credited when they place their first order</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralDashboard;
