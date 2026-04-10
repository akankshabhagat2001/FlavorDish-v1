/**
 * Google Maps Restaurant Service
 * Fetches real restaurant data from Google Maps API for Ahmedabad
 */

import { Restaurant } from '../types';

export interface GoogleRestaurantData {
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating: number;
  reviewCount: number;
  cuisines: string[];
  priceLevel: number;
  imageUrl?: string;
  phone?: string;
  website?: string;
  placeId?: string;
  isOpen?: boolean;
}

class GoogleMapsRestaurantService {
  private apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  private ahmedabadCenter = { lat: 23.0225, lng: 72.5714 };
  private searchRadius = 15000; // 15km radius

  /**
   * Fetch nearby restaurants from Google Maps Places API
   * @param searchQuery - Type of restaurant (e.g., "restaurant", "fast food")
   * @returns Promise<GoogleRestaurantData[]>
   */
  async fetchNearbyRestaurants(searchQuery: string = 'restaurant'): Promise<GoogleRestaurantData[]> {
    try {
      // Since we can't directly call Google Places API from frontend, we use mock data
      // In production, call your backend endpoint which will hit Google Places API
      return this.getMockRestaurantData();
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return this.getMockRestaurantData();
    }
  }

  /**
   * Get restaurant location coordinates
   */
  async getRestaurantLocation(restaurantName: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // Mock implementation - in production, use Geocoding API
      const restaurants = await this.fetchNearbyRestaurants();
      const found = restaurants.find(r => r.name.toLowerCase() === restaurantName.toLowerCase());
      return found ? { lat: found.lat, lng: found.lng } : null;
    } catch (error) {
      console.error('Error getting restaurant location:', error);
      return null;
    }
  }

  /**
   * Get explore places data (food spots, markets, etc.)
   */
  async getExploreAhmedabad(): Promise<GoogleRestaurantData[]> {
    try {
      return this.getMockExploreData();
    } catch (error) {
      console.error('Error fetching explore data:', error);
      return this.getMockExploreData();
    }
  }

  /**
   * Mock restaurant data for Ahmedabad
   */
  private getMockRestaurantData(): GoogleRestaurantData[] {
    return [
      {
        name: 'Agashiye - Heritage Dining',
        lat: 23.186111,
        lng: 72.539444,
        address: 'Haveli, Lal Darwaja, Ahmedabad 380001',
        rating: 4.8,
        reviewCount: 3547,
        cuisines: ['Gujarati', 'Heritage', 'Vegetarian'],
        priceLevel: 3,
        phone: '+91 79-2640-7445',
        isOpen: true,
      },
      {
        name: 'Vishala - Traditional Gujarat',
        lat: 22.9925,
        lng: 72.6407,
        address: 'Gheekanta Village, Ahmedabad 380005',
        rating: 4.7,
        reviewCount: 2834,
        cuisines: ['Gujarati', 'Indian', 'Traditional'],
        priceLevel: 2,
        phone: '+91 79-2682-2711',
        isOpen: true,
      },
      {
        name: 'Rajwadu - Authentic Village Experience',
        lat: 23.0208,
        lng: 72.5491,
        address: 'North of C.G. Road, Ahmedabad 380006',
        rating: 4.6,
        reviewCount: 3421,
        cuisines: ['Gujarati', 'Traditional', 'Vegetarian'],
        priceLevel: 2,
        phone: '+91 79-2648-4555',
        isOpen: true,
      },
      {
        name: 'Tomato\'s - Multi-Cuisine',
        lat: 23.0583,
        lng: 72.5022,
        address: 'Vastrapur, Ahmedabad 380015',
        rating: 4.5,
        reviewCount: 2156,
        cuisines: ['North Indian', 'Chinese', 'Continental'],
        priceLevel: 2,
        phone: '+91 79-2658-5100',
        isOpen: true,
      },
      {
        name: 'San Marco - Fine Dining',
        lat: 23.0364,
        lng: 72.5817,
        address: 'Satellite, Ahmedabad 380015',
        rating: 4.8,
        reviewCount: 2543,
        cuisines: ['Italian', 'Continental', 'Fine Dining'],
        priceLevel: 4,
        phone: '+91 79-2658-6666',
        isOpen: true,
      },
      {
        name: 'Jasuben\'s Pizza - Famous Street Pizza',
        lat: 23.1901,
        lng: 72.5404,
        address: 'Law Garden/Lal Darwaja, Ahmedabad 380001',
        rating: 4.5,
        reviewCount: 2834,
        cuisines: ['Pizza', 'Gujarati', 'Street Food'],
        priceLevel: 1,
        phone: '+91 79-2650-5240',
        isOpen: true,
      },
      {
        name: 'Havmor Ice Cream - Premium Desserts',
        lat: 23.0228,
        lng: 72.5498,
        address: 'C.G. Road, Ahmedabad 380009',
        rating: 4.4,
        reviewCount: 1592,
        cuisines: ['Ice Cream', 'Desserts', 'Beverages'],
        priceLevel: 2,
        phone: '+91 79-2644-4850',
        isOpen: true,
      },
      {
        name: 'Karnavati Club - Heritage Dining',
        lat: 23.185,
        lng: 72.568,
        address: 'Near Ellisbridge, Ahmedabad 380006',
        rating: 4.6,
        reviewCount: 1847,
        cuisines: ['Gujarati', 'Indian', 'Heritage'],
        priceLevel: 2,
        phone: '+91 79-2655-0333',
        isOpen: true,
      },
      {
        name: 'Honest Restaurant - North Indian',
        lat: 23.035,
        lng: 72.585,
        address: 'Satellite, Ahmedabad 380015',
        rating: 4.3,
        reviewCount: 1456,
        cuisines: ['North Indian', 'Chinese', 'Indian'],
        priceLevel: 2,
        phone: '+91 79-2614-0055',
        isOpen: true,
      },
      {
        name: 'Manek Chowk - Street Food Hub',
        lat: 23.1815,
        lng: 72.6301,
        address: 'Manek Chowk, Old City, Ahmedabad 380001',
        rating: 4.6,
        reviewCount: 4234,
        cuisines: ['Indian', 'Street Food', 'Snacks'],
        priceLevel: 1,
        phone: '+91 79-2650-1200',
        isOpen: true,
      },
      {
        name: 'Cafe Coffee Day - Hangout',
        lat: 22.988,
        lng: 72.601,
        address: 'Navrangpura, Ahmedabad 380009',
        rating: 4.2,
        reviewCount: 1234,
        cuisines: ['Cafe', 'Coffee', 'Snacks'],
        priceLevel: 2,
        phone: '+91 79-2646-5210',
        isOpen: true,
      },
      {
        name: 'The Noodle House - Asian Cuisine',
        lat: 23.0427,
        lng: 72.5506,
        address: 'Satellite, Ahmedabad 380015',
        rating: 4.4,
        reviewCount: 1876,
        cuisines: ['Asian', 'Chinese', 'Thai'],
        priceLevel: 2,
        phone: '+91 79-2614-2233',
        isOpen: true,
      },
    ];
  }

  /**
   * Mock explore places data
   */
  private getMockExploreData(): GoogleRestaurantData[] {
    return [
      {
        name: 'Sabarmati Riverfront - Food & Culture Zone',
        lat: 23.1798,
        lng: 72.6292,
        address: 'Sabarmati Riverfront, Ahmedabad 380001',
        rating: 4.7,
        reviewCount: 5234,
        cuisines: ['Food Court', 'Street Food', 'All Cuisines'],
        priceLevel: 1,
        isOpen: true,
      },
      {
        name: 'Adalaj Stepwell - Heritage Food Centre',
        lat: 23.2147,
        lng: 72.5822,
        address: 'Adalaj, Ahmedabad 380005',
        rating: 4.7,
        reviewCount: 3156,
        cuisines: ['Gujarati', 'Indian', 'Heritage'],
        priceLevel: 1,
        isOpen: true,
      },
      {
        name: 'AURA Ahmedabad - Food Hub',
        lat: 23.0470,
        lng: 72.6230,
        address: 'Gota, Ahmedabad',
        rating: 4.5,
        reviewCount: 1876,
        cuisines: ['Multi-cuisine', 'All Types'],
        priceLevel: 3,
        isOpen: true,
      },
      {
        name: 'Kankaria Lake - Food Stalls',
        lat: 23.0301,
        lng: 72.5401,
        address: 'Kankaria Lake, Ahmedabad',
        rating: 4.3,
        reviewCount: 3456,
        cuisines: ['Street Food', 'Snacks'],
        priceLevel: 1,
        isOpen: true,
      },
      {
        name: 'Vijay Chowk - Food Market',
        lat: 23.1680,
        lng: 72.6341,
        address: 'Vijay Chowk, Ahmedabad',
        rating: 4.4,
        reviewCount: 912,
        cuisines: ['Street Food', 'Chaat'],
        priceLevel: 1,
        isOpen: true,
      },
      {
        name: 'Mithakhali Six Roads - Street Food',
        lat: 23.1790,
        lng: 72.6277,
        address: 'Mithakhali Six Roads, Ahmedabad',
        rating: 4.5,
        reviewCount: 2145,
        cuisines: ['Chinese', 'Street Food', 'Indian'],
        priceLevel: 2,
        isOpen: true,
      },
    ];
  }

  /**
   * Convert Google restaurant data to internal Restaurant format
   */
  convertToRestaurant(googleData: GoogleRestaurantData, index: number): Restaurant {
    return {
      _id: `google-${index}-${Date.now()}`,
      name: googleData.name,
      imageUrl: googleData.imageUrl || `https://via.placeholder.com/400x300?text=${encodeURIComponent(googleData.name)}`,
      cuisine: googleData.cuisines || ['Indian'],
      rating: googleData.rating,
      location: {
        address: googleData.address,
        latitude: googleData.lat,
        longitude: googleData.lng,
        city: 'Ahmedabad',
      },
      costForTwo: this.priceLeveToAmount(googleData.priceLevel),
      deliveryTime: Math.floor(Math.random() * 30) + 15, // 15-45 mins
      discount: Math.floor(Math.random() * 50),
      isOpen: googleData.isOpen !== false,
      phone: googleData.phone || '+91 XXXXXXXXXX',
      signatureDish: {
        name: 'Special of the Day',
        imageUrl: googleData.imageUrl || 'https://via.placeholder.com/100x100?text=Dish',
        description: `Try our special at ${googleData.name}`,
        rating: googleData.rating,
        price: this.priceLeveToAmount(googleData.priceLevel) / 2,
      },
      ownerId: `owner-${index}`,
      reviews: [],
      menu: [],
    } as any;
  }

  /**
   * Convert price level (1-4) to amount
   */
  private priceLeveToAmount(priceLevel: number): number {
    const priceLevels: { [key: number]: number } = {
      1: 300,
      2: 600,
      3: 1000,
      4: 1500,
    };
    return priceLevels[priceLevel] || 500;
  }
}

export const googleMapsRestaurantService = new GoogleMapsRestaurantService();
