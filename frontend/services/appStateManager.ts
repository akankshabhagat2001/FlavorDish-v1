// State management hooks for App component
import { useState, useCallback, useReducer } from 'react';
import { User, AppViewState, LatLng, Restaurant, City } from '../types';
import { locationFilterService, LocationStatus } from './locationFilterService';

// App State Type
export interface AppState {
  currentUser: User | null;
  currentView: AppViewState;
  restaurants: Restaurant[];
  dbCities: City[];
  userCoords: LatLng;
  locationName: string;
  selectedRes: Restaurant | null;
  cartItems: any[];
  isCartOpen: boolean;
  searchQuery: string;
  loading: boolean;
  isLocating: boolean;
  currentCity: string;
  locationStatus: LocationStatus | null;
  isOutsideServiceArea: boolean;
  sortBy: 'relevance' | 'rating' | 'deliveryTime' | 'price';
  maxPrice: number | null;
  showLocationPrompt: boolean;
  selectedRestaurantForMap: Restaurant | null;
  selectedCollection: { collection: any; restaurants: Restaurant[] } | null;
}

// Action Types
export type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_VIEW'; payload: AppViewState }
  | { type: 'SET_RESTAURANTS'; payload: Restaurant[] }
  | { type: 'SET_CITIES'; payload: City[] }
  | { type: 'SET_USER_COORDS'; payload: LatLng }
  | { type: 'SET_LOCATION_NAME'; payload: string }
  | { type: 'SET_SELECTED_RES'; payload: Restaurant | null }
  | { type: 'SET_CART_ITEMS'; payload: any[] }
  | { type: 'SET_CART_OPEN'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOCATING'; payload: boolean }
  | { type: 'SET_CURRENT_CITY'; payload: string }
  | { type: 'SET_LOCATION_STATUS'; payload: LocationStatus | null }
  | { type: 'SET_OUTSIDE_SERVICE_AREA'; payload: boolean }
  | { type: 'SET_SORT_BY'; payload: AppState['sortBy'] }
  | { type: 'SET_MAX_PRICE'; payload: number | null }
  | { type: 'SET_SHOW_LOCATION_PROMPT'; payload: boolean }
  | { type: 'SET_SELECTED_RESTAURANT_FOR_MAP'; payload: Restaurant | null }
  | { type: 'SET_SELECTED_COLLECTION'; payload: { collection: any; restaurants: Restaurant[] } | null }
  | { type: 'RESET_STATE' };

// Initial State
export const initialAppState: AppState = {
  currentUser: null,
  currentView: 'home',
  restaurants: [],
  dbCities: [],
  userCoords: { latitude: 23.0225, longitude: 72.5714, lat: 23.0225, lng: 72.5714 },
  locationName: 'Ahmedabad, Gujarat',
  selectedRes: null,
  cartItems: [],
  isCartOpen: false,
  searchQuery: '',
  loading: false,
  isLocating: false,
  currentCity: 'Ahmedabad',
  locationStatus: null,
  isOutsideServiceArea: false,
  sortBy: 'relevance' as const,
  maxPrice: null,
  showLocationPrompt: false,
  selectedRestaurantForMap: null,
  selectedCollection: null,
};

// Reducer
export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_RESTAURANTS':
      return { ...state, restaurants: action.payload };
    case 'SET_CITIES':
      return { ...state, dbCities: action.payload };
    case 'SET_USER_COORDS':
      return { ...state, userCoords: action.payload };
    case 'SET_LOCATION_NAME':
      return { ...state, locationName: action.payload };
    case 'SET_SELECTED_RES':
      return { ...state, selectedRes: action.payload };
    case 'SET_CART_ITEMS':
      return { ...state, cartItems: action.payload };
    case 'SET_CART_OPEN':
      return { ...state, isCartOpen: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_LOCATING':
      return { ...state, isLocating: action.payload };
    case 'SET_CURRENT_CITY':
      return { ...state, currentCity: action.payload };
    case 'SET_LOCATION_STATUS':
      return { ...state, locationStatus: action.payload };
    case 'SET_OUTSIDE_SERVICE_AREA':
      return { ...state, isOutsideServiceArea: action.payload };
    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload };
    case 'SET_MAX_PRICE':
      return { ...state, maxPrice: action.payload };
    case 'SET_SHOW_LOCATION_PROMPT':
      return { ...state, showLocationPrompt: action.payload };
    case 'SET_SELECTED_RESTAURANT_FOR_MAP':
      return { ...state, selectedRestaurantForMap: action.payload };
    case 'SET_SELECTED_COLLECTION':
      return { ...state, selectedCollection: action.payload };
    case 'RESET_STATE':
      return initialAppState;
    default:
      return state;
  }
};

