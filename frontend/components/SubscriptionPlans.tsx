import React, { useState, useEffect } from 'react';
import { subscriptionService, SubscriptionPlan, UserSubscription } from '../services/subscriptionService';
import { Check, Star } from 'lucide-react';

interface SubscriptionPlansProps {
  userId: string;
  onSubscriptionChange?: () => void;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ userId, onSubscriptionChange }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, subData] = await Promise.all([
        subscriptionService.getSubscriptionPlans(),
        subscriptionService.getUserSubscription(userId)
      ]);
      setPlans(plansData);
      setCurrentSubscription(subData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planName: string) => {
    try {
      setSubscribing(planName);
      // In real implementation, this would handle payment
      alert(`Redirecting to payment for ${planName} plan...`);
      // await subscriptionService.subscribeToPlan(userId, planName as any, paymentMethodId);
      // fetchData();
      // onSubscriptionChange?.();
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium':
        return 'border-purple-300 bg-purple-50';
      case 'elite':
        return 'border-yellow-300 bg-yellow-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getPlanBadge = (plan: string) => {
    if (plan === 'elite') return '👑 BEST VALUE';
    if (plan === 'premium') return '⭐ POPULAR';
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Subscription Plans</h1>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your FlavourFinder experience
          </p>
        </div>

        {/* Current Subscription Info */}
        {currentSubscription && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-8 text-center">
            <p className="text-gray-800">
              You're currently on the <strong>{currentSubscription.plan.toUpperCase()}</strong> plan
              {currentSubscription.endDate && (
                <>
                  {' '}
                  until{' '}
                  <strong>{new Date(currentSubscription.endDate).toLocaleDateString()}</strong>
                </>
              )}
            </p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan === plan.name;
            return (
              <div
                key={plan.name}
                className={`rounded-lg border-2 p-8 transition-all ${getPlanColor(plan.name)} ${
                  isCurrentPlan ? 'ring-2 ring-green-500' : ''
                }`}
              >
                {/* Badge */}
                {getPlanBadge(plan.name) && (
                  <div className="inline-block px-3 py-1 bg-yellow-400 text-black rounded-full text-sm font-bold mb-4">
                    {getPlanBadge(plan.name)}
                  </div>
                )}

                {/* Plan Name */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
                </h2>

                {/* Price */}
                <div className="mb-6">
                  <p className="text-4xl font-bold text-gray-900">
                    ₹{plan.monthlyFee}
                    <span className="text-lg text-gray-600">/month</span>
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="text-green-600" size={20} />
                    <span className="text-gray-700">{plan.freeDeliveries} free deliveries</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="text-green-600" size={20} />
                    <span className="text-gray-700">{plan.discountPercentage}% discount on orders</span>
                  </div>
                  {plan.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="text-green-600" size={20} />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                {isCurrentPlan ? (
                  <button className="w-full py-3 bg-green-600 text-white rounded-lg font-bold cursor-not-allowed">
                    ✓ Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={subscribing === plan.name}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold disabled:bg-gray-400 transition"
                  >
                    {subscribing === plan.name ? 'Processing...' : 'Subscribe Now'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6">Plan Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-bold">Feature</th>
                  <th className="text-center py-3 px-4 font-bold">Basic</th>
                  <th className="text-center py-3 px-4 font-bold">Premium</th>
                  <th className="text-center py-3 px-4 font-bold">Elite</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">Free Deliveries/Month</td>
                  <td className="text-center">0</td>
                  <td className="text-center">10</td>
                  <td className="text-center">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">Discount</td>
                  <td className="text-center">None</td>
                  <td className="text-center">5%</td>
                  <td className="text-center">15%</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">Priority Support</td>
                  <td className="text-center text-red-600">❌</td>
                  <td className="text-center text-green-600">✅</td>
                  <td className="text-center text-green-600">✅</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">Bonus Points</td>
                  <td className="text-center">0</td>
                  <td className="text-center">500</td>
                  <td className="text-center">2000</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Exclusive Offers</td>
                  <td className="text-center text-red-600">❌</td>
                  <td className="text-center text-red-600">❌</td>
                  <td className="text-center text-green-600">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
