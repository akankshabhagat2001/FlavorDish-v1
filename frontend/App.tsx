
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { db } from './database/db';
import { Restaurant, AppViewState, LatLng, User, MenuItem, SortOption, Category, City, Collection } from './types.ts';
import { FOOD_INSPIRATION, TOP_BRANDS } from './constants.tsx';
import { aiImageService } from './services/aiImageService';

import Header from './components/Header.tsx';
import Hero from './components/Hero.tsx';
import RestaurantCard from './components/RestaurantCard.tsx';
const RestaurantDetail = lazy(() => import('./components/RestaurantDetail.tsx'));
import CartModal from './components/CartModal.tsx';
import OrderHistory from './components/OrderHistory.tsx';
import LoginPage from './components/LoginPage.tsx';
import MapView from './components/MapView.tsx';
import RegisterPage from './components/RegisterPage.tsx';
import ProfilePage from './components/ProfilePage.tsx';
import Footer from './components/Footer.tsx';
import LocationPermissionPrompt from './components/LocationPermissionPrompt.tsx';
import CategoryTiles from './components/CategoryTiles.tsx';
import Collections from './components/Collections.tsx';
import Localities from './components/Localities.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import AdminDashboardComplete from './components/AdminDashboardComplete.tsx';
import AdminLoginPage from './components/AdminLoginPage.tsx';
import PartnerDashboard from './components/PartnerDashboard.tsx';
import RestaurantDashboardComplete from './components/RestaurantDashboardComplete.tsx';
import DeliveryDashboard from './components/DeliveryDashboard.tsx';
import DeliveryDashboardComplete from './components/DeliveryDashboardComplete.tsx';
import CustomerDashboardComplete from './components/CustomerDashboardComplete.tsx';
import ServiceAreaCheck from './components/ServiceAreaCheck.tsx';
import CityDisplay from './components/CityDisplay.tsx';
import CheckoutLocationPrompt from './components/CheckoutLocationPrompt.tsx';
import FullScreenMapModal from './components/FullScreenMapModal.tsx';
import RestaurantLocationModal from './components/RestaurantLocationModal.tsx';
import RestaurantLocationMap from './components/RestaurantLocationMap.tsx';
import RestaurantInfoHub from './components/RestaurantInfoHub.tsx';
import ExplorePlaces from './components/ExplorePlaces.tsx';
import FoodieAssistant from './components/FoodieAssistant.tsx';
import ExploreAhmedabad from './components/ExploreAhmedabad.tsx';
import RestaurantSuggestionForm from './components/RestaurantSuggestionForm.tsx';
import RestaurantSuggestions from './components/RestaurantSuggestions.tsx';
import OrderCompletePage from './components/OrderCompletePage.tsx';
import TableBookingPage from './components/TableBookingPage.tsx';
import { AboutPage, ProjectDeckPage, TeamPage, BlogPage, CareersPage, InvestorPage, ReportFraudPage, ContactPage, FeedingIndiaPage, HyperpurePage, FlavorlandPage, WeatherUnionPage, AppsPage, EnterprisePage, PrivacyPage, TermsPage, SitemapPage, BlinkitPage } from './components/StaticPages.tsx';
import { orderService } from './services/orderService';
import { authService, restaurantService, foodService, suggestionService } from './services';
import { realtimeRestaurantService } from './services/realtimeRestaurantService';
import { locationFilterService, LocationStatus } from './services/locationFilterService';
import { gpsLocationService } from './services/gpsLocationService';
import { notificationService } from './services/notificationService';

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppViewState>('home');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dbCities, setDbCities] = useState<City[]>([]);
  const [userCoords, setUserCoords] = useState<LatLng>({ latitude: 23.0225, longitude: 72.5714, lat: 23.0225, lng: 72.5714 });
  const [locationName, setLocationName] = useState<string>('Ahmedabad, Gujarat');
  const [selectedRes, setSelectedRes] = useState<Restaurant | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [currentCity, setCurrentCity] = useState<string>('Ahmedabad');
  const [locationStatus, setLocationStatus] = useState<LocationStatus | null>(null);
  const [isOutsideServiceArea, setIsOutsideServiceArea] = useState(false);
  const [isMapView, setIsMapView] = useState(false);
  
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [selectedRestaurantForMap, setSelectedRestaurantForMap] = useState<Restaurant | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<{ collection: any; restaurants: Restaurant[] } | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false);
  const [showRestaurantInfoHub, setShowRestaurantInfoHub] = useState(false);
  const [isSuggestionFormOpen, setIsSuggestionFormOpen] = useState(false);
  const [restaurantSuggestions, setRestaurantSuggestions] = useState<any[]>([]);
  const [globalMenuItems, setGlobalMenuItems] = useState<any[]>([]);

  const loadRestaurantSuggestions = async () => {
    try {
      const response = await suggestionService.getSuggestions('approved');
      setRestaurantSuggestions(response?.suggestions || []);
    } catch (error) {
      console.warn('Suggestion API unavailable, falling back to local DB', error);
      setRestaurantSuggestions(await db.restaurantSuggestions.find());
    }
  };
  
  // Track last completed order details
  const [lastOrderId, setLastOrderId] = useState<string>('');
  const [lastOrderTotal, setLastOrderTotal] = useState<number>(0);

  const normalizeRole = (role?: string): User['role'] => {
    if (role === 'restaurant_owner') return 'restaurant';
    if (role === 'delivery_partner') return 'delivery';
    return (role as User['role']) || 'customer';
  };

  const handleViewChange = (view: string) => setCurrentView(view as AppViewState);

  const normalizeCoords = (coords: Partial<LatLng> & { lat?: number; lng?: number }) => ({
    latitude: coords.latitude ?? coords.lat ?? 0,
    longitude: coords.longitude ?? coords.lng ?? 0,
    lat: coords.latitude ?? coords.lat ?? 0,
    lng: coords.longitude ?? coords.lng ?? 0,
  });

  const normalizeUser = (rawUser: any): User => ({
    _id: rawUser?._id || rawUser?.id || '',
    name: rawUser?.name || 'User',
    email: rawUser?.email || '',
    role: normalizeRole(rawUser?.role),
    restaurantId: rawUser?.restaurantId || rawUser?.restaurant?._id || rawUser?.restaurant || '',
    createdAt: rawUser?.createdAt ? new Date(rawUser.createdAt).getTime() : Date.now(),
    address: rawUser?.address,
    walletBalance: rawUser?.walletBalance,
  });

  const normalizeRestaurant = (raw: any): Restaurant => ({
    _id: raw?._id || '',
    ownerId: raw?.ownerId || raw?.owner?._id || raw?.owner || '',
    name: raw?.name || 'Restaurant',
    description: raw?.description || '',
    cuisine: Array.isArray(raw?.cuisine) ? raw.cuisine : [],
    location: {
      address: raw?.address?.street
        ? `${raw.address.street}, ${raw.address.city || ''}`.trim()
        : raw?.location?.address || '',
      latitude: raw?.address?.coordinates?.latitude || raw?.location?.latitude || 23.0225,
      longitude: raw?.address?.coordinates?.longitude || raw?.location?.longitude || 72.5714,
      googleMapsUrl: raw?.location?.googleMapsUrl,
    },
    rating: raw?.rating || 0,
    isOpen: raw?.isOpen ?? true,
    imageUrl: raw?.imageUrl || raw?.image || raw?.images?.[0]?.url || aiImageService.getRestaurantImageUrl(raw?.name || 'Default'),
    image: raw?.image || raw?.imageUrl || raw?.images?.[0]?.url || aiImageService.getRestaurantThumbnail(raw?.name || 'Default'),
    deliveryTime: raw?.deliveryTime || '30 min',
    costForTwo: raw?.costForTwo || 0,
    createdAt: raw?.createdAt ? new Date(raw.createdAt).getTime() : Date.now(),
    walletBalance: raw?.walletBalance,
    menu: raw?.menu,
    signatureDish: raw?.signatureDish,
    contactPhone: raw?.contactPhone || raw?.phone,
    openingHours: raw?.openingHours,
    tablePrice: raw?.tablePrice,
    chairPrice: raw?.chairPrice,
  });

  useEffect(() => {
    // Show location prompt when cart opens
    if (isCartOpen && currentUser?.role === 'customer') {
      setShowLocationPrompt(true);
    }
  }, [isCartOpen, currentUser?.role]);

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserCoords(coords);
        try {
          // Check service area and get city
          const status = await locationFilterService.checkServiceArea(coords.latitude, coords.longitude);
          setLocationStatus(status);
          setCurrentCity(status.city);
          setLocationName(`${status.city}, Gujarat`);
          setIsOutsideServiceArea(!status.canOrder);
          localStorage.setItem('selectedCity', status.city);
        } catch (error) {
          console.error('Error checking service area:', error);
          setLocationName("Ahmedabad, Gujarat");
        } finally {
          setIsLocating(false);
          setLoading(false);
        }
      },
      () => {
        setIsLocating(false);
        setLoading(false);
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (window.location.pathname === '/adminLogin' || window.location.pathname === '/admin-login') {
      setCurrentView('admin_login' as any);
      window.history.replaceState(null, '', '/');
    }

    const init = async () => {
      await db.init();
      const storedUser = authService.getCurrentUser() || db.getCurrentUser();
      const user = storedUser ? normalizeUser(storedUser) : null;
      setCurrentUser(user);
      
      if (user) {
        if (user.role === 'admin') setCurrentView('admin');
        else if (user.role === 'restaurant') setCurrentView('partner');
        else if (user.role === 'delivery') setCurrentView('delivery');
      }

      try {
        const restaurantsResponse = await restaurantService.getRestaurants({ limit: 100 });
        let apiRestaurants = (restaurantsResponse?.restaurants || restaurantsResponse || []).map(normalizeRestaurant);
        setRestaurants(apiRestaurants);
        
        // Set up real-time subscription for restaurant updates
        realtimeRestaurantService.subscribeToUpdates((restaurants) => {
          const updated = (restaurants || []).map(normalizeRestaurant);
          if (updated.length > 0) {
            setRestaurants(updated);
            console.log('🔄 Restaurants updated in real-time:', updated.length);
          }
        });
      } catch (error) {
        console.warn('Restaurant API unavailable', error);
      }
      setDbCities(await db.cities.find());
      setCartItems(db.getCart());
      setCollections(await db.collections.find());
      await loadRestaurantSuggestions();
      try {
        const foodsResponse = await foodService.getFoods({ limit: 200 });
        const apiFoods = Array.isArray(foodsResponse) ? foodsResponse : foodsResponse?.foods || [];
        setGlobalMenuItems(apiFoods);
      } catch (error) {
        console.warn('Food API unavailable', error);
      }
      
      // Check saved city preference
      const savedCity = localStorage.getItem('selectedCity');
      if (savedCity) {
        setCurrentCity(savedCity);
      }

      // Initialize notification service for customers
      if (user?.role === 'customer' || !user) {
        try {
          await notificationService.initialize();
        } catch (error) {
          console.warn('Notification service initialization skipped:', error);
        }
      }
    };
    init();

    const unsubRestaurants = db.restaurants.subscribe(async () => {
      try {
        const restaurantsResponse = await restaurantService.getRestaurants({ limit: 100 });
        let apiRestaurants = (restaurantsResponse?.restaurants || restaurantsResponse || []).map(normalizeRestaurant);
        setRestaurants(apiRestaurants);
      } catch (e) {
        console.error('Restaurant sub update failed', e);
      }
    });

    const unsubCollections = db.collections.subscribe(async () => {
      setCollections(await db.collections.find());
    });

    const unsubSuggestions = db.restaurantSuggestions.subscribe(async () => {
      await loadRestaurantSuggestions();
    });

    const handleAddToCart = (e: any) => {
      const { item, restaurant } = e.detail;
      setCartItems(prev => {
        const existing = prev.find(i => i.item._id === item._id);
        const updated = existing 
          ? prev.map(i => i.item._id === item._id ? { ...i, qty: i.qty + 1 } : i)
          : [...prev, { item, restaurant, qty: 1 }];
        db.setCart(updated);
        return updated;
      });
      setIsCartOpen(true);
    };

    window.addEventListener('addToCart', handleAddToCart);
    return () => {
      window.removeEventListener('addToCart', handleAddToCart);
      unsubRestaurants();
      unsubCollections();
      unsubSuggestions();
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    db.logout();
    setCurrentUser(null);
    setCurrentView('home');
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCartItems(prev => {
      const updated = prev.map(i => {
        if (i.item._id === itemId) {
          const newQty = Math.max(0, i.qty + delta);
          return { ...i, qty: newQty };
        }
        return i;
      }).filter(i => i.qty > 0);
      db.setCart(updated);
      return updated;
    });
  };

  const handleCheckout = async (paymentMethod: string, address: string) => {
    if (!currentUser) {
      setCurrentView('login');
      setIsCartOpen(false);
      return;
    }

    // Get live GPS location before checkout
    let finalCoords = userCoords;
    try {
      const liveCoords = await gpsLocationService.getCurrentLocation();
      finalCoords = {
        latitude: liveCoords.latitude,
        longitude: liveCoords.longitude,
        lat: liveCoords.latitude,
        lng: liveCoords.longitude
      };
      console.log('✅ Live GPS captured:', finalCoords);
    } catch (error) {
      console.warn('⚠️ GPS unavailable, using default:', userCoords);
      // Continue with default coordinates if GPS fails
    }

    const subtotal = cartItems.reduce((a, b) => a + (b.item.price * b.qty), 0);
    const platformFee = 15;
    const gst = Math.round(subtotal * 0.05);
    const deliveryFee = 25;
    const total = subtotal + platformFee + gst + deliveryFee;

    const orderPayload = {
      restaurant: cartItems[0]?.restaurant?._id,
      items: cartItems.map((i) => ({
        food: i.item._id,
        quantity: i.qty,
        specialInstructions: i.item.specialInstructions || ''
      })),
      deliveryAddress: {
        street: address,
        city: currentCity || 'Ahmedabad',
        state: 'Gujarat',
        zipCode: '',
        coordinates: {
          latitude: finalCoords.latitude,
          longitude: finalCoords.longitude
        }
      },
      paymentMethod: paymentMethod === 'cod' ? 'cash_on_delivery' : paymentMethod === 'upi' ? 'online' : paymentMethod === 'card' ? 'online' : 'cash_on_delivery',
      totalAmount: total,
      deliveryFee,
      taxAmount: gst,
    };
    
    console.log('📦 Order payload:', orderPayload);

    try {
      const result = await orderService.createOrder(orderPayload);

      setCartItems([]);
      db.setCart([]);
      setIsCartOpen(false);
      setLastOrderId(result?.order?.orderId || result?._id || 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase());
      setLastOrderTotal(total);
      setCurrentView('order_complete');
    } catch (err: any) {
      console.error('❌ Order creation failed:', err);
      
      // Check if it's a location-related error
      if (err.message?.includes('location') || err.response?.status === 400) {
        alert('❌ Order Failed:\n\nLocation data is missing or invalid.\n\nPlease:\n1. Enable GPS location\n2. Check your address details\n3. Try again');
        return;
      }

      alert('❌ Checkout failed. Please check:\n1. Internet connection\n2. Location permissions enabled\n3. Address details complete\n\nTry again');
    }
  };

  const sortedRestaurants = useMemo(() => {
    const term = searchQuery.toLowerCase();
    let list = restaurants.filter(res => {
      // Filter by current city (Strictly Ahmedabad for FlavorFinder as requested)
      const resCity = res.location?.address?.toLowerCase() || '';
      const matchesCity = currentCity.toLowerCase() === 'ahmedabad' || resCity.includes('ahmedabad') || resCity === ''; 
      
      const matchesSearch = !searchQuery || 
                            res.name.toLowerCase().includes(term) || 
                            res.cuisine.some(c => c.toLowerCase().includes(term)) ||
                            globalMenuItems.some(m => m.restaurantId === res._id && m.itemName.toLowerCase().includes(term));
      
      const matchesPrice = !maxPrice || res.costForTwo <= maxPrice;
      
      // Filter by selected category if not 'All'
      const matchesCategory = selectedCategory === 'All' ||
                             (selectedCategory === 'street_food'
                                ? res.cuisine.some(c => ['street food', 'lari', 'street', 'gujarati snacks'].includes(c.toLowerCase()))
                                : res.cuisine.some(c => c.toLowerCase().includes(selectedCategory.toLowerCase())));
      
      return matchesCity && matchesSearch && matchesPrice && matchesCategory;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'cost_low') return a.costForTwo - b.costForTwo;
      if (sortBy === 'cost_high') return b.costForTwo - a.costForTwo;
      if (sortBy === 'delivery_time') return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
      return 0;
    });

    return list;
  }, [restaurants, searchQuery, sortBy, maxPrice, currentCity, selectedCategory, globalMenuItems]);

  const recommendedRestaurants = useMemo(() => {
    if (!sortedRestaurants.length) return [];
    const hour = new Date().getHours();
    let filtered: Restaurant[] = [];
    
    if (hour < 11) {
      filtered = sortedRestaurants.filter(r => r.cuisine.some(c => ['breakfast', 'cafe', 'continental'].includes(c.toLowerCase())));
    } else if (hour < 16) {
      filtered = sortedRestaurants.filter(r => r.cuisine.some(c => ['lunch', 'street food', 'gujarati', 'asian'].includes(c.toLowerCase())));
    } else if (hour < 20) {
      filtered = sortedRestaurants.filter(r => r.cuisine.some(c => ['dinner', 'fine dining', 'italian', 'japanese'].includes(c.toLowerCase())));
    } else {
      filtered = sortedRestaurants;
    }
    
    // Remove duplicates by restaurant ID
    const seen = new Set<string>();
    const unique = filtered.filter(r => {
      if (seen.has(r._id)) return false;
      seen.add(r._id);
      return true;
    });
    
    return unique.slice(0, 4);
  }, [sortedRestaurants]);

  const isAuthority = currentUser && (currentUser.role === 'admin' || currentUser.role === 'restaurant');

  const handleCityChange = (city: string, status: LocationStatus) => {
    setCurrentCity(city);
    setLocationStatus(status);
    localStorage.setItem('selectedCity', city);
    setIsOutsideServiceArea(!status.canOrder);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setCurrentView('city_listing');
  };

  const handleSuggestionSubmit = async (suggestion: any) => {
    const saveObj = {
      ...suggestion,
      createdAt: Date.now(),
      status: 'pending' as const
    };

    try {
      const response = await suggestionService.submitSuggestion(saveObj);
      const savedSuggestion = response?.suggestion || saveObj;
      setRestaurantSuggestions(prev => [...prev, savedSuggestion]);
      alert('✨ Thank you for suggesting ' + suggestion.name + '! Our team will review it soon.');
      return;
    } catch (error) {
      console.error('Suggestion service unavailable:', error);
      alert('Oops! Could not save your suggestion right now. Please try again.');
    }
  };

  const sortOptions: { id: SortOption; label: string; icon: string }[] = [
    { id: 'relevance', label: 'Relevance', icon: 'fa-sort' },
    { id: 'rating', label: 'Rating: High to Low', icon: 'fa-star' },
    { id: 'cost_low', label: 'Price: Low to High', icon: 'fa-arrow-down-short-wide' },
    { id: 'cost_high', label: 'Price: High to Low', icon: 'fa-arrow-up-wide-short' },
    { id: 'delivery_time', label: 'Delivery Time', icon: 'fa-clock' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Service Area Check for logged-in customers */}
      {currentView === 'home' && currentUser?.role === 'customer' && (
        <ServiceAreaCheck 
          onOutsideArea={(status) => setIsOutsideServiceArea(true)}
          onLocationVerified={(status) => {
            setLocationStatus(status);
            setIsOutsideServiceArea(!status.canOrder);
          }}
        />
      )}
      {currentView === 'admin' && currentUser?.role === 'admin' ? (
        <AdminDashboardComplete />
      ) : currentView === 'partner' && currentUser?.role === 'restaurant' ? (
        <RestaurantDashboardComplete currentUser={currentUser} onLogout={handleLogout} onViewChange={handleViewChange} />
      ) : currentView === 'delivery' && currentUser?.role === 'delivery' ? (
        <DeliveryDashboardComplete currentUser={currentUser} onLogout={handleLogout} onViewChange={handleViewChange} />
      ) : currentView === 'customer-dashboard' && currentUser?.role === 'customer' ? (
        <CustomerDashboardComplete currentUser={currentUser} onLogout={handleLogout} onViewChange={handleViewChange} />
      ) : (
        <>
          {isAuthority && (
            <div className={`fixed top-0 left-0 right-0 z-[1500] px-6 py-2 flex items-center justify-between text-white shadow-xl ${currentUser?.role === 'admin' ? 'bg-[#5D2E8C]' : 'bg-[#1C1C1C]'}`}>
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-black border border-white/10">
                    {currentUser?.role.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest">{currentUser?.role} Console Active</p>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setCurrentView(currentUser?.role === 'admin' ? 'admin' : 'partner')} className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">Command Center</button>
                  <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase"><i className="fa-solid fa-power-off"></i></button>
               </div>
            </div>
          )}

          <div className={isAuthority ? 'pt-12' : ''}>
            {currentView !== 'home' && (
              <Header 
                locationName={locationName} userCoords={userCoords} dbCities={dbCities}
                onOpenLocationPicker={requestLocation} searchQuery={searchQuery} onSearch={(t) => { setSearchQuery(t); setCurrentView('city_listing'); }} 
                onLogoClick={() => { setCurrentView('home'); setSearchQuery(''); }} 
                onAuthClick={() => setCurrentView('login')} currentUser={currentUser} 
                onLogout={handleLogout} onViewChange={handleViewChange} 
                onLocationSelect={(name, coords) => { setLocationName(name); setUserCoords(normalizeCoords(coords)); }}
                onCityChange={handleCityChange}
                isLocating={isLocating}
              />
            )}

            <main className="transition-all">
              {currentView === 'home' && (
                <>
                  <Hero 
                    locationName={locationName} dbCities={dbCities}
                    onOpenLocationPicker={requestLocation} onSearch={(t) => { setSearchQuery(t); setCurrentView('city_listing'); }} 
                    onAuthClick={(mode) => { setCurrentView(mode === 'signup' ? 'register' : 'login'); }} currentUser={currentUser} 
                    onLogout={handleLogout} onViewChange={handleViewChange} 
                    onLocationSelect={(name, coords) => { setLocationName(name); setUserCoords(normalizeCoords(coords)); }}
                    onOpenSuggestionForm={() => setIsSuggestionFormOpen(true)}
                    onCityChange={handleCityChange}
                    onCategoryFilter={handleCategoryFilter}
                  />
                  <div className="max-w-7xl mx-auto px-4 py-16">
                    <CategoryTiles onSelect={() => setCurrentView('city_listing')} />
                    <Collections 
                      city="Ahmedabad" 
                      collections={collections}
                      restaurants={restaurants}
                      onCollectionClick={(collection, collectionRestaurants, isExplore) => {
                        if (isExplore) {
                          setIsExploreModalOpen(true);
                        } else {
                          setSelectedCollection({ collection, restaurants: collectionRestaurants });
                        }
                      }}
                      onViewMap={(restaurant) => {
                        setSelectedRestaurantForMap(restaurant);
                        setIsLocationModalOpen(true);
                      }}
                    />
                    <RestaurantSuggestions 
                      suggestions={restaurantSuggestions}
                      onOpenForm={() => setIsSuggestionFormOpen(true)}
                    />
                    <Localities city="Ahmedabad" localities={[]} loading={loading} />
                  </div>
                </>
              )}

              {currentView === 'city_listing' && (
                <div className="max-w-7xl mx-auto px-4 py-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 tracking-tight">Food in Ahmedabad</h2>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Best curated spots for you</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl md:ml-auto">
                       <button onClick={() => setIsMapView(false)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${!isMapView ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>List</button>
                       <button onClick={() => setIsMapView(true)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 ${isMapView ? 'bg-white text-[#EF4F5F] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                         <i className="fa-solid fa-map"></i> Map
                       </button>
                    </div>
                    
                    {/* Sort & Filter Bar */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                       <button 
                        onClick={() => setMaxPrice(maxPrice === 500 ? null : 500)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                          maxPrice === 500 
                          ? 'bg-[#EF4F5F] text-white border-[#EF4F5F] shadow-lg shadow-[#EF4F5F]/20' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                        }`}
                       >
                         <i className="fa-solid fa-tags"></i> Food Under ₹500
                       </button>
                       <button 
                        onClick={() => setMaxPrice(maxPrice === 1800 ? null : 1800)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                          maxPrice === 1800 
                          ? 'bg-[#EF4F5F] text-white border-[#EF4F5F] shadow-lg shadow-[#EF4F5F]/20' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                        }`}
                       >
                         <i className="fa-solid fa-calendar-check"></i> Booking Under ₹1800
                       </button>
                       <div className="w-[1px] h-6 bg-gray-100 mx-2"></div>
                       {sortOptions.map(opt => (
                         <button
                           key={opt.id}
                           onClick={() => setSortBy(opt.id)}
                           className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                             sortBy === opt.id 
                             ? 'bg-gray-900 text-white border-gray-900 shadow-xl' 
                             : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                           }`}
                         >
                           <i className={`fa-solid ${opt.icon}`}></i> {opt.label}
                         </button>
                       ))}
                    </div>
                  </div>

                  {recommendedRestaurants.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-black text-gray-900 mb-4">Recommended for you</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {recommendedRestaurants.map(res => (
                          <RestaurantCard 
                            key={res._id + '-rec'}
                            restaurant={res}
                            currentUser={currentUser}
                            onClick={() => {
                              setSelectedRes(res);
                              setShowRestaurantInfoHub(true);
                            }}
                            onMapViewClick={(restaurant) => {
                              setSelectedRestaurantForMap(restaurant);
                              setIsLocationModalOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {globalMenuItems.length > 0 && (
                    <div className="mb-12">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                        <div>
                          <h2 className="text-2xl font-black text-gray-900">All delivery dishes</h2>
                          <p className="text-gray-500 text-sm mt-1">Browse every available menu item from restaurants in Ahmedabad.</p>
                        </div>
                        <div className="text-sm text-gray-400 uppercase tracking-widest font-black">Serving delivery now</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {globalMenuItems.slice(0, 12).map((item: any) => {
                          const restaurant = item.restaurant && typeof item.restaurant === 'object'
                            ? item.restaurant
                            : restaurants.find(r => r._id === item.restaurant);
                          const itemName = item.name || item.itemName || 'Dish';
                          const price = item.discountedPrice || item.price || 0;

                          return (
                            <div key={item._id} className="bg-white rounded-[40px] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                              <div className="flex items-start gap-4">
                                <div className={`${item.isVeg ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest`}>{item.isVeg ? 'Veg' : 'Non-Veg'}</div>
                                <span className="text-xs text-gray-400 uppercase tracking-widest">{restaurant?.name || 'Restaurant'}</span>
                              </div>
                              <div className="mt-4 min-h-[180px] overflow-hidden rounded-[32px] bg-gray-50">
                                <img src={item.image || item.images?.[0] || restaurant?.imageUrl || 'https://via.placeholder.com/400x300'} alt={itemName} className="w-full h-44 object-cover" />
                              </div>
                              <div className="mt-5">
                                <h3 className="text-xl font-black text-gray-900 leading-tight">{itemName}</h3>
                                <p className="text-gray-500 text-sm mt-2 line-clamp-2">{item.description || item.category || 'Delicious menu item from the restaurant.'}</p>
                              </div>
                              <div className="mt-6 flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-2xl font-black">₹{price}</p>
                                  {item.discount && <p className="text-xs text-emerald-500 uppercase tracking-widest">{item.discount}% off</p>}
                                </div>
                                <button
                                  onClick={() => window.dispatchEvent(new CustomEvent('addToCart', { detail: { item, restaurant } }))}
                                  className="px-5 py-3 rounded-2xl bg-gray-900 text-white text-[10px] uppercase font-black tracking-widest hover:bg-[#EF4F5F] transition-all"
                                >
                                  Add to Cart
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {sortedRestaurants.length > 0 ? (
                    isMapView ? (
                      <div className="w-full h-[600px] mt-8 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                        <MapView 
                          restaurants={sortedRestaurants} 
                          center={userCoords} 
                          onRestaurantClick={(res) => { setSelectedRes(res); setShowRestaurantInfoHub(true); }}
                          onClose={() => setIsMapView(false)}
                          isInline={true}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {sortedRestaurants.map(res => (
                          <RestaurantCard 
                            key={res._id} 
                            restaurant={res} 
                            currentUser={currentUser}
                            onClick={() => {
                              setSelectedRes(res);
                              setShowRestaurantInfoHub(true);
                            }}
                            onMapViewClick={(restaurant) => {
                              setSelectedRestaurantForMap(restaurant);
                              setIsLocationModalOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                       <i className="fa-solid fa-utensils text-4xl text-gray-200 mb-4 block"></i>
                       <h3 className="text-gray-500 font-black uppercase tracking-widest">No restaurants found</h3>
                       <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search query.</p>
                       <button 
                        onClick={() => { setMaxPrice(null); setSortBy('relevance'); setSearchQuery(''); }}
                        className="mt-6 text-[#EF4F5F] font-black uppercase tracking-widest text-[10px] hover:underline"
                       >
                         Clear All Filters
                       </button>
                    </div>
                  )}
                </div>
              )}

              {currentView === 'restaurant' && selectedRes && (
                <Suspense fallback={<div className="py-20 text-center text-sm text-gray-500">Loading restaurant details…</div>}>
                  <RestaurantDetail 
                    restaurant={selectedRes} currentUser={currentUser} 
                    onClose={() => setCurrentView('city_listing')} 
                  />
                </Suspense>
              )}

              {currentView === 'history' && (
                <div className="max-w-4xl mx-auto py-12 px-4">
                   <OrderHistory userCoords={userCoords} onGoHome={() => setCurrentView('home')} onOrderAgain={() => {}} currentUser={currentUser} />
                </div>
              )}

              {currentView === 'profile' && currentUser && (
                <ProfilePage 
                  onLogout={handleLogout} 
                  onViewChange={handleViewChange} 
                  onProfileUpdated={(updatedUser) => setCurrentUser(updatedUser)}
                />
              )}

              {currentView === 'explore_ahmedabad' && (
                <ExploreAhmedabad />
              )}

              {currentView === 'order_complete' && (
                <OrderCompletePage 
                  lastOrderId={lastOrderId}
                  totalAmount={lastOrderTotal}
                  onReturnHome={() => setCurrentView('home')}
                  onTrackOrder={() => setCurrentView('history')}
                />
              )}

              {currentView === 'book_table' && selectedRes && currentUser && (
                 <TableBookingPage 
                   restaurantId={selectedRes._id}
                   restaurantName={selectedRes.name}
                   isNightclub={selectedRes.cuisine.map(c => c.toLowerCase()).some(c => c === 'nightlife' || c === 'club' || c === 'clubs')}
                   onClose={() => setCurrentView('home')}
                   onBookingComplete={(details) => {
                     setCurrentView('home');
                   }}
                 />
              )}

              {currentView === 'login' && (
                <LoginPage onLoginSuccess={(u) => {
                  const normalized = normalizeUser(u);
                  setCurrentUser(normalized);
                  if (normalized?.role === 'admin') setCurrentView('admin');
                  else if (normalized?.role === 'restaurant') setCurrentView('partner');
                  else if (normalized?.role === 'delivery') setCurrentView('delivery');
                  else setCurrentView('home');
                }} onGoBack={() => setCurrentView('home')} onViewChange={handleViewChange} />
              )}

              {currentView === 'admin_login' && (
                <AdminLoginPage 
                  onLoginSuccess={(u) => {
                    const normalized = normalizeUser(u);
                    setCurrentUser(normalized);
                    if (normalized?.role === 'admin') setCurrentView('admin');
                  }} 
                  onGoBack={() => setCurrentView('home')} 
                  onViewChange={handleViewChange} 
                />
              )}

              {currentView === 'register' && (
                <RegisterPage 
                  onSuccess={(user) => {
                    if (user) {
                      // User was logged in immediately after registration
                      const normalized = normalizeUser(user);
                      setCurrentUser(normalized);
                      if (normalized?.role === 'admin') setCurrentView('admin');
                      else if (normalized?.role === 'restaurant') setCurrentView('partner');
                      else if (normalized?.role === 'delivery') setCurrentView('delivery');
                      else setCurrentView('home');
                    } else {
                      // Fallback to login view
                      setCurrentView('login');
                    }
                  }}
                  onLoginClick={() => setCurrentView('login')}
                />
              )}

              {currentView === 'about' && <AboutPage />}
              {currentView === 'presentation' && <ProjectDeckPage />}
              {currentView === 'team' && <TeamPage />}
              {currentView === 'blog' && <BlogPage />}
              {currentView === 'careers' && <CareersPage />}
              {currentView === 'investor' && <InvestorPage />}
              {currentView === 'report_fraud' && <ReportFraudPage />}
              {currentView === 'contact' && <ContactPage />}
              {currentView === 'feeding_india' && <FeedingIndiaPage />}
              {currentView === 'hyperpure' && <HyperpurePage />}
              {currentView === 'flavorland' && <FlavorlandPage />}
              {currentView === 'weather' && <WeatherUnionPage />}
              {currentView === 'apps' && <AppsPage />}
              {currentView === 'enterprise' && <EnterprisePage />}
              {currentView === 'privacy' && <PrivacyPage />}
              {currentView === 'terms' && <TermsPage />}
              {currentView === 'sitemap' && <SitemapPage />}
              {currentView === 'blinkit' && <BlinkitPage />}
            </main>
          </div>
          <Footer onViewChange={handleViewChange} />
          <FoodieAssistant userLocation={userCoords} />

          {isCartOpen && (
            <>
              {showLocationPrompt && (
                <CheckoutLocationPrompt 
                  onLocationReady={(coords) => {
                    if (coords) {
                      setUserCoords(normalizeCoords(coords));
                    }
                    setShowLocationPrompt(false);
                  }}
                  onCancel={() => {
                    setShowLocationPrompt(false);
                    setIsCartOpen(false);
                  }}
                />
              )}
              <CartModal 
                items={cartItems}
                onClose={() => setIsCartOpen(false)}
                onUpdateQty={handleUpdateQty}
                onCheckout={handleCheckout}
                currentLocation={locationName}
                locationCoords={userCoords}
                onOpenLocationPicker={requestLocation}
              />
            </>
          )}

          {/* Restaurant Info Hub - Comprehensive Info Page */}
          {showRestaurantInfoHub && selectedRes && (
            <RestaurantInfoHub
              restaurant={selectedRes}
              userLocation={userCoords}
              currentUser={currentUser}
              onClose={() => setShowRestaurantInfoHub(false)}
              onAddToCart={(item) => {
                setCartItems(prev => {
                  const existing = prev.find(i => i.item._id === item._id);
                  const updated = existing 
                    ? prev.map(i => i.item._id === item._id ? { ...i, qty: i.qty + 1 } : i)
                    : [...prev, { item, restaurant: selectedRes, qty: 1 }];
                  db.setCart(updated);
                  return updated;
                });
                setIsCartOpen(true);
              }}
              onOrderFood={() => {
                if (!currentUser) {
                  // Redirect to login if not authenticated
                  setCurrentView('login');
                  setShowRestaurantInfoHub(false);
                  alert('Please login to place an order');
                  return;
                }
                setShowRestaurantInfoHub(false);
                setIsCartOpen(true);
              }}
              onBookTable={() => {
                if (!currentUser) {
                  setCurrentView('login');
                  setShowRestaurantInfoHub(false);
                  alert('Please login to book a table');
                  return;
                }
                setShowRestaurantInfoHub(false);
                setCurrentView('book_table');
              }}
            />
          )}

          {/* Restaurant Location Modal */}
          <RestaurantLocationModal
            isOpen={isLocationModalOpen}
            restaurant={selectedRestaurantForMap || restaurants[0]}
            userLocation={userCoords}
            onClose={() => {
              setIsLocationModalOpen(false);
              setSelectedRestaurantForMap(null);
            }}
            onOrderFood={() => {
              setIsLocationModalOpen(false);
              if (selectedRestaurantForMap) {
                setSelectedRes(selectedRestaurantForMap);
                setShowRestaurantInfoHub(true);
              }
            }}
            onBookTable={() => {
              setIsLocationModalOpen(false);
              if (!currentUser) {
                setCurrentView('login');
                alert('Please login to book a table');
                return;
              }
              if (selectedRestaurantForMap) setSelectedRes(selectedRestaurantForMap);
              setCurrentView('book_table');
            }}
          />

          {/* Full Screen Map Modal (Legacy) */}
          {selectedRestaurantForMap && !isLocationModalOpen && (
            <FullScreenMapModal 
              restaurant={selectedRestaurantForMap}
              userLocation={userCoords}
              onClose={() => setSelectedRestaurantForMap(null)}
            />
          )}

          {/* Explore Ahmedabad Foods Modal */}
          {isExploreModalOpen && (
            <div className="fixed inset-0 z-[1300] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
              <div className="bg-white w-full max-w-4xl rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-6 flex items-center justify-between sticky top-0 z-10">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                      <i className="fa-solid fa-map"></i>
                      Explore Ahmedabad Foods
                    </h2>
                    <p className="text-sm text-white/90 mt-1">Discover amazing food destinations across the city</p>
                  </div>
                  <button
                    onClick={() => setIsExploreModalOpen(false)}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                  >
                    <i className="fa-solid fa-xmark text-white text-xl"></i>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <ExplorePlaces
                    userLocation={userCoords}
                    onRestaurantClick={(restaurant) => {
                      setSelectedRes(restaurant);
                      setCurrentView('restaurant');
                      setIsExploreModalOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Collection View Modal */}
          {selectedCollection && selectedCollection.restaurants.length > 0 && (
            <div className="fixed inset-0 z-[1400] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
              <div className="bg-white w-full max-w-4xl rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#EF4F5F] to-[#FF6B7B] text-white px-6 py-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{selectedCollection.collection.title}</h2>
                    <p className="text-sm text-white/90 mt-1">{selectedCollection.restaurants.length} restaurants in this collection</p>
                  </div>
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                  >
                    <i className="fa-solid fa-xmark text-white text-xl"></i>
                  </button>
                </div>

                {/* Restaurants Grid */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {selectedCollection.restaurants.map((res) => (
                      <div 
                        key={res._id}
                        onClick={() => {
                          setSelectedRes(res);
                          setCurrentView('restaurant');
                          setSelectedCollection(null);
                        }}
                        className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
                      >
                        <div className="relative h-40 overflow-hidden bg-gray-50">
                          <img
                            src={res.imageUrl}
                            alt={res.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full text-xs font-black text-orange-500 shadow-sm">
                            ⭐ {res.rating.toFixed(1)}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-black text-gray-900 mb-1 truncate">{res.name}</h3>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-3 line-clamp-2">
                            {res.cuisine.join(', ')}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-700 font-bold">₹{res.costForTwo}</span>
                            <span className="text-gray-500 font-semibold">{res.deliveryTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <RestaurantSuggestionForm 
            isOpen={isSuggestionFormOpen}
            onClose={() => setIsSuggestionFormOpen(false)}
            onSubmit={handleSuggestionSubmit}
            currentUserEmail={currentUser?.email || ''}
          />
        </>
      )}
    </div>
  );
};

export default App;
