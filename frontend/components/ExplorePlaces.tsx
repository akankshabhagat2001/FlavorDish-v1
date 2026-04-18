/**
 * Explore Ahmedabad Food Places
 * Shows food destinations and exploratory food places in Ahmedabad
 * Integrated with Google Maps data
 */

import React, { useState, useEffect } from 'react';
import { Restaurant } from '../types';
import { restaurantService, foodService, suggestionService } from '../services';
import RestaurantLocationMap from './RestaurantLocationMap';

interface ExplorePlace {
  id: string;
  name: string;
  description: string;
  rating: number;
  reviewCount: number;
  cuisines: string[];
  specialty: string;
  imageEmoji: string;
  lat: number;
  lng: number;
  address: string;
  type: 'restaurant' | 'food' | 'suggestion';
  source: 'database' | 'user_suggestion';
}

interface ExplorePlacesProps {
  userLocation?: { lat: number; lng: number };
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

const ExplorePlaces: React.FC<ExplorePlacesProps> = ({ userLocation, onRestaurantClick }) => {
  const [explorePlaces, setExplorePlaces] = useState<ExplorePlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<ExplorePlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadExplorePlaces();
  }, []);

  const loadExplorePlaces = async () => {
    setLoading(true);
    try {
      // Fetch real data from database
      const [restaurantsResponse, foodsResponse, suggestionsResponse] = await Promise.all([
        restaurantService.getRestaurants({ limit: 50 }),
        foodService.getFoods({ limit: 50 }),
        suggestionService.getSuggestions('approved')
      ]);

      const restaurants = restaurantsResponse?.restaurants || restaurantsResponse || [];
      const foods = foodsResponse?.foods || foodsResponse || [];
      const suggestions = suggestionsResponse?.suggestions || suggestionsResponse || [];

      // Convert restaurants to explore places
      const restaurantPlaces: ExplorePlace[] = restaurants.map((r: any) => ({
        id: r._id,
        name: r.name,
        description: r.description || `Authentic ${r.cuisine?.join(', ')} cuisine`,
        rating: r.rating || 4.0,
        reviewCount: r.reviewCount || 0,
        cuisines: r.cuisine || ['Multi-cuisine'],
        specialty: r.cuisine?.[0] || 'Food',
        imageEmoji: getEmojiForCuisine(r.cuisine?.[0] || 'Food'),
        lat: r.location?.latitude || 23.0225,
        lng: r.location?.longitude || 72.5714,
        address: r.location?.address || r.address || 'Ahmedabad',
        type: 'restaurant',
        source: 'database'
      }));

      // Convert food items to explore places (group by restaurant)
      const foodPlaces: ExplorePlace[] = foods
        .filter((f: any) => f.isAvailable)
        .slice(0, 20) // Limit to 20 food items
        .map((f: any) => ({
          id: f._id,
          name: f.name,
          description: f.description || `Delicious ${f.category} dish`,
          rating: f.rating || 4.2,
          reviewCount: f.reviewCount || 0,
          cuisines: [f.category || 'Food'],
          specialty: f.tags?.join(', ') || f.category || 'Specialty',
          imageEmoji: getEmojiForCuisine(f.category || 'Food'),
          lat: 23.0225 + (Math.random() - 0.5) * 0.1, // Slight random offset
          lng: 72.5714 + (Math.random() - 0.5) * 0.1,
          address: 'Various locations in Ahmedabad',
          type: 'food',
          source: 'database'
        }));

      // Convert user suggestions to explore places
      const suggestionPlaces: ExplorePlace[] = suggestions
        .filter((s: any) => s.status === 'approved')
        .map((s: any) => ({
          id: s._id,
          name: s.name,
          description: s.description || `Suggested by ${s.suggestedBy}`,
          rating: 4.0,
          reviewCount: 0,
          cuisines: s.cuisine || ['Multi-cuisine'],
          specialty: s.cuisine?.[0] || 'Food',
          imageEmoji: getEmojiForCuisine(s.cuisine?.[0] || 'Food'),
          lat: 23.0225 + (Math.random() - 0.5) * 0.1,
          lng: 72.5714 + (Math.random() - 0.5) * 0.1,
          address: s.location || 'Ahmedabad',
          type: 'suggestion',
          source: 'user_suggestion'
        }));

      // Combine all places
      const allPlaces = [...restaurantPlaces, ...foodPlaces, ...suggestionPlaces];
      setExplorePlaces(allPlaces);

    } catch (error) {
      console.error('Error loading explore places:', error);
      // Fallback to empty array if no data
      setExplorePlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const getEmojiForCuisine = (cuisine: string): string => {
    const emojiMap: { [key: string]: string } = {
      'Street Food': '🍜',
      'Food Court': '🏪',
      'Food & Culture': '🏛️',
      'Food Hub': '🌟',
      Food: '🍽️',
      'Chaat': '🥟',
      'Chinese': '🥢',
      'Indian': '🍛',
      'Gujarati': '🥘',
      'Italian': '🍝',
      default: '🔍',
    };
    return emojiMap[cuisine] || emojiMap['default'];
  };

  const uniqueCuisines = Array.from(
    new Set(explorePlaces.flatMap((p) => p.cuisines))
  ).sort();

  const filteredPlaces = explorePlaces
    .filter((p) => {
      if (filter !== 'all' && !p.cuisines.includes(filter)) {
        return false;
      }
      if (!searchTerm.trim()) {
        return true;
      }
      const query = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query) ||
        p.cuisines.some((cuisine) => cuisine.toLowerCase().includes(query))
      );
    });

  if (selectedPlace) {
    const selectedAsRestaurant: Restaurant = {
      _id: selectedPlace.id,
      name: selectedPlace.name,
      imageUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(selectedPlace.name)}`,
      cuisine: selectedPlace.cuisines,
      rating: selectedPlace.rating,
      location: {
        address: selectedPlace.address,
        latitude: selectedPlace.lat,
        longitude: selectedPlace.lng,
        city: 'Ahmedabad',
      },
      costForTwo: 500,
      deliveryTime: 20,
      discount: 15,
      isOpen: true,
      phone: '+91 XXXXXXXXXX',
      reviewCount: selectedPlace.reviewCount,
    } as any;

    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedPlace(null)}
          className="flex items-center gap-2 text-purple-600 font-bold hover:text-purple-700 mb-4"
        >
          <i className="fa-solid fa-arrow-left"></i>
          Back to Explore
        </button>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl">{selectedPlace.imageEmoji}</span>
            <div>
              <h3 className="font-black text-xl text-gray-900">{selectedPlace.name}</h3>
              <div className="flex gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  selectedPlace.type === 'restaurant' ? 'bg-blue-100 text-blue-800' :
                  selectedPlace.type === 'food' ? 'bg-green-100 text-green-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {selectedPlace.type.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  selectedPlace.source === 'database' ? 'bg-purple-100 text-purple-800' :
                  'bg-pink-100 text-pink-800'
                }`}>
                  {selectedPlace.source === 'user_suggestion' ? 'USER SUGGESTED' : 'VERIFIED'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mb-4">{selectedPlace.description}</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-star text-orange-500"></i>
              <span className="font-bold text-gray-900">
                {selectedPlace.rating.toFixed(1)} ({selectedPlace.reviewCount} reviews)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-utensils text-purple-600"></i>
              <span className="text-gray-700">{selectedPlace.cuisines.join(', ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-map-marker-alt text-red-500"></i>
              <span className="text-gray-700">{selectedPlace.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-tag text-green-600"></i>
              <span className="text-gray-700">{selectedPlace.specialty}</span>
            </div>
          </div>
        </div>
        <RestaurantLocationMap
          restaurant={selectedAsRestaurant}
          userLocation={userLocation}
          showDirections={true}
          allowFullScreen={true}
          height="450px"
        />
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedPlace.cuisines.map((cuisine) => (
              <span
                key={cuisine}
                className="bg-white px-3 py-1 rounded-full text-xs font-bold text-purple-600 border border-purple-200"
              >
                {cuisine}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-bold text-sm text-center hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-directions"></i>
              Get Directions
            </a>
            <button
              onClick={() => onRestaurantClick?.(selectedAsRestaurant)}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-arrow-right"></i>
              Explore More
            </button>
          </div>
        </>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-2 flex items-center justify-center gap-2">
          <i className="fa-solid fa-map text-orange-500"></i>
          Explore Ahmedabad Food
        </h2>
        <p className="text-gray-600 mb-4">Discover amazing food destinations across the city</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={loadExplorePlaces}
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <i className="fa-solid fa-refresh"></i>
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
          <div className="text-xs text-gray-500">
            <span className="font-bold text-purple-600">{explorePlaces.length}</span> places found
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Ahmedabad street food, lari, dhaba…"
            className="w-full rounded-3xl border border-gray-200 bg-white px-5 py-4 text-sm font-semibold text-gray-800 shadow-sm outline-none transition-all focus:border-[#EF4F5F] focus:ring-4 focus:ring-[#EF4F5F]/10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-[2px] font-black">Search & filter</span>
        </div>
      </div>

      {/* Filter Tabs */}
      {uniqueCuisines.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            All Places
          </button>
          {uniqueCuisines.slice(0, 6).map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => setFilter(cuisine)}
              className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                filter === cuisine
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Places Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlaces.map((place, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPlace(place)}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-gray-100 hover:border-purple-300 group"
              >
                {/* Image/Emoji Area */}
                <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                  {place.imageEmoji}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-gray-900 text-sm line-clamp-2">{place.name}</h3>
                    <div className="flex flex-col gap-1">
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold">
                        ⭐ {place.rating.toFixed(1)}
                      </span>
                      <div className="flex gap-1">
                        <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                          place.type === 'restaurant' ? 'bg-blue-100 text-blue-800' :
                          place.type === 'food' ? 'bg-green-100 text-green-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {place.type[0].toUpperCase()}
                        </span>
                        <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                          place.source === 'database' ? 'bg-purple-100 text-purple-800' :
                          'bg-pink-100 text-pink-800'
                        }`}>
                          {place.source === 'user_suggestion' ? 'U' : 'V'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{place.description}</p>

                  {/* Cuisine Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {place.cuisines.slice(0, 2).map((cuisine) => (
                      <span
                        key={cuisine}
                        className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-[10px] font-bold"
                      >
                        {cuisine}
                      </span>
                    ))}
                    {place.cuisines.length > 2 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-[10px] font-bold">
                        +{place.cuisines.length - 2}
                      </span>
                    )}
                  </div>

                  {/* View Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlace(place);
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-bold text-xs hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-map"></i>
                    View Location
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredPlaces.length === 0 && (
            <div className="text-center py-12">
              <i className="fa-solid fa-magnifying-glass text-4xl text-gray-300 mb-3 block"></i>
              <p className="text-gray-500">No places found in this category</p>
              <button
                onClick={() => setFilter('all')}
                className="mt-4 text-purple-600 font-bold hover:underline"
              >
                View All Places
              </button>
            </div>
          )}
        </>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
        <p className="text-sm text-blue-900 font-semibold">
          <i className="fa-solid fa-lightbulb mr-2"></i>
          💡 Tip: Click on any place to see it on the map and get directions! 
          <span className="block mt-1 text-xs text-blue-700">
            Places are dynamically loaded from our database - restaurants, food items, and user suggestions.
          </span>
        </p>
      </div>
    </div>
  );
};

export default ExplorePlaces;
