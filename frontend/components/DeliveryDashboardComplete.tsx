import React, { useState, useEffect } from 'react';
import { User, Order } from '../types';
import { orderService } from '../services/orderService';

interface DeliveryDashboardCompleteProps {
  currentUser: User;
  onLogout: () => void;
  onViewChange?: (view: string) => void;
}

const DeliveryDashboardComplete: React.FC<DeliveryDashboardCompleteProps> = ({ 
  currentUser, 
  onLogout,
  onViewChange 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'completed' | 'earnings' | 'profile'>('overview');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  const normalizeOrder = (raw: any): Order => ({
    _id: raw?._id || '',
    userId: raw?.customer?._id || raw?.userId || '',
    restaurantId: raw?.restaurant?._id || raw?.restaurantId || '',
    restaurantName: raw?.restaurant?.name || raw?.restaurantName || '',
    items: raw?.items || [],
    totalAmount: raw?.total || raw?.totalAmount || 0,
    orderStatus: raw?.status || raw?.orderStatus || 'placed',
    status: raw?.status || raw?.orderStatus || 'placed',
    createdAt: raw?.createdAt ? new Date(raw.createdAt).getTime() : Date.now(),
    deliveryAddress:
      typeof raw?.deliveryAddress === 'string'
        ? raw.deliveryAddress
        : raw?.deliveryAddress?.street || '',
  });

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await orderService.getDeliveryOrders({ page: 1, limit: 200 });
        const orders = (response?.orders || []).map(normalizeOrder);
        setAllOrders(orders);
        setAcceptedOrders(orders.filter(o => (o.orderStatus || o.status) === 'out_for_delivery').slice(0, 3));
        setCompletedOrders(orders.filter(o => (o.orderStatus || o.status) === 'delivered').slice(0, 5));
      } catch (err) {
        console.error('Error loading orders:', err);
      }
    };
    loadOrders();
  }, []);

  const markDelivered = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'delivered');
      const response = await orderService.getDeliveryOrders({ page: 1, limit: 200 });
      const orders = (response?.orders || []).map(normalizeOrder);
      setAllOrders(orders);
      setAcceptedOrders(orders.filter(o => (o.orderStatus || o.status) === 'out_for_delivery').slice(0, 3));
      setCompletedOrders(orders.filter(o => (o.orderStatus || o.status) === 'delivered').slice(0, 5));
    } catch (error) {
      console.error('Failed to mark order delivered:', error);
    }
  };

  const stats = {
    activeDeliveries: acceptedOrders.length,
    totalDeliveries: completedOrders.length + acceptedOrders.length,
    totalEarnings: completedOrders.reduce((sum, o) => sum + 50, 0), // ₹50 per delivery
    averageRating: 4.8,
    todayEarnings: completedOrders.length * 50,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 italic">flavorfinder</h1>
            <p className="text-xs text-gray-500 font-semibold">Delivery Partner Dashboard</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-gray-500">Delivery Partner</p>
            </div>
            <button 
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: '📊 Overview', icon: 'overview' },
              { id: 'active', label: '🚗 Active Deliveries', icon: 'active' },
              { id: 'completed', label: '✅ Completed', icon: 'completed' },
              { id: 'earnings', label: '💰 Earnings', icon: 'earnings' },
              { id: 'profile', label: '👤 Profile', icon: 'profile' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-bold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Active Deliveries', value: stats.activeDeliveries, icon: '🚗', color: 'blue', bgColor: 'bg-blue-50' },
                { label: 'Total Deliveries', value: stats.totalDeliveries, icon: '✅', color: 'green', bgColor: 'bg-green-50' },
                { label: 'Today\'s Earnings', value: `₹${stats.todayEarnings}`, icon: '💵', color: 'green', bgColor: 'bg-green-50' },
                { label: 'Total Earnings', value: `₹${stats.totalEarnings}`, icon: '💰', color: 'yellow', bgColor: 'bg-yellow-50' },
                { label: 'Rating', value: stats.averageRating, icon: '⭐', color: 'yellow', bgColor: 'bg-yellow-50' }
              ].map((metric, i) => (
                <div key={i} className={`${metric.bgColor} rounded-xl p-4 border border-gray-200`}>
                  <p className="text-gray-600 text-xs font-bold mb-2">{metric.label}</p>
                  <p className="text-2xl font-black text-gray-900">{metric.value}</p>
                </div>
              ))}
            </div>

            {/* Active Deliveries Quick View */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-black mb-4">🚗 Active Deliveries ({acceptedOrders.length})</h2>
              {acceptedOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-2">🎯</p>
                  <p className="text-gray-600 font-semibold">No active deliveries. Start accepting orders!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {acceptedOrders.map((order, idx) => (
                    <div key={order._id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-black text-gray-900">Delivery #{idx + 1}</p>
                          <p className="text-sm text-gray-600">Order #{order._id.substring(0, 8)}</p>
                        </div>
                        <span className="bg-green-200 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                          🟢 In Transit
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-gray-600">Amount: <span className="font-bold text-gray-900">₹{order.totalAmount}</span></p>
                          <p className="text-xs text-gray-600 mt-1">Commission: <span className="font-bold text-green-700">₹50</span></p>
                        </div>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm">
                          📍 Navigate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-black text-lg mb-4">📈 Today's Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <p className="text-gray-600 font-semibold">Deliveries</p>
                    <p className="font-black text-gray-900">{acceptedOrders.length}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-600 font-semibold">Earnings</p>
                    <p className="font-black text-green-600">₹{stats.todayEarnings}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-600 font-semibold">Rating</p>
                    <p className="font-black text-yellow-600">⭐ {stats.averageRating}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-black text-lg mb-4">💡 Tips to Earn More</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Accept more orders during peak hours</li>
                  <li>✓ Maintain high delivery speed</li>
                  <li>✓ Keep your rating above 4.5</li>
                  <li>✓ Weekend orders pay 20% more</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Active Deliveries Tab */}
        {activeTab === 'active' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-black mb-6">🚗 Active Deliveries ({acceptedOrders.length})</h2>
            {acceptedOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">🎯</p>
                <p className="text-gray-600 font-semibold">No active deliveries currently</p>
                <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold">
                  View New Orders
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {acceptedOrders.map((order, idx) => (
                  <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-black text-lg text-gray-900">Delivery #{idx + 1}</p>
                            <p className="text-sm text-gray-600">Order #{order._id.substring(0, 8)}</p>
                          </div>
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                            In Transit
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-gray-600">Amount</p>
                            <p className="font-black text-gray-900">₹{order.totalAmount}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Commission</p>
                            <p className="font-black text-green-600">₹50</p>
                          </div>
                        </div>

                        {/* Delivery Progress */}
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">✓</div>
                            <p className="text-sm font-semibold text-gray-900">Picked up from restaurant</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-yellow-600 text-white flex items-center justify-center text-xs font-bold">🚗</div>
                            <p className="text-sm font-semibold text-gray-900">On the way to customer</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">📍</div>
                            <p className="text-sm font-semibold text-gray-600">Arriving soon</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap">
                          📍 Navigate
                        </button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap">
                          📞 Call
                        </button>
                        <button
                          onClick={() => markDelivered(order._id)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap"
                        >
                          ✅ Delivered
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed Deliveries Tab */}
        {activeTab === 'completed' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-black mb-6">✅ Completed Deliveries ({completedOrders.length})</h2>
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">Order #{order._id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-600 mt-1">Amount: ₹{order.totalAmount} • Commission: ₹50</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full mb-2">
                        ✅ Delivered
                      </span>
                      <button className="text-xs font-bold text-blue-600 hover:text-blue-700">
                        Rate Order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-black text-lg mb-4">💰 Earnings Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <p className="text-gray-600 font-semibold">Today</p>
                    <p className="font-black text-green-600 text-lg">₹{stats.todayEarnings}</p>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <p className="text-gray-600 font-semibold">This Week</p>
                    <p className="font-black text-green-600 text-lg">₹{stats.todayEarnings * 4}</p>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <p className="text-gray-600 font-semibold">This Month</p>
                    <p className="font-black text-green-600 text-lg">₹{stats.totalEarnings}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <p className="text-gray-900 font-black">Total Lifetime</p>
                    <p className="font-black text-green-700 text-xl">₹{stats.totalEarnings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-black text-lg mb-4">📊 Delivery Stats</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-1">Completion Rate</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '98%'}}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">98%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-1">Average Rating</p>
                    <div className="flex items-center gap-2">
                      <div className="text-xl font-black text-yellow-500">⭐ {stats.averageRating}</div>
                      <p className="text-xs text-gray-600">/5.0</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-1">Total Deliveries</p>
                    <p className="text-xl font-black text-blue-600">{stats.totalDeliveries}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Earning Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-black text-lg mb-4">Recent Earnings</h3>
              <div className="space-y-2">
                {completedOrders.length > 0 ? completedOrders.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-900">Order #{order._id.substring(0, 8)}</p>
                    <p className="font-black text-green-600">+ ₹50</p>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-500">
                    No recent earnings yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 space-y-6">
              <h2 className="text-2xl font-black mb-6">My Profile</h2>
              
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Name</label>
                <input
                  type="text"
                  defaultValue={currentUser.name}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Phone</label>
                <input
                  type="tel"
                  defaultValue={currentUser.phone || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={currentUser.email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="font-bold text-green-900 mb-3">📊 Your Statistics</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-green-700">Total Deliveries</p>
                    <p className="font-black text-2xl text-green-900">{stats.totalDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Total Earnings</p>
                    <p className="font-black text-2xl text-green-900">₹{stats.totalEarnings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Avg Rating</p>
                    <p className="font-black text-2xl text-green-900">⭐ {stats.averageRating}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Success Rate</p>
                    <p className="font-black text-2xl text-green-900">98%</p>
                  </div>
                </div>
              </div>

              <button className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-black transition-all">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboardComplete;
