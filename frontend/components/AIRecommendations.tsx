import React, { useState, useEffect } from 'react';
import { getSearchSuggestions } from '../services/geminiService';
import { Restaurant } from '../types';

interface RecommendedFood {
  name: string;
  reason: string;
  cuisine: string;
  rating: number;
  price: number;
}

interface AIRecommendationsProps {
  userOrderHistory?: string[];
  currentUser?: any;
  topRestaurants: Restaurant[];
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  userOrderHistory = [],
  currentUser,
  topRestaurants,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchRecommendations();
  }, [userOrderHistory]);

  const fetchRecommendations = async () => {
    if (!currentUser) {
      // Show default recommendations if no user
      setRecommendations(getDefaultRecommendations());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For now, use default recommendations
      // In future: call Gemini API with user preferences
      // const prompt = `Based on this order history: ${historyString}, suggest 8 food items...`;
      // const suggestions = await getSearchSuggestions(prompt, userCoords, 'Ahmedabad');
      
      setRecommendations(getDefaultRecommendations());
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setRecommendations(getDefaultRecommendations());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultRecommendations = (): RecommendedFood[] => [
    {
      name: 'Paneer Butter Masala',
      reason: 'Popular in your favorite restaurants',
      cuisine: 'Indian',
      rating: 4.8,
      price: 380,
    },
    {
      name: 'Chicken Tikka Biryani',
      reason: 'Trending today in Ahmedabad',
      cuisine: 'Indian',
      rating: 4.7,
      price: 450,
    },
    {
      name: 'Garlic Breadsticks Pizza',
      reason: 'Most ordered by similar users',
      cuisine: 'Italian',
      rating: 4.6,
      price: 299,
    },
    {
      name: 'Tandoori Chicken',
      reason: 'Highly rated on Zomato',
      cuisine: 'Indian',
      rating: 4.9,
      price: 340,
    },
    {
      name: 'Crispy Dosa',
      reason: 'South Indian specialty you might love',
      cuisine: 'South Indian',
      rating: 4.5,
      price: 150,
    },
    {
      name: 'Thai Green Curry',
      reason: 'New cuisine trending this week',
      cuisine: 'Thai',
      rating: 4.4,
      price: 420,
    },
    {
      name: 'Smoked Brisket Burger',
      reason: 'Gourmet option you haven\'t tried',
      cuisine: 'American',
      rating: 4.7,
      price: 520,
    },
    {
      name: 'Lamb Kebab Platter',
      reason: 'Premium dining experience',
      cuisine: 'Middle Eastern',
      rating: 4.8,
      price: 680,
    },
  ];

  const uniqueCuisines = recommendations
    .map((r: RecommendedFood) => r.cuisine)
    .filter((v, i, a) => a.indexOf(v) === i);
  const cuisines: string[] = ['all', ...uniqueCuisines];

  const filteredRecommendations =
    activeCategory === 'all' ? recommendations : recommendations.filter(r => r.cuisine === activeCategory);

  return (
    <div className="w-full bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-800 mb-2 flex items-center gap-2">
          <i className="fa-solid fa-sparkles text-purple-600"></i>
          Just For You
        </h2>
        <p className="text-gray-600">Personalized recommendations based on your taste</p>
      </div>

      {/* Category Filter */}
      {cuisines.length > 1 && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {cuisines.map(cuisine => (
            <button
              key={cuisine}
              onClick={() => setActiveCategory(cuisine)}
              className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                activeCategory === cuisine
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
              }`}
            >
              {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Recommendations Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="w-full h-32 bg-gray-300 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredRecommendations.map((food, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 overflow-hidden group cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-32 bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center overflow-hidden">
                <div className="text-4xl group-hover:scale-110 transition-transform">🍽️</div>
                {food.rating && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded-full text-xs font-bold">
                    ⭐ {food.rating}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-1">{food.name}</h3>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{food.reason}</p>

                {/* Cuisine Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                    {food.cuisine}
                  </span>
                  <span className="text-xs font-bold text-gray-700">₹{food.price}</span>
                </div>

                {/* Order Button */}
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-1.5 rounded-lg font-bold text-xs hover:shadow-lg transition-all">
                  <i className="fa-solid fa-plus mr-1"></i> Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRecommendations.length === 0 && (
        <div className="text-center py-12">
          <i className="fa-solid fa-utensils text-4xl text-gray-300 mb-3 block"></i>
          <p className="text-gray-500">No recommendations in this category</p>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="bg-white text-purple-600 px-6 py-2 rounded-full font-bold border-2 border-purple-600 hover:bg-purple-50 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <i className={`fa-solid fa-rotate-right ${loading ? 'animate-spin' : ''}`}></i>
          {loading ? 'Getting Recommendations...' : 'More Recommendations'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mt-4 text-sm flex items-center gap-2">
          <i className="fa-solid fa-exclamation-circle"></i>
          {error}
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;
