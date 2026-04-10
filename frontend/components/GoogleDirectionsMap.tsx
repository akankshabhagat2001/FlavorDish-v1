import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsApi } from '../services/googleMapsLoader';
import { LatLng } from '../types';

interface GoogleDirectionsMapProps {
  origin: LatLng;
  destination: LatLng;
  destinationName?: string;
  height?: string;
}

const DEFAULT_HEIGHT = '360px';
const DEFAULT_AHMEDABAD_CENTER: LatLng = { lat: 23.0225, lng: 72.5714, latitude: 23.0225, longitude: 72.5714 } as any;

const GoogleDirectionsMap: React.FC<GoogleDirectionsMapProps> = ({
  origin,
  destination,
  destinationName,
  height = DEFAULT_HEIGHT,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string>('');
  const [routeSteps, setRouteSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!mapRef.current) return;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
      return;
    }

    setLoading(true);
    loadGoogleMapsApi(apiKey)
      .then(() => {
        const google = (window as any).google;
        if (!google || !google.maps) {
          throw new Error('Google Maps library not available');
        }

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: origin.lat || origin.latitude, lng: origin.lng || origin.longitude },
          zoom: 13,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });

        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({ map, suppressMarkers: false });

        directionsService.route(
          {
            origin: { lat: origin.lat || origin.latitude, lng: origin.lng || origin.longitude },
            destination: { lat: destination.lat || destination.latitude, lng: destination.lng || destination.longitude },
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: false,
          },
          (result: any, status: string) => {
            setLoading(false);
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result);
              const steps: string[] = [];
              const legs = result.routes?.[0]?.legs ?? [];
              legs.forEach((leg: any) => {
                leg.steps.forEach((step: any) => {
                  const text = step.instructions?.replace(/<[^>]+>/g, '') || '';
                  if (text) steps.push(text);
                });
              });
              setRouteSteps(steps);
            } else {
              console.error('Directions request failed:', status, result);
              setError('Unable to calculate directions right now. Please try again later.');
            }
          }
        );
      })
      .catch((err) => {
        console.error('Google Maps load error:', err);
        setError(err.message || 'Failed to load Google Maps.');
        setLoading(false);
      });
  }, [origin, destination]);

  const mapCenter = origin || DEFAULT_AHMEDABAD_CENTER;

  return (
    <div className="space-y-4">
      <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-lg" style={{ height }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-gray-700 font-black">
            Loading directions…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-white/90 p-6 flex items-center justify-center text-center text-sm text-red-600 font-bold">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
          <p className="text-[10px] uppercase tracking-[2px] text-slate-500 font-black mb-2">From</p>
          <p className="text-sm font-semibold text-slate-900">{destinationName ? `Your location → ${destinationName}` : 'Your location'}</p>
          <p className="text-xs text-slate-500 mt-1">Ahmedabad city route</p>
        </div>
        <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
          <p className="text-[10px] uppercase tracking-[2px] text-slate-500 font-black mb-2">Destination</p>
          <p className="text-sm font-semibold text-slate-900">{destinationName || 'Street food spot'}</p>
          <p className="text-xs text-slate-500 mt-1">{destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-black text-slate-900">Follow the route</h4>
        {routeSteps.length > 0 ? (
          <ol className="list-decimal list-inside text-sm text-slate-700 space-y-2">
            {routeSteps.map((step, idx) => (
              <li key={idx} className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
                {step}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">Step-by-step directions will appear here once the route is ready.</p>
        )}
      </div>
    </div>
  );
};

export default GoogleDirectionsMap;
