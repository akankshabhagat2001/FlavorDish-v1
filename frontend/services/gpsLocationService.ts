// Service to handle GPS location detection and reverse geocoding with caching

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const CACHE: { [key: string]: CacheEntry } = {};
const GEOCODING_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const LOCATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getFromCache = (key: string): any | null => {
  const entry = CACHE[key];
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > entry.ttl;
  if (isExpired) {
    delete CACHE[key];
    return null;
  }

  return entry.data;
};

const setCache = (key: string, data: any, ttl: number): void => {
  CACHE[key] = { data, timestamp: Date.now(), ttl };
};

export const gpsLocationService = {
  // Get current GPS coordinates
  getCurrentLocation: (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  },

  // Get address from GPS coordinates using OpenStreetMap with caching
  getAddressFromCoordinates: async (
    latitude: number,
    longitude: number
  ): Promise<string> => {
    const cacheKey = `geocode_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
    
    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.debug('Using cached geocoding result');
      return cached;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          signal: AbortSignal.timeout(5000), // Add timeout
        }
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Format address from OSM response
      const address = data.address || {};
      const parts = [
        address.house_number,
        address.road,
        address.suburb,
        address.city,
      ].filter(Boolean);
      
      const result = parts.join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      
      // Cache the result
      setCache(cacheKey, result, GEOCODING_CACHE_TTL);
      
      return result;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  },

  // Detect user's home address on first login
  detectHomeAddress: async (): Promise<{
    address: string;
    latitude: number;
    longitude: number;
  } | null> => {
    try {
      const coords = await gpsLocationService.getCurrentLocation();
      const address = await gpsLocationService.getAddressFromCoordinates(
        coords.latitude,
        coords.longitude
      );
      
      return {
        address,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    } catch (error: any) {
      console.error('Address detection error:', error);
      
      // Provide specific error messages based on error type
      if (error.code === 1) {
        console.error('GPS Permission Denied. User must enable location access.');
      } else if (error.code === 2) {
        console.error('GPS Position Unavailable. Please check your location settings.');
      } else if (error.code === 3) {
        console.error('GPS Request Timeout. Please enable GPS and try again.');
      }
      
      return null;
    }
  },

  // Get error message for user
  getGpsErrorMessage: (error: any): string => {
    if (error?.code === 1) {
      return 'Location permission denied. Please enable GPS in your browser settings and try again.';
    } else if (error?.code === 2) {
      return 'Location not available. Please enable GPS on your device.';
    } else if (error?.code === 3) {
      return 'Location request timed out. Please enable GPS and try again.';
    }
    return 'Could not detect location. Please enable GPS and ensure location permission is granted.';
  },

  // Watch live location changes
  watchLocation: (
    onLocation: (coords: { latitude: number; longitude: number }) => void,
    onError?: (error: GeolocationPositionError) => void
  ): number => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        onLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Geolocation watch error:', error);
        onError?.(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  },

  // Stop watching location
  stopWatchingLocation: (watchId: number): void => {
    navigator.geolocation.clearWatch(watchId);
  },

  // Clear all caches
  clearCache: (): void => {
    Object.keys(CACHE).forEach((key) => delete CACHE[key]);
    console.debug('GPS service cache cleared');
  },
};
