
import { LatLng, DiscoveryResult } from "../types.ts";

// Fallback browser-safe service functions. No external Gemini access required.
export const getSmartDiscovery = async (query: string, location: LatLng): Promise<DiscoveryResult> => {
  return {
    text: `Top Ahmedabad recommendations for "${query}": check out local favorites and top-rated outlets near (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}).`,
    groundingChunks: []
  };
};

export const getAIFoodSuggestions = getSmartDiscovery;

export const reverseGeocode = async (coords: LatLng): Promise<string> => {
  return 'Ahmedabad, Gujarat';
};

export const getSearchSuggestions = async (query: string, location: LatLng, city: string): Promise<any[]> => {
  if (!query || query.length < 2) return [];
  const base = query.trim();
  return [
    { term: `${base} nearby`, type: 'restaurant' },
    { term: `${base} popular`, type: 'dish' },
    { term: `${base} best rated`, type: 'cuisine' }
  ];
};

export const getCityResolution = async (cityName: string): Promise<{ name: string, coords: LatLng } | null> => {
  if (!cityName) return null;
  return {
    name: `${cityName.trim()}, Ahmedabad`,
    coords: { latitude: 23.0225, longitude: 72.5714, lat: 23.0225, lng: 72.5714 }
  };
};
