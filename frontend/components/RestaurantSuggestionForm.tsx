import React, { useState, useEffect } from 'react';

interface RestaurantSuggestion {
  _id?: string;
  name: string;
  cuisine: string[];
  description: string;
  location: string;
  contactPerson: string;
  phone: string;
  email: string;
  website?: string;
  suggestedBy: string;
  createdAt?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

interface RestaurantSuggestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (suggestion: RestaurantSuggestion) => void;
  currentUserEmail?: string;
}

const RestaurantSuggestionForm: React.FC<RestaurantSuggestionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUserEmail = ''
}) => {
  const [formData, setFormData] = useState<RestaurantSuggestion>({
    name: '',
    cuisine: [],
    description: '',
    location: '',
    contactPerson: '',
    phone: '',
    email: '',
    website: '',
    suggestedBy: currentUserEmail,
  });

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const cuisineOptions = ['Gujarati', 'North Indian', 'Chinese', 'Italian', 'Cafe', 'Fast Food', 'Desserts', 'Street Food', 'Seafood', 'Pure Veg', 'Multi Cuisine'];

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      suggestedBy: currentUserEmail
    }));
  }, [currentUserEmail]);

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || selectedCuisines.length === 0 || !formData.contactPerson) {
      alert('Please fill in all required fields');
      return;
    }

    onSubmit({
      ...formData,
      cuisine: selectedCuisines,
      createdAt: Date.now(),
      status: 'pending'
    });

    // Reset form
    setFormData({
      name: '',
      cuisine: [],
      description: '',
      location: '',
      contactPerson: '',
      phone: '',
      email: '',
      website: '',
      suggestedBy: currentUserEmail,
    });
    setSelectedCuisines([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#EF4F5F] to-orange-500 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Share Your Food Discovery 🍽️</h2>
            <p className="text-white/90 text-sm mt-1">Found an amazing place? Help others discover it!</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-all"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Restaurant Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Restaurant/Cafe Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Asha's Kitchen, The Coffee House"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4F5F] bg-gray-50"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Location/Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Satellite, C.G. Road, Vastrapur"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4F5F] bg-gray-50"
              required
            />
          </div>

          {/* Cuisine Types */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Cuisine Types <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cuisineOptions.map(cuisine => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => handleCuisineToggle(cuisine)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedCuisines.includes(cuisine)
                      ? 'bg-[#EF4F5F] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Why should we feature this place?
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell us what makes this place special... signature dishes, ambiance, service quality, etc."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4F5F] bg-gray-50 resize-none"
            />
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              placeholder="Your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4F5F] bg-gray-50"
              required
            />
          </div>

          {/* Phone and Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4F5F] bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4F5F] bg-gray-50"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Website (Optional)</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4F5F] bg-gray-50"
            />
          </div>

          {/* Disclaimer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <i className="fa-solid fa-info-circle mr-2"></i>
              Your suggestion will be reviewed by our team before appearing on FlavorFinder. We verify all submissions to ensure quality and authenticity.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#EF4F5F] to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Share Your Discovery ✨
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantSuggestionForm;
