import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { deliveryPartnerService } from '../services/deliveryPartnerService';
import { io, Socket } from 'socket.io-client';

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
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [earningsData, setEarningsData] = useState<any>(null);
  
  // Rider statuses
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [simulateLocation, setSimulateLocation] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchActiveDeliveries();
    fetchEarnings();

    // Socket Initialization
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      query: { userId: currentUser._id }
    });
    setSocket(newSocket);

    newSocket.on('delivery:assigned', (data) => {
      // If the assigned delivery belongs to this rider, refresh deliveries
      // Since admin maps deliveryPartnerId to their actual object map, we check inside the updated deliveries list
      // Or we can just blindly fetch. For simplicity, we just fetch:
      fetchActiveDeliveries();
      // Optional: native browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Delivery Assigned!', { body: `Order \${data.orderId} assigned to you.`});
      }
    });

    newSocket.on('delivery:status:update', (data) => {
      // If an admin or system forcefully updates status, reload
      fetchActiveDeliveries();
    });

    return () => {
      newSocket.close();
    };
  }, [currentUser._id]);

  useEffect(() => {
    // Ask for notification permission
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Geolocation effect
  useEffect(() => {
    let watchId: number;
    let intervalId: any;

    if (isOnline && activeDeliveries.length > 0) {
      if (!simulateLocation && "geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            // Broadcast location to all active deliveries
            for (let d of activeDeliveries) {
              await deliveryPartnerService.updateLocation(d._id, latitude, longitude);
            }
          },
          (error) => console.error("Error watching position", error),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      } else {
        // Mock Location Simulator (wandering around Ahmedabad center)
        let lat = 23.0225;
        let lng = 72.5714;
        intervalId = setInterval(async () => {
          lat += (Math.random() - 0.5) * 0.005;
          lng += (Math.random() - 0.5) * 0.005;
          for (let d of activeDeliveries) {
            await deliveryPartnerService.updateLocation(d._id, lat, lng);
          }
        }, 8000);
      }
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOnline, simulateLocation, activeDeliveries]);


  const fetchActiveDeliveries = async () => {
    try {
      const res = await deliveryPartnerService.getDeliveryOrders();
      if (res?.data) {
        setActiveDeliveries(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch active deliveries', err);
    }
  };

  const fetchEarnings = async () => {
    try {
      const res = await deliveryPartnerService.getEarnings();
      if (res?.data) {
        setEarningsData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch earnings', err);
    }
  };

  const handleUpdateStatus = async (deliveryId: string, status: string) => {
    try {
      await deliveryPartnerService.updateDeliveryStatus(deliveryId, status);
      await fetchActiveDeliveries();
      if (status === 'delivered') {
        await fetchEarnings();
      }
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Could not update status. Please try again.');
    }
  };

  // Safe metrics fallbacks
  const stats = {
    activeDeliveries: activeDeliveries.length,
    totalDeliveries: earningsData?.totalDeliveries || 0,
    totalEarnings: earningsData?.totalEarnings || 0,
    averageRating: currentUser.rating || 4.8,
    todayEarnings: earningsData?.totalEarnings || 0, // Mocking today vs total for simplicity in phase 2 unless dates filtered
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 italic">flavorfinder</h1>
            <p className="text-xs text-gray-500 font-semibold">Delivery Partner Dashboard</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-xl">
              <span className={`w-3 h-3 rounded-full \${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-sm font-bold text-gray-700">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              <label className="relative inline-flex items-center cursor-pointer ml-2">
                <input type="checkbox" className="sr-only peer" checked={isOnline} onChange={() => setIsOnline(!isOnline)} />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-gray-500">Rider</p>
            </div>
            <button 
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 sm:gap-8 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'active', label: '🚗 Active Deliveries' },
              { id: 'completed', label: '✅ Completed' },
              { id: 'earnings', label: '💰 Earnings' },
              { id: 'profile', label: '👤 Profile' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-bold text-sm transition-all whitespace-nowrap \${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Offline Warning */}
        {!isOnline && activeTab !== 'profile' && (
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 font-bold">
                  You are currently OFFLINE. Toggle yourself ONLINE in the top menu to broadcast your location and receive ping assignments!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Active Jobs', value: stats.activeDeliveries, icon: '🚗', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
                { label: 'Completed', value: stats.totalDeliveries, icon: '✅', bgColor: 'bg-green-50', textColor: 'text-green-700' },
                { label: 'Earnings', value: `₹\${stats.totalEarnings}`, icon: '💰', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
                { label: 'Rating', value: stats.averageRating, icon: '⭐', bgColor: 'bg-orange-50', textColor: 'text-orange-700' }
              ].map((metric, i) => (
                <div key={i} className={`\${metric.bgColor} rounded-xl p-4 border border-white`}>
                  <p className={`\${metric.textColor} text-xs font-bold mb-2 uppercase tracking-wide`}>{metric.label}</p>
                  <p className="text-3xl font-black text-gray-900">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Jobs Quick View */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-black mb-4 tracking-tight">Active Assignments</h2>
                {activeDeliveries.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-4xl mb-3">🎯</p>
                    <p className="text-gray-500 font-semibold">Ready for dispatch.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeDeliveries.slice(0,3).map((delivery) => (
                      <div key={delivery._id} className="border border-orange-100 bg-orange-50/30 rounded-2xl p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                              {delivery.status.replace('_', ' ')}
                            </span>
                            <p className="text-lg font-black text-gray-900 mt-2">Order #{String(delivery?.orderId?._id || delivery._id).substring(0,6)}</p>
                          </div>
                          <p className="font-black text-xl text-green-600">₹{delivery.deliveryCharge || delivery.baseRate}</p>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1 mb-4">
                          <p><strong>From:</strong> {delivery.restaurantId?.name || 'Restaurant'}</p>
                          <p><strong>To:</strong> {delivery.deliveryLocation?.address}</p>
                        </div>
                        <button onClick={() => setActiveTab('active')} className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-bold text-sm transition-colors">
                          Manage Delivery
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tools */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-xl mb-4 tracking-tight">Rider Tools</h3>
                
                <div className="p-5 border border-gray-200 rounded-2xl mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900">Developer Testing</h4>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg">Mock Tool</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Enable Mock Location to simulate roaming across Ahmedabad without activating browser hardware GPS.
                  </p>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={simulateLocation} onChange={() => setSimulateLocation(!simulateLocation)} />
                      <div className={`block w-14 h-8 rounded-full \${simulateLocation ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition \${simulateLocation ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <div className="ml-3 font-bold text-gray-700">Simulate Location</div>
                  </label>
                </div>

                <h4 className="font-bold text-gray-900 mt-6 mb-3">Today's Guide</h4>
                <ul className="space-y-3 text-sm text-gray-600 bg-gray-50 p-5 rounded-2xl">
                  <li className="flex items-center gap-2">✓ <span className="flex-1">Avoid heavy traffic near Navrangpura</span></li>
                  <li className="flex items-center gap-2">✓ <span className="flex-1">Peak pay active from 7PM - 10PM</span></li>
                  <li className="flex items-center gap-2">✓ <span className="flex-1">Keep food securely insulated</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Active Deliveries Tab */}
        {activeTab === 'active' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-slide-up">
            <h2 className="text-2xl font-black mb-6 tracking-tight flex items-center gap-3">
              🚗 Dispatch Queue
              <span className="bg-orange-100 text-orange-700 text-sm py-1 px-3 rounded-full">{activeDeliveries.length} Job(s)</span>
            </h2>
            
            {activeDeliveries.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
                <p className="text-5xl mb-4">🥱</p>
                <p className="text-gray-500 font-bold text-lg">Your queue is empty right now.</p>
                <p className="text-gray-400 text-sm mt-1">Make sure you are ONLINE to receive dispatch pings.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeDeliveries.map((delivery) => (
                  <div key={delivery._id} className="border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors">
                    {/* Header Row */}
                    <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-200">
                      <div>
                        <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                          Order #{String(delivery?.orderId?._id || delivery._id).substring(0,8)}
                        </span>
                        <h3 className="font-black text-xl text-gray-900 mt-2">Payout: ₹{delivery.deliveryCharge || delivery.baseRate}</h3>
                      </div>
                      <div className="flex gap-2">
                         {/* Action Buttons mapping the State Machine */}
                         {delivery.status === 'accepted' && (
                           <button onClick={() => handleUpdateStatus(delivery._id, 'picked_up')} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/30">
                             Mark Picked Up
                           </button>
                         )}
                         {delivery.status === 'picked_up' && (
                           <button onClick={() => handleUpdateStatus(delivery._id, 'on_the_way')} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/30">
                             Mark On The Way
                           </button>
                         )}
                         {delivery.status === 'on_the_way' && (
                           <button onClick={() => handleUpdateStatus(delivery._id, 'delivered')} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-500/30">
                             Mark Delivered
                           </button>
                         )}
                      </div>
                    </div>
                    
                    {/* Body Row */}
                    <div className="p-6 flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="bg-gray-100 p-3 rounded-xl text-gray-500"><i className="fa-solid fa-store"></i></div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pickup</p>
                            <p className="font-black text-gray-900">{delivery.restaurantId?.name || 'Restaurant'}</p>
                            <p className="text-sm text-gray-600">{delivery.pickupLocation?.address || delivery.restaurantId?.address}</p>
                          </div>
                        </div>
                        <div className="w-0.5 h-6 bg-gray-200 ml-6"></div>
                        <div className="flex items-start gap-4">
                          <div className="bg-orange-100 p-3 rounded-xl text-orange-600"><i className="fa-solid fa-location-dot"></i></div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Drop-off</p>
                            <p className="font-black text-gray-900">{delivery.customerId?.name || 'Customer'}</p>
                            <p className="text-sm text-gray-600">{delivery.deliveryLocation?.address}</p>
                            <p className="text-sm text-gray-500 font-bold mt-1">📞 {delivery.customerId?.phone || 'Hidden'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Vertical status timeline */}
                      <div className="w-full md:w-64 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Journey</h4>
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                           <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                             <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white \${['accepted','picked_up','on_the_way'].includes(delivery.status) ? 'border-orange-500 text-orange-500' : 'border-gray-300'}`}>✓</div>
                             <p className={`pl-3 text-sm font-bold \${['accepted','picked_up','on_the_way'].includes(delivery.status) ? 'text-gray-900' : 'text-gray-400'}`}>Assigned</p>
                           </div>
                           <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                             <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white \${['picked_up','on_the_way'].includes(delivery.status) ? 'border-orange-500 text-orange-500' : 'border-gray-300'}`}></div>
                             <p className={`pl-3 text-sm font-bold \${['picked_up','on_the_way'].includes(delivery.status) ? 'text-gray-900' : 'text-gray-400'}`}>Picked Up</p>
                           </div>
                           <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                             <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white \${delivery.status === 'on_the_way' ? 'border-orange-500 text-orange-500' : 'border-gray-300'}`}></div>
                             <p className={`pl-3 text-sm font-bold \${delivery.status === 'on_the_way' ? 'text-gray-900' : 'text-gray-400'}`}>On The Way</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed Tab - Stub for Phase 3/Extension, using total metric for now */}
        {activeTab === 'completed' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-center h-64">
             <div className="text-center">
                 <h2 className="text-2xl font-black text-gray-900">Completed Orders Module</h2>
                 <p className="text-gray-500 mt-2">You have completed {stats.totalDeliveries} historical orders.</p>
                 <p className="text-sm text-gray-400 mt-4">(Extended views loading in subsequent updates)</p>
             </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
             <h2 className="text-2xl font-black mb-6 tracking-tight">Wallet & Earnings</h2>
             <div className="bg-[#0F1012] text-white p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
                
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Available Balance</p>
                <p className="text-6xl font-black">₹{stats.totalEarnings}</p>

                <div className="flex gap-4 mt-8">
                  <button className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-black tracking-wide transition-colors">
                    Withdraw to Bank
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-colors">
                    View History
                  </button>
                </div>
             </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-slide-up">
              <h2 className="text-2xl font-black mb-8 tracking-tight">Rider Account</h2>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl overflow-hidden border-4 border-white shadow-lg">
                  👤
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900">{currentUser.name}</h3>
                  <p className="text-gray-500 font-bold">{currentUser.email}</p>
                  <p className="text-orange-500 font-black text-sm mt-1">★ {stats.averageRating} Rating</p>
                </div>
              </div>
              <hr className="border-gray-100 mb-8" />
              <div className="space-y-4">
                 <div>
                   <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-2">Registered Phone</label>
                   <input type="text" readOnly value={currentUser.phone || 'Not Provided'} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-700" />
                 </div>
                 <div>
                   <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-2">Vehicle Configuration</label>
                   <input type="text" readOnly value="Two-Wheeler (Motorcycle)" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-700" />
                 </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboardComplete;
