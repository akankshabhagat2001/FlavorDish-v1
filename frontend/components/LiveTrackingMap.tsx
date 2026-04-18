// @ts-nocheck
/**
 * Live Tracking Map - Real-time delivery tracking via Socket.io
 * Uses react-leaflet + MapTiler (free, no paid API key needed)
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../services/runtimeConfig';

// Fix Leaflet default icon paths broken by bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
const TILE_URL = `https://api.maptiler.com/maps/openstreetmap/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`;
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Custom marker icons
const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:40px;height:40px;background:#FF6B6B;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);">📍</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -24],
});

const deliveryIcon = L.divIcon({
  className: '',
  html: `<div style="width:40px;height:40px;background:#4ECDC4;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);">🛵</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -24],
});

interface DeliveryLocation {
  lat: number;
  lng: number;
  status: 'pending' | 'accepted' | 'preparing' | 'on-way' | 'delivered';
  timestamp: number;
}

// Auto-fits the map whenever both markers are available
function BoundsAdjuster({
  userPos,
  deliveryPos,
}: {
  userPos: [number, number] | null;
  deliveryPos: [number, number] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (userPos && deliveryPos) {
      const bounds = L.latLngBounds([userPos, deliveryPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (userPos) {
      map.setView(userPos, 14);
    }
  }, [userPos, deliveryPos]);
  return null;
}

export default function LiveTrackingMap({ orderId }: { orderId: string }) {
  const socketRef = useRef<Socket | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Default center: Ahmedabad
  const defaultCenter: [number, number] = [23.0225, 72.5714];

  const userPos: [number, number] | null = userLocation
    ? [userLocation.lat, userLocation.lng]
    : null;
  const deliveryPos: [number, number] | null = deliveryLocation
    ? [deliveryLocation.lat, deliveryLocation.lng]
    : null;

  // Get user's geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => console.log('Could not get user location')
      );
    }
  }, []);

  // Socket.io for real-time delivery tracking
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current.emit('join-order', orderId);

    socketRef.current.on('delivery-location-update', (data: DeliveryLocation) => {
      console.log('Delivery location update:', data);
      setDeliveryLocation(data);
    });

    socketRef.current.on('order-status-update', (status: string) => {
      console.log('Order status:', status);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [orderId]);

  const statusColor: Record<string, string> = {
    pending: 'text-gray-500',
    accepted: 'text-blue-500',
    preparing: 'text-orange-500',
    'on-way': 'text-green-500',
    delivered: 'text-green-700',
  };

  return (
    <div className="live-tracking-container space-y-3">
      <MapContainer
        center={userPos ?? defaultCenter}
        zoom={13}
        style={{ width: '100%', height: '500px', borderRadius: '12px' }}
        zoomControl={true}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <BoundsAdjuster userPos={userPos} deliveryPos={deliveryPos} />

        {/* User location marker */}
        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-sm">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Delivery partner marker */}
        {deliveryPos && (
          <Marker position={deliveryPos} icon={deliveryIcon}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-sm">🛵 Delivery Partner</p>
                <p className="text-xs text-gray-600 capitalize">
                  {deliveryLocation?.status.replace('-', ' ')}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Line connecting user and delivery partner */}
        {userPos && deliveryPos && (
          <Polyline
            positions={[deliveryPos, userPos]}
            pathOptions={{ color: '#4ECDC4', weight: 3, dashArray: '8 6', opacity: 0.8 }}
          />
        )}
      </MapContainer>

      {/* Status card */}
      {deliveryLocation && (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4 space-y-1">
          <p className="text-sm">
            <span className="font-semibold text-gray-700">Status: </span>
            <span className={`font-bold capitalize ${statusColor[deliveryLocation.status] ?? 'text-gray-600'}`}>
              {deliveryLocation.status.replace('-', ' ').toUpperCase()}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Location: </span>
            {deliveryLocation.lat.toFixed(4)}, {deliveryLocation.lng.toFixed(4)}
          </p>
          <p className="text-sm text-gray-500">
            <span className="font-semibold">Updated: </span>
            {new Date(deliveryLocation.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}

      {!deliveryLocation && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-center text-sm text-gray-500">
          Waiting for delivery partner location...
        </div>
      )}
    </div>
  );
}