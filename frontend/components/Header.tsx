
import React, { useState, useEffect, useRef } from 'react';
import { UserType, AppViewState, LatLng, City } from '../types.ts';
import { AHMEDABAD_LOCALITIES } from '../database/data.ts';
import CityDisplay from './CityDisplay.tsx';
import { LocationStatus } from '../services/locationFilterService.ts';
import { getCityResolution } from '../services/geminiService.ts';

interface HeaderProps {
  onSearch: (term: string) => void;
  searchQuery: string;
  showSearch?: boolean;
  locationName: string;
  userCoords: LatLng;
  dbCities: City[];
  onOpenLocationPicker: () => void;
  onLogoClick: () => void;
  onAuthClick: (mode: 'login' | 'signup') => void;
  currentUser: any;
  onLogout: () => void;
  onViewChange: (view: AppViewState) => void;
  onLocationSelect: (name: string, coords: LatLng) => void;
  onCityChange?: (city: string, status: LocationStatus) => void;
  isLocating?: boolean;
}

const RECENT_SEARCHES_KEY = 'flavorfinder_recent_searches';
const RECENT_LOCATIONS_KEY = 'flavorfinder_recent_locations';

const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  searchQuery,
  showSearch = true, 
  locationName, 
  userCoords,
  dbCities,
  onOpenLocationPicker,
  onLogoClick,
  onAuthClick,
  currentUser,
  onLogout,
  onViewChange,
  onLocationSelect,
  onCityChange,
  isLocating = false
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{term: string, type: string}[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentLocations, setRecentLocations] = useState<{name: string, coords: LatLng}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isResolvingLoc, setIsResolvingLoc] = useState(false);
  const [locSearchValue, setLocSearchValue] = useState(locationName);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchQuery);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locDropdownRef = useRef<HTMLDivElement>(null);
  const locInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setLocSearchValue(locationName);
  }, [locationName]);

  useEffect(() => {
    setLocalSearchTerm(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) setRecentSearches(JSON.parse(stored));

    const storedLocs = localStorage.getItem(RECENT_LOCATIONS_KEY);
    if (storedLocs) setRecentLocations(JSON.parse(storedLocs));

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (locDropdownRef.current && !locDropdownRef.current.contains(event.target as Node)) {
        setShowLocDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (locSearchValue.length > 0 && locSearchValue !== locationName) {
      const filtered = AHMEDABAD_LOCALITIES.filter(locality => 
        locality.toLowerCase().includes(locSearchValue.toLowerCase())
      ).slice(0, 5);
      setLocationSuggestions(filtered);
    } else {
      setLocationSuggestions([]);
    }
  }, [locSearchValue, locationName]);

  const handleLocInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocSearchValue(e.target.value);
    setShowLocDropdown(true);
  };

  const handleLocSelect = async (cityName: string) => {
    setLocSearchValue(cityName);
    setIsResolvingLoc(true);
    try {
      const resolved = await getCityResolution(cityName);
      if (resolved) {
        onLocationSelect(resolved.name, resolved.coords);
        saveRecentLocation(resolved.name, resolved.coords);
      }
    } catch (err) {
      console.warn("Loc resolution failed.");
    } finally {
      setIsResolvingLoc(false);
      setShowLocDropdown(false);
    }
  };

  const saveRecentLocation = (name: string, coords: LatLng) => {
    const newLocs = [{name, coords}, ...recentLocations.filter(l => l.name !== name)].slice(0, 5);
    setRecentLocations(newLocs);
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(newLocs));
  };

  const fetchSuggestions = (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    // Static food-related suggestions
    const staticSuggestions = [
      { term: 'pizza', type: 'cuisine' },
      { term: 'burger', type: 'dish' },
      { term: 'pasta', type: 'cuisine' },
      { term: 'chicken', type: 'dish' },
      { term: 'vegetarian', type: 'cuisine' },
      { term: 'chinese', type: 'cuisine' },
      { term: 'italian', type: 'cuisine' },
      { term: 'indian', type: 'cuisine' },
      { term: 'thai', type: 'cuisine' },
      { term: 'mexican', type: 'cuisine' },
      { term: 'coffee', type: 'beverage' },
      { term: 'sandwich', type: 'dish' },
      { term: 'salad', type: 'dish' },
      { term: 'dessert', type: 'category' },
      { term: 'fast food', type: 'category' }
    ];
    
    // Filter suggestions based on query
    const filtered = staticSuggestions.filter(suggestion => 
      suggestion.term.toLowerCase().includes(query.toLowerCase())
    );
    
    setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    setShowDropdown(true);

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      fetchSuggestions(value);
    }, 400); 
  };

  const handleSelectTerm = (term: string) => {
    setLocalSearchTerm(term);
    onSearch(term);
    setShowDropdown(false);
    saveRecentSearch(term);
  };

  const handleManualSearch = () => {
    if (localSearchTerm.trim()) {
      handleSelectTerm(localSearchTerm);
    }
  };

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const newRecent = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecent));
  };

  const getDashboardView = (role: UserType): AppViewState => {
    if (role === 'admin') return 'admin';
    if (role === 'restaurant') return 'partner';
    if (role === 'delivery') return 'delivery';
    return 'customer-dashboard';
  };

  return (
    <nav className="bg-[#1C1C1C] sticky top-0 z-[1100] shadow-2xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div 
          className="flex items-center gap-2 cursor-pointer border-none"
          onClick={onLogoClick}
        >
          <img src="/images/logo.png" alt="Flavorfinder Logo" className="h-[40px] w-auto object-contain transition-transform hover:scale-105" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
          <div className="hidden flex-col items-center">
            <span className="text-2xl font-black text-white tracking-tighter italic leading-none">flavorfinder</span>
          </div>
        </div>
        
        {showSearch && (
          <div className="flex flex-1 max-w-4xl gap-3 items-center">
            {/* City Display Component */}
            {currentUser?.role === 'customer' && (
              <div className="hidden lg:block">
                <CityDisplay onCityDetected={(city: string) => onCityChange?.(city, {
                  isInServiceArea: true,
                  city,
                  distance: 0,
                  message: 'Service available',
                  canOrder: true,
                })} />
              </div>
            )}
            
            {/* Search Bar */}
            <div className="hidden md:flex flex-1 bg-white/5 border border-white/10 rounded-2xl shadow-sm items-center px-2 py-1.5 gap-2 transition-all hover:bg-white/10 hover:border-white/20 focus-within:ring-2 focus-within:ring-[#EF4F5F]/40 focus-within:border-[#EF4F5F]/50 relative">
              <div className="flex items-center gap-2 px-3 border-r border-white/10 min-w-[240px] relative" ref={locDropdownRef}>
                <i className={`fa-solid ${isResolvingLoc || isLocating ? 'fa-circle-notch fa-spin' : 'fa-location-dot'} text-[#EF4F5F]`}></i>
                <input 
                  ref={locInputRef}
                  type="text"
                  value={locSearchValue}
                  onFocus={() => setShowLocDropdown(true)}
                  onChange={handleLocInputChange}
                  placeholder="Search Ahmedabad..."
                  className={`bg-transparent border-0 outline-none text-sm font-bold text-white placeholder:text-gray-500 w-full ${isLocating ? 'animate-pulse' : ''}`}
                />
                <i className="fa-solid fa-caret-down text-gray-500 text-xs cursor-pointer" onClick={() => setShowLocDropdown(!showLocDropdown)}></i>
                {showLocDropdown && (
                  <div className="absolute top-full left-0 w-[350px] mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up z-[1200]">
                    <div className="p-4">
                      <button onClick={() => { onOpenLocationPicker(); setShowLocDropdown(false); }} className="w-full flex items-center gap-4 p-4 text-sm font-bold text-[#EF4F5F] hover:bg-[#FFF4F5] rounded-xl transition-all">
                        <i className="fa-solid fa-location-crosshairs"></i> {isLocating ? 'Locating...' : 'Use Live GPS'}
                      </button>
                      {locationSuggestions.map(loc => (
                        <button key={loc} onClick={() => handleLocSelect(loc)} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">{loc}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-1 px-3 relative" ref={dropdownRef}>
                <i className="fa-solid fa-magnifying-glass text-gray-500"></i>
                <input type="text" value={localSearchTerm} placeholder="Search for food..." className="outline-none text-white w-full bg-transparent text-sm font-medium placeholder:text-gray-500" onChange={handleInputChange} onFocus={() => setShowDropdown(true)} onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()} />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-6 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
              <button onClick={() => onViewChange('home')} className="hover:text-white transition-colors">Marketplace</button>
              <button onClick={() => onViewChange('explore_ahmedabad')} className="hover:text-white transition-colors">Explore</button>
              <button onClick={() => onViewChange(getDashboardView(currentUser.role))} className="text-[#EF4F5F] font-black underline hover:text-[#ff6b7b]">
                {currentUser.role === 'customer' ? 'Orders' : 'Console'}
              </button>
            </div>
          )}
          {currentUser ? (
            <div className="flex items-center gap-4">
               <button onClick={() => onViewChange('profile')} className="flex items-center gap-2 text-white font-bold text-sm bg-white/10 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/20 hover:shadow-lg transition-all">
                 <i className="fa-solid fa-circle-user text-[#EF4F5F] text-lg"></i>
                 <span className="max-w-[80px] truncate">{currentUser.name}</span>
               </button>
               <button onClick={onLogout} className="text-gray-500 hover:text-[#EF4F5F] transition-colors"><i className="fa-solid fa-power-off"></i></button>
            </div>
          ) : (
            <button onClick={() => onAuthClick('login')} className="bg-gradient-to-r from-[#EF4F5F] to-[#E63946] hover:from-[#E63946] hover:to-[#D62828] text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-[#EF4F5F]/40 hover:shadow-2xl transition-all transform hover:scale-105">Login</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
