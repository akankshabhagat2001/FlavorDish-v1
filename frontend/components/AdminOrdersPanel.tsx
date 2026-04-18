import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const AdminOrdersPanel: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await adminService.getOrders({ limit: 100 });
      setOrders(data?.orders || data?.data || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  const statusStyle = (status: string) => {
    const key = (status || '').toLowerCase();
    if (key.includes('deliver')) return 'bg-emerald-100/10 text-emerald-400 border-emerald-500/30';
    if (key.includes('cancel')) return 'bg-rose-100/10 text-rose-400 border-rose-500/30';
    if (key.includes('place') || key.includes('pending')) return 'bg-amber-100/10 text-amber-400 border-amber-500/30';
    return 'bg-indigo-100/10 text-indigo-400 border-indigo-500/30';
  };

  return (
    <div className="bg-[#2A2B2E] rounded-xl p-5 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-2xl text-white">Order Management</h3>
        <button onClick={fetchOrders} className="text-violet-400 hover:text-white p-2 transition">
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 py-10 text-center">Loading orders...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#17181A] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Restaurant</th>
                <th className="px-4 py-3">Total (₹)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Override Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map(order => (
                <tr key={order._id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-mono text-xs">#{String(order._id).slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{order.customer?.name || order.customerName || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{order.restaurant?.name || 'N/A'}</td>
                  <td className="px-4 py-3 font-bold text-white">₹{order.total || order.totalAmount || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border ${statusStyle(order.status || order.orderStatus)}`}>
                      {(order.status || order.orderStatus || 'pending').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select 
                      value={order.status || order.orderStatus || 'placed'} 
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      className="bg-[#17181A] border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-violet-500"
                    >
                      <option value="placed">Placed</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="picked_up">Picked Up</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPanel;
