import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { authService } from '../services';

import AdminUsersPanel from './AdminUsersPanel';
import AdminRestaurantsPanel from './AdminRestaurantsPanel';
import AdminOrdersPanel from './AdminOrdersPanel';
import AdminDeliveryAdvanced from './AdminDeliveryAdvanced';
import AdminActivityLogsPanel from './AdminActivityLogsPanel';
import AdminReviewsPanel from './AdminReviewsPanel';
import AdminSubscriptionsPanel from './AdminSubscriptionsPanel';

const statusStyle = (status: string) => {
  const key = (status || '').toLowerCase();
  if (key.includes('deliver')) return 'bg-emerald-100 text-emerald-700';
  if (key.includes('cancel')) return 'bg-rose-100 text-rose-700';
  if (key.includes('place') || key.includes('pending')) return 'bg-amber-100 text-amber-700';
  return 'bg-indigo-100 text-indigo-700';
};

const AdminDashboardComplete: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [usersByRole, setUsersByRole] = useState<Record<string, number>>({
    customer: 0,
    restaurant_owner: 0,
    delivery_partner: 0,
    admin: 0
  });

  const [activeTab, setActiveTab] = useState('Dashboard');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, ordersRes] = await Promise.all([
          adminService.getStats(),
          adminService.getOrders({ page: 1, limit: 6 })
        ]);

        const incomingStats = statsRes?.stats || statsRes || {};
        const incomingOrders = ordersRes?.orders || ordersRes?.data || [];
        const userStatsArr = incomingStats.userStats || [];

        const rolesMap = userStatsArr.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {});

        setStats(incomingStats);
        setOrders(Array.isArray(incomingOrders) ? incomingOrders : []);
        setUsersByRole({
          customer: rolesMap['customer'] || 0,
          restaurant_owner: rolesMap['restaurant'] || rolesMap['restaurant_owner'] || 0,
          delivery_partner: rolesMap['delivery'] || rolesMap['delivery_partner'] || 0,
          admin: rolesMap['admin'] || 0
        });
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setStats({
          totalUsers: 0,
          totalOrders: 0,
          totalRestaurants: 0,
          totalRevenue: 0
        });
        setOrders([]);
        setUsersByRole({ customer: 0, restaurant_owner: 0, delivery_partner: 0, admin: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const revenueText = useMemo(() => {
    const value = Number(stats?.totalRevenue || 0);
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return `${value}`;
  }, [stats]);

  const handleLogout = () => {
    authService.logout();
    navigate('/admin-login');
  };

  const weeklyBars = [62, 74, 45, 86, 97, 104, 68];
  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxBar = Math.max(...weeklyBars);

  return (
    <div className="min-h-screen bg-[#0F1012] text-white p-2">
      <div className="mx-auto flex max-w-[1350px] gap-3">
        <aside className="w-[330px] rounded-2xl bg-[#161033] border border-violet-900/60 p-5 flex flex-col">
          <h1 className="text-4xl font-black italic text-violet-400 tracking-tight">flavorfinder</h1>
          <p className="text-[10px] uppercase tracking-[5px] text-violet-300/70 mt-1">Admin Console</p>

          <div className="mt-8 space-y-2">
            <p className="text-[11px] uppercase tracking-[4px] text-slate-400">Overview</p>
            <button onClick={() => setActiveTab('Dashboard')} className={`w-full text-left rounded-xl px-4 py-3 ${activeTab === 'Dashboard' ? 'bg-violet-700/70 font-bold' : 'hover:bg-white/5'}`}>Dashboard</button>
          </div>

          <div className="mt-8 space-y-2">
            <p className="text-[11px] uppercase tracking-[4px] text-slate-400">Management</p>
            <button onClick={() => setActiveTab('Users')} className={`w-full text-left px-4 py-3 rounded-xl ${activeTab === 'Users' ? 'bg-violet-700/70 font-bold' : 'hover:bg-white/5'}`}>Users</button>
            <button onClick={() => setActiveTab('Restaurants')} className={`w-full text-left px-4 py-3 rounded-xl ${activeTab === 'Restaurants' ? 'bg-violet-700/70 font-bold' : 'hover:bg-white/5'}`}>Restaurants</button>
            <button onClick={() => setActiveTab('Orders')} className={`w-full text-left px-4 py-3 rounded-xl ${activeTab === 'Orders' ? 'bg-violet-700/70 font-bold' : 'hover:bg-white/5'}`}>Orders</button>
            <button onClick={() => setActiveTab('Delivery')} className={`w-full text-left px-4 py-3 rounded-xl ${activeTab === 'Delivery' ? 'bg-violet-700/70 font-bold' : 'hover:bg-white/5'}`}>Delivery</button>
          </div>

          <div className="mt-8 space-y-2">
            <p className="text-[11px] uppercase tracking-[4px] text-slate-400">System</p>
            <button onClick={() => setActiveTab('Activity Logs')} className={`w-full text-left px-4 py-3 rounded-xl ${activeTab === 'Activity Logs' ? 'bg-violet-700/70 font-bold' : 'hover:bg-white/5'}`}>Activity Logs</button>
            <button onClick={() => setActiveTab('Reviews')} className={`w-full text-left px-4 py-3 rounded-xl ${activeTab === 'Reviews' ? 'bg-violet-700/70 font-bold' : 'hover:bg-white/5'}`}>Reviews</button>
            <button onClick={() => setActiveTab('Subscriptions')} className={`w-full text-left px-4 py-3 rounded-xl ${activeTab === 'Subscriptions' ? 'bg-violet-700/70 font-bold' : 'hover:bg-white/5'}`}>Subscriptions</button>
          </div>

          <div className="mt-auto pt-5 border-t border-white/10">
            <button onClick={handleLogout} className="w-full rounded-xl bg-rose-600/90 py-3 font-black hover:bg-rose-500 transition">
              Logout Admin
            </button>
          </div>
        </aside>

        <main className="flex-1 rounded-2xl bg-[#17181A] border border-white/10 p-5">
          <header className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-4xl font-black tracking-tight">{activeTab === 'Dashboard' ? 'Dashboard Overview' : activeTab}</h2>
              <p className="text-slate-400 font-semibold">{new Date().toLocaleDateString()} - Ahmedabad</p>
            </div>
            <span className="rounded-full bg-violet-100 text-violet-700 px-4 py-1 text-sm font-black">System Online</span>
          </header>

          {loading ? (
            <div className="h-[70vh] flex items-center justify-center text-slate-300">Loading data...</div>
          ) : activeTab === 'Dashboard' ? (
            <>
              <section className="grid grid-cols-4 gap-3 mb-4">
                <div className="rounded-xl bg-[#2A2B2E] p-4 border border-white/10">
                  <p className="text-slate-300 text-sm">Total Users</p>
                  <p className="text-5xl font-black">{stats?.totalUsers || 0}</p>
                </div>
                <div className="rounded-xl bg-[#2A2B2E] p-4 border border-white/10">
                  <p className="text-slate-300 text-sm">Total Orders</p>
                  <p className="text-5xl font-black">{stats?.totalOrders || 0}</p>
                </div>
                <div className="rounded-xl bg-[#2A2B2E] p-4 border border-white/10">
                  <p className="text-slate-300 text-sm">Restaurants</p>
                  <p className="text-5xl font-black">{stats?.totalRestaurants || 0}</p>
                </div>
                <div className="rounded-xl bg-[#2A2B2E] p-4 border border-white/10">
                  <p className="text-slate-300 text-sm">Revenue (₹)</p>
                  <p className="text-5xl font-black">{revenueText}</p>
                </div>
              </section>

              <section className="grid grid-cols-3 gap-3 mb-4">
                <div className="col-span-2 rounded-xl bg-[#2A2B2E] p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-xl">Weekly Orders</h3>
                    <span className="text-violet-400 text-sm font-bold">Last 7 days</span>
                  </div>
                  <div className="h-40 flex items-end gap-3">
                    {weeklyBars.map((value, idx) => (
                      <div key={weekLabels[idx]} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full rounded-md bg-violet-600/90" style={{ height: `${(value / maxBar) * 120}px` }} />
                        <span className="text-xs text-slate-300">{weekLabels[idx]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[#2A2B2E] p-4 border border-white/10">
                  <h3 className="font-black text-xl mb-3">User Roles</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Customers</span><span>{usersByRole.customer}</span></div>
                    <div className="flex justify-between"><span>Rest. Owners</span><span>{usersByRole.restaurant_owner}</span></div>
                    <div className="flex justify-between"><span>Delivery</span><span>{usersByRole.delivery_partner}</span></div>
                    <div className="flex justify-between"><span>Admin</span><span>{usersByRole.admin}</span></div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-3 gap-3">
                <div className="col-span-2 rounded-xl bg-[#2A2B2E] p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-xl">Recent Orders</h3>
                    <button className="text-violet-400 font-bold text-sm">View all</button>
                  </div>
                  <div className="space-y-2">
                    {orders.length > 0 ? orders.slice(0, 5).map((order) => (
                      <div key={order._id} className="grid grid-cols-4 gap-2 items-center text-sm">
                        <span className="text-slate-300">#{String(order._id).slice(-4)}</span>
                        <span>{order?.customer?.name || order?.customerName || 'Customer'}</span>
                        <span>₹{order?.total || order?.totalAmount || 0}</span>
                        <span className={`w-fit px-3 py-1 rounded-full text-xs font-black ${statusStyle(order?.status || order?.orderStatus)}`}>
                          {(order?.status || order?.orderStatus || 'pending').toString()}
                        </span>
                      </div>
                    )) : <div className="text-sm text-slate-400 py-4">No recent orders found.</div>}
                  </div>
                </div>

                <div className="rounded-xl bg-[#2A2B2E] p-4 border border-white/10">
                  <h3 className="font-black text-xl mb-3">System Alerts</h3>
                  <div className="space-y-2 text-sm">
                    <div className="rounded-lg border-l-4 border-amber-400 bg-white/5 p-2">3 restaurants pending approval</div>
                    <div className="rounded-lg border-l-4 border-violet-400 bg-white/5 p-2">12 new review submissions</div>
                    <div className="rounded-lg border-l-4 border-emerald-400 bg-white/5 p-2">Payment gateway active</div>
                    <div className="rounded-lg border-l-4 border-rose-400 bg-white/5 p-2">2 failed delivery attempts</div>
                  </div>
                </div>
              </section>
            </>
          ) : activeTab === 'Users' ? (
            <AdminUsersPanel />
          ) : activeTab === 'Restaurants' ? (
            <AdminRestaurantsPanel />
          ) : activeTab === 'Orders' ? (
            <AdminOrdersPanel />
          ) : activeTab === 'Delivery' ? (
            <AdminDeliveryAdvanced />
          ) : activeTab === 'Activity Logs' ? (
            <AdminActivityLogsPanel />
          ) : activeTab === 'Reviews' ? (
            <AdminReviewsPanel />
          ) : activeTab === 'Subscriptions' ? (
            <AdminSubscriptionsPanel />
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-white/10 rounded-xl mt-4">
               <i className="fa-solid fa-person-digging text-5xl mb-4 text-violet-400"></i>
               <h3 className="text-2xl font-black text-white">Under Development</h3>
               <p className="mt-2 text-sm max-w-md text-center">The {activeTab} section is currently being built and will be available in a future update.</p>
               <button onClick={() => setActiveTab('Dashboard')} className="mt-6 px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold text-sm transition">
                 Return to Dashboard
               </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardComplete;
