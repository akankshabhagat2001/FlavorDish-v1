import React, { useState, useEffect } from 'react';
import { db } from '../database/db.ts';
import { LocalFood } from '../types.ts';

const ExploreAhmedabad: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFood, setSelectedFood] = useState<LocalFood | null>(null);
  const [spiceFilter, setSpiceFilter] = useState<number | null>(null);
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [localFoods, setLocalFoods] = useState<LocalFood[]>([]);

  useEffect(() => {
    const fetchFoods = async () => {
      const foods = await db.localFoods.find();
      setLocalFoods(foods);
    };
    fetchFoods();
  }, []);

  const categories = [
    { id: 'all', label: 'All Foods', icon: '🍽️' },
    { id: 'sweets', label: 'Traditional Sweets', icon: '🍯' },
    { id: 'main', label: 'Main Courses', icon: '🥘' },
    { id: 'street', label: 'Street Food', icon: '🥟' },
    { id: 'snack', label: 'Snacks', icon: '🥒' },
    { id: 'beverage', label: 'Beverages', icon: '☕' }
  ];

  const filteredFoods = localFoods.filter(food => {
    if (selectedCategory !== 'all' && food.category !== selectedCategory) return false;
    if (spiceFilter !== null && food.spiceLevel > spiceFilter) return false;
    if (vegOnly && !food.isVeg) return false;
    return true;
  });

  const SpiceLevel = ({ level }: { level: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= level ? 'text-[#EF4F5F]' : 'text-gray-300'}>
          🌶️
        </span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">🏛️ Discover Ahmedabad</h1>
          <p className="text-xl opacity-90 mb-2">Explore the authentic cuisines and food stories of our city</p>
          <p className="text-sm opacity-80">From royal kitchens to household treasures - taste the essence of Gujarat</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b sticky top-0 z-40 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Category Tabs */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Browse by Category</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#EF4F5F] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Spice Level */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Max Spice Level</h3>
              <div className="flex gap-2">
                {[null, 1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setSpiceFilter(level)}
                    className={`px-3 py-2 rounded-lg transition-all ${
                      spiceFilter === level
                        ? 'bg-[#EF4F5F] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level === null ? 'Any' : '🌶️'.repeat(level)}
                  </button>
                ))}
              </div>
            </div>

            {/* Vegetarian Filter */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Preferences</h3>
              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  vegOnly
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {vegOnly ? '🥬' : '🍃'} Vegetarian Only
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Found <span className="font-bold text-[#EF4F5F]">{filteredFoods.length}</span> delicacies
          </div>
        </div>
      </div>

      {/* Food Grid */}
      <div className="max-w-6xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFoods.map(food => (
            <div
              key={food._id}
              onClick={() => setSelectedFood(food)}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer hover:scale-105"
            >
              {/* Image */}
              <div className="relative h-48 bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center overflow-hidden">
                {food.imageUrl ? (
                  <img
                    src={food.imageUrl}
                    alt={food.name}
                    className="w-full h-full object-cover"
                    onError={() => {}}
                  />
                ) : (
                  <span className="text-6xl">🍽️</span>
                )}
                {/* Rating Badge */}
                <div className="absolute top-3 right-3 bg-yellow-400 text-white px-3 py-1 rounded-full font-bold shadow-lg">
                  ⭐ {food.rating}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Name */}
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{food.name}</h2>
                <p className="text-lg text-orange-600 font-semibold mb-3">{food.gujarati}</p>

                {/* Origin */}
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-semibold">Origin:</span> {food.origin}
                </p>

                {/* Spice & Veg */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <SpiceLevel level={food.spiceLevel} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    food.isVeg
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {food.isVeg ? '🥬 Vegetarian' : '🍗 Non-Veg'}
                  </span>
                </div>

                {/* Availability */}
                <p className="text-xs text-gray-600 mb-4">
                  <span className="font-semibold">Available:</span> {food.availability}
                </p>

                {/* Nutrition Hint */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mb-4">
                  <p className="text-xs text-blue-800">
                    💡 <span className="font-semibold">Nutrition:</span> {food.nutritionHint}
                  </p>
                </div>

                {/* Learn More Button */}
                <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredFoods.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🍽️</span>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No foods found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Food Detail Modal */}
      {selectedFood && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setSelectedFood(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full my-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-8 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-4xl font-bold mb-2">{selectedFood.name}</h2>
                  <p className="text-2xl opacity-90">{selectedFood.gujarati}</p>
                </div>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="text-2xl hover:bg-white/20 p-2 rounded-full transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 pb-8 space-y-6">
              {/* Story */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">📖 The Story</h3>
                <p className="text-gray-700 leading-relaxed">{selectedFood.story}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Spice Level</p>
                  <SpiceLevel level={selectedFood.spiceLevel} />
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Type</p>
                  <p className="text-lg">{selectedFood.isVeg ? '🥬 Vegetarian' : '🍗 Non-Vegetarian'}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Rating</p>
                  <p className="text-lg">⭐ {selectedFood.rating}/5</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Availability</p>
                  <p className="text-sm">{selectedFood.availability}</p>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">🧂 Key Ingredients</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFood.ingredients.map((ing, idx) => (
                    <span key={idx} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Where to Find */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">🏪 Where to Find</h3>
                <div className="space-y-2">
                  {selectedFood.restaurants.map((res, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xl">🍽️</span>
                      <span className="font-semibold text-gray-700">{res}</span>
                      <span className="ml-auto text-orange-600 font-semibold">View →</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutrition */}
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-6 rounded-xl border-l-4 border-blue-500">
                <h3 className="text-lg font-bold text-gray-800 mb-2">💪 Nutrition Profile</h3>
                <p className="text-gray-700">{selectedFood.nutritionHint}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all">
                  🔖 Save to Favorites
                </button>
                <button className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-all">
                  📤 Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreAhmedabad;
