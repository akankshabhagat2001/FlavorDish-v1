import React, { useState, useEffect } from 'react';
import { User, Restaurant, MenuItem, Order } from '../types';
import { orderService, restaurantService } from '../services';
import apiClient from '../services/apiClient';

interface CustomerDashboardCompleteProps {
  currentUser: User;
  onLogout: () => void;
  onViewChange?: (view: string) => void;
}

const CustomerDashboardComplete: React.FC<CustomerDashboardCompleteProps> = ({ 
  currentUser, 
  onLogout,
  onViewChange 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'orders' | 'favorites' | 'profile'>('home');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [followingRestaurants, setFollowingRestaurants] = useState<Restaurant[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyFollowedRestaurants, setNearbyFollowedRestaurants] = useState<Restaurant[]>([]);
  
  // Addresses State
  const [localAddresses, setLocalAddresses] = useState(currentUser.savedAddresses || []);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [newAddressDetails, setNewAddressDetails] = useState('');

  const handleSaveAddress = async () => {
    if (!newAddressDetails.trim()) return;
    const newAddress = {
      id: Date.now().toString(),
      label: newAddressLabel,
      details: newAddressDetails.trim(),
      isDefault: localAddresses.length === 0
    };
    const updatedAddresses = [...localAddresses, newAddress];
    
    try {
      await apiClient.put('/auth/profile', { savedAddresses: updatedAddresses });
      setLocalAddresses(updatedAddresses);
      setIsAddingAddress(false);
      setNewAddressDetails('');
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.savedAddresses = updatedAddresses;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
    } catch (err) {
      console.error('Failed to save address', err);
      setLocalAddresses(updatedAddresses);
      setIsAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const updatedAddresses = localAddresses.filter(a => a.id !== id);
    try {
      await apiClient.put('/auth/profile', { savedAddresses: updatedAddresses });
      setLocalAddresses(updatedAddresses);
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.savedAddresses = updatedAddresses;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
    } catch (err) {
      setLocalAddresses(updatedAddresses);
    }
  };

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
    const loadRestaurants = async () => {
      try {
        const response = await restaurantService.getRestaurants({ page: 1, limit: 200 });
        const data = (response?.restaurants || []).map(normalizeRestaurant);
        setRestaurants(data);
        setFilteredRestaurants(data);
      } catch (err) {
        console.error('Error loading restaurants:', err);
      }
    };
    loadRestaurants();
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await orderService.getMyOrders({ page: 1, limit: 200 });
        const data = (response?.orders || []).map(normalizeOrder);
        const userOrdersData = data.filter(o => o.userId === currentUser._id || !o.userId);
        setUserOrders(userOrdersData);
      } catch (err) {
        console.error('Error loading orders:', err);
      }
    };
    loadOrders();
  }, [currentUser._id]);

  useEffect(() => {
    const loadFollowingRestaurants = async () => {
      try {
        const response = await apiClient.get('/users/following');
        const data = (response.data.followingRestaurants || []).map(normalizeRestaurant);
        setFollowingRestaurants(data);
      } catch (err) {
        console.error('Error loading following restaurants:', err);
      }
    };
    loadFollowingRestaurants();
  }, [currentUser._id]);

  const handleSearch = () => {
    let filtered = restaurants;
    
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedCuisine) {
      filtered = filtered.filter(r => r.cuisine.includes(selectedCuisine));
    }
    
    setFilteredRestaurants(filtered);
  };

  const cuisines = Array.from(new Set(restaurants.flatMap(r => r.cuisine)));

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Check for nearby followed restaurants
  const checkNearbyFollowedRestaurants = (userLat: number, userLng: number) => {
    const nearby = followingRestaurants.filter(restaurant => {
      const distance = calculateDistance(
        userLat,
        userLng,
        restaurant.location.latitude,
        restaurant.location.longitude
      );
      return distance <= 0.5; // Within 500 meters
    });

    if (nearby.length > 0 && nearby.length !== nearbyFollowedRestaurants.length) {
      setNearbyFollowedRestaurants(nearby);

      // Show notification for each nearby restaurant
      nearby.forEach(restaurant => {
        if (Notification.permission === 'granted') {
          new Notification('Restaurant Nearby! 🎉', {
            body: `${restaurant.name} is just ${Math.round(calculateDistance(userLat, userLng, restaurant.location.latitude, restaurant.location.longitude) * 1000)}m away!`,
            icon: restaurant.imageUrl,
            tag: `restaurant-${restaurant._id}`,
          });
        }
      });
    }
  };

  // Get user's location and check for nearby restaurants
  useEffect(() => {
    if (followingRestaurants.length === 0) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        checkNearbyFollowedRestaurants(latitude, longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [followingRestaurants]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 italic">flavorfinder</h1>
            <p className="text-xs text-gray-500 font-semibold">Find Your Flavor</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-gray-500">Customer</p>
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
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: 'home', label: '🏠 Home', icon: 'home' },
              { id: 'search', label: '🔍 Search', icon: 'search' },
              { id: 'orders', label: '📦 My Orders', icon: 'orders' },
              { id: 'favorites', label: '❤️ Favorites', icon: 'favorites' },
              { id: 'profile', label: '👤 Profile', icon: 'profile' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
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
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            {/* Hero Banner */}
            <div className="relative h-80 rounded-3xl overflow-hidden bg-gradient-to-r from-orange-500 to-red-600 text-white">
              <img 
                src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1000&h=400&fit=crop" 
                alt="Food delivery"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <div className="relative z-10 h-full flex flex-col justify-center px-8">
                <h2 className="text-5xl font-black mb-4">Order Delicious Food</h2>
                <p className="text-xl opacity-90">From your favorite restaurants</p>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-black text-lg mb-4">Browse by Cuisine</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                <button 
                  onClick={() => {
                    setSelectedCuisine('');
                    handleSearch();
                  }}
                  className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                    selectedCuisine === '' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  All Cuisines
                </button>
                {cuisines.map(cuisine => (
                  <button
                    key={cuisine}
                    onClick={() => {
                      setSelectedCuisine(cuisine);
                    }}
                    className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                      selectedCuisine === cuisine
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Restaurants */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-black text-lg mb-6">Featured Restaurants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.slice(0, 6).map(restaurant => (
                  <div key={restaurant._id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="relative">
                      <img 
                        src={restaurant.imageUrl || 'https://via.placeholder.com/300x200?text=Restaurant'} 
                        alt={restaurant.name}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full font-bold text-sm">
                        ⭐ {restaurant.rating}
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-black text-lg text-gray-900 mb-2">{restaurant.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{restaurant.cuisine.join(', ')}</p>
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-green-600">{restaurant.deliveryTime}</span>
                        <span className={restaurant.isOpen ? 'text-green-600' : 'text-red-600'}>
                          {restaurant.isOpen ? '🟢 Open' : '🔴 Closed'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Followed Restaurants */}
            {nearbyFollowedRestaurants.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <h3 className="font-black text-lg mb-6 text-green-800 flex items-center gap-2">
                  <i className="fa-solid fa-location-dot text-green-600"></i>
                  Followed Restaurants Nearby! 🎉
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nearbyFollowedRestaurants.map(restaurant => (
                    <div key={restaurant._id} className="bg-white rounded-xl p-4 border border-green-200 hover:shadow-lg transition-all cursor-pointer" onClick={() => onViewChange?.(`restaurant-${restaurant._id}`)}>
                      <div className="flex items-center gap-3">
                        <img
                          src={restaurant.imageUrl || 'https://via.placeholder.com/60x60?text=🍽️'}
                          alt={restaurant.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{restaurant.name}</h4>
                          <p className="text-sm text-gray-600 truncate">{restaurant.cuisine.join(', ')}</p>
                          <p className="text-xs text-green-600 font-semibold">
                            {userLocation && Math.round(calculateDistance(
                              userLocation.lat,
                              userLocation.lng,
                              restaurant.location.latitude,
                              restaurant.location.longitude
                            ) * 1000)}m away
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="font-black text-xl mb-4">Search Restaurants</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search by restaurant name or cuisine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <div>
                  <label className="block font-bold text-gray-900 mb-2">Filter by Cuisine</label>
                  <select
                    value={selectedCuisine}
                    onChange={(e) => setSelectedCuisine(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">All Cuisines</option>
                    {cuisines.map(cuisine => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSearch}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-black transition-all"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-black text-lg mb-6">Results ({filteredRestaurants.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.map(restaurant => (
                  <div key={restaurant._id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all">
                    <img 
                      src={restaurant.imageUrl || 'https://via.placeholder.com/300x200'} 
                      alt={restaurant.name}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="font-black text-lg text-gray-900">{restaurant.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{restaurant.cuisine.join(', ')}</p>
                      <div className="flex justify-between mt-3 text-sm font-bold">
                        <span>⭐ {restaurant.rating}</span>
                        <span className={restaurant.isOpen ? 'text-green-600' : 'text-red-600'}>
                          {restaurant.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="font-black text-xl mb-6">My Orders ({userOrders.length})</h2>
            {userOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">📦</p>
                <p className="text-gray-600 font-semibold">No orders yet. Start ordering now!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map(order => (
                  <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-black text-gray-900">Order #{order._id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-600 mt-1">₹{order.totalAmount}</p>
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
                    <div className="flex gap-2">
                      {[
                        { step: 'Order Placed', status: ['placed', 'preparing', 'ready', 'out_for_delivery', 'delivered'] },
                        { step: 'Preparing', status: ['preparing', 'ready', 'out_for_delivery', 'delivered'] },
                        { step: 'Ready', status: ['ready', 'out_for_delivery', 'delivered'] },
                        { step: 'Delivering', status: ['out_for_delivery', 'delivered'] },
                        { step: 'Delivered', status: ['delivered'] }
                      ].map((tracker, i) => (
                        <div key={i} className="flex-1">
                          <div className={`h-2 rounded-full mb-1 ${
                            tracker.status.includes(order.orderStatus || order.status || 'placed') ? 'bg-green-500' : 'bg-gray-200'
                          }`}></div>
                          <p className="text-xs text-center font-bold text-gray-600">{tracker.step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="font-black text-xl mb-6">Following Restaurants</h2>
            {followingRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">❤️</p>
                <p className="text-gray-600 font-semibold">No following yet. Follow your favorite restaurants!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {followingRestaurants.map((restaurant) => (
                  <div key={restaurant._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 hover:shadow-lg transition-all cursor-pointer" onClick={() => onViewChange?.(`restaurant-${restaurant._id}`)}>
                    <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-gray-200">
                      <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-black text-lg text-gray-900 mb-2">{restaurant.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine.join(', ')}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <i className="fa-solid fa-star text-yellow-400"></i>
                        <span className="text-sm font-bold">{restaurant.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">{restaurant.deliveryTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h2 className="font-black text-2xl mb-6">My Profile</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Full Name</label>
                  <p className="text-lg font-bold text-gray-900">{currentUser.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Email</label>
                  <p className="text-lg font-bold text-gray-900">{currentUser.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Phone</label>
                  <p className="text-lg font-bold text-gray-900">{currentUser.phone || 'Not added'}</p>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-xl text-gray-900">My Addresses</h3>
                    {!isAddingAddress && (
                      <button 
                        onClick={() => setIsAddingAddress(true)}
                        className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        + Add New Address
                      </button>
                    )}
                  </div>

                  {isAddingAddress && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 animate-fade-in">
                      <h4 className="font-bold text-gray-800 mb-3 text-sm">Add New Delivery Address</h4>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          {['Home', 'Work', 'Other'].map(lbl => (
                            <button 
                              key={lbl} 
                              onClick={() => setNewAddressLabel(lbl)}
                              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${newAddressLabel === lbl ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                        <textarea 
                          value={newAddressDetails}
                          onChange={(e) => setNewAddressDetails(e.target.value)}
                          placeholder="House No, Building, Street, Landmark..."
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none h-24 focus:outline-none focus:border-blue-500"
                        />
                        <div className="flex justify-end gap-3 pt-2">
                          <button 
                            onClick={() => setIsAddingAddress(false)}
                            className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleSaveAddress}
                            disabled={!newAddressDetails.trim()}
                            className="px-6 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50"
                          >
                            Save Address
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {localAddresses.length === 0 && !isAddingAddress && (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <p className="text-gray-500 font-semibold text-sm">No saved addresses yet.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localAddresses.map((addr: any) => (
                      <div key={addr.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow relative group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                            <i className={`fa-solid ${addr.label === 'Home' ? 'fa-home' : addr.label === 'Work' ? 'fa-briefcase' : 'fa-map-pin'}`}></i>
                          </div>
                          <span className="font-black text-gray-900">{addr.label}</span>
                          {addr.isDefault && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ml-2">Default</span>}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-2">{addr.details}</p>
                        <button 
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center"
                          title="Delete Address"
                        >
                          <i className="fa-solid fa-trash text-sm"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-8">
                  <p className="font-bold text-blue-900 mb-2">📊 Account Stats</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-700">Total Orders</p>
                      <p className="font-black text-2xl text-blue-900">{userOrders.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Total Spent</p>
                      <p className="font-black text-2xl text-blue-900">₹{userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)}</p>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-black transition-all mt-8">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboardComplete;
