import React, { useState, useEffect } from 'react';
import { Restaurant, LatLng } from '../types.ts';
import MapView from './MapView.tsx';

interface FullScreenMapModalProps {
  restaurant: Restaurant;
  userLocation: LatLng;
  onClose: () => void;
}

const FullScreenMapModal: React.FC<FullScreenMapModalProps> = ({ restaurant, userLocation, onClose }) => {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = () => {
    const fullAddress = `${restaurant.name}, ${restaurant.location.address}`;
    navigator.clipboard.writeText(fullAddress).then(() => {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    });
  };

  const handleGetDirections = async () => {
    const destination = `${restaurant.name}, ${restaurant.location.address}`;

    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const origin = `${position.coords.latitude},${position.coords.longitude}`;
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
          window.open(mapsUrl, '_blank');
        },
        () => {
          // Fallback if location fails
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
          window.open(mapsUrl, '_blank');
        }
      );
    } else {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
      window.open(mapsUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[1500] flex flex-col bg-white">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#EF4F5F] to-[#FF6B7B] text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black tracking-tight truncate">{restaurant.name}</h2>
          <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest truncate">
            {restaurant.location.address}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all ml-4"
        >
          <i className="fa-solid fa-xmark text-white text-xl"></i>
        </button>
      </div>

      {/* Map Container */}
      <div className="flex-1 overflow-hidden bg-gray-50 relative">
        <MapView
          restaurants={[restaurant]}
          center={{
            latitude: restaurant.location.latitude,
            longitude: restaurant.location.longitude,
            lat: restaurant.location.lat || restaurant.location.latitude,
            lng: restaurant.location.lng || restaurant.location.longitude,
          }}
          onRestaurantClick={() => {}}
          onClose={onClose}
          isInline={false}
          destinationPosition={{
            latitude: restaurant.location.latitude,
            longitude: restaurant.location.longitude,
            lat: restaurant.location.lat || restaurant.location.latitude,
            lng: restaurant.location.lng || restaurant.location.longitude,
          }}
        />

        {/* Info Card Overlay - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12">
          <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-md mx-auto">
            {/* Restaurant Details */}
            <div className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                <img
                  src={restaurant.imageUrl}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-gray-900 truncate">{restaurant.name}</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                  <i className="fa-solid fa-star text-orange-500 mr-1"></i>
                  {restaurant.rating.toFixed(1)} Rating
                </p>
                <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">{restaurant.cuisine.join(', ')}</p>
              </div>
            </div>

            {/* Location & Distance Info */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
                <i className="fa-solid fa-location-dot text-blue-600 text-lg flex-shrink-0 mt-0.5"></i>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest">Address</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.location.address)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-800 font-semibold break-words hover:text-blue-600 hover:underline flex flex-wrap items-center gap-1 transition-colors">
                    {restaurant.location.address}
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-70"></i>
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-lg">
                <i className="fa-solid fa-clock text-emerald-600 text-lg flex-shrink-0"></i>
                <div>
                  <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest">Delivery Time</p>
                  <p className="text-xs text-gray-800 font-semibold">{restaurant.deliveryTime} mins</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-lg">
                <i className="fa-solid fa-tag text-purple-600 text-lg flex-shrink-0"></i>
                <div>
                  <p className="text-[10px] text-purple-700 font-bold uppercase tracking-widest">Cost for Two</p>
                  <p className="text-xs text-gray-800 font-semibold">₹{restaurant.costForTwo}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleCopyAddress}
                className="flex-1 min-w-[120px] bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <i className={`fa-solid ${copiedAddress ? 'fa-check' : 'fa-copy'}`}></i>
                {copiedAddress ? 'Copied!' : 'Copy Address'}
              </button>

              <button
                onClick={handleGetDirections}
                className="flex-1 min-w-[120px] bg-[#EF4F5F] hover:bg-[#FF6B7B] text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#EF4F5F]/30"
              >
                <i className="fa-solid fa-directions"></i>
                Get Directions
              </button>
            </div>

            {/* Coordinates for Debugging */}
            <div className="mt-4 pt-4 border-t border-gray-100 text-[9px] text-gray-400 font-mono bg-gray-50 p-2 rounded text-center">
              📍 {restaurant.location.latitude.toFixed(4)}, {restaurant.location.longitude.toFixed(4)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenMapModal;
