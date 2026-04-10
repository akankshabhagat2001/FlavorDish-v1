import React, { useState, useEffect, useRef } from 'react';

interface Location {
  latitude: number;
  longitude: number;
}

interface DeliveryTrackingProps {
  orderId: string;
  restaurantLocation: Location;
  userLocation: Location;
  deliveryPartnerLocation?: Location;
  eta?: number; // minutes remaining
  status: 'confirmed' | 'preparing' | 'ready' | 'dispatched' | 'in-transit' | 'near' | 'delivered';
  onClose: () => void;
}

const DeliveryTrackingMap: React.FC<DeliveryTrackingProps> = ({
  orderId,
  restaurantLocation,
  userLocation,
  deliveryPartnerLocation,
  eta = 30,
  status,
  onClose,
}) => {
  const [currentEta, setCurrentEta] = useState(eta);
  const [distance, setDistance] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const L = useRef<any>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initializeMap;
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      L.current = (window as any).L;
      if (mapRef.current && !mapInstanceRef.current) {
        const map = L.current.map(mapRef.current).setView(
          [userLocation.latitude, userLocation.longitude],
          15
        );

        L.current.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        updateMarkers();
      }
    };

    loadLeaflet();
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) *
        Math.cos((loc2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !L.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.current.Marker) {
        map.removeLayer(layer);
      }
    });

    // User location (blue marker)
    L.current.marker([userLocation.latitude, userLocation.longitude], {
      icon: L.current.divIcon({
        html: `<div class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg"><i class="fa-solid fa-user"></i></div>`,
        iconSize: [30, 30],
      }),
    })
      .addTo(map)
      .bindPopup('Your Location');

    // Restaurant location (red marker)
    L.current.marker([restaurantLocation.latitude, restaurantLocation.longitude], {
      icon: L.current.divIcon({
        html: `<div class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg"><i class="fa-solid fa-utensils"></i></div>`,
        iconSize: [30, 30],
      }),
    })
      .addTo(map)
      .bindPopup('Restaurant');

    // Delivery partner location (green marker)
    if (deliveryPartnerLocation) {
      const dist = calculateDistance(deliveryPartnerLocation, userLocation);
      setDistance(dist);

      L.current.marker([deliveryPartnerLocation.latitude, deliveryPartnerLocation.longitude], {
        icon: L.current.divIcon({
          html: `<div class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg animate-pulse"><i class="fa-solid fa-motorcycle"></i></div>`,
          iconSize: [30, 30],
        }),
      })
        .addTo(map)
        .bindPopup('Delivery Partner');

      // Fit bounds to show all markers
      const bounds = L.current.latLngBounds([
        [userLocation.latitude, userLocation.longitude],
        [restaurantLocation.latitude, restaurantLocation.longitude],
        [deliveryPartnerLocation.latitude, deliveryPartnerLocation.longitude],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      const bounds = L.current.latLngBounds([
        [userLocation.latitude, userLocation.longitude],
        [restaurantLocation.latitude, restaurantLocation.longitude],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Update ETA
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEta(prev => (prev > 0 ? prev - 1 : 0));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Update markers when location changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers();
    }
  }, [deliveryPartnerLocation]);

  const getStatusInfo = () => {
    switch (status) {
      case 'confirmed':
        return { icon: '✓', text: 'Order Confirmed', color: 'blue' };
      case 'preparing':
        return { icon: '👨‍🍳', text: 'Preparing Your Food', color: 'orange' };
      case 'ready':
        return { icon: '📦', text: 'Order Ready for Pickup', color: 'yellow' };
      case 'dispatched':
        return { icon: '🚗', text: 'Dispatch to Delivery Partner', color: 'green' };
      case 'in-transit':
        return { icon: '🏍️', text: 'On the Way', color: 'green' };
      case 'near':
        return { icon: '📍', text: 'Delivery Partner Arriving', color: 'red' };
      case 'delivered':
        return { icon: '✅', text: 'Order Delivered', color: 'green' };
      default:
        return { icon: '?', text: 'Unknown', color: 'gray' };
    }
  };

  const statusInfo = getStatusInfo();
  const colorClasses = {
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EF4F5F] to-[#FF6B7B] text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold">Live Tracking</h2>
            <p className="text-sm text-white/80">Order #{orderId.substring(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-2xl hover:bg-white/20 p-2 rounded-full transition-all">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Map */}
          <div ref={mapRef} className="h-80 bg-gray-100" />

          {/* Info Section */}
          <div className="p-6 space-y-4">
            {/* Status */}
            <div className={`${colorClasses[statusInfo.color as keyof typeof colorClasses]} text-white p-4 rounded-lg text-center`}>
              <p className="text-3xl mb-2">{statusInfo.icon}</p>
              <p className="font-bold text-lg">{statusInfo.text}</p>
            </div>

            {/* Stats Grid */}
            {deliveryPartnerLocation && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center border-2 border-blue-200">
                  <p className="text-sm text-gray-600 font-semibold">Distance</p>
                  <p className="text-2xl font-bold text-blue-600">{distance.toFixed(1)} km</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg text-center border-2 border-green-200">
                  <p className="text-sm text-gray-600 font-semibold">ETA</p>
                  <p className="text-2xl font-bold text-green-600">{currentEta} min</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg text-center border-2 border-orange-200">
                  <p className="text-sm text-gray-600 font-semibold">Speed</p>
                  <p className="text-2xl font-bold text-orange-600">~25 km/h</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-bold text-gray-800 mb-3">Order Status Timeline</p>
              <div className="space-y-2">
                {[
                  { label: 'Confirmed', icon: '✓', done: ['confirmed', 'preparing', 'ready', 'dispatched', 'in-transit', 'near', 'delivered'].includes(status) },
                  { label: 'Preparing', icon: '👨‍🍳', done: ['preparing', 'ready', 'dispatched', 'in-transit', 'near', 'delivered'].includes(status) },
                  { label: 'Ready', icon: '📦', done: ['ready', 'dispatched', 'in-transit', 'near', 'delivered'].includes(status) },
                  { label: 'Dispatched', icon: '🚗', done: ['dispatched', 'in-transit', 'near', 'delivered'].includes(status) },
                  { label: 'In Transit', icon: '🏍️', done: ['in-transit', 'near', 'delivered'].includes(status) },
                  { label: 'Delivered', icon: '✅', done: ['delivered'].includes(status) },
                ].map((step, idx, arr) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        step.done
                          ? 'bg-green-500 text-white'
                          : idx === arr.findIndex(s => ['confirmed', 'preparing', 'ready', 'dispatched', 'in-transit', 'near', 'delivered'].indexOf(s.label) === ['confirmed', 'preparing', 'ready', 'dispatched', 'in-transit', 'near', 'delivered'].indexOf(status))
                            ? 'bg-[#EF4F5F] text-white'
                            : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span
                      className={`font-semibold ${
                        step.done ? 'text-gray-800' : idx === arr.findIndex(s => ['confirmed', 'preparing', 'ready', 'dispatched', 'in-transit', 'near', 'delivered'].indexOf(s.label) === ['confirmed', 'preparing', 'ready', 'dispatched', 'in-transit', 'near', 'delivered'].indexOf(status)) ? 'text-[#EF4F5F]' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-blue-500 text-white py-2 rounded-lg font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-phone"></i> Call Driver
              </button>
              <button className="bg-green-500 text-white py-2 rounded-lg font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-share"></i> Share Tracking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTrackingMap;
