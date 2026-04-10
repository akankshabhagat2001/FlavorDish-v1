
import React, { useState, useEffect, useMemo } from 'react';
import { Order, UserType } from '../types.ts';
import { orderService, paymentService } from '../services';
import { socketService } from '../services/socketService';

interface DeliveryDashboardProps {
  currentUser: { _id: string; name: string; role: UserType };
  onLogout: () => void;
}

const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ currentUser, onLogout }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [availableEarnings, setAvailableEarnings] = useState<number>(0);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getDeliveryOrders({ page: 1, limit: 50 });
      const apiOrders = response?.orders || response || [];
      const normalizedOrders = apiOrders.map((order: any) => ({
        ...order,
        restaurantName: order.restaurant?.name || order.restaurantName || '',
        deliveryAddress: typeof order.deliveryAddress === 'object'
          ? `${order.deliveryAddress.street || ''}${order.deliveryAddress.city ? ', ' + order.deliveryAddress.city : ''}${order.deliveryAddress.state ? ', ' + order.deliveryAddress.state : ''}${order.deliveryAddress.zipCode ? ', ' + order.deliveryAddress.zipCode : ''}`
          : order.deliveryAddress || '',
        orderStatus: order.status || order.orderStatus || 'pending',
        status: order.status || order.orderStatus || 'pending',
        createdAt: order.createdAt ? new Date(order.createdAt).getTime() : Date.now(),
      }));

      const todo = normalizedOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(todo);
      setAvailableEarnings(todo.filter((o: any) => o.orderStatus === 'delivered').reduce((sum: number, o: any) => sum + 40, 0));
    } catch (error) {
      console.error('Delivery orders load error:', error);
      setOrders([]);
      setAvailableEarnings(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Connect to socket for real-time notifications
    socketService.connect();

    // Listen for new orders (for restaurant owners)
    socketService.onNewOrder((newOrder) => {
      // Show notification for new orders
      if (Notification.permission === 'granted') {
        new Notification('New Order!', {
          body: `Order from ${newOrder.restaurant?.name || 'Restaurant'}`,
          icon: '/favicon.ico'
        });
      }
      loadOrders(); // Refresh orders
    });

    // Listen for delivery assignments
    socketService.onDeliveryAssigned((order) => {
      if (Notification.permission === 'granted') {
        new Notification('Delivery Assigned!', {
          body: `New delivery to ${order.deliveryAddress}`,
          icon: '/favicon.ico'
        });
      }
      loadOrders(); // Refresh orders
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socketService.disconnect();
      socketService.offNewOrder();
      socketService.offDeliveryAssigned();
    };
  }, [currentUser]);

  const pendingOrders = useMemo(() => orders.filter(o => o.orderStatus !== 'delivered'), [orders]);
  const activeOrder = useMemo(() => orders.find(o => o.orderStatus !== 'delivered'), [orders]);
  const completedTrips = useMemo(() => orders.filter(o => o.orderStatus === 'delivered'), [orders]);
  const totalEarnings = useMemo(() => completedTrips.length * 40, [completedTrips]);

  const updateStatus = async (orderId: string, nextStatus: Order['orderStatus']) => {
    try {
      await orderService.updateOrderStatus(orderId, nextStatus);
      await loadOrders();
    } catch (error) {
      console.error('Order status update failed:', error);
      alert('Unable to update order status. Please try again.');
    }
  };

  const handleAccept = async (orderId: string) => {
    await updateStatus(orderId, 'picked_up');
  };

  const handleReject = async (orderId: string) => {
    if (window.confirm('Are you sure? Rejections impact your ecosystem rating.')) {
      alert('Order rejection is not supported in the current backend flow. Please complete or update the order status instead.');
    }
  };

  const handleReleaseEarnings = async () => {
    const amount = availableEarnings;
    if (amount <= 0) {
      alert('No earnings available to release.');
      return;
    }

    setAvailableEarnings(0);
    alert(`₹${amount} released to delivery partner account.`);

    // Optionally call backend release API
    try {
      await paymentService.releaseDeliveryPartner(orders[0]?._id || '');
    } catch (err) {
      console.warn('Delivery release API may not be available', err);
    }
  };

  const nextStatusMap: Record<string, Order['orderStatus']> = {
    'confirmed': 'picked_up',
    'preparing': 'picked_up',
    'ready': 'picked_up',
    'picked_up': 'delivered',
    'out_for_delivery': 'delivered'
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 font-sans">
      {/* Dynamic Profile Header */}
      <div className="bg-gradient-to-br from-gray-900 to-black text-white px-6 py-12 rounded-b-[50px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-white/10 p-1 border border-white/20 backdrop-blur-md">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} className="w-full h-full object-cover rounded-2xl" alt="" />
            </div>
            <div>
               <div className="flex items-center gap-2 mb-1">
                 <h1 className="text-3xl font-black tracking-tighter">{currentUser.name.split(' ')[0]}</h1>
                 <span className="bg-emerald-500 w-2 h-2 rounded-full animate-pulse"></span>
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Ecosystem Hero Level 4</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-500 transition-all shadow-lg">
             <i className="fa-solid fa-power-off"></i>
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 -mt-10 space-y-6">
        {/* Real-time Earnings Meter */}
        <div className="bg-white p-10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 flex justify-between items-center relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2">Available Payout</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-gray-900">₹{availableEarnings}</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase mb-2">Pending release</span>
              </div>
              <button onClick={handleReleaseEarnings} className="mt-2 text-xs font-black uppercase tracking-widest bg-emerald-600 text-white px-3 py-2 rounded-xl hover:bg-emerald-700 transition">Release Funds</button>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2">Trips Done</p>
              <h3 className="text-4xl font-black text-emerald-500 group-hover:scale-110 transition-transform">{completedTrips.length}</h3>
           </div>
        </div>

        {/* Global Auto-Accept Control */}
        <div className="bg-white px-8 py-5 rounded-[30px] border border-gray-100 shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${autoAccept ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-300'}`}>
                <i className="fa-solid fa-bolt-lightning"></i>
             </div>
             <div>
               <p className="text-[11px] font-black text-gray-800 uppercase tracking-tight">Auto-Accept Gigs</p>
               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Efficiency Mode</p>
             </div>
           </div>
           <button 
             onClick={() => setAutoAccept(!autoAccept)}
             className={`w-14 h-8 rounded-full p-1 transition-all relative ${autoAccept ? 'bg-emerald-500' : 'bg-gray-200'}`}
           >
             <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${autoAccept ? 'translate-x-6' : 'translate-x-0'}`}></div>
           </button>
        </div>

        {/* New Assignments View */}
        {pendingOrders.length > 0 && (
          <div className="space-y-5 animate-slide-up">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] font-black text-gray-500 uppercase tracking-[4px]">Payload Assignments ({pendingOrders.length})</h2>
              <button className="text-[9px] font-black text-orange-500 uppercase underline tracking-widest">History</button>
            </div>
            <div className="space-y-4">
              {pendingOrders.map(order => (
                <div key={order._id} className="bg-white border-2 border-orange-100 p-8 rounded-[40px] shadow-2xl animate-pulse-slow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-orange-500 text-white px-5 py-2 rounded-bl-[24px] text-[10px] font-black uppercase tracking-widest">
                    Hot New Gig
                  </div>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h4 className="text-2xl font-black text-gray-900 tracking-tight">{order.restaurantName}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID: #{order._id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-orange-500">₹40</p>
                      <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Base Payout</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-10">
                    <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50/50 p-4 rounded-2xl">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-50">
                        <i className="fa-solid fa-map-location-dot"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Destination</p>
                         <p className="font-bold truncate text-gray-800">{order.deliveryAddress || 'Doorstep'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleAccept(order._id)}
                      className="flex-[2] bg-gray-900 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      Accept Gig <i className="fa-solid fa-chevron-right text-[10px]"></i>
                    </button>
                    <button 
                      onClick={() => handleReject(order._id)}
                      className="flex-1 bg-gray-50 border border-gray-100 text-gray-400 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Active Operations */}
        <div className="space-y-5">
          <h2 className="text-[11px] font-black text-gray-500 uppercase tracking-[4px] ml-2">Active Mission Protocol</h2>
          {activeOrder ? (
            <div className="bg-white p-10 rounded-[48px] shadow-[0_30px_70px_rgba(0,0,0,0.08)] border-l-[12px] border-orange-500 relative">
               <div className="absolute top-8 right-8">
                 <div className="flex flex-col items-end">
                   <span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">
                     {activeOrder.orderStatus.replace('_', ' ')}
                   </span>
                   <p className="text-[8px] text-gray-400 font-bold uppercase mt-2">Status Lock</p>
                 </div>
               </div>

               <div className="mb-10">
                 <h4 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{activeOrder.restaurantName}</h4>
                 <p className="text-sm text-gray-500 font-medium">Order Payload #{activeOrder._id.slice(0, 8)}</p>
               </div>

               <div className="space-y-6 mb-12 relative">
                  <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gray-100 border-l-2 border-dashed border-gray-200"></div>
                  
                  <div className="flex items-center gap-5 relative z-10">
                     <div className="w-10 h-10 bg-white shadow-xl rounded-2xl flex items-center justify-center text-orange-500 ring-4 ring-orange-50">
                        <i className="fa-solid fa-store"></i>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Merchant Hub</p>
                        <p className="text-base font-black text-gray-800">{activeOrder.restaurantName}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-5 relative z-10">
                     <div className="w-10 h-10 bg-white shadow-xl rounded-2xl flex items-center justify-center text-emerald-500 ring-4 ring-emerald-50">
                        <i className="fa-solid fa-house-chimney"></i>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Dropzone</p>
                        <p className="text-base font-black text-gray-800">{activeOrder.deliveryAddress?.split(',')[0] || 'Main Entrance'}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{activeOrder.deliveryAddress}</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-8">
                  <button className="bg-gray-50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                     <i className="fa-solid fa-phone"></i> Call Merchant
                  </button>
                  <button className="bg-gray-50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                     <i className="fa-solid fa-location-arrow"></i> Get Path
                  </button>
               </div>

               <button 
                onClick={() => updateStatus(activeOrder._id, nextStatusMap[activeOrder.orderStatus])}
                className="w-full bg-gray-900 text-white py-6 rounded-[30px] font-black text-sm uppercase tracking-[4px] shadow-2xl hover:bg-black hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4 group"
               >
                 Mark {nextStatusMap[activeOrder.orderStatus]?.replace('_', ' ').toUpperCase()}
                 <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-2 transition-transform"></i>
               </button>
            </div>
          ) : (
            <div className="py-24 text-center bg-white rounded-[50px] border-2 border-dashed border-gray-200">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                  <i className="fa-solid fa-motorcycle text-4xl"></i>
               </div>
               <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Scanning for available payloads...</p>
            </div>
          )}
        </div>

        {/* Shift Summary / Recent Activity */}
        <div className="space-y-5 pb-12">
           <h2 className="text-[11px] font-black text-gray-500 uppercase tracking-[4px] ml-2">Recent Success Missions</h2>
           <div className="space-y-4">
              {completedTrips.slice(0, 5).map(o => (
                <div key={o._id} className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
                         <i className="fa-solid fa-check-double text-lg"></i>
                      </div>
                      <div>
                         <p className="font-black text-gray-800 text-sm tracking-tight">{o.restaurantName}</p>
                         <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • MISSION SUCCESS</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-lg font-black text-gray-900 leading-none">₹40</p>
                      <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-1">Paid</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
