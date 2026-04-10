/**
 * Comprehensive Restaurant Information Hub
 * Displays all restaurant details: menu, pricing, booking, delivery info, reviews, etc.
 */

import React, { useState, useMemo } from 'react';
import { Restaurant, MenuItem, Review } from '../types';

interface RestaurantInfoHubProps {
  restaurant: Restaurant;
  userLocation?: { lat: number; lng: number };
  currentUser: any;
  onBookTable?: () => void;
  onOrderFood?: () => void;
  onAddToCart?: (item: MenuItem) => void;
  onClose?: () => void;
}

const RestaurantInfoHub: React.FC<RestaurantInfoHubProps> = ({
  restaurant,
  userLocation,
  currentUser,
  onBookTable,
  onOrderFood,
  onAddToCart,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'menu' | 'booking' | 'delivery' | 'reviews' | 'amenities'
  >('menu');

  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance = userLocation
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        restaurant.location.latitude,
        restaurant.location.longitude
      )
    : 0;

  const deliveryFee = distance > 5 ? Math.ceil(distance * 10) : 0;
  const deliveryTime = Math.ceil(distance * 2) + 20; // 2 mins per km + 20 mins prep

  const menuCategories = Array.from(
    new Set(restaurant.menu?.map((item) => item.category || 'All') || ['All'])
  );

  const filteredMenu = useMemo(() => {
    let items = restaurant.menu || [];
    if (selectedMenuCategory !== 'all') {
      items = items.filter((item) => item.category === selectedMenuCategory);
    }
    if (searchQuery) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return items;
  }, [selectedMenuCategory, searchQuery, restaurant.menu]);

  return (
    <div className="fixed inset-0 z-[1100] bg-white overflow-y-auto animate-fade-in">
      {/* Header with Close Button */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 text-2xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <h1 className="text-2xl font-black text-gray-900">{restaurant.name}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Restaurant Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Hero Info */}
            <div className="md:col-span-2">
              <h2 className="text-4xl md:text-5xl font-black mb-4">{restaurant.name}</h2>
              <p className="text-xl text-white/80 mb-4">{restaurant.cuisine.join(' • ')}</p>
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
                  <i className="fa-solid fa-star text-yellow-400"></i>
                  <span className="font-bold">
                    {restaurant.rating?.toFixed(1) || 'N/A'} ({restaurant.reviewCount || 0} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
                  <i className="fa-solid fa-location-dot"></i>
                  <span className="font-bold">{distance.toFixed(1)} km away</span>
                </div>
                <div
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold ${
                    restaurant.isOpen
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  <i className={`fa-solid fa-circle text-sm`}></i>
                  {restaurant.isOpen ? 'Open Now' : 'Closed'}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                <i className="fa-solid fa-clock text-2xl text-yellow-400"></i>
                <div>
                  <p className="text-xs text-white/60 uppercase font-bold">Delivery</p>
                  <p className="text-lg font-black">{deliveryTime} mins</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                <i className="fa-solid fa-truck text-2xl text-green-400"></i>
                <div>
                  <p className="text-xs text-white/60 uppercase font-bold">Fee</p>
                  <p className="text-lg font-black">₹{deliveryFee}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                <i className="fa-solid fa-credit-card text-2xl text-blue-400"></i>
                <div>
                  <p className="text-xs text-white/60 uppercase font-bold">Avg. Cost</p>
                  <p className="text-lg font-black">₹{restaurant.costForTwo}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto no-scrollbar gap-8">
            {[
              { id: 'overview', label: 'Overview', icon: 'home' },
              { id: 'menu', label: 'Menu', icon: 'book-open' },
              { id: 'booking', label: 'Book Table', icon: 'chair' },
              { id: 'delivery', label: 'Delivery', icon: 'truck' },
              { id: 'reviews', label: 'Reviews', icon: 'star' },
              { id: 'amenities', label: 'Amenities', icon: 'star' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 font-bold text-sm whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#EF4F5F] text-[#EF4F5F]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className={`fa-solid fa-${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-fade-in">
            {/* Restaurant Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h3 className="text-2xl font-black mb-6">Restaurant Details</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <i className="fa-solid fa-map-pin text-[#EF4F5F] text-xl flex-shrink-0 mt-1"></i>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Address
                      </p>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.location.address)}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 hover:text-[#EF4F5F] hover:underline transition-colors flex items-center gap-1">
                        {restaurant.location.address}
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-70"></i>
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <i className="fa-solid fa-phone text-[#EF4F5F] text-xl flex-shrink-0 mt-1"></i>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Phone
                      </p>
                      <a
                        href={`tel:${restaurant.phone}`}
                        className="font-semibold text-[#EF4F5F] hover:underline"
                      >
                        {restaurant.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <i className="fa-solid fa-clock text-[#EF4F5F] text-xl flex-shrink-0 mt-1"></i>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Hours
                      </p>
                      <p className="font-semibold text-gray-900">
                        {restaurant.openingHours || '11:00 AM - 11:00 PM'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <i className="fa-solid fa-utensils text-[#EF4F5F] text-xl flex-shrink-0 mt-1"></i>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Cuisine
                      </p>
                      <p className="font-semibold text-gray-900">{restaurant.cuisine.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#FFF4F5] to-white rounded-2xl p-8 border border-[#EF4F5F]/20">
                <h3 className="text-2xl font-black mb-6">About</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {restaurant.description || 'Welcome to our restaurant! We offer authentic cuisine with premium quality ingredients and exceptional service.'}
                </p>
                {restaurant.signatureDish && (
                  <div className="bg-white rounded-xl p-4 border border-[#EF4F5F]/30">
                    <p className="text-xs font-bold text-[#EF4F5F] uppercase tracking-wider mb-2">
                      🌟 Signature Dish
                    </p>
                    <p className="font-black text-lg text-gray-900">
                      {restaurant.signatureDish.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#EF4F5F] transition-colors"
              />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <i className="fa-solid fa-leaf text-green-500"></i>
                <span>Pure Veg Available</span>
              </div>
            </div>

            {/* Must Try Section */}
            {restaurant.menu?.filter(item => item.isPopular).length > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-6">
                <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-star text-orange-500"></i>
                  Must Try
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {restaurant.menu.filter(item => item.isPopular).slice(0, 3).map((item) => (
                    <div key={item._id} className="bg-white rounded-xl p-4 border border-orange-100 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-sm border flex-shrink-0 ${
                          item.isVeg ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                        }`}></div>
                        <h4 className="font-bold text-sm text-gray-900">{item.name}</h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">₹{item.price}</span>
                        <button 
                          onClick={() => onAddToCart?.(item)}
                          className="bg-[#EF4F5F] text-white px-3 py-1 rounded text-xs font-bold hover:bg-[#d43d4c] transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedMenuCategory('all')}
                className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                  selectedMenuCategory === 'all'
                    ? 'bg-[#EF4F5F] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {menuCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedMenuCategory(cat)}
                  className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                    selectedMenuCategory === cat
                      ? 'bg-[#EF4F5F] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMenu.length > 0 ? (
                filteredMenu.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col"
                  >
                    {item.image && (
                      <div className="h-48 bg-gray-100 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover hover:scale-110 transition-transform"
                        />
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-4 h-4 rounded-sm border-2 flex-shrink-0 mt-0.5 ${
                              item.isVeg
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                            }`}
                          ></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900">{item.name}</h4>
                              {item.isPopular && (
                                <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                  Popular
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {item.discount && (
                          <div className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-bold">
                            {item.discount}% OFF
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3 flex-1 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        {item.ratings && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <i className="fa-solid fa-star text-yellow-400"></i>
                            <span>{item.ratings.toFixed(1)}</span>
                            {item.reviews && <span>({item.reviews})</span>}
                          </div>
                        )}
                        {item.prepTime && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <i className="fa-solid fa-clock"></i>
                            <span>{item.prepTime}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          {item.discountedPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-gray-900">₹{item.discountedPrice}</span>
                              <span className="line-through text-gray-400 text-sm">₹{item.price}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-lg text-gray-900">₹{item.price}</span>
                          )}
                        </div>
                        <button 
                          onClick={() => onAddToCart?.(item)}
                          className="bg-[#EF4F5F] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#d43d4c] transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <i className="fa-solid fa-magnifying-glass text-4xl text-gray-200 mb-4"></i>
                  <p className="text-gray-500 font-semibold">No items found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Booking Tab */}
        {activeTab === 'booking' && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl p-8">
              <h3 className="text-2xl font-black mb-2">Reserve Your Table</h3>
              <p className="text-gray-600 mb-8">
                Book a table at {restaurant.name} and guarantee your spot
              </p>

              <button
                onClick={onBookTable}
                className="w-full bg-gradient-to-r from-[#EF4F5F] to-[#FF6B7B] text-white py-4 rounded-xl font-black text-lg hover:shadow-lg transition-all"
              >
                <i className="fa-solid fa-chair mr-2"></i>
                Book Table Now
              </button>

              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-black text-[#EF4F5F]">2-50</p>
                  <p className="text-xs text-gray-600 font-bold mt-1">Guests Allowed</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-black text-[#EF4F5F]">₹{restaurant.tablePrice || 0}</p>
                  <p className="text-xs text-gray-600 font-bold mt-1">Table Charge</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-black text-[#EF4F5F]">30+ days</p>
                  <p className="text-xs text-gray-600 font-bold mt-1">In Advance</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Tab */}
        {activeTab === 'delivery' && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-2xl p-8">
              <h3 className="text-2xl font-black mb-2">Online Food Delivery</h3>
              <p className="text-gray-600 mb-8">Order food for delivery to your location</p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-map-pin text-green-500 text-xl"></i>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Distance</p>
                      <p className="font-bold text-gray-900">{distance.toFixed(1)} km</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-truck text-green-500 text-xl"></i>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Delivery Time</p>
                      <p className="font-bold text-gray-900">~{deliveryTime} minutes</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-circle-dollar-to-slot text-green-500 text-xl"></i>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Delivery Fee</p>
                      <p className="font-bold text-gray-900">₹{deliveryFee}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={onOrderFood}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-black text-lg hover:shadow-lg transition-all"
              >
                <i className="fa-solid fa-shopping-bag mr-2"></i>
                Order Food Now
              </button>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <div className="bg-white border border-gray-100 rounded-2xl p-8">
              <h3 className="text-2xl font-black mb-4">Customer Reviews</h3>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-4xl font-black text-gray-900">
                      {restaurant.rating?.toFixed(1) || 'N/A'}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`fa-solid fa-star text-lg ${
                            i < Math.round(restaurant.rating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        ></i>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-bold">
                      Based on {restaurant.reviewCount || 0} reviews
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center py-12">
                <i className="fa-solid fa-star text-4xl text-gray-200 mb-4 block"></i>
                <p className="text-gray-500 font-semibold">Reviews coming soon!</p>
                <p className="text-gray-400 text-sm mt-2">Be one of the first to review this restaurant</p>
              </div>
            </div>
          </div>
        )}

        {/* Amenities Tab */}
        {activeTab === 'amenities' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: 'wifi', label: 'Free WiFi' },
                { icon: 'credit-card', label: 'Card Payments' },
                { icon: 'mobile', label: 'Digital Menu' },
                { icon: 'tree', label: 'Outdoor Seating' },
                { icon: 'wheelchair', label: 'Wheelchair Access' },
                { icon: 'clock', label: '24/7 Service' },
              ].map((amenity, i) => (
                <div
                  key={i}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center hover:border-[#EF4F5F] transition-colors"
                >
                  <i className={`fa-solid fa-${amenity.icon} text-2xl text-[#EF4F5F] mb-2 block`}></i>
                  <p className="font-bold text-sm text-gray-900">{amenity.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg max-w-7xl mx-auto">
        <div className="px-4 py-4 flex gap-4">
          <button
            onClick={onOrderFood}
            className="flex-1 bg-gradient-to-r from-[#EF4F5F] to-[#FF6B7B] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            <i className="fa-solid fa-shopping-bag mr-2"></i>
            Order Food
          </button>
          <button
            onClick={onBookTable}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            <i className="fa-solid fa-chair mr-2"></i>
            Book Table
          </button>
        </div>
      </div>

      {/* Spacer for bottom buttons */}
      <div className="h-20"></div>
    </div>
  );
};

export default RestaurantInfoHub;
