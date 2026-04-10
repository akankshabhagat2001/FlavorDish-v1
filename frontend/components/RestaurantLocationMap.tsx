/**
 * Restaurant Location Map - Shows single or multiple restaurant locations
 * Used for both delivery tracking and table booking views
 */

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Restaurant } from '../types';

// Set Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';

interface RestaurantLocationMapProps {
  restaurant: Restaurant;
  userLocation?: { lat: number; lng: number };
  showDirections?: boolean;
  allowFullScreen?: boolean;
  height?: string;
}

const RestaurantLocationMap: React.FC<RestaurantLocationMapProps> = ({
  restaurant,
  userLocation,
  showDirections = true,
  allowFullScreen = true,
  height = '400px',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !restaurant) return;

    // Initialize map centered on restaurant location
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [restaurant.location.longitude, restaurant.location.latitude],
      zoom: 15,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Add restaurant marker
      const restaurantMarkerEl = document.createElement('div');
      restaurantMarkerEl.className = 'w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white cursor-pointer';
      restaurantMarkerEl.innerHTML = '🍽️';
      restaurantMarkerEl.title = restaurant.name;

      new mapboxgl.Marker({ element: restaurantMarkerEl })
        .setLngLat([restaurant.location.longitude, restaurant.location.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="text-center">
              <h3 class="font-bold text-sm">${restaurant.name}</h3>
              <p class="text-xs text-gray-600">${restaurant.location.address}</p>
              <p class="text-xs font-semibold text-green-600">⭐ ${restaurant.rating.toFixed(1)}</p>
            </div>`
          )
        )
        .addTo(map);

      // Add user marker if available
      if (userLocation) {
        const userMarkerEl = document.createElement('div');
        userMarkerEl.className = 'w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white cursor-pointer';
        userMarkerEl.innerHTML = '📍';
        userMarkerEl.title = 'Your Location';

        new mapboxgl.Marker({ element: userMarkerEl })
          .setLngLat([userLocation.lng, userLocation.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              '<div class="text-center"><p class="font-bold text-sm">Your Location</p></div>'
            )
          )
          .addTo(map);

        // Fit bounds to show both markers
        const bounds = new mapboxgl.LngLatBounds()
          .extend([restaurant.location.longitude, restaurant.location.latitude])
          .extend([userLocation.lng, userLocation.lat]);
        map.fitBounds(bounds, { padding: 50 });

        // Add route line
        if (map.getSource('route')) {
          map.removeLayer('route');
          map.removeSource('route');
        }

        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [userLocation.lng, userLocation.lat],
                [restaurant.location.longitude, restaurant.location.latitude],
              ],
            },
          },
        });

        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#4F46E5',
            'line-width': 3,
            'line-dasharray': [3, 3],
          },
        });

        // Calculate distance
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          restaurant.location.latitude,
          restaurant.location.longitude
        );
        const duration = Math.ceil((distance / 40) * 60);
        console.log(`Distance: ${distance.toFixed(2)} km, Estimated time: ${duration} mins`);
      } else {
        map.setCenter([restaurant.location.longitude, restaurant.location.latitude]);
      }
    });

    return () => {
      map.remove();
    };
  }, [restaurant, userLocation]);

  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleOpenGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.name + ', ' + restaurant.location.address)}`,
      '_blank'
    );
  };

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-900">{restaurant.name} - Location</h3>
            <button
              onClick={() => setIsFullScreen(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Map */}
          <div className="flex-1 overflow-hidden rounded-b-2xl">
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={handleOpenGoogleMaps}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-map"></i> Open in Google Maps
            </button>
            <button
              onClick={() => setIsFullScreen(false)}
              className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-bold text-sm hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100">
        <div ref={mapContainer} style={{ width: '100%', height }} />

        {/* Full Screen Toggle Button */}
        {allowFullScreen && (
          <button
            onClick={() => setIsFullScreen(true)}
            className="absolute top-4 right-4 z-40 bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:shadow-lg font-bold text-sm transition-all border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
          >
            <i className="fa-solid fa-expand"></i> Full Screen
          </button>
        )}

        {/* Card Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-black text-sm text-gray-900">{restaurant.name}</h4>
              <p className="text-[11px] text-gray-600 line-clamp-2">{restaurant.location.address}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-orange-500">⭐ {restaurant.rating.toFixed(1)}</p>
              <p className="text-[10px] text-gray-500">{restaurant.reviewCount || 'N/A'} reviews</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={handleOpenGoogleMaps}
              className="flex-1 bg-green-50 text-green-600 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-green-100 transition-colors border border-green-200 flex items-center justify-center gap-1"
            >
              <i className="fa-solid fa-directions"></i> Directions
            </button>
            {showDirections && (
              <button
                onClick={() => {
                  const phone = restaurant.phone || '';
                  if (phone && phone !== '+91 XXXXXXXXXX') {
                    window.open(`tel:${phone}`);
                  }
                }}
                className="flex-1 bg-blue-50 text-blue-600 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-colors border border-blue-200 flex items-center justify-center gap-1"
              >
                <i className="fa-solid fa-phone"></i> Call
              </button>
            )}
            <button
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.location.address)}`, '_blank')}
              className="flex-1 bg-purple-50 text-purple-600 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-purple-100 transition-colors border border-purple-200 flex items-center justify-center gap-1"
            >
              <i className="fa-solid fa-info"></i> Details
            </button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
          <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Rating</p>
          <p className="text-lg font-black text-orange-700">⭐ {restaurant.rating.toFixed(1)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
          <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Delivery</p>
          <p className="text-lg font-black text-green-700">{restaurant.deliveryTime}m</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">For Two</p>
          <p className="text-lg font-black text-blue-700">₹{restaurant.costForTwo}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
          <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Status</p>
          <p className={`text-lg font-black ${restaurant.isOpen ? 'text-green-700' : 'text-red-700'}`}>
            {restaurant.isOpen ? 'Open' : 'Closed'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantLocationMap;