// Custom Hook for App State Management
export const useAppState = () => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  const setUser = useCallback((user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const setView = useCallback((view: AppViewState) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const setRestaurants = useCallback((restaurants: Restaurant[]) => {
    dispatch({ type: 'SET_RESTAURANTS', payload: restaurants });
  }, []);

  const setCities = useCallback((cities: City[]) => {
    dispatch({ type: 'SET_CITIES', payload: cities });
  }, []);

  const setUserCoords = useCallback((coords: LatLng) => {
    dispatch({ type: 'SET_USER_COORDS', payload: coords });
  }, []);

  const setLocationName = useCallback((name: string) => {
    dispatch({ type: 'SET_LOCATION_NAME', payload: name });
  }, []);

  const setSelectedRes = useCallback((res: Restaurant | null) => {
    dispatch({ type: 'SET_SELECTED_RES', payload: res });
  }, []);

  const setCartItems = useCallback((items: any[]) => {
    dispatch({ type: 'SET_CART_ITEMS', payload: items });
  }, []);

  const setIsCartOpen = useCallback((isOpen: boolean) => {
    dispatch({ type: 'SET_CART_OPEN', payload: isOpen });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setIsLocating = useCallback((locating: boolean) => {
    dispatch({ type: 'SET_LOCATING', payload: locating });
  }, []);

  const setCurrentCity = useCallback((city: string) => {
    dispatch({ type: 'SET_CURRENT_CITY', payload: city });
  }, []);

  const setLocationStatus = useCallback((status: LocationStatus | null) => {
    dispatch({ type: 'SET_LOCATION_STATUS', payload: status });
  }, []);

  const setIsOutsideServiceArea = useCallback((outside: boolean) => {
    dispatch({ type: 'SET_OUTSIDE_SERVICE_AREA', payload: outside });
  }, []);

  const setSortBy = useCallback((sort: AppState['sortBy']) => {
    dispatch({ type: 'SET_SORT_BY', payload: sort });
  }, []);

  const setMaxPrice = useCallback((price: number | null) => {
    dispatch({ type: 'SET_MAX_PRICE', payload: price });
  }, []);

  const setShowLocationPrompt = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_LOCATION_PROMPT', payload: show });
  }, []);

  const setSelectedRestaurantForMap = useCallback((res: Restaurant | null) => {
    dispatch({ type: 'SET_SELECTED_RESTAURANT_FOR_MAP', payload: res });
  }, []);

  const setSelectedCollection = useCallback((collection: any) => {
    dispatch({ type: 'SET_SELECTED_COLLECTION', payload: collection });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  return {
    state,
    setUser,
    setView,
    setRestaurants,
    setCities,
    setUserCoords,
    setLocationName,
    setSelectedRes,
    setCartItems,
    setIsCartOpen,
    setSearchQuery,
    setLoading,
    setIsLocating,
    setCurrentCity,
    setLocationStatus,
    setIsOutsideServiceArea,
    setSortBy,
    setMaxPrice,
    setShowLocationPrompt,
    setSelectedRestaurantForMap,
    setSelectedCollection,
    resetState,
  };
};
