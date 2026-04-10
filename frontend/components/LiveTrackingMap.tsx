import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { io, Socket } from 'socket.io-client';

// Get your Mapbox token from https://account.mapbox.com/tokens/
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';

interface DeliveryLocation {
  lat: number;
  lng: number;
  status: 'pending' | 'accepted' | 'preparing' | 'on-way' | 'delivered';
  timestamp: number;
}

interface Marker {
  element: HTMLDivElement;
  marker: mapboxgl.Marker;
}

export default function LiveTrackingMap({ orderId }: { orderId: string }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const markersRef = useRef<{ [key: string]: Marker }>({});

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [72.5714, 23.0225], // Ahmedabad coordinates
      zoom: 13,
    });

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserLocation({ lat: userLat, lng: userLng });

          if (map.current) {
            map.current.setCenter([userLng, userLat]);
            addMarker('user', userLng, userLat, 'User Location', '#FF6B6B');
          }
        },
        () => console.log('Could not get user location')
      );
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  // Connect to Socket.io for real-time tracking
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current.emit('join-order', orderId);

    socketRef.current.on('delivery-location-update', (data: DeliveryLocation) => {
      console.log('Delivery location update:', data);
      setDeliveryLocation(data);

      if (map.current) {
        addMarker('delivery', data.lng, data.lat, `Delivery Boy - ${data.status}`, '#4ECDC4');

        // Auto-fit map to show both locations
        if (userLocation) {
          const bounds = new mapboxgl.LngLatBounds()
            .extend([data.lng, data.lat])
            .extend([userLocation.lng, userLocation.lat]);
          map.current.fitBounds(bounds, { padding: 50 });
        }
      }
    });

    socketRef.current.on('order-status-update', (status: string) => {
      console.log('Order status:', status);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [orderId, userLocation]);

  // Add marker to map
  const addMarker = (
    id: string,
    lng: number,
    lat: number,
    title: string,
    color: string
  ) => {
    if (!map.current) return;

    // Remove existing marker if any
    if (markersRef.current[id]) {
      markersRef.current[id].marker.remove();
    }

    // Create custom marker
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.backgroundColor = color;
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid white';
    el.style.cursor = 'pointer';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontSize = '20px';

    // Add emoji
    if (id === 'user') {
      el.innerHTML = '📍';
    } else if (id === 'delivery') {
      el.innerHTML = '🛵';
    }

    const marker = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<div><strong>${title}</strong></div>`))
      .addTo(map.current);

    markersRef.current[id] = { element: el, marker };
  };

  return (
    <div className="live-tracking-container">
      <div ref={mapContainer} style={{ width: '100%', height: '500px', borderRadius: '12px' }} />
      {deliveryLocation && (
        <div className="tracking-status">
          <p>
            <strong>Status:</strong> {deliveryLocation.status.replace('-', ' ').toUpperCase()}
          </p>
          <p>
            <strong>Location:</strong> {deliveryLocation.lat.toFixed(4)}, {deliveryLocation.lng.toFixed(4)}
          </p>
          <p>
            <strong>Updated:</strong> {new Date(deliveryLocation.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}
