import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng } from '../types';
import { getMapTilerRoutingService, RouteResult } from '../services/mapTilerRouting';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapTilerDirectionsMapProps {
  origin: LatLng;
  destination: LatLng;
  destinationName?: string;
  height?: string;
  profile?: 'driving' | 'walking' | 'cycling';
}

const DEFAULT_HEIGHT = '360px';

const MapTilerDirectionsMap: React.FC<MapTilerDirectionsMapProps> = ({
  origin,
  destination,
  destinationName = 'Destination',
  height = DEFAULT_HEIGHT,
  profile = 'driving'
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!mapRef.current) return;

    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
    if (!apiKey) {
      setError('MapTiler API key is missing. Add VITE_MAPTILER_API_KEY to your .env file.');
      setLoading(false);
      return;
    }

    try {
      // Initialize Leaflet map
      const map = L.map(mapRef.current).setView(
        [(origin.lat || origin.latitude) + (destination.lat || destination.latitude) / 2,
         (origin.lng || origin.longitude) + (destination.lng || destination.longitude) / 2],
        13
      );

      // Add MapTiler tiles
      L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${apiKey}`, {
        attribution: '© MapTiler © OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstance.current = map;

      // Get routing service and fetch route
      const routingService = getMapTilerRoutingService();

      routingService.getRoute(origin, destination, profile)
        .then((route) => {
          if (route) {
            setRouteData(route);

            // Add route polyline
            const routeLatLngs = routingService.getRouteLatLngs(route.geometry);
            const routeLine = L.polyline(routeLatLngs, {
              color: 'blue',
              weight: 5,
              opacity: 0.7
            }).addTo(map);

            routeLayerRef.current = routeLine;

            // Add markers
            const startMarker = L.marker([origin.lat || origin.latitude, origin.lng || origin.longitude])
              .addTo(map)
              .bindPopup('Your Location');

            const endMarker = L.marker([destination.lat || destination.latitude, destination.lng || destination.longitude])
              .addTo(map)
              .bindPopup(destinationName);

            markersRef.current = [startMarker, endMarker];

            // Fit map bounds to show entire route
            const bounds = L.latLngBounds(routeLatLngs);
            map.fitBounds(bounds, { padding: [20, 20] });

          } else {
            setError('No route found between these locations.');
          }
        })
        .catch((err) => {
          console.error('Error loading route:', err);
          setError('Failed to load route. Please try again.');
        })
        .finally(() => {
          setLoading(false);
        });

      return () => {
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
        routeLayerRef.current = null;
        markersRef.current = [];
      };
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map.');
      setLoading(false);
    }
  }, [origin, destination, destinationName, profile]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <i className="fas fa-exclamation-triangle text-2xl"></i>
          </div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="rounded-lg border"
        style={{ height }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Calculating route...</p>
          </div>
        </div>
      )}

      {routeData && !loading && (
        <div className="absolute top-2 left-2 bg-white p-3 rounded-lg shadow-md z-[1000]">
          <div className="text-sm">
            <div className="flex items-center mb-1">
              <i className="fas fa-route text-blue-500 mr-2"></i>
              <span className="font-medium">{formatDistance(routeData.distance)}</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-clock text-green-500 mr-2"></i>
              <span>{formatDuration(routeData.duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapTilerDirectionsMap;