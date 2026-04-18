import React, { useEffect, useRef, useState } from 'react';
import { Restaurant, LatLng } from '../types.ts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  restaurants: Restaurant[];
  center: LatLng;
  onRestaurantClick: (restaurant: Restaurant) => void;
  onClose: () => void;
  isInline?: boolean;
  hoveredRestaurantId?: string | null;
  courierPosition?: LatLng | null;
  destinationPosition?: LatLng | null;
  showTrace?: boolean;
}

const MapView: React.FC<MapViewProps> = ({
  restaurants,
  center,
  onRestaurantClick,
  onClose,
  isInline = false,
  hoveredRestaurantId = null,
  courierPosition = null,
  destinationPosition = null,
  showTrace = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    try {
      // Initialize Leaflet map
      const map = L.map(mapRef.current).setView([center.lat, center.lng], 13);

      // Add MapTiler tiles
      const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
      if (apiKey) {
        L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${apiKey}`, {
          attribution: '© MapTiler © OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);
      } else {
        // Fallback to OpenStreetMap if no MapTiler key
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);
      }

      mapInstance.current = map;
      setIsMapLoaded(true);

      return () => {
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
    }
  }, [center]);

  // Add restaurant markers
  useEffect(() => {
    if (!mapInstance.current || !isMapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      mapInstance.current!.removeLayer(marker);
    });
    markersRef.current = {};

    // Add new markers
    restaurants.forEach((restaurant) => {
      const marker = L.marker([restaurant.location.latitude, restaurant.location.longitude])
        .addTo(mapInstance.current!)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-lg">${restaurant.name}</h3>
            <p class="text-sm text-gray-600">${restaurant.cuisine.join(', ')}</p>
            <p class="text-sm">⭐ ${restaurant.rating} • ${restaurant.deliveryTime}</p>
            <button class="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" onclick="window.dispatchEvent(new CustomEvent('restaurantClick', { detail: '${restaurant._id}' }))">
              View Details
            </button>
          </div>
        `);

      // Highlight hovered restaurant
      if (hoveredRestaurantId === restaurant._id) {
        marker.openPopup();
      }

      marker.on('click', () => {
        onRestaurantClick(restaurant);
      });

      markersRef.current[restaurant._id] = marker;
    });
  }, [restaurants, isMapLoaded, hoveredRestaurantId, onRestaurantClick]);

  // Add courier and destination markers
  useEffect(() => {
    if (!mapInstance.current || !isMapLoaded) return;

    // Add courier marker
    if (courierPosition) {
      if (courierMarkerRef.current) {
        mapInstance.current.removeLayer(courierMarkerRef.current);
      }

      const courierIcon = L.divIcon({
        html: '<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><i class="fa-solid fa-truck text-white text-xs"></i></div>',
        className: 'custom-courier-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      courierMarkerRef.current = L.marker([courierPosition.lat, courierPosition.lng], { icon: courierIcon })
        .addTo(mapInstance.current)
        .bindPopup('Delivery Partner');
    }

    // Add destination marker
    if (destinationPosition) {
      if (destinationMarkerRef.current) {
        mapInstance.current.removeLayer(destinationMarkerRef.current);
      }

      const destIcon = L.divIcon({
        html: '<div class="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><i class="fa-solid fa-house text-white text-xs"></i></div>',
        className: 'custom-destination-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      destinationMarkerRef.current = L.marker([destinationPosition.lat, destinationPosition.lng], { icon: destIcon })
        .addTo(mapInstance.current)
        .bindPopup('Delivery Destination');
    }

    // Add route polyline if both positions exist
    if (courierPosition && destinationPosition && showTrace) {
      if (polylineRef.current) {
        mapInstance.current.removeLayer(polylineRef.current);
      }

      const latlngs: [number, number][] = [
        [courierPosition.lat, courierPosition.lng],
        [destinationPosition.lat, destinationPosition.lng]
      ];

      polylineRef.current = L.polyline(latlngs, {
        color: 'blue',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(mapInstance.current);
    }
  }, [courierPosition, destinationPosition, showTrace, isMapLoaded]);

  if (mapError) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-map text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">Map could not be loaded</p>
          <p className="text-sm text-gray-500">Using free OpenStreetMap</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${isInline ? 'w-full h-96' : 'w-full h-full'}`}>
      {!isInline && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[1000] bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
        >
          <i className="fa-solid fa-times text-gray-700"></i>
        </button>
      )}

      <div ref={mapRef} className="w-full h-full rounded-lg" />

      <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <i className="fa-solid fa-info-circle"></i>
          <span>Free OpenStreetMap</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
