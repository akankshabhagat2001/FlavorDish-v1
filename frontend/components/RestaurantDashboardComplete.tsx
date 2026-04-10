import React, { useState, useEffect, useRef } from 'react';
import { User, Restaurant, MenuItem, Order } from '../types';
import { db } from '../database/db.ts';
import { foodService, orderService, restaurantService } from '../services';

interface RestaurantDashboardCompleteProps {
  currentUser: User;
  onLogout: () => void;
  onViewChange?: (view: string) => void;
}

const RestaurantDashboardComplete: React.FC<RestaurantDashboardCompleteProps> = ({ 
  currentUser, 
  onLogout,
  onViewChange 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'orders' | 'earnings' | 'settings'>('overview');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    itemName: '',
    sku: '',
    description: '',
    price: 0,
    category: '',
    isAvailable: true,
    isVeg: true,
    prepTime: '',
    nutritionalInfo: '',
    protein: 0,
    calories: 0,
    tags: '',
    image: 'https://via.placeholder.com/400x250.png?text=Upload+Image'
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [priceSize, setPriceSize] = useState<'all' | 'budget' | 'mid' | 'premium'>('all');
  const [loadError, setLoadError] = useState<string>('');
  const [showAuditLog, setShowAuditLog] = useState<boolean>(true);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const normalizeRestaurant = (raw: any): Restaurant => ({
    _id: raw?._id || '',
    ownerId: raw?.ownerId || raw?.owner?._id || raw?.owner || '',
    name: raw?.name || 'Restaurant',
    description: raw?.description || '',
    cuisine: Array.isArray(raw?.cuisine) ? raw.cuisine : [],
    location: {
      address: raw?.address?.street ? `${raw.address.street}, ${raw.address.city || ''}` : (raw?.location?.address || ''),
      latitude: raw?.address?.coordinates?.latitude || raw?.location?.latitude || 23.0225,
      longitude: raw?.address?.coordinates?.longitude || raw?.location?.longitude || 72.5714,
    },
    rating: raw?.rating || 0,
    isOpen: raw?.isOpen ?? true,
    imageUrl: raw?.imageUrl || raw?.image || raw?.images?.[0]?.url || '',
    deliveryTime: raw?.deliveryTime || '30 min',
    costForTwo: raw?.costForTwo || 0,
    createdAt: raw?.createdAt ? new Date(raw.createdAt).getTime() : Date.now(),
  });

  const formatNutritionalInfo = (raw: any): string => {
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') {
      const parts: string[] = [];
      if (raw.calories) parts.push(`Calories: ${raw.calories}`);
      if (raw.protein) parts.push(`Protein: ${raw.protein}${typeof raw.protein === 'number' ? 'g' : ''}`);
      if (raw.carbs) parts.push(`Carbs: ${raw.carbs}g`);
      if (raw.fat) parts.push(`Fat: ${raw.fat}g`);
      if (raw.notes) parts.push(raw.notes);
      return parts.join(', ');
    }
    return '';
  };

  const normalizeMenuItem = (raw: any): MenuItem => ({
    _id: raw?._id || '',
    restaurantId: raw?.restaurant?._id || raw?.restaurant || raw?.restaurantId || '',
    itemName: raw?.name || raw?.itemName || 'Item',
    name: raw?.name || raw?.itemName || 'Item',
    sku: raw?.sku || raw?.itemCode || '',
    description: raw?.description || '',
    price: raw?.price || 0,
    category: raw?.category || raw?.subcategory || raw?.categoryId || 'Main',
    isAvailable: raw?.isAvailable ?? raw?.available ?? true,
    available: raw?.isAvailable ?? raw?.available ?? true,
    isVeg: raw?.isVeg ?? (raw?.categoryId ? raw.categoryId === 'veg' : true),
    prepTime: raw?.prepTime || raw?.preparationTime || raw?.prepariationTime || '',
    nutritionalInfo: formatNutritionalInfo(raw?.nutritionalInfo) || formatNutritionalInfo({ calories: raw?.calories, protein: raw?.protein, notes: raw?.nutritionalInfo }),
    tags: Array.isArray(raw?.tags) ? raw?.tags : raw?.tags?.split?.(',').map((t: string) => t.trim()) || [],
    image: raw?.image || raw?.images?.[0]?.url || raw?.images?.[0] || 'https://via.placeholder.com/150',
    updatedAt: raw?.updatedAt || Date.now(),
  });

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
  });

  useEffect(() => {
    const loadData = async () => {
        let userRestaurant = null;
        try {
          const myRestaurantsResponse = await restaurantService.getMyRestaurants();
          const myRestaurants = myRestaurantsResponse?.restaurants || [];
          userRestaurant = myRestaurants[0];

          if (!userRestaurant && currentUser?.restaurantId) {
            const restaurantResponse = await restaurantService.getRestaurantById(currentUser.restaurantId);
            userRestaurant = restaurantResponse?.restaurant || null;
          }
        } catch (err) {
          console.warn('API get restaurants failed', err);
        }

        if (!userRestaurant) {
          setLoadError('Restaurant not found. Please ensure you are logged in as a restaurant owner and your restaurant is configured.');
          setRestaurant(null);
          setMenuItems([]);
          setOrders([]);
          return;
        }

        const normalizedRestaurant = normalizeRestaurant(userRestaurant);
        setRestaurant(normalizedRestaurant);

        try {
          const [menuResponse, ordersResponse] = await Promise.all([
            restaurantService.getRestaurantMenu(normalizedRestaurant._id),
            orderService.getRestaurantOrders({ page: 1, limit: 200 }),
          ]);
          const rawMenu = (menuResponse as any)?.menu || menuResponse || [];
          setMenuItems((Array.isArray(rawMenu) ? rawMenu : []).map(normalizeMenuItem));
          setOrders((ordersResponse?.orders || []).map(normalizeOrder));
        } catch (err) {
          console.warn('API menu/orders load failed', err);
        }

        const storedLog = localStorage.getItem('partner_audit_log');
        if (storedLog) {
          try {
            setAuditLog(JSON.parse(storedLog));
          } catch {}
        }
    };
    loadData();
  }, [currentUser._id]);

  const resetMenuForm = () => {
    setEditingMenuItem(null);
    setMenuForm({
      itemName: '',
      sku: '',
      description: '',
      price: 0,
      category: '',
      isAvailable: true,
      isVeg: true,
      prepTime: '',
      nutritionalInfo: '',
      protein: 0,
      calories: 0,
      tags: '',
      image: 'https://via.placeholder.com/400x250.png?text=Upload+Image'
    });
  };

  const handleMenuImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use object URL if file is large, otherwise base64 for portability.
    if (file.size > 200_000) {
      const url = URL.createObjectURL(file);
      setMenuForm(prev => {
        appendAudit(`Uploaded large image for ${prev.itemName || 'new item'} (using object URL)`);
        return { ...prev, image: url };
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMenuForm(prev => {
        appendAudit(`Uploaded image for ${prev.itemName || 'new item'} (base64)`);
        return { ...prev, image: reader.result as string };
      });
    };
    reader.readAsDataURL(file);
  };

  const refreshMenu = async (restaurantId: string) => {
    try {
      const menuResponse = await restaurantService.getRestaurantMenu(restaurantId);
      const rawMenu = (menuResponse as any)?.menu || menuResponse || [];
      setMenuItems((Array.isArray(rawMenu) ? rawMenu : []).map(normalizeMenuItem));
    } catch (err) {
      console.warn('API menu refresh failed', err);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    const text = await file.text();
    const rows = text.split('\n').filter(row => row.trim());
    if (rows.length <= 1) return;

    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    const imported: MenuItem[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',').map(c => c.trim());
      const item: any = {
        restaurantId: restaurant._id,
        itemName: '',
        sku: '',
        description: '',
        price: 0,
        category: 'Main',
        isAvailable: true,
        isVeg: true,
        prepTime: '',
        nutritionalInfo: '',
        tags: [],
        image: 'https://via.placeholder.com/400x250.png?text=Menu+Image',
        updatedAt: Date.now()
      };

      headers.forEach((header, idx) => {
        const value = cols[idx] || '';
        if (header === 'name' || header === 'itemname') item.itemName = value;
        if (header === 'sku') item.sku = value;
        if (header === 'description') item.description = value;
        if (header === 'price') item.price = Number(value) || 0;
        if (header === 'category') item.category = value;
        if (header === 'isavailable') item.isAvailable = /true/i.test(value);
        if (header === 'isveg') item.isVeg = /true/i.test(value);
        if (header === 'preptime') item.prepTime = value;
        if (header === 'nutritionalinfo') item.nutritionalInfo = value;
        if (header === 'tags') item.tags = value.split(';').map((t: string) => t.trim()).filter((t: string) => t);
      });

      imported.push(item);
    }

    const dbMenu = (db as any).menuItems;
    for (const item of imported) {
      try {
        await foodService.createFood({
          name: item.itemName,
          description: item.description,
          price: item.price,
          category: item.category || 'General',
          cuisine: item.category || 'General',
          images: [{ url: item.image, alt: item.itemName }],
          isAvailable: item.isAvailable,
          isVeg: item.isVeg,
          preparationTime: Number(item.prepTime) || Number(item.preparationTime) || 20,
          nutritionalInfo: item.nutritionalInfo ? { notes: item.nutritionalInfo } : undefined,
          tags: item.tags,
          restaurant: restaurant._id
        });
      } catch (apiError) {
        console.warn('CSV import item failed', apiError);
      }
    }

    appendAudit(`Imported ${imported.length} menu items via CSV`);
    await refreshMenu(restaurant._id);
  };

  const handleSaveMenuItem = async () => {
    if (!restaurant) {
      alert('Restaurant not loaded. Please try again.');
      return;
    }

    // Validate required fields
    const errors: string[] = [];
    if (!menuForm.itemName || menuForm.itemName.trim() === '') errors.push('Dish Name is required');
    if (menuForm.price <= 0) errors.push('Price must be greater than 0');
    if (!menuForm.category || menuForm.category.trim() === '') errors.push('Category is required');
    if (!menuForm.description || menuForm.description.trim() === '') errors.push('Description is required');

    if (errors.length > 0) {
      alert('Please fill in all required fields:\n\n' + errors.map(e => '✗ ' + e).join('\n'));
      return;
    }

    const caloriesValue = menuForm.calories || undefined;
    const proteinValue = menuForm.protein || undefined;
    const notesValue = menuForm.nutritionalInfo?.trim() || undefined;
    const nutritionalPayload = {
      ...(caloriesValue ? { calories: caloriesValue } : {}),
      ...(proteinValue ? { protein: proteinValue } : {}),
      ...(notesValue ? { notes: notesValue } : {})
    };
    const preparationTimeValue = Number(String(menuForm.prepTime).replace(/\D/g, '')) || 20;

    const payload = {
      name: menuForm.itemName,
      sku: menuForm.sku,
      description: menuForm.description,
      price: menuForm.price,
      category: menuForm.category,
      cuisine: menuForm.category || 'General',
      preparationTime: preparationTimeValue,
      nutritionalInfo: Object.keys(nutritionalPayload).length ? nutritionalPayload : undefined,
      tags: menuForm.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t),
      images: [{ url: menuForm.image, alt: menuForm.itemName }],
      isVeg: menuForm.isVeg,
      isAvailable: menuForm.isAvailable,
      updatedAt: Date.now(),
      restaurant: restaurant._id
    };

    try {
      if (editingMenuItem) {
        await foodService.updateFood(editingMenuItem._id, payload);
        appendAudit(`Updated menu item ${menuForm.itemName} (SKU: ${menuForm.sku || 'N/A'})`);
      } else {
        await foodService.createFood(payload);
        appendAudit(`Created new menu item ${menuForm.itemName} (SKU: ${menuForm.sku || 'N/A'})`);
      }
    } catch (apiError) {
      console.error('API upsert menu item failed', apiError);
      alert('Failed to save menu item. Please try again.');
    }

    await refreshMenu(restaurant._id);
    resetMenuForm();
  };

  const handleStartEditing = (item: MenuItem) => {
    const nutrition = item.nutritionalInfo;
    const nutritionString = typeof nutrition === 'string' ? nutrition : '';
    const caloriesFromInfo = typeof nutrition === 'string' ? Number((nutrition.match(/Calories: (\d+)/)?.[1]) || 0) : 0;
    const proteinFromInfo = typeof nutrition === 'string' ? Number((nutrition.match(/Protein: (\d+)/)?.[1]) || 0) : 0;

    setEditingMenuItem(item);
    setMenuForm({
      itemName: item.itemName,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      isVeg: item.isVeg ?? true,
      prepTime: item.prepTime || String(item.preparationTime || ''),
      nutritionalInfo: nutritionString,
      protein: proteinFromInfo || 0,
      calories: caloriesFromInfo || 0,
      sku: item.sku || '',
      tags: item.tags?.join(', ') || '',
      image: item.image || 'https://via.placeholder.com/400x250.png?text=Upload+Image'
    });
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!window.confirm('Delete this dish permanently?')) return;

    try {
      await foodService.deleteFood(id);
      appendAudit(`Deleted menu item id ${id}`);
    } catch (apiError) {
      console.error('API delete menu item failed', apiError);
      alert('Failed to delete menu item.');
    }

    if (restaurant) await refreshMenu(restaurant._id);
  };

  const appendAudit = (message: string) => {
    const entry = `${new Date().toLocaleString()} - ${message}`;
    setAuditLog(prev => [entry, ...prev]);
    localStorage.setItem('partner_audit_log', JSON.stringify([entry, ...auditLog]));
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    const updatedAvailable = !item.isAvailable;
    try {
      await foodService.updateFood(item._id, { isAvailable: updatedAvailable });
      appendAudit(`Toggled availability for ${item.itemName} to ${updatedAvailable ? 'Available' : 'Unavailable'}`);
    } catch (apiError) {
      console.error('API toggle availability failed', apiError);
      alert('Failed to toggle availability.');
    }
    if (restaurant) await refreshMenu(restaurant._id);
  };

  const syncMenuToFoodCollection = async () => {
    if (!restaurant) {
      appendAudit('Sync failed: restaurant not loaded.');
      return;
    }

    for (const item of menuItems) {
      try {
        await foodService.createFood({
          name: item.itemName,
          description: item.description,
          price: item.price,
          category: item.category || 'Uncategorized',
          cuisine: item.category || 'General',
          images: [{ url: item.image, alt: item.itemName }],
          isVeg: item.isVeg || false,
          isAvailable: item.isAvailable || false,
          preparationTime: Number(item.preparationTime) || Number(item.prepTime) || 20,
          nutritionalInfo: item.nutritionalInfo ? { notes: item.nutritionalInfo } : undefined,
          tags: item.tags,
          restaurant: restaurant._id
        });
      } catch (err) {
        console.warn('Sync menu item to database failed for item', item.itemName, err);
      }
    }

    appendAudit('Synced local menu items to global restaurant food collection');
    if (restaurant) await refreshMenu(restaurant._id);
  };

  const handleToggleStatus = async () => {
    if (!restaurant) return;
    const newStatus = !restaurant.isOpen;
    try {
      await restaurantService.updateRestaurant(restaurant._id, { isActive: newStatus });
    } catch (err) {
      console.error('API update failed', err);
      alert('Failed to toggle status.');
    }
    setRestaurant(prev => prev ? { ...prev, isOpen: newStatus } : null);
    appendAudit(`Changed restaurant status to ${newStatus ? 'Open' : 'Closed'}`);
  };

  const handleSaveSettings = async () => {
    if (!restaurant) return;
    const nameInput = document.getElementById('setting-res-name') as HTMLInputElement;
    const cuisineInput = document.getElementById('setting-res-cuisine') as HTMLInputElement;
    if (!nameInput || !cuisineInput) return;

    const payload = {
      name: nameInput.value,
      cuisine: cuisineInput.value.split(',').map(c => c.trim()).filter(Boolean)
    };

    try {
      await restaurantService.updateRestaurant(restaurant._id, payload);
    } catch (err) {
      console.error('API update failed', err);
      alert('Failed to save settings.');
    }

    setRestaurant(prev => prev ? { ...prev, name: payload.name, cuisine: payload.cuisine } : null);
    appendAudit('Updated restaurant settings');
    alert('Settings saved successfully!');
  };

  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    avgRating: restaurant?.rating || 0,
    totalReviews: menuItems.reduce((sum, m) => sum + (m.reviews || 0), 0),
    activeOrders: orders.filter(o => ['placed', 'preparing', 'ready'].includes(o.orderStatus || o.status || 'placed')).length,
  };

  const filteredMenuItems = menuItems.filter(item => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = !query ||
      item.itemName.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.sku || '').toLowerCase().includes(query) ||
      (item.tags || []).join(',').toLowerCase().includes(query) ||
      (restaurant?.name || '').toLowerCase().includes(query);
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesMinPrice = minPrice === undefined || item.price >= minPrice;
    const matchesMaxPrice = maxPrice === undefined || item.price <= maxPrice;
    const matchesSize =
      priceSize === 'all' ||
      (priceSize === 'budget' && item.price <= 250) ||
      (priceSize === 'mid' && item.price > 250 && item.price <= 599) ||
      (priceSize === 'premium' && item.price >= 600);
    return matchesQuery && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesSize;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 italic">flavorfinder</h1>
            <p className="text-xs text-gray-500 font-semibold">Restaurant Partner Dashboard</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-gray-500">Restaurant Partner</p>
            </div>
            <button 
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
            >
              Logout
            </button>
          </div>
        </div>
        {loadError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="bg-red-100 border border-red-300 text-red-700 text-sm font-bold rounded-lg p-3">
              {loadError}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: '📊 Overview', icon: 'overview' },
              { id: 'menu', label: '🍽️ Menu Items', icon: 'menu' },
              { id: 'orders', label: '📦 Orders', icon: 'orders' },
              { id: 'earnings', label: '💰 Earnings', icon: 'earnings' },
              { id: 'settings', label: '⚙️ Settings', icon: 'settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-bold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600'
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
            {/* Restaurant Info */}
            {restaurant && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex gap-6">
                  <img
                    src={restaurant.imageUrl || 'https://via.placeholder.com/150'}
                    alt={restaurant.name}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{restaurant.name}</h2>
                    <p className="text-gray-600 mt-2">{restaurant.cuisine.join(', ')}</p>
                    <div className="flex gap-6 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Rating</p>
                        <p className="font-black text-xl">⭐ {restaurant.rating}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className={`font-black text-xl ${restaurant.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                          {restaurant.isOpen ? '🟢 Open' : '🔴 Closed'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: 'blue' },
                { label: 'Active Orders', value: stats.activeOrders, icon: '⏱️', color: 'orange' },
                { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: 'green' },
                { label: 'Avg Rating', value: stats.avgRating.toFixed(1), icon: '⭐', color: 'yellow' },
                { label: 'Menu Items', value: menuItems.length, icon: '🍽️', color: 'red' }
              ].map((metric, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                  <p className="text-gray-600 text-xs font-bold mb-2">{metric.label}</p>
                  <p className="text-2xl font-black text-gray-900">{metric.value}</p>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-black mb-4">Recent Orders</h2>
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-bold text-gray-900">Order #{order._id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-600">₹{order.totalAmount}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      (order.orderStatus || order.status) === 'delivered' ? 'bg-green-100 text-green-700' :
                      (order.orderStatus || order.status) === 'out_for_delivery' ? 'bg-blue-100 text-blue-700' :
                      (order.orderStatus || order.status) === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.orderStatus || order.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="mb-4 flex flex-col lg:flex-row gap-3 justify-between">
                <h2 className="text-xl font-black">{editingMenuItem ? 'Edit Dish' : 'Add New Dish'}</h2>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="search"
                    placeholder="Search food, description, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option>All</option>
                    {[...new Set(menuItems.map(item => item.category))].map(cat => <option key={cat}>{cat}</option>)}
                  </select>
                  <select value={priceSize} onChange={(e) => setPriceSize(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="all">Price Size: All</option>
                    <option value="budget">Budget (&lt;=250)</option>
                    <option value="mid">Mid (251-599)</option>
                    <option value="premium">Premium (600+)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={minPrice ?? ''}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={maxPrice ?? ''}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button onClick={() => csvInputRef.current?.click()} className="px-3 py-2 bg-blue-600 text-white rounded-lg font-bold">CSV Import</button>
                  <button onClick={syncMenuToFoodCollection} className="px-3 py-2 bg-green-600 text-white rounded-lg font-bold">Sync to Menu DB</button>
                  <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500">Dish Image</label>
                  <div
                    className="h-44 bg-gray-50 border border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <img src={menuForm.image} alt="Dish" className="w-full h-full object-cover" />
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleMenuImageChange} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Dish Name <span className="text-red-600">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter dish name (e.g., Butter Chicken)"
                      value={menuForm.itemName}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, itemName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Price (₹) <span className="text-red-600">*</span></label>
                      <input
                        type="number"
                        placeholder="e.g., 299"
                        value={menuForm.price}
                        onChange={(e) => setMenuForm(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-gray-500 block mb-1">
                        SKU / Item Code
                        <span className="ml-1 text-gray-400 font-normal cursor-help" title="SKU stands for Stock Keeping Unit. It is a unique code used by POS systems (e.g. BC-001 for Butter Chicken). You can leave it empty.">[?]</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Optional (e.g., BC-001)"
                        value={menuForm.sku}
                        onChange={(e) => setMenuForm(prev => ({ ...prev, sku: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">Unique tracking code for inventory.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Category <span className="text-red-600">*</span></label>
                      <select
                        value={menuForm.category}
                        onChange={(e) => setMenuForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      >
                        <option value="">Select category</option>
                        {Array.from(new Set(menuItems.map(item => item.category).filter(Boolean))).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        {['Main Course','Appetizer','Dessert','Beverage','Snack','Salad'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Prep Time</label>
                      <input
                        type="text"
                        placeholder="e.g., 15 min"
                        value={menuForm.prepTime}
                        onChange={(e) => setMenuForm(prev => ({ ...prev, prepTime: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Calories (kcal)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g., 350"
                        value={menuForm.calories}
                        onChange={(e) => setMenuForm(prev => ({ ...prev, calories: Number(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Protein (g)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g., 25"
                        value={menuForm.protein}
                        onChange={(e) => setMenuForm(prev => ({ ...prev, protein: Number(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Nutritional Info</label>
                    <input
                      type="text"
                      placeholder="e.g., Calories: 350, Protein: 25g"
                      value={menuForm.nutritionalInfo}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, nutritionalInfo: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Tags</label>
                    <input
                      type="text"
                      placeholder="e.g., Spicy, Gluten-free, Vegan (comma separated)"
                      value={menuForm.tags}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Description <span className="text-red-600">*</span></label>
                    <textarea
                      placeholder="Describe the dish ingredients, taste, and preparation method..."
                      value={menuForm.description}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 h-28"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={menuForm.isVeg}
                        onChange={(e) => setMenuForm(prev => ({ ...prev, isVeg: e.target.checked }))}
                      />
                      Veg
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={menuForm.isAvailable}
                        onChange={(e) => setMenuForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      />
                      Available
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveMenuItem}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black"
                    >
                      {editingMenuItem ? 'Update Dish' : 'Add Dish'}
                    </button>
                    {editingMenuItem && (
                      <button
                        onClick={resetMenuForm}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-black mb-4">Menu ({menuItems.length} items)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMenuItems.length === 0 ? (
                  <div className="col-span-full bg-gray-50 border border-dashed border-gray-300 rounded-3xl p-10 text-center">
                    <p className="text-gray-500 text-sm font-bold mb-4">No menu items found. Add your first dish or adjust the search filters.</p>
                    <button onClick={resetMenuForm} className="px-4 py-3 bg-red-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-red-700">
                      Add New Dish
                    </button>
                  </div>
                ) : filteredMenuItems.map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-xl p-4 relative bg-white">
                    <img
                      src={item.image || 'https://via.placeholder.com/300x180?text=No+Image'}
                      alt={item.itemName}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                    <h4 className="text-lg font-black text-gray-900 mb-1">{item.itemName} {item.sku && <span className="text-xs text-gray-500 font-normal">({item.sku})</span>}</h4>
                    <p className="text-xs text-gray-500 mb-1">{restaurant?.name || 'Unknown Restaurant'}</p>
                    <p className="text-xs text-gray-500 mb-2">{item.category} • {item.prepTime || item.preparationTime || 'N/A'} prep</p>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                    {item.nutritionalInfo && <p className="text-xs text-gray-500 mb-2">Nutrition: {item.nutritionalInfo}</p>}
                    {item.tags && item.tags.length > 0 && <p className="text-xs text-gray-500 mb-2">Tags: {item.tags.join(', ')}</p>}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-black text-emerald-600">₹{item.price}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-black ${item.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => handleToggleAvailability(item)} className="flex-1 text-xs font-black uppercase tracking-widest py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                        {item.isAvailable ? 'Make Unavailable' : 'Make Available'}
                      </button>
                      <button onClick={() => handleStartEditing(item)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black">Edit</button>
                      <button onClick={() => handleDeleteMenuItem(item._id)} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 font-bold text-sm">
            <input type="checkbox" checked={showAuditLog} onChange={e => setShowAuditLog(e.target.checked)} className="w-4 h-4" />
            Show Action Log
          </label>
        </div>

        {showAuditLog && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200 mb-4 max-h-40 overflow-y-auto">
            <h3 className="font-black uppercase text-xs text-gray-500 mb-2">Partner Audit Log</h3>
            {auditLog.length === 0 ? (
              <p className="text-gray-400 text-xs">No actions yet.</p>
            ) : (
              <ul className="space-y-1 text-xs text-gray-700">
                {auditLog.map((entry, index) => (
                  <li key={index}>• {entry}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-black mb-4">All Orders ({orders.length})</h2>
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">Order #{order._id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-600 mt-1">₹{order.totalAmount} • {order.items?.length || 1} item(s)</p>
                    </div>
                    <div className="text-right">
                      <span className={`block px-3 py-1 rounded-full text-xs font-bold mb-2 w-fit ml-auto ${
                      (order.orderStatus || order.status) === 'delivered' ? 'bg-green-100 text-green-700' :
                      (order.orderStatus || order.status) === 'out_for_delivery' ? 'bg-blue-100 text-blue-700' :
                      (order.orderStatus || order.status) === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.orderStatus || order.status}
                      </span>
                      {['placed', 'preparing'].includes(order.orderStatus || order.status || 'placed') && (
                        <button className="text-xs font-bold text-red-600 hover:text-red-700">
                          Update Status
                        </button>
                      )}
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
                <h3 className="font-black text-lg mb-4">Revenue Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <p className="text-gray-600 font-semibold">Total Revenue</p>
                    <p className="font-black text-green-600 text-lg">₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-600 font-semibold">Commission (5%)</p>
                    <p className="font-black text-red-600">₹{Math.round(stats.totalRevenue * 0.05).toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <p className="text-gray-900 font-black">Net Earnings</p>
                    <p className="font-black text-green-700 text-lg">₹{Math.round(stats.totalRevenue * 0.95).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-black text-lg mb-4">Performance</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-1">Average Rating</p>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-black text-yellow-500">⭐ {stats.avgRating}</div>
                      <p className="text-sm text-gray-600">/5.0</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-1">Total Orders</p>
                    <p className="text-2xl font-black text-blue-600">{stats.totalOrders}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 space-y-6">
              <h2 className="text-2xl font-black mb-6">Restaurant Settings</h2>
              
              {restaurant && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Restaurant Name <span className="text-red-600">*</span></label>
                    <input
                      id="setting-res-name"
                      type="text"
                      defaultValue={restaurant.name}
                      placeholder="Enter restaurant name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Cuisines</label>
                    <input
                      id="setting-res-cuisine"
                      type="text"
                      defaultValue={restaurant.cuisine.join(', ')}
                      placeholder="e.g., North Indian, Continental, Italian"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-bold text-gray-900">Restaurant Status</p>
                      <p className="text-sm text-gray-600">Currently {restaurant.isOpen ? 'Open' : 'Closed'}</p>
                    </div>
                    <button 
                      onClick={handleToggleStatus}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold"
                    >
                      Toggle Status
                    </button>
                  </div>

                  <button 
                    onClick={handleSaveSettings}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-black transition-all"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDashboardComplete;
