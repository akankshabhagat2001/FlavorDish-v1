
import React, { useState, useEffect, useRef } from 'react';
import { Restaurant, Order, UserType, MenuItem, Booking } from '../types.ts';
import { db } from '../database/db.ts';
import { paymentService, restaurantService, foodService, orderService } from '../services';

interface PartnerDashboardProps {
  currentUser: { _id: string; name: string; role: UserType };
  onLogout: () => void;
  onPreviewSite?: () => void;
}

const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ currentUser, onLogout, onPreviewSite }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'reservations' | 'menu' | 'profile'>('orders');
  const [availablePayout, setAvailablePayout] = useState<number>(0);
  
  // Menu Management State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    itemName: '',
    price: 0,
    description: '',
    category: 'Main Course',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
  });

  // Profile Management State
  const [profileForm, setProfileForm] = useState({
    description: '',
    cuisine: '',
    costForTwo: 0,
    deliveryTime: '',
    contactPhone: '',
    openingHours: '',
    tablePrice: 0,
    chairPrice: 0,
    signatureDishName: '',
    signatureDishImage: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);

  const normalizeMenuItem = (raw: any): MenuItem => ({
    _id: raw?._id || '',
    restaurantId: raw?.restaurant?._id || raw?.restaurant || raw?.restaurantId || '',
    itemName: raw?.name || raw?.itemName || 'Dish',
    name: raw?.name || raw?.itemName || 'Dish',
    description: raw?.description || '',
    price: raw?.price || 0,
    category: raw?.category || raw?.subcategory || raw?.categoryId || 'Main',
    isAvailable: raw?.isAvailable ?? raw?.available ?? true,
    isVeg: raw?.isVeg ?? true,
    prepTime: raw?.prepTime || raw?.preparationTime || raw?.prepariationTime || '',
    nutritionalInfo: typeof raw?.nutritionalInfo === 'string' ? raw.nutritionalInfo : raw?.nutritionalInfo?.notes ? raw.nutritionalInfo.notes : raw?.nutritionalInfo ? `Calories: ${raw.nutritionalInfo.calories || 0}, Protein: ${raw.nutritionalInfo.protein || 0}` : '',
    tags: Array.isArray(raw?.tags) ? raw.tags : raw?.tags?.split?.(',').map((t: string) => t.trim()) || [],
    image: raw?.image || raw?.images?.[0]?.url || raw?.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
  });

  const loadData = async () => {
    setLoading(true);

    try {
      // 1. Fetch restaurant from backend
      const myRestaurantsResponse = await restaurantService.getMyRestaurants();
      const myRestaurants = myRestaurantsResponse?.restaurants || myRestaurantsResponse || [];
      let myRes = myRestaurants.find((r: Restaurant) => r.ownerId === currentUser._id);
      if (!myRes && myRestaurants.length > 0) {
        myRes = myRestaurants[0];
      }

      // Wait, skipping local DB record if API fails. We ONLY use API.

      if (!myRes) {
        setLoading(false);
        return;
      }

      setRestaurant(myRes);

      setProfileForm({
        description: myRes.description || '',
        cuisine: Array.isArray(myRes.cuisine) ? myRes.cuisine.join(', ') : (myRes.cuisine || ''),
        costForTwo: myRes.costForTwo || 0,
        deliveryTime: myRes.deliveryTime || '',
        contactPhone: myRes.contactPhone || '',
        openingHours: myRes.openingHours || '',
        tablePrice: myRes.tablePrice || 0,
        chairPrice: myRes.chairPrice || 0,
        signatureDishName: myRes.signatureDish?.name || '',
        signatureDishImage: myRes.signatureDish?.imageUrl || ''
      });

      // 2. Get orders from backend for that restaurant
      let myOrders: any[] = [];
      try {
        const orderResponse = await orderService.getRestaurantOrders({ page: 1, limit: 50 });
        myOrders = orderResponse.orders || [];
      } catch (e) {
        console.error('Failed to fetch restaurant orders from API', e);
      }

      // 3. Get menu items from backend
      let menu: any[] = [];
      try {
        const menuResponse = await restaurantService.getRestaurantMenu(myRes._id);
        const rawMenu = menuResponse.menu || menuResponse || [];
        menu = Array.isArray(rawMenu) ? rawMenu.map(normalizeMenuItem) : [];
      } catch (e) {
        console.error('Failed to fetch menu from API', e);
      }

      const sortedOrders = myOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(sortedOrders);
      setBookings([]); // Local booking removed to rely on API directly
      setMenuItems(menu);

      // Calculate pending partner payout by 10-day policy and fee structure
      const payoutRealtime = sortedOrders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => {
          const amount = o.total || o.totalAmount || 0;
          const restaurantShare = Math.max(0, Math.round(amount * 0.92));
          return sum + restaurantShare;
        }, 0);
      setAvailablePayout(payoutRealtime);

    } catch (error) {
      console.error('Partner dashboard load error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Return empty teardown instead of local db.orders.subscribe
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemForm({ ...itemForm, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, signatureDishImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !itemForm.itemName || itemForm.price <= 0) {
      alert('Please fill in all required fields correctly');
      return;
    }

    try {
      const foodData = {
        name: itemForm.itemName,
        description: itemForm.description,
        price: itemForm.price,
        category: itemForm.category,
        subcategory: itemForm.category,
        restaurant: restaurant._id,
        images: [{ url: itemForm.image, alt: itemForm.itemName }],
        isVeg: itemForm.isVeg,
        isAvailable: true,
        preparationTime: 20
      };

      try {
        await foodService.createFood({...foodData, cuisine: foodData.subcategory});
      } catch (apiError) {
        console.error('API add item failed', apiError);
        alert('Failed to add item to menu.');
        return;
      }

      // Show success popup
      alert(`✅ Menu Added!\n"${itemForm.itemName}" has been added to your menu.`);
      
      // Reset form and close modal
      setIsAddingItem(false);
      setItemForm({
        itemName: '',
        price: 0,
        description: '',
        category: 'Main Course',
        isVeg: true,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
      });
      
      // Reload menu
      await loadData();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('❌ Error adding menu item. Please try again.');
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !restaurant || !itemForm.itemName || itemForm.price <= 0) {
      alert('Please fill in all required fields correctly');
      return;
    }

    try {
      const foodUpdate = {
        name: itemForm.itemName,
        description: itemForm.description,
        price: itemForm.price,
        category: itemForm.category,
        images: [{ url: itemForm.image, alt: itemForm.itemName }],
        isVeg: itemForm.isVeg
      };

      try {
        await foodService.updateFood(editingItem._id, foodUpdate);
      } catch (apiError) {
        console.error('API update item failed', apiError);
        alert('Failed to update menu item.');
        return;
      }

      // Show success message
      alert(`✅ Menu Updated!\n"${itemForm.itemName}" has been updated successfully.`);
      
      setEditingItem(null);
      setItemForm({
        itemName: '',
        price: 0,
        description: '',
        category: 'Main Course',
        isVeg: true,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
      });
      
      await loadData();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('❌ Error updating menu item. Please try again.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Permanently remove this dish from the marketplace?')) return;

    try {
      await foodService.deleteFood(id);
    } catch (apiError) {
      console.error('API delete item failed', apiError);
    }

    loadData();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    const cuisines = profileForm.cuisine.split(',').map(c => c.trim()).filter(c => c);

    // Directly update using API instead of local DB
    try {
      await restaurantService.updateRestaurant(restaurant._id, {
        description: profileForm.description,
        cuisine: cuisines,
        costForTwo: profileForm.costForTwo,
        deliveryTime: profileForm.deliveryTime,
        contactPhone: profileForm.contactPhone,
        openingHours: profileForm.openingHours,
        tablePrice: profileForm.tablePrice,
        chairPrice: profileForm.chairPrice,
        signatureDish: {
          name: profileForm.signatureDishName,
          imageUrl: profileForm.signatureDishImage
        }
      });
      alert("Business profile updated successfully!");
      loadData();
    } catch (error) {
      console.error('Failed to update restaurant profile', error);
      alert('Failed to update profile. Please try again later.');
    }
  };

    // await bookingService.updateStatus if it exists, skipping local db.updateBookingStatus
    // loadData();

  const handleReleasePayout = async () => {
    if (!restaurant) return;

    // For local demo, mark payout as released by zeroing out availablePayout
    setAvailablePayout(0);
    alert(`Payout of ₹${Math.round(availablePayout)} released to ${restaurant.name}.`);

    // (Optional) if connected to backed server: release via API
    try {
      await paymentService.releaseRestaurant(orders[0]?._id || '');
    } catch (e) {
      console.warn('Backend payout route may not exist yet', e);
    }
  };

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-[#EF4F5F]"></i>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col fixed h-full z-[100] shadow-sm">
        <div className="p-8 border-b border-gray-50 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EF4F5F] rounded-xl flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-store"></i></div>
          <span className="text-xl font-black text-gray-900 tracking-tighter italic leading-none">partnerhub</span>
        </div>
        <div className="p-6 flex-1 space-y-2">
          {[
            { id: 'orders', icon: 'fa-receipt', label: 'Orders' },
            { id: 'reservations', icon: 'fa-calendar-check', label: 'Bookings' },
            { id: 'menu', icon: 'fa-utensils', label: 'Manage Menu' },
            { id: 'profile', icon: 'fa-id-card', label: 'Store Profile' }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)} 
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${activeTab === item.id ? 'bg-[#EF4F5F]/5 text-[#EF4F5F]' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            >
              <i className={`fa-solid ${item.icon} text-sm ${activeTab === item.id ? 'text-[#EF4F5F]' : 'text-gray-300 group-hover:text-gray-500'}`}></i>
              <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
          <button onClick={onPreviewSite} className="w-full flex items-center gap-4 p-4 mt-8 rounded-2xl bg-gray-900 text-white shadow-lg hover:scale-105 transition-all">
             <i className="fa-solid fa-eye text-sm"></i>
             <span className="text-[10px] font-black uppercase tracking-widest">Public Site</span>
          </button>
        </div>
        <div className="p-6 border-t border-gray-50">
          <button onClick={onLogout} className="w-full py-3 text-gray-400 hover:text-red-500 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"><i className="fa-solid fa-power-off"></i> Logout</button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-12">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">{restaurant.name}</h1>
            <p className="text-gray-400 font-bold uppercase tracking-[2px] text-[10px] mt-1">Merchant Hub • {activeTab}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Merchant Wallet</p>
            <div className="text-2xl font-black text-[#EF4F5F]">₹{Math.round(availablePayout)}</div>
            <button onClick={handleReleasePayout} className="mt-2 px-3 py-2 bg-[#EF4F5F] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 transition">Release Now</button>
          </div>
          {activeTab === 'menu' && (
            <button onClick={() => { setIsAddingItem(true); setItemForm({ itemName: '', price: 100, description: '', category: 'Main Course', isVeg: true, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500' }); }} className="bg-[#EF4F5F] text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#EF4F5F]/20 hover:scale-105 transition-all">
              Add New Dish
            </button>
          )}
        </header>

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[40px] border border-gray-100">
                <i className="fa-solid fa-receipt text-4xl text-gray-100 mb-4 block"></i>
                <p className="text-gray-400 font-bold uppercase tracking-widest">Waiting for orders...</p>
              </div>
            ) : (
              orders.map(o => (
                <div key={o._id} className="bg-white p-8 rounded-[40px] border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300"><i className="fa-solid fa-receipt text-xl"></i></div>
                    <div>
                      <h4 className="font-black text-gray-900 text-lg">Order #{o._id.slice(0, 6)}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total: ₹{o.totalAmount} • {o.items.length} Items</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${o.orderStatus === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                    {o.orderStatus.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="space-y-6">
            {bookings.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[40px] border border-gray-100">
                <i className="fa-solid fa-calendar-check text-4xl text-gray-100 mb-4 block"></i>
                <p className="text-gray-400 font-bold uppercase tracking-widest">No active bookings</p>
              </div>
            ) : (
              bookings.map(b => (
                <div key={b._id} className="bg-white p-8 rounded-[40px] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300"><i className="fa-solid fa-user-group text-xl"></i></div>
                    <div>
                      <h4 className="font-black text-gray-900 text-lg">{b.guests} Guests</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{b.bookingDate} at {b.bookingTime} • Total: ₹{b.totalAmount || 0}</p>
                      {b.specialRequests && (
                        <p className="text-xs text-gray-500 mt-2 italic">"{b.specialRequests}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${b.bookingStatus === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : b.bookingStatus === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                      {b.bookingStatus}
                    </span>
                    {b.bookingStatus !== 'cancelled' && (
                      <div className="flex gap-2">
                        {b.bookingStatus === 'pending' && (
                          <button onClick={() => handleUpdateBookingStatus(b._id, 'confirmed')} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">Confirm</button>
                        )}
                        <button onClick={() => handleUpdateBookingStatus(b._id, 'cancelled')} className="bg-white border border-red-100 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuItems.map(item => {
              const title = item.itemName || item.name || 'Dish';
              const rawImages = (item as any).images;
              const imageUrl = item.image || rawImages?.[0]?.url || rawImages?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

              return (
                <div key={item._id} className="bg-white p-6 rounded-[32px] border border-gray-100 group hover:shadow-2xl transition-all relative overflow-hidden">
                  <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'} shadow-sm border-2 border-white`}></div>
                  <img src={imageUrl} className="w-full h-40 rounded-2xl object-cover mb-4" alt={title} />
                  <h4 className="text-xl font-black text-gray-900 mb-1">{title}</h4>
                  <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  {item.prepTime && <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Prep: {item.prepTime}</p>}
                  {item.nutritionalInfo && <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">{item.nutritionalInfo}</p>}
                  {item.tags?.length ? <p className="text-[10px] text-gray-500 mb-3">Tags: {item.tags.join(', ')}</p> : null}
                  <p className="text-lg font-black text-[#EF4F5F] mb-4">₹{item.price}</p>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingItem(item);
                      setItemForm({
                        itemName: item.itemName,
                        price: item.price,
                        description: item.description,
                        category: item.category,
                        isVeg: !!item.isVeg,
                        image: item.image
                      });
                    }} className="flex-1 bg-gray-50 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100">Edit</button>
                    <button onClick={() => handleDeleteItem(item._id)} className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-4xl bg-white p-12 rounded-[48px] border border-gray-100 shadow-sm animate-fade-in">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Store Profile</h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Manage public business details</p>
              </div>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Business Description</label>
                    <textarea 
                      value={profileForm.description} 
                      onChange={e => setProfileForm({...profileForm, description: e.target.value})} 
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] focus:bg-white outline-none font-bold min-h-[140px] transition-all" 
                      placeholder="Tell customers about your kitchen's history, vibe, and specialties..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Cuisines (Comma Separated)</label>
                    <input 
                      type="text" 
                      value={profileForm.cuisine} 
                      onChange={e => setProfileForm({...profileForm, cuisine: e.target.value})} 
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] focus:bg-white outline-none font-bold transition-all" 
                      placeholder="e.g. Italian, Continental, North Indian"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Avg. Cost for Two (₹)</label>
                      <input 
                        type="number" 
                        value={profileForm.costForTwo} 
                        onChange={e => setProfileForm({...profileForm, costForTwo: parseInt(e.target.value) || 0})} 
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] focus:bg-white outline-none font-bold transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Avg. Delivery Time</label>
                      <input 
                        type="text" 
                        value={profileForm.deliveryTime} 
                        onChange={e => setProfileForm({...profileForm, deliveryTime: e.target.value})} 
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] focus:bg-white outline-none font-bold transition-all"
                        placeholder="e.g. 35 min"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Contact Phone Number</label>
                    <input 
                      type="tel" 
                      value={profileForm.contactPhone} 
                      onChange={e => setProfileForm({...profileForm, contactPhone: e.target.value})} 
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] focus:bg-white outline-none font-bold transition-all"
                      placeholder="+91 99999 00000"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Opening Hours</label>
                    <input 
                      type="text" 
                      value={profileForm.openingHours} 
                      onChange={e => setProfileForm({...profileForm, openingHours: e.target.value})} 
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] focus:bg-white outline-none font-bold transition-all"
                      placeholder="e.g. 11:00 AM - 11:00 PM"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Table Price (₹)</label>
                      <input 
                        type="number" 
                        value={profileForm.tablePrice} 
                        onChange={e => setProfileForm({...profileForm, tablePrice: parseInt(e.target.value) || 0})} 
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] focus:bg-white outline-none font-bold transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Chair Price (₹)</label>
                      <input 
                        type="number" 
                        value={profileForm.chairPrice} 
                        onChange={e => setProfileForm({...profileForm, chairPrice: parseInt(e.target.value) || 0})} 
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] focus:bg-white outline-none font-bold transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-8 bg-[#FFF9FA] rounded-[32px] border-2 border-[#EF4F5F]/5">
                    <label className="text-[10px] font-black text-[#EF4F5F] uppercase tracking-widest mb-4 block">Signature Dish Spotlight</label>
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        value={profileForm.signatureDishName} 
                        onChange={e => setProfileForm({...profileForm, signatureDishName: e.target.value})} 
                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-100 outline-none font-bold text-sm shadow-sm focus:border-[#EF4F5F]" 
                        placeholder="What's your star dish?"
                      />
                      <div 
                        onClick={() => signatureFileInputRef.current?.click()}
                        className="relative w-full h-32 bg-white rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-[#EF4F5F] transition-all overflow-hidden group shadow-sm"
                      >
                        {profileForm.signatureDishImage ? (
                          <>
                            <img src={profileForm.signatureDishImage} className="w-full h-full object-cover" alt="Signature Preview" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-white font-black text-[8px] uppercase tracking-widest">Update Photo</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <i className="fa-solid fa-camera text-gray-300 mb-1"></i>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Signature Dish Photo</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          ref={signatureFileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleSignatureFileChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-gray-50 flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => loadData()}
                  className="px-8 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                >
                  Discard Changes
                </button>
                <button 
                  type="submit" 
                  className="bg-[#EF4F5F] text-white px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-[#EF4F5F]/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Save Business Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {(isAddingItem || editingItem) && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsAddingItem(false); setEditingItem(null); }}></div>
            <div className="relative bg-white w-full max-w-xl rounded-[48px] p-10 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
              <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">{editingItem ? 'Edit Dish' : 'Add New Dish'}</h2>
              <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-6">
                
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Dish Presentation</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full h-48 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#EF4F5F] hover:bg-[#FFF4F5] transition-all group overflow-hidden"
                  >
                    {itemForm.image ? (
                      <>
                        <img src={itemForm.image} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <p className="text-white font-black text-xs uppercase tracking-widest">Change Photo</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-cloud-arrow-up text-3xl text-gray-300 group-hover:text-[#EF4F5F] mb-3"></i>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#EF4F5F]">Upload Image</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Dish Name</label>
                  <input type="text" value={itemForm.itemName} onChange={e => setItemForm({...itemForm, itemName: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] outline-none font-bold" required />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Price (₹)</label>
                    <input type="number" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: parseInt(e.target.value) || 0})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] outline-none font-bold" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                    <select value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] outline-none font-bold appearance-none">
                      <option>Main Course</option>
                      <option>Starters</option>
                      <option>Desserts</option>
                      <option>Beverages</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] outline-none font-bold min-h-[80px]" placeholder="Describe your dish (optional)" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <input 
                    type="checkbox" 
                    checked={itemForm.isVeg} 
                    onChange={e => setItemForm({...itemForm, isVeg: e.target.checked})} 
                    className="w-5 h-5 cursor-pointer"
                  />
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer flex-1">Vegetarian</label>
                  <div className={`w-4 h-4 rounded-full ${itemForm.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                </div>

                <button type="submit" className="w-full bg-[#EF4F5F] text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-[#EF4F5F]/20 hover:scale-105 active:scale-95 transition-all">{editingItem ? 'Update Dish' : 'Add Dish to Menu'}</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PartnerDashboard;
