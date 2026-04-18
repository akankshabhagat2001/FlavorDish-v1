// @ts-nocheck
/**
 * Restaurant Location Modal
 * Shows restaurant location, address, and directions
 * Triggered when user clicks map icon on restaurant card
 */

import React, { useState } from 'react';
import { Restaurant } from '../types';
import RestaurantLocationMap from './RestaurantLocationMap';
import MapTilerDirectionsMap from './MapTilerDirectionsMap';

interface RestaurantLocationModalProps {
  isOpen: boolean;
  restaurant: Restaurant;
  userLocation?: { lat: number; lng: number };
  onClose: () => void;
  onBookTable?: () => void;
  onOrderFood?: () => void;
}

const RestaurantLocationModal: React.FC<RestaurantLocationModalProps> = ({
  isOpen,
  restaurant,
  userLocation,
  onClose,
  onBookTable,
  onOrderFood,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDirections, setShowDirections] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
        <div
          className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-3xl">
            <div>
              <h2 className="text-xl font-black text-gray-900">📍 {restaurant.name}</h2>
              <p className="text-sm text-gray-500">{restaurant.cuisine.join(', ')}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl w-10 h-10 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Map */}
            <div>
              <RestaurantLocationMap
                restaurant={restaurant}
                userLocation={userLocation}
                showDirections={true}
                allowFullScreen={true}
                height="350px"
              />
            </div>

            {/* Restaurant Details Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-info-circle text-purple-600"></i>
                Restaurant Details
              </h3>

              <div className="space-y-3">
                {/* Address */}
                <div className="flex gap-3">
                  <i className="fa-solid fa-location-dot text-red-500 mt-1 flex-shrink-0"></i>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Address</p>
                    <p className="text-sm font-semibold text-gray-900">{restaurant.location.address}</p>
                  </div>
                </div>

                {/* Phone */}
                {restaurant.phone && restaurant.phone !== '+91 XXXXXXXXXX' && (
                  <div className="flex gap-3">
                    <i className="fa-solid fa-phone text-green-500 mt-1 flex-shrink-0"></i>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</p>
                      <a
                        href={`tel:${restaurant.phone}`}
                        className="text-sm font-semibold text-green-600 hover:underline"
                      >
                        {restaurant.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Coordinates */}
                <div className="flex gap-3">
                  <i className="fa-solid fa-map text-blue-500 mt-1 flex-shrink-0"></i>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Coordinates</p>
                    <p className="text-sm font-mono text-gray-900">
                      {restaurant.location.latitude.toFixed(4)}, {restaurant.location.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* Ratings & Reviews */}
                <div className="flex gap-3">
                  <i className="fa-solid fa-star text-orange-500 mt-1 flex-shrink-0"></i>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</p>
                    <p className="text-sm font-semibold text-gray-900">
                      ⭐ {restaurant.rating.toFixed(1)} • {restaurant.reviewCount || '0'} reviews
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex gap-3">
                  <i className={`fa-solid fa-${restaurant.isOpen ? 'circle-check' : 'circle-xmark'} mt-1 flex-shrink-0 ${restaurant.isOpen ? 'text-green-500' : 'text-red-500'}`}></i>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</p>
                    <p className={`text-sm font-semibold ${restaurant.isOpen ? 'text-green-700' : 'text-red-700'}`}>
                      {restaurant.isOpen ? '✅ Open Now' : '❌ Currently Closed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <button
                onClick={() => setShowDirections((prev) => !prev)}
                className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold text-sm transition-all text-center flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-map-location-dot"></i>
                {showDirections ? 'Hide Route' : 'Show In-App Directions'}
              </button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.name + ', ' + restaurant.location.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm transition-all text-center flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-directions"></i>
                Open Google Maps
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.location.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-bold text-sm transition-all text-center flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-magnifying-glass"></i>
                Search in Maps
              </a>
            </div>

            {showDirections && (
              <div className="mt-4">
                <MapTilerDirectionsMap
                  origin={userLocation ? {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    lat: userLocation.lat || userLocation.latitude,
                    lng: userLocation.lng || userLocation.longitude
                  } : { lat: 23.0225, lng: 72.5714, latitude: 23.0225, longitude: 72.5714 }}
                  destination={{
                    lat: restaurant.location.latitude,
                    lng: restaurant.location.longitude,
                    latitude: restaurant.location.latitude,
                    longitude: restaurant.location.longitude
                  }}
                  destinationName={restaurant.name}
                  height="320px"
                />
              </div>
            )}

            {/* Order Or Book Buttons */}
            <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
              <button
                onClick={onOrderFood}
                disabled={isLoading || !restaurant.isOpen}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  restaurant.isOpen
                    ? 'bg-gradient-to-r from-[#EF4F5F] to-[#FF6B7B] text-white hover:shadow-lg hover:shadow-[#EF4F5F]/30'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <i className="fa-solid fa-utensils"></i>
                Order Food
              </button>
              <button
                onClick={onBookTable}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/30 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-chair"></i>
                Book Table
              </button>
            </div>

            {/* Info Message */}
            {!restaurant.isOpen && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                <p className="text-sm text-orange-700 font-semibold">
                  ⏰ This restaurant is currently closed. Please check back during business hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RestaurantLocationModal;
