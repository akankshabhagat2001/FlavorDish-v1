
import React, { useState, useEffect, useRef } from 'react';
import { UserType, AppViewState, LatLng, City } from '../types.ts';
import { getSearchSuggestions, getCityResolution } from '../services/geminiService.ts';
import { AHMEDABAD_LOCALITIES } from '../database/data.ts';
import CityDisplay from './CityDisplay.tsx';
import { LocationStatus } from '../services/locationFilterService.ts';

interface HeroProps {
  locationName: string;
  dbCities: City[];
  onOpenLocationPicker: () => void;
  onSearch: (term: string) => void;
  onAuthClick: (mode: 'login' | 'signup') => void;
  currentUser: any;
  onLogout: () => void;
  onViewChange: (view: AppViewState) => void;
  onLocationSelect: (name: string, coords: LatLng) => void;
  onOpenSuggestionForm?: () => void;
  onCityChange?: (city: string, status: LocationStatus) => void;
  onCategoryFilter?: (category: string) => void;
}

const Hero: React.FC<HeroProps> = ({ 
  locationName, 
  dbCities,
  onOpenLocationPicker, 
  onSearch, 
  onAuthClick, 
  currentUser, 
  onLogout,
  onViewChange,
  onLocationSelect,
  onOpenSuggestionForm,
  onCityChange,
  onCategoryFilter
}) => {
  const [locSearchValue, setLocSearchValue] = useState(locationName);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<{term: string, type: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locDropdownRef = useRef<HTMLDivElement>(null);

  const categories = ['All', 'Pizza', 'Chinese', 'Fast Food', 'Veg Meals', 'Burgers', 'Desserts', 'Breakfast'];

  useEffect(() => {
    setLocSearchValue(locationName);
  }, [locationName]);

  const handleLocInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocSearchValue(e.target.value);
    setShowLocDropdown(true);
  };

  const handleLocSelect = async (localityName: string) => {
    const resolved = await getCityResolution(localityName);
    if (resolved) {
      onLocationSelect(resolved.name.includes('Ahmedabad') ? resolved.name : `${resolved.name}, Ahmedabad`, resolved.coords);
    }
    setShowLocDropdown(false);
  };

  const getDashboardView = (role: UserType): AppViewState => {
    if (role === 'admin') return 'admin';
    if (role === 'restaurant') return 'partner';
    if (role === 'delivery') return 'delivery';
    return 'customer-dashboard';
  };

  return (
    <div className="relative h-screen min-h-[650px] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-50 p-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex gap-8">
          {currentUser && currentUser.role !== 'customer' ? (
            <button onClick={() => onViewChange(getDashboardView(currentUser.role))} className="bg-white/10 backdrop-blur-md text-white px-5 py-2 rounded-xl font-bold text-xs tracking-tight hover:bg-[#EF4F5F] transition-all border border-white/20 uppercase">
              Manage Platform
            </button>
          ) : (
            <button onClick={() => onAuthClick('signup')} className="text-white font-bold text-sm tracking-tight hover:opacity-80 transition-opacity">Restaurant Partners</button>
          )}
        </div>
        <div className="flex gap-10 items-center">
           {!currentUser ? (
             <>
               <button onClick={() => onAuthClick('login')} className="text-white font-bold text-sm tracking-tight">Log in</button>
               <button onClick={() => onAuthClick('signup')} className="text-white font-bold text-sm tracking-tight">Sign up</button>
             </>
           ) : (
             <div className="flex gap-8 items-center">
               {currentUser.role === 'customer' && <button onClick={() => onViewChange(getDashboardView(currentUser.role))} className="text-white font-bold text-sm tracking-tight">Orders</button>}
               <button onClick={() => onViewChange('profile')} className="text-white font-bold text-sm tracking-tight">Profile</button>
               <button onClick={onLogout} className="text-white font-bold text-sm tracking-tight">Log out</button>
             </div>
           )}
        </div>
      </div>

      <div className="absolute inset-0">
        <img 
          src="/images/background of website.jpg" 
          alt="Food Background" 
          className="w-full h-full object-cover" 
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-amber-900/50 to-orange-900/60"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl px-4 text-center flex flex-col items-center">
        {/* Brand Logo with Enhanced Animation */}
        <div className="mb-8 animate-bounce flex flex-col items-center">
          <img src="/images/logo.png" alt="flavorfinder logo" className="h-[120px] md:h-[180px] w-auto object-contain drop-shadow-2xl" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-white italic tracking-tighter drop-shadow-2xl bg-gradient-to-r from-red-400 via-pink-400 to-orange-400 bg-clip-text text-transparent hidden" style={{textShadow: '0 8px 30px rgba(239, 79, 95, 0.6)'}}>
            flavorfinder
          </h1>
          <div className="h-1.5 w-40 bg-gradient-to-r from-[#EF4F5F] via-orange-400 to-yellow-400 mx-auto mt-4 rounded-full shadow-lg animate-pulse"></div>
        </div>

        {/* Tagline with better contrast */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 drop-shadow-xl">
          🍽️ Discover Authentic Flavors in Ahmedabad
        </h2>
        <p className="text-white text-sm sm:text-base mb-10 max-w-2xl drop-shadow-lg font-semibold">
          Join thousands of food lovers discovering the best restaurants, dishes & dining experiences
        </p>

        {/* Category Filter Tabs */}
        <div className="w-full mb-10 overflow-x-auto animate-fade-in">
          <div className="flex gap-3 justify-center pb-3 px-2 min-w-max mx-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  if (onCategoryFilter) onCategoryFilter(category);
                }}
                className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-200 drop-shadow-md ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#EF4F5F] to-orange-500 text-white shadow-2xl scale-110'
                    : 'bg-white/25 text-white hover:bg-white/40 backdrop-blur-md border-2 border-white/40 hover:border-white/60'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Call-to-Action Button */}
        <div className="mt-8 animate-fade-in">
          <button
            onClick={onOpenSuggestionForm}
            className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105 drop-shadow-lg flex items-center gap-2 mx-auto"
          >
            <i className="fa-solid fa-lightbulb"></i>Found a Hidden Gem?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
