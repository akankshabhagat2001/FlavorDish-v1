import React from 'react';

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

interface RestaurantSuggestionsProps {
  suggestions: RestaurantSuggestion[];
  onOpenForm: () => void;
}

const RestaurantSuggestions: React.FC<RestaurantSuggestionsProps> = ({
  suggestions,
  onOpenForm
}) => {
  // Filter only approved suggestions
  const approvedSuggestions = suggestions.filter(s => s.status === 'approved' || !s.status);

  if (approvedSuggestions.length === 0) {
    return (
      <div className="mb-12">
        <div className="mb-8">
          <h2 className="text-3xl font-medium text-[#1c1c1c] mb-1">🌟 Community Picks</h2>
          <p className="text-lg text-gray-500 font-light">
            Discover hidden gems suggested by our community members
          </p>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-8 text-center border-2 border-dashed border-orange-200">
          <i className="fa-solid fa-lightbulb text-4xl text-orange-400 mb-4 block"></i>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Found an amazing place?</h3>
          <p className="text-gray-600 mb-6">Help others discover your favorite food spots in Ahmedabad</p>
          <button
            onClick={onOpenForm}
            className="inline-block px-8 py-3 bg-gradient-to-r from-[#EF4F5F] to-orange-500 text-white rounded-full font-bold hover:shadow-lg transition-all hover:scale-105"
          >
            <i className="fa-solid fa-plus mr-2"></i>Suggest a Restaurant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-medium text-[#1c1c1c] mb-1">🌟 Community Picks</h2>
          <p className="text-lg text-gray-500 font-light">
            Favorite spots recommended by FlavorFinder community
          </p>
        </div>
        <button
          onClick={onOpenForm}
          className="px-4 py-2 bg-gradient-to-r from-[#EF4F5F] to-orange-500 text-white rounded-full font-bold text-sm hover:shadow-lg transition-all"
        >
          <i className="fa-solid fa-plus mr-1"></i>Suggest
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {approvedSuggestions.map((suggestion) => (
          <div
            key={suggestion._id}
            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
          >
            {/* Card Header with Gradient */}
            <div className="bg-gradient-to-r from-[#EF4F5F] to-orange-500 h-24 relative flex items-end p-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white drop-shadow-md">{suggestion.name}</h3>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center">
                <i className="fa-solid fa-star text-white text-lg"></i>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-3">
              {/* Location */}
              <div className="flex items-start gap-2">
                <i className="fa-solid fa-location-dot text-[#EF4F5F] mt-1 flex-shrink-0"></i>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Location</p>
                  <p className="text-sm font-medium text-gray-800">{suggestion.location}</p>
                </div>
              </div>

              {/* Cuisines */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Cuisine</p>
                <div className="flex flex-wrap gap-1">
                  {suggestion.cuisine.slice(0, 3).map((cuisine, i) => (
                    <span
                      key={i}
                      className="inline-block bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-medium"
                    >
                      {cuisine}
                    </span>
                  ))}
                  {suggestion.cuisine.length > 3 && (
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                      +{suggestion.cuisine.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {suggestion.description && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Why visit?</p>
                  <p className="text-sm text-gray-700 line-clamp-2 italic">{suggestion.description}</p>
                </div>
              )}

              {/* Contact */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p className="text-xs text-gray-600">
                  <i className="fa-solid fa-user mr-2 text-[#EF4F5F]"></i>
                  <span className="font-medium">{suggestion.contactPerson}</span>
                </p>
                {suggestion.phone && (
                  <p className="text-xs text-gray-600">
                    <i className="fa-solid fa-phone mr-2 text-[#EF4F5F]"></i>
                    <a
                      href={`tel:${suggestion.phone}`}
                      className="hover:text-[#EF4F5F] transition-colors"
                    >
                      {suggestion.phone}
                    </a>
                  </p>
                )}
                {suggestion.website && (
                  <p className="text-xs text-gray-600">
                    <i className="fa-solid fa-globe mr-2 text-[#EF4F5F]"></i>
                    <a
                      href={suggestion.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#EF4F5F] transition-colors truncate"
                    >
                      Visit Website
                    </a>
                  </p>
                )}
              </div>

              {/* Suggested By */}
              <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
                Suggested by community member
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantSuggestions;
