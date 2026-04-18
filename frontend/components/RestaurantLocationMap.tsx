// @ts-nocheck
/**
 * Restaurant Location Map
 * ───────────────────────
 * Shows a restaurant pin + optional user pin with a dashed line between them.
 * Uses react-leaflet + MapTiler Streets-v2 tiles.
 *
 * Fix applied: tile URL changed from .jpg (openstreetmap raster) to .png
 * (streets-v2). The .jpg extension caused "Invalid key" overlays because
 * the openstreetmap raster style uses a separate quota tier on MapTiler.
 */

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Restaurant } from '../types';

// ─── Leaflet bundler icon fix ─────────────────────────────────────────────────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl:     markerShadow,
});

// ─── Tile config ──────────────────────────────────────────────────────────────
// KEY FIX: use streets-v2 with .png — NOT openstreetmap with .jpg
// openstreetmap/.jpg caused the "Invalid key" overlay because that style
// lives under a different MapTiler quota bucket.
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
const TILE_URL     = `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;
const TILE_ATTR    =
  '&copy; <a href="https://www.maptiler.com/">MapTiler</a> ' +
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// ─── Custom marker icons ──────────────────────────────────────────────────────
const restaurantIcon = L.divIcon({
  className: '',
  html: `<div style="width:40px;height:40px;background:#EF4F5F;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:20px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🍽️</div>`,
  iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -24],
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:34px;height:34px;background:#3B82F6;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">📍</div>`,
  iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -20],
});

// ─── Auto-fit helper ──────────────────────────────────────────────────────────
function BoundsAdjuster({
  restaurantPos,
  userPos,
}: {
  restaurantPos: [number, number];
  userPos?: [number, number];
}) {
  const map = useMap();
  React.useEffect(() => {
    if (userPos) {
      map.fitBounds(L.latLngBounds([restaurantPos, userPos]), { padding: [50, 50] });
    } else {
      map.setView(restaurantPos, 15);
    }
  }, [restaurantPos, userPos]);
  return null;
}

// ─── Haversine distance ───────────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface RestaurantLocationMapProps {
  restaurant:       Restaurant;
  userLocation?:    { lat: number; lng: number };
  showDirections?:  boolean;
  allowFullScreen?: boolean;
  height?:          string;
}

// ─── Component ────────────────────────────────────────────────────────────────
const RestaurantLocationMap: React.FC<RestaurantLocationMapProps> = ({
  restaurant,
  userLocation,
  showDirections = true,
  allowFullScreen = true,
  height = '400px',
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const restaurantPos: [number, number] = [
    restaurant.location.latitude,
    restaurant.location.longitude,
  ];
  const userPos: [number, number] | undefined = userLocation
    ? [userLocation.lat, userLocation.lng]
    : undefined;

  const distance = userPos
    ? haversine(userPos[0], userPos[1], restaurantPos[0], restaurantPos[1])
    : null;

  const handleOpenGoogleMaps = () =>
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        restaurant.name + ', ' + restaurant.location.address
      )}`,
      '_blank'
    );

  // Shared map content rendered in both normal and fullscreen modes
  const MapContent = ({ mapHeight }: { mapHeight: string }) => (
    <MapContainer
      center={restaurantPos}
      zoom={15}
      style={{ width: '100%', height: mapHeight }}
      zoomControl
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <BoundsAdjuster restaurantPos={restaurantPos} userPos={userPos} />

      <Marker position={restaurantPos} icon={restaurantIcon}>
        <Popup>
          <div className="text-center p-1">
            <h3 className="font-bold text-sm">{restaurant.name}</h3>
            <p className="text-xs text-gray-600">{restaurant.location.address}</p>
            <p className="text-xs font-semibold text-green-600">
              ⭐ {restaurant.rating.toFixed(1)}
            </p>
          </div>
        </Popup>
      </Marker>

      {userPos && (
        <>
          <Marker position={userPos} icon={userIcon}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-sm">Your Location</p>
                {distance && (
                  <p className="text-xs text-gray-500">{distance.toFixed(1)} km away</p>
                )}
              </div>
            </Popup>
          </Marker>
          <Polyline
            positions={[userPos, restaurantPos]}
            pathOptions={{ color: '#4F46E5', weight: 3, dashArray: '8 6', opacity: 0.7 }}
          />
        </>
      )}
    </MapContainer>
  );

  // Full-screen modal
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-900">
              {restaurant.name} — Location
            </h3>
            <button
              onClick={() => setIsFullScreen(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden rounded-b-2xl">
            <MapContent mapHeight="100%" />
          </div>
          <div className="p-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={handleOpenGoogleMaps}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-map" /> Open in Google Maps
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

  // Normal view
  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100">
        <MapContent mapHeight={height} />

        {allowFullScreen && (
          <button
            onClick={() => setIsFullScreen(true)}
            className="absolute top-4 right-4 z-[400] bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:shadow-lg font-bold text-sm transition-all border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
          >
            <i className="fa-solid fa-expand" /> Full Screen
          </button>
        )}

        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-black text-sm text-gray-900">{restaurant.name}</h4>
              <p className="text-[11px] text-gray-600 line-clamp-2">
                {restaurant.location.address}
              </p>
              {distance && (
                <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                  📏 {distance.toFixed(1)} km from you
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-orange-500">⭐ {restaurant.rating.toFixed(1)}</p>
              <p className="text-[10px] text-gray-500">
                {(restaurant as any).reviewCount || 'N/A'} reviews
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={handleOpenGoogleMaps}
              className="flex-1 bg-green-50 text-green-600 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-green-100 transition-colors border border-green-200 flex items-center justify-center gap-1"
            >
              <i className="fa-solid fa-directions" /> Directions
            </button>
            {showDirections && (
              <button
                onClick={() => {
                  const phone = (restaurant as any).phone || '';
                  if (phone && phone !== '+91 XXXXXXXXXX') window.open(`tel:${phone}`);
                }}
                className="flex-1 bg-blue-50 text-blue-600 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-colors border border-blue-200 flex items-center justify-center gap-1"
              >
                <i className="fa-solid fa-phone" /> Call
              </button>
            )}
            <button
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    restaurant.name + ' ' + restaurant.location.address
                  )}`,
                  '_blank'
                )
              }
              className="flex-1 bg-purple-50 text-purple-600 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-purple-100 transition-colors border border-purple-200 flex items-center justify-center gap-1"
            >
              <i className="fa-solid fa-info" /> Details
            </button>
          </div>
        </div>
      </div>

      {/* Info cards */}
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