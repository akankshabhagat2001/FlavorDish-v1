
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Restaurant, UserType, Order, MenuItem, User } from '../types.ts';
import { adminService, restaurantService, userService } from '../services';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface AdminDashboardProps {
  onGoBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onGoBack }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'restaurants' | 'users' | 'orders' | 'fleet'>('overview');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  
  // Modal state
  const [isAddingMerchant, setIsAddingMerchant] = useState(false);
  const [merchantForm, setMerchantForm] = useState({
    name: '',
    cuisine: 'Gujarati',
    costForTwo: 500,
    address: '',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000'
  });

  const bannerInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [restaurantResponse, userResponse, orderResponse] = await Promise.all([
        restaurantService.getRestaurants({ limit: 100 }),
        userService.getUsers({ page: 1, limit: 200 }),
        adminService.getOrders({ page: 1, limit: 100 })
      ]);

      const restaurantsList = restaurantResponse?.restaurants || restaurantResponse || [];
      const usersList = userResponse?.users || userResponse || [];
      const ordersList = orderResponse?.orders || orderResponse || [];

      setRestaurants(restaurantsList);
      setUsers(usersList);
      setOrders(ordersList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Admin dashboard load error:', error);
      setRestaurants([]);
      setUsers([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMerchantForm({ ...merchantForm, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOnboardMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await restaurantService.createRestaurant({
        name: merchantForm.name,
        description: 'Newly onboarded partner',
        cuisine: [merchantForm.cuisine, 'New'],
        address: {
          street: merchantForm.address,
          city: 'Ahmedabad',
          state: 'Gujarat',
          zipCode: '380001',
          coordinates: {
            latitude: 23.0225,
            longitude: 72.5714
          }
        },
        phone: '',
        email: '',
        images: [{ url: merchantForm.imageUrl, alt: merchantForm.name }],
        costForTwo: merchantForm.costForTwo,
        deliveryFee: 40,
        minimumOrder: 100,
        isActive: true
      });
      setIsAddingMerchant(false);
      loadData();
    } catch (error) {
      console.error('Failed to onboard merchant via API:', error);
      alert('Unable to onboard merchant right now. Please try again later.');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  // Chart data
  const revenueChartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === date && order.paymentStatus === 'paid';
      });
      const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        orders: dayOrders.length
      };
    });
  }, [orders]);

  const userRoleChartData = useMemo(() => {
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(roleCounts).map(([role, count]) => ({
      role: role === 'restaurant' ? 'Merchant' : role === 'delivery' ? 'Fleet' : role === 'customer' ? 'Diner' : role.charAt(0).toUpperCase() + role.slice(1),
      count,
      fill: role === 'admin' ? '#8B5CF6' : role === 'restaurant' ? '#3B82F6' : role === 'delivery' ? '#F59E0B' : '#10B981'
    }));
  }, [users]);

  const orderStatusChartData = useMemo(() => {
    const statusCounts = orders.reduce((acc, order) => {
      const status = order.orderStatus || 'placed';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      fill: status === 'delivered' ? '#10B981' : status === 'preparing' ? '#F59E0B' : status === 'out_for_delivery' ? '#3B82F6' : '#EF4444'
    }));
  }, [orders]);

  const getRoleBadge = (role: UserType) => {
    const roles: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      restaurant: 'bg-blue-100 text-blue-700 border-blue-200',
      delivery: 'bg-orange-100 text-orange-700 border-orange-200',
      customer: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    return (
      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${roles[role] || 'bg-gray-100 text-gray-700'}`}>
        {role === 'restaurant' ? 'Merchant' : role === 'delivery' ? 'Fleet' : role === 'customer' ? 'Diner' : role}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <aside className="w-80 bg-[#121214] text-white flex flex-col fixed h-full z-[1300] shadow-2xl">
        <div className="p-10 border-b border-white/5">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-[#EF4F5F] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#EF4F5F]/40 border border-white/10">
              <i className="fa-solid fa-shield-halved text-white text-xl"></i>
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic leading-none">flavorfinder</h1>
          </div>
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-[4px] mt-4 ml-1">Admin Command</p>
        </div>
        
        <nav className="flex-1 py-12 px-6 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: 'fa-chart-line' },
            { id: 'users', label: 'User Governance', icon: 'fa-users-gear' },
            { id: 'restaurants', label: 'Merchant Hub', icon: 'fa-store' },
            { id: 'orders', label: 'Live Operations', icon: 'fa-truck-fast' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`w-full flex items-center gap-5 px-6 py-4 rounded-[20px] transition-all group ${
                activeSection === item.id 
                  ? 'bg-[#EF4F5F] text-white shadow-2xl shadow-[#EF4F5F]/30' 
                  : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-lg`}></i>
              <span className="text-[11px] font-black tracking-tight uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={onGoBack} className="w-full flex items-center justify-center gap-3 text-gray-500 hover:text-[#EF4F5F] text-[10px] font-black uppercase tracking-[3px] transition-all py-3 hover:bg-[#EF4F5F]/5 rounded-2xl">
            <i className="fa-solid fa-right-from-bracket"></i> Marketplace
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-80 p-12 min-h-screen">
        <header className="mb-16 flex justify-between items-end">
          <div>
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter capitalize">{activeSection.replace('_', ' ')}</h2>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-[2px] mt-2 ml-1">Authority Management Panel</p>
          </div>
        </header>

        {/* Fix: Changed activeTab to activeSection to correctly reference the state variable */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-users text-xl"></i>
                  </div>
                  <span className="text-emerald-500 text-xs font-black uppercase tracking-widest">+12%</span>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-1">{users.length}</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Users</p>
              </div>

              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-store text-xl"></i>
                  </div>
                  <span className="text-blue-500 text-xs font-black uppercase tracking-widest">+8%</span>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-1">{restaurants.length}</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Active Merchants</p>
              </div>

              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-truck-fast text-xl"></i>
                  </div>
                  <span className="text-orange-500 text-xs font-black uppercase tracking-widest">+15%</span>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-1">{orders.length}</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Orders</p>
              </div>

              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-indian-rupee-sign text-xl"></i>
                  </div>
                  <span className="text-purple-500 text-xs font-black uppercase tracking-widest">+22%</span>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-1">₹{orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Revenue</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Chart */}
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-6">Revenue Trend (30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#EF4F5F"
                      strokeWidth={3}
                      dot={{ fill: '#EF4F5F', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#EF4F5F', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* User Roles Chart */}
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-6">User Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userRoleChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {userRoleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Order Status Chart */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-6">Order Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orderStatusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="status" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {orderStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeSection === 'restaurants' && (
           <div className="space-y-6">
             <div className="flex justify-between items-center bg-[#121214] p-8 rounded-[32px]">
               <div className="text-white">
                  <h3 className="text-xl font-black tracking-tight">Merchant Governance</h3>
                  <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Global partner network</p>
               </div>
               <button onClick={() => setIsAddingMerchant(true)} className="bg-[#EF4F5F] text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">Onboard New Merchant</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {restaurants.map(res => (
                  <div key={res._id} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 group">
                     <img src={res.imageUrl} className="w-full h-48 rounded-[28px] object-cover mb-6 shadow-md" alt="" />
                     <h4 className="text-2xl font-black text-gray-900 tracking-tight">{res.name}</h4>
                     <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(res.name + ' ' + res.location.address)}`} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6 hover:text-[#EF4F5F] hover:underline transition-colors mt-1">
                       {res.location.address}
                       <i className="fa-solid fa-arrow-up-right-from-square ml-1 opacity-70 text-[8px]"></i>
                     </a>
                  </div>
                ))}
             </div>
           </div>
        )}

        {isAddingMerchant && (
          <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddingMerchant(false)}></div>
            <div className="relative bg-white w-full max-w-xl rounded-[40px] p-10 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
              <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Onboard Merchant</h2>
              <form onSubmit={handleOnboardMerchant} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Store Banner</label>
                  <div 
                    onClick={() => bannerInputRef.current?.click()}
                    className="w-full h-44 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-[#EF4F5F] transition-all overflow-hidden relative group"
                  >
                    {merchantForm.imageUrl ? (
                      <>
                        <img src={merchantForm.imageUrl} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <p className="text-white font-black text-xs uppercase tracking-widest">Change Banner</p>
                        </div>
                      </>
                    ) : (
                      <i className="fa-solid fa-image text-3xl text-gray-200"></i>
                    )}
                  </div>
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                </div>
                <input type="text" placeholder="Restaurant Name" className="w-full px-6 py-4 bg-gray-50 border-transparent border-2 focus:border-[#EF4F5F] rounded-2xl outline-none font-bold" required value={merchantForm.name} onChange={e => setMerchantForm({...merchantForm, name: e.target.value})} />
                <input type="text" placeholder="Cuisine (e.g. Italian, Thai)" className="w-full px-6 py-4 bg-gray-50 border-transparent border-2 focus:border-[#EF4F5F] rounded-2xl outline-none font-bold" required value={merchantForm.cuisine} onChange={e => setMerchantForm({...merchantForm, cuisine: e.target.value})} />
                <button className="w-full bg-[#EF4F5F] text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl">Confirm Onboarding</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
