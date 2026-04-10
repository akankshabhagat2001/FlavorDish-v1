// Service to handle city-based location filtering (like Zomato)

interface CityBounds {
  name: string;
  center: { latitude: number; longitude: number };
  radiusKm: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Define service areas by city with geographic boundaries
const SERVICE_AREAS: { [key: string]: CityBounds } = {
  ahmedabad: {
    name: 'Ahmedabad',
    center: { latitude: 23.0225, longitude: 72.5714 },
    radiusKm: 25, // Service within 25 km radius
    minLat: 22.85,
    maxLat: 23.35,
    minLng: 72.3,
    maxLng: 72.95,
  },
  gandhinagar: {
    name: 'Gandhinagar',
    center: { latitude: 23.2156, longitude: 72.6369 },
    radiusKm: 15,
    minLat: 23.05,
    maxLat: 23.38,
    minLng: 72.45,
    maxLng: 72.82,
  },
  vadodara: {
    name: 'Vadodara',
    center: { latitude: 22.3072, longitude: 73.1812 },
    radiusKm: 15,
    minLat: 22.15,
    maxLat: 22.46,
    minLng: 73.03,
    maxLng: 73.33,
  },
};

export interface LocationStatus {
  isInServiceArea: boolean;
  city: string;
  distance: number; // km from city center
  message: string;
  canOrder: boolean;
}

export const locationFilterService = {
  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance: (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // Get user's current city based on GPS
  getUserCity: async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Use reverse geocoding to get city
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      
      // Extract city from address
      const address = data.address || {};
      const city = address.city || address.town || address.village || 'Unknown';
      
      return city;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Unknown';
    }
  },

  // Check if user is in Ahmedabad service area
  checkServiceArea: async (latitude: number, longitude: number): Promise<LocationStatus> => {
    // Get user's city first
    const userCity = await locationFilterService.getUserCity(latitude, longitude);
    
    // Check if in Ahmedabad bounds
    const ahmedabad = SERVICE_AREAS.ahmedabad;
    const distance = locationFilterService.calculateDistance(
      latitude,
      longitude,
      ahmedabad.center.latitude,
      ahmedabad.center.longitude
    );

    const isInBounds =
      latitude >= ahmedabad.minLat &&
      latitude <= ahmedabad.maxLat &&
      longitude >= ahmedabad.minLng &&
      longitude <= ahmedabad.maxLng;

    const isWithinRadius = distance <= ahmedabad.radiusKm;
    const isInServiceArea = isInBounds || isWithinRadius;

    if (isInServiceArea) {
      return {
        isInServiceArea: true,
        city: 'Ahmedabad',
        distance: parseFloat(distance.toFixed(1)),
        message: `📍 Delivering in Ahmedabad (${distance.toFixed(1)} km from city center)`,
        canOrder: true,
      };
    } else {
      return {
        isInServiceArea: false,
        city: userCity,
        distance: parseFloat(distance.toFixed(1)),
        message: `❌ Sorry! We don't deliver to ${userCity} yet. Currently delivering only in Ahmedabad.`,
        canOrder: false,
      };
    }
  },

  // Force user to Ahmedabad if outside (for testing)
  forceAhmedabad: (): LocationStatus => {
    return {
      isInServiceArea: true,
      city: 'Ahmedabad',
      distance: 0,
      message: '📍 Ahmedabad (Default)',
      canOrder: true,
    };
  },

  // Get all available service cities
  getAvailableCities: (): string[] => {
    return Object.keys(SERVICE_AREAS).map(key => SERVICE_AREAS[key].name);
  },

  // Validate if restaurant is in service area
  isRestaurantAvailable: (restaurantCoordinates: {
    latitude?: number;
    longitude?: number;
  }): boolean => {
    if (!restaurantCoordinates.latitude || !restaurantCoordinates.longitude) {
      // If no coordinates, assume available
      return true;
    }

    const ahmedabad = SERVICE_AREAS.ahmedabad;
    const isInBounds =
      restaurantCoordinates.latitude >= ahmedabad.minLat &&
      restaurantCoordinates.latitude <= ahmedabad.maxLat &&
      restaurantCoordinates.longitude >= ahmedabad.minLng &&
      restaurantCoordinates.longitude <= ahmedabad.maxLng;

    return isInBounds;
  },
};
