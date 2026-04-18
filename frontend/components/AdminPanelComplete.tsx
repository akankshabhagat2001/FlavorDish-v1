/**
 * AdminPanelComplete.tsx
 * Full admin panel: Dashboard, Users, Restaurants, Orders,
 * Delivery, Payments, Analytics, Notifications, Activity Logs
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

/* ─── API helper ─────────────────────────────────────────────── */
const BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
const api = async (path: string, opts: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
};

/* ─── Types ──────────────────────────────────────────────────── */
interface AdminUser { _id: string; name: string; email: string; role: string; phone?: string; isActive: boolean; createdAt: string; walletBalance?: number; }
interface AdminRestaurant { _id: string; name: string; owner?: { name: string; email: string }; address?: { city?: string; street?: string }; rating?: number; isOpen: boolean; isApproved?: boolean; cuisine?: string[]; createdAt: string; }
interface AdminOrder { _id: string; orderNumber: string; customer?: { name: string; email: string }; restaurant?: { name: string }; total: number; status: string; paymentStatus: string; createdAt: string; deliveryPartner?: { name: string } | null; }
interface AdminPayment { _id: string; userId?: { name: string; email: string }; orderId?: { orderNumber: string }; amount: number; paymentMethod: string; status: string; transactionId?: string; createdAt: string; }
interface ActivityLog { _id: string; userId?: { name: string; role: string }; action: string; userRole: string; details?: any; createdAt: string; ipAddress?: string; }
interface DeliveryPartner { _id: string; name: string; phone?: string; isActive: boolean; isAvailable: boolean; totalDeliveries?: number; activeOrder?: any; currentLocation?: { latitude: number; longitude: number }; }

/* ─── Color helpers ──────────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700', confirmed: 'bg-indigo-100 text-indigo-700',
  preparing: 'bg-yellow-100 text-yellow-700', ready: 'bg-orange-100 text-orange-700',
  picked_up: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700', pending: 'bg-gray-100 text-gray-700',
  completed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700',
  refunded: 'bg-pink-100 text-pink-700',
};
const statusBadge = (s: string) => <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[s] || 'bg-gray-100 text-gray-600'}`}>{s?.replace(/_/g, ' ')}</span>;
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/* ─── Mini Chart (SVG sparkline) ─────────────────────────────── */
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 40 }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 200; const h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} fillOpacity="0.12" stroke="none" />
    </svg>
  );
};

/* ─── Bar Chart ──────────────────────────────────────────────── */
const BarChart: React.FC<{ data: { label: string; value: number }[]; color: string; height?: number }> = ({ data, color, height = 120 }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t" style={{ height: `${(d.value / max) * (height - 20)}px`, background: color }} title={`${d.label}: ${d.value}`} />
          <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN ADMIN PANEL
══════════════════════════════════════════════════════════════ */
type TabId = 'dashboard' | 'users' | 'restaurants' | 'orders' | 'delivery' | 'payments' | 'analytics' | 'notifications' | 'activity';

interface Props { currentUser: any; onLogout: () => void; onViewChange?: (v: string) => void; }

const AdminPanelComplete: React.FC<Props> = ({ currentUser, onLogout, onViewChange }) => {
  const [tab, setTab] = useState<TabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const NAV: { id: TabId; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'restaurants', label: 'Restaurants', icon: '🍽️' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'delivery', label: 'Delivery', icon: '🚚' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'activity', label: 'Activity Logs', icon: '📋' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-14'} transition-all duration-200 bg-gray-900 flex flex-col flex-shrink-0 z-20`}>
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-gray-800">
          <span className="text-xl font-black text-red-500">FF</span>
          {sidebarOpen && <span className="text-white font-bold text-sm tracking-wide">Admin Panel</span>}
        </div>
        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors
                ${tab === item.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
        {/* Bottom */}
        <div className="p-3 border-t border-gray-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2 px-1 mb-2">
              <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-content-center text-white text-xs font-bold flex-shrink-0 flex items-center justify-center">
                {currentUser?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{currentUser?.name || 'Admin'}</p>
                <p className="text-gray-500 text-[10px] truncate">{currentUser?.email}</p>
              </div>
            </div>
          )}
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded text-xs transition-colors">
            <span>🚪</span>{sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0 z-10">
          <button onClick={() => setSidebarOpen(p => !p)} className="text-gray-500 hover:text-gray-700 p-1">
            <span className="text-lg">☰</span>
          </button>
          <h1 className="font-semibold text-gray-800 text-sm capitalize">
            {NAV.find(n => n.id === tab)?.icon} {NAV.find(n => n.id === tab)?.label}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            {onViewChange && (
              <button onClick={() => onViewChange('home')} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-3 py-1.5">
                ← Back to App
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5">
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'users' && <UsersTab />}
          {tab === 'restaurants' && <RestaurantsTab />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'delivery' && <DeliveryTab />}
          {tab === 'payments' && <PaymentsTab />}
          {tab === 'analytics' && <AnalyticsTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'activity' && <ActivityTab />}
        </main>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   DASHBOARD TAB
══════════════════════════════════════════════════════════════ */
const DashboardTab: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/admin/dashboard').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard…</div>;
  if (!data) return <div className="text-red-500 text-sm">Failed to load dashboard data.</div>;

  const ov = data.overview || {};
  const KPI_CARDS = [
    { label: 'Total Users', value: ov.totalUsers?.toLocaleString(), sub: `+${ov.newUsersToday || 0} today`, icon: '👥', color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Restaurants', value: ov.totalRestaurants?.toLocaleString(), sub: `${ov.activeRestaurants} active`, icon: '🍽️', color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Total Orders', value: ov.totalOrders?.toLocaleString(), sub: `${ov.ordersToday} today`, icon: '📦', color: '#8B5CF6', bg: '#F5F3FF' },
    { label: 'Total Revenue', value: fmt(ov.totalRevenue || 0), sub: `${ov.revenueGrowth >= 0 ? '↑' : '↓'} ${Math.abs(ov.revenueGrowth || 0)}% vs last month`, icon: '💰', color: '#10B981', bg: '#ECFDF5' },
    { label: 'Revenue Today', value: fmt(ov.revenueToday || 0), sub: `This month: ${fmt(ov.revenueThisMonth || 0)}`, icon: '📅', color: '#EF4444', bg: '#FEF2F2' },
    { label: 'Delivery Partners', value: ov.deliveryPartners?.toLocaleString(), sub: `${ov.activeDeliveries} available`, icon: '🚚', color: '#EC4899', bg: '#FDF2F8' },
  ];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {KPI_CARDS.map(card => (
          <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{card.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: card.bg }}>
                {card.icon}
              </div>
            </div>
            <p className="text-xl font-bold text-gray-800">{card.value ?? '—'}</p>
            <p className="text-[11px] mt-0.5" style={{ color: card.color }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders by Status */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Orders by Status</h3>
          <div className="space-y-2">
            {(data.ordersByStatus || []).map((s: any) => {
              const total = data.ordersByStatus.reduce((a: number, b: any) => a + b.count, 0);
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              return (
                <div key={s._id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-24 capitalize truncate">{s._id?.replace(/_/g, ' ')}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-10 text-right">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Restaurants by Revenue</h3>
          <div className="space-y-2">
            {(data.topRestaurants || []).map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                <span className="flex-1 text-sm text-gray-700 truncate">{r.name}</span>
                <span className="text-xs font-semibold text-green-600">{fmt(r.revenue)}</span>
                <span className="text-[10px] text-gray-400">{r.orderCount} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Recent Orders</h3>
          <span className="text-xs text-gray-400">Latest 8</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              {['Order#', 'Customer', 'Restaurant', 'Amount', 'Status', 'Date'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(data.recentOrders || []).map((o: AdminOrder) => (
                <tr key={o._id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs font-mono text-gray-600">#{o.orderNumber?.slice(-6)}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700">{o.customer?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{o.restaurant?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-gray-800">{fmt(o.total || 0)}</td>
                  <td className="px-4 py-2.5">{statusBadge(o.status)}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">{fmtDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Restaurants Alert */}
      {ov.pendingRestaurants > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">{ov.pendingRestaurants} restaurant{ov.pendingRestaurants > 1 ? 's' : ''} pending approval</p>
            <p className="text-xs text-amber-600 mt-0.5">Go to Restaurants tab to review and approve.</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   USERS TAB
══════════════════════════════════════════════════════════════ */
const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const data = await api(`/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (u: AdminUser) => {
    setActionLoading(u._id);
    try {
      await api(`/admin/users/${u._id}/status`, { method: 'PUT', body: JSON.stringify({ isActive: !u.isActive }) });
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isActive: !x.isActive } : x));
    } catch (err) { alert('Failed to update user'); }
    finally { setActionLoading(''); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      await api(`/admin/users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(x => x._id !== id));
      setTotal(t => t - 1);
    } catch (err) { alert('Failed to delete user'); }
  };

  const exportCSV = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE}/admin/export/users`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click();
  };

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700', customer: 'bg-blue-100 text-blue-700',
    restaurant_owner: 'bg-orange-100 text-orange-700', delivery_partner: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-wrap gap-3 items-center">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="🔍 Search name or email…"
          className="flex-1 min-w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none">
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="restaurant_owner">Restaurant Owner</option>
          <option value="delivery_partner">Delivery Partner</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Blocked</option>
        </select>
        <button onClick={exportCSV} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5">
          ⬇ Export CSV
        </button>
        <span className="text-xs text-gray-400 ml-auto">{total} users</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16 text-gray-400 text-sm">Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['User', 'Role', 'Phone', 'Wallet', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {u.role?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{u.phone || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{fmt(u.walletBalance || 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => toggleStatus(u)} disabled={actionLoading === u._id}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                          {u.isActive ? 'Block' : 'Unblock'}
                        </button>
                        <button onClick={() => deleteUser(u._id)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors font-medium">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {total > 15 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Page {page} of {Math.ceil(total / 15)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 15)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   RESTAURANTS TAB
══════════════════════════════════════════════════════════════ */
const RestaurantsTab: React.FC = () => {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [approvedFilter, setApprovedFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<AdminRestaurant[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      if (approvedFilter) params.set('approved', approvedFilter);
      const [data, pendingData] = await Promise.all([
        api(`/admin/restaurants?${params}`),
        api('/admin/restaurants/pending'),
      ]);
      setRestaurants(data.restaurants || []);
      setTotal(data.total || 0);
      setPending(pendingData.restaurants || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search, approvedFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApproval = async (id: string, isApproved: boolean) => {
    try {
      await api(`/admin/restaurants/${id}/approval`, { method: 'PUT', body: JSON.stringify({ isApproved }) });
      setPending(p => p.filter(r => r._id !== id));
      load();
    } catch (err) { alert('Failed to update restaurant'); }
  };

  const exportCSV = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE}/admin/export/restaurants`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'restaurants.csv'; a.click();
  };

  return (
    <div className="space-y-4">
      {/* Pending Approvals */}
      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex items-center gap-2">
            <span className="text-amber-600">⚠️</span>
            <h3 className="text-sm font-semibold text-amber-800">Pending Approvals ({pending.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {pending.map(r => (
              <div key={r._id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-lg flex-shrink-0">🍽️</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.owner?.name} • {r.owner?.email}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleApproval(r._id, true)}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium">✓ Approve</button>
                  <button onClick={() => handleApproval(r._id, false)}
                    className="bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200">✗ Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-wrap gap-3 items-center">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="🔍 Search restaurants…"
          className="flex-1 min-w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        <select value={approvedFilter} onChange={e => { setApprovedFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">All</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>
        <button onClick={exportCSV} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">⬇ Export CSV</button>
        <span className="text-xs text-gray-400 ml-auto">{total} restaurants</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['Restaurant', 'Owner', 'City', 'Rating', 'Status', 'Approved', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {restaurants.map(r => (
                  <tr key={r._id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-base flex-shrink-0">🍽️</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                          <p className="text-xs text-gray-400 truncate">{r.cuisine?.slice(0, 2).join(', ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{r.owner?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.address?.city || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-yellow-600">★ {(r.rating || 0).toFixed(1)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {r.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.isApproved ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      {!r.isApproved && (
                        <button onClick={() => handleApproval(r._id, true)}
                          className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium transition-colors">
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 15 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Page {page} of {Math.ceil(total / 15)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 15)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   ORDERS TAB
══════════════════════════════════════════════════════════════ */
const OrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const data = await api(`/admin/orders?${params}`);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, statusFilter, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    } catch (err) { alert('Failed to update order'); }
    finally { setUpdating(''); }
  };

  const exportCSV = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE}/admin/export/orders`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'orders.csv'; a.click();
  };

  const ORDER_STATUSES = ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-wrap gap-3 items-center">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>From</span>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none" />
          <span>To</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none" />
        </div>
        <button onClick={exportCSV} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">⬇ Export CSV</button>
        <span className="text-xs text-gray-400 ml-auto">{total} orders</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="flex justify-center py-16 text-gray-400 text-sm">Loading orders…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['Order#', 'Customer', 'Restaurant', 'Amount', 'Payment', 'Status', 'Date', 'Update Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">#{o.orderNumber?.slice(-6)}</td>
                    <td className="px-4 py-3"><div><p className="text-xs font-medium text-gray-800">{o.customer?.name}</p><p className="text-[11px] text-gray-400">{o.customer?.email}</p></div></td>
                    <td className="px-4 py-3 text-xs text-gray-600">{o.restaurant?.name}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">{fmt(o.total || 0)}</td>
                    <td className="px-4 py-3">{statusBadge(o.paymentStatus)}</td>
                    <td className="px-4 py-3">{statusBadge(o.status)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <select value={o.status} disabled={updating === o._id}
                        onChange={e => updateStatus(o._id, e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none bg-white">
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 20 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   DELIVERY TAB
══════════════════════════════════════════════════════════════ */
const DeliveryTab: React.FC = () => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'partners' | 'active'>('partners');
  const [assigning, setAssigning] = useState(false);
  const [assignForm, setAssignForm] = useState({ orderId: '', partnerId: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const [pData, aData] = await Promise.all([
        api(`/admin/delivery/partners?${params}`),
        api('/admin/delivery/active'),
      ]);
      setPartners(pData.partners || []);
      setTotal(pData.total || 0);
      setActiveOrders(aData.activeOrders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const assignDelivery = async () => {
    if (!assignForm.orderId || !assignForm.partnerId) return alert('Select order and partner');
    try {
      await api('/admin/delivery/assign', { method: 'POST', body: JSON.stringify(assignForm) });
      setAssigning(false);
      setAssignForm({ orderId: '', partnerId: '' });
      load();
      alert('Delivery partner assigned successfully!');
    } catch (err) { alert('Assignment failed'); }
  };

  return (
    <div className="space-y-4">
      {/* View Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1 border border-gray-100 w-fit">
        {[['partners', '👥 Partners'], ['active', '🛵 Active Deliveries']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v as any)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${view === v ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {view === 'partners' && (
        <>
          <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-wrap gap-3 items-center">
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="🔍 Search partners…"
              className="flex-1 min-w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
            </select>
            <button onClick={() => setAssigning(true)}
              className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
              + Assign Delivery
            </button>
            <span className="text-xs text-gray-400 ml-auto">{total} partners</span>
          </div>

          {/* Assign Modal */}
          {assigning && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-base font-bold text-gray-800 mb-4">Assign Delivery Partner</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Order ID</label>
                    <input value={assignForm.orderId} onChange={e => setAssignForm(p => ({ ...p, orderId: e.target.value }))}
                      placeholder="Paste Order ID…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Partner</label>
                    <select value={assignForm.partnerId} onChange={e => setAssignForm(p => ({ ...p, partnerId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                      <option value="">Select partner…</option>
                      {partners.filter(p => p.isAvailable && p.isActive).map(p => (
                        <option key={p._id} value={p._id}>{p.name} — {p.totalDeliveries} deliveries</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={assignDelivery} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Assign</button>
                    <button onClick={() => setAssigning(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? <div className="flex justify-center py-16 text-gray-400 text-sm">Loading…</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b border-gray-100">
                    {['Partner', 'Phone', 'Available', 'Active', 'Deliveries', 'Current Order'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {partners.map(p => (
                      <tr key={p._id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-base">🛵</div>
                            <p className="text-sm font-medium text-gray-800">{p.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{p.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.isAvailable ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {p.isAvailable ? 'Available' : 'Busy'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">{p.totalDeliveries || 0}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{p.activeOrder ? `#${p.activeOrder.orderNumber?.slice(-6)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'active' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Active Deliveries ({activeOrders.length})</h3>
            <button onClick={load} className="text-xs text-gray-500 hover:text-gray-700">🔄 Refresh</button>
          </div>
          {loading ? <div className="flex justify-center py-16 text-gray-400 text-sm">Loading…</div> : (
            <div className="divide-y divide-gray-50">
              {activeOrders.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No active deliveries</div>
              ) : activeOrders.map(o => (
                <div key={o._id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg flex-shrink-0">🚚</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-800">Order #{o.orderNumber?.slice(-6)}</p>
                      {statusBadge(o.status)}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-4">
                      <span>👤 {o.customer?.name}</span>
                      <span>🍽️ {o.restaurant?.name}</span>
                      {o.deliveryPartner && <span>🛵 {o.deliveryPartner.name}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-800">{fmt(o.total || 0)}</p>
                    <p className="text-[11px] text-gray-400">{fmtDate(o.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   PAYMENTS TAB
══════════════════════════════════════════════════════════════ */
const PaymentsTab: React.FC = () => {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<any>({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (methodFilter) params.set('method', methodFilter);
      if (search) params.set('search', search);
      const data = await api(`/admin/payments?${params}`);
      setPayments(data.payments || []);
      setTotal(data.total || 0);
      setSummary(data.summary || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, statusFilter, methodFilter, search]);

  useEffect(() => { load(); }, [load]);

  const refund = async (id: string, amount: number) => {
    if (!confirm(`Issue refund of ${fmt(amount)}?`)) return;
    try {
      await api(`/admin/payments/${id}/refund`, { method: 'POST', body: JSON.stringify({ amount, reason: 'Admin refund' }) });
      load();
      alert('Refund initiated!');
    } catch (err) { alert('Refund failed'); }
  };

  const exportCSV = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE}/admin/export/payments`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'payments.csv'; a.click();
  };

  const METHOD_ICONS: Record<string, string> = { upi: '📱', card: '💳', wallet: '👛', cod: '💵', net_banking: '🏦', google_pay: '🎯' };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { k: 'completed', label: 'Completed', icon: '✅', color: '#10B981' },
          { k: 'pending', label: 'Pending', icon: '⏳', color: '#F59E0B' },
          { k: 'failed', label: 'Failed', icon: '❌', color: '#EF4444' },
          { k: 'refunded', label: 'Refunded', icon: '↩️', color: '#6366F1' },
        ].map(s => (
          <div key={s.k} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span>{s.icon}</span>
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className="text-lg font-bold" style={{ color: s.color }}>{fmt(summary[s.k]?.total || 0)}</p>
            <p className="text-[11px] text-gray-400">{summary[s.k]?.count || 0} transactions</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-wrap gap-3 items-center">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="🔍 Transaction ID or Razorpay ID…"
          className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">All Status</option>
          {['pending', 'completed', 'failed', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">All Methods</option>
          {['upi', 'card', 'wallet', 'cod', 'net_banking'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <button onClick={exportCSV} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">⬇ Export CSV</button>
        <span className="text-xs text-gray-400 ml-auto">{total} payments</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="flex justify-center py-16 text-gray-400 text-sm">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['Transaction', 'User', 'Order', 'Method', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{p.transactionId?.slice(-12) || p._id.slice(-8)}</td>
                    <td className="px-4 py-3"><p className="text-xs font-medium text-gray-800">{p.userId?.name || '—'}</p><p className="text-[11px] text-gray-400">{p.userId?.email}</p></td>
                    <td className="px-4 py-3 text-xs text-gray-500">#{p.orderId?.orderNumber?.slice(-6) || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-gray-700">
                        {METHOD_ICONS[p.paymentMethod] || '💰'} {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-800">{fmt(p.amount)}</td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      {p.status === 'completed' && (
                        <button onClick={() => refund(p._id, p.amount)}
                          className="text-xs px-2.5 py-1 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 font-medium transition-colors">
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 20 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   ANALYTICS TAB
══════════════════════════════════════════════════════════════ */
const AnalyticsTab: React.FC = () => {
  const [period, setPeriod] = useState('7d');
  const [orderData, setOrderData] = useState<{ label: string; value: number }[]>([]);
  const [revenueData, setRevenueData] = useState<{ label: string; value: number }[]>([]);
  const [userData, setUserData] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, r, u] = await Promise.all([
        api(`/admin/analytics/orders?period=${period}`),
        api(`/admin/analytics/revenue?period=${period}`),
        api(`/admin/analytics/users?period=30d`),
      ]);
      const fmt2 = (d: string) => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      setOrderData((o.data || []).map((d: any) => ({ label: fmt2(d._id), value: d.count })));
      setRevenueData((r.data || []).map((d: any) => ({ label: fmt2(d._id), value: d.total })));
      setUserData((u.data || []).map((d: any) => ({ label: fmt2(d._id), value: d.count })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const totalOrders = orderData.reduce((a, b) => a + b.value, 0);
  const totalRevenue = revenueData.reduce((a, b) => a + b.value, 0);
  const totalUsers = userData.reduce((a, b) => a + b.value, 0);
  const sparkOrders = orderData.map(d => d.value);
  const sparkRevenue = revenueData.map(d => d.value);

  return (
    <div className="space-y-5">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Period:</span>
        {[['7d', '7 Days'], ['30d', '30 Days'], ['90d', '90 Days']].map(([v, l]) => (
          <button key={v} onClick={() => setPeriod(v)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${period === v ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20 text-gray-400">Loading analytics…</div> : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Orders</span>
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-2xl font-black text-gray-800 mb-3">{totalOrders.toLocaleString()}</p>
              <Sparkline data={sparkOrders} color="#6366F1" />
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</span>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-2xl font-black text-gray-800 mb-3">{fmt(totalRevenue)}</p>
              <Sparkline data={sparkRevenue} color="#10B981" />
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Users (30d)</span>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-2xl font-black text-gray-800 mb-3">{totalUsers.toLocaleString()}</p>
              <Sparkline data={userData.map(d => d.value)} color="#F59E0B" />
            </div>
          </div>

          {/* Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Orders Per Day</h3>
              <BarChart data={orderData.slice(-14)} color="#6366F1" height={140} />
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Revenue (₹)</h3>
              <BarChart data={revenueData.slice(-14)} color="#10B981" height={140} />
            </div>
          </div>

          {/* User Growth */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">User Registrations (Last 30 Days)</h3>
            <BarChart data={userData} color="#F59E0B" height={120} />
          </div>
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   NOTIFICATIONS TAB
══════════════════════════════════════════════════════════════ */
const NotificationsTab: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', targetRole: '' });
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/admin/notifications');
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!form.title || !form.message) return alert('Title and message required');
    setSending(true);
    try {
      await api('/admin/notifications/send', { method: 'POST', body: JSON.stringify(form) });
      setForm({ title: '', message: '', targetRole: '' });
      setShowForm(false);
      load();
    } catch (err) { alert('Failed to send'); }
    finally { setSending(false); }
  };

  const markAllRead = async () => {
    await api('/admin/notifications/read-all', { method: 'PUT' });
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const ROLE_LABELS: Record<string, string> = { customer: '👤 Customers', restaurant_owner: '🍽️ Restaurants', delivery_partner: '🚚 Delivery', admin: '👑 Admins', '': '🌐 All Users' };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700">Notifications</h2>
          {unread > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread} new</span>}
        </div>
        <div className="flex gap-2">
          {unread > 0 && <button onClick={markAllRead} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5">Mark all read</button>}
          <button onClick={() => setShowForm(p => !p)} className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            + Send Notification
          </button>
        </div>
      </div>

      {/* Send Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-red-100 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Broadcast Notification</h3>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Notification title"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            placeholder="Message body…" rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
          <select value={form.targetRole} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="">All Users</option>
            <option value="customer">Customers only</option>
            <option value="restaurant_owner">Restaurant Owners only</option>
            <option value="delivery_partner">Delivery Partners only</option>
          </select>
          <div className="flex gap-3">
            <button onClick={send} disabled={sending}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {sending ? 'Sending…' : '📤 Send Notification'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-16 text-gray-400 text-sm">Loading…</div> : notifications.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No notifications yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map(n => (
              <div key={n._id} className={`px-4 py-3 flex gap-3 ${n.read ? '' : 'bg-red-50/40'}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'bg-gray-300' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-400">{ROLE_LABELS[n.targetRole || '']}</span>
                    <span className="text-[10px] text-gray-400">Reached {n.targetCount} users</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   ACTIVITY LOGS TAB
══════════════════════════════════════════════════════════════ */
const ActivityTab: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (actionFilter) params.set('action', actionFilter);
      if (roleFilter) params.set('role', roleFilter);
      const data = await api(`/admin/activity?${params}`);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, actionFilter, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const ACTION_COLORS: Record<string, string> = {
    USER_BLOCKED: 'bg-red-100 text-red-700', USER_UNBLOCKED: 'bg-green-100 text-green-700',
    RESTAURANT_APPROVED: 'bg-blue-100 text-blue-700', RESTAURANT_REJECTED: 'bg-red-100 text-red-700',
    ORDER_STATUS_UPDATED: 'bg-purple-100 text-purple-700', PAYMENT_REFUNDED: 'bg-pink-100 text-pink-700',
    DATA_EXPORTED: 'bg-orange-100 text-orange-700', NOTIFICATION_SENT: 'bg-indigo-100 text-indigo-700',
    USER_DELETED: 'bg-red-100 text-red-800', DELIVERY_ASSIGNED: 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-wrap gap-3 items-center">
        <input value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          placeholder="🔍 Filter by action…"
          className="flex-1 min-w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
          <option value="restaurant_owner">Restaurant Owner</option>
          <option value="delivery_partner">Delivery Partner</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{total} log entries</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="flex justify-center py-16 text-gray-400 text-sm">Loading logs…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['Time', 'User', 'Role', 'Action', 'Details', 'IP'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">{log.userId?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold">{log.userRole}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                      {log.details ? JSON.stringify(log.details).replace(/[{}"]/g, '').replace(/:/g, ': ').slice(0, 80) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 30 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Page {page} of {Math.ceil(total / 30)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 30)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanelComplete;
