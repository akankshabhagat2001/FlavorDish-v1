/**
 * MapTiler Routing Service
 * Calls MapTiler Directions REST API directly.
 * No SDK import needed — @maptiler/sdk does NOT export a directions() function.
 *
 * API docs: https://docs.maptiler.com/cloud/api/directions/
 * Endpoint: GET https://api.maptiler.com/directions/v2/{profile}/{lng1,lat1};{lng2,lat2}?key=KEY
 *
 * Supported profiles: driving | walking | cycling
 */

import { LatLng } from '../types';

export interface RouteResult {
  distance: number;              // total route distance in meters
  duration: number;              // total route duration in seconds
  geometry: [number, number][];  // [lng, lat] coordinate pairs (GeoJSON order)
  steps?: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  name: string;
}

export class MapTilerRoutingService {
  private apiKey: string;
  private baseUrl = 'https://api.maptiler.com/directions/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch a driving/walking/cycling route between two points.
   * @param start  Origin coordinates (LatLng from FlavorFinder types)
   * @param end    Destination coordinates
   * @param profile  'driving' | 'walking' | 'cycling' — defaults to 'driving'
   * @returns RouteResult or null if no route found
   */
  async getRoute(
    start: LatLng,
    end: LatLng,
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<RouteResult | null> {
    // Normalise LatLng — FlavorFinder type has both .lat/.lng AND .latitude/.longitude
    const startLng = start.lng ?? start.longitude;
    const startLat = start.lat ?? start.latitude;
    const endLng   = end.lng ?? end.longitude;
    const endLat   = end.lat ?? end.latitude;

    const url =
      `${this.baseUrl}/${profile}` +
      `/${startLng},${startLat};${endLng},${endLat}` +
      `?steps=true&geometries=geojson&language=en&key=${this.apiKey}`;

    try {
      const res = await fetch(url);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Directions API ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const route = data?.routes?.[0];
      if (!route) return null;

      // Extract turn-by-turn steps if available
      const steps: RouteStep[] = [];
      if (route.legs?.[0]?.steps) {
        for (const step of route.legs[0].steps) {
          steps.push({
            instruction: step.maneuver?.instruction ?? step.name ?? '',
            distance:    step.distance ?? 0,
            duration:    step.duration ?? 0,
            name:        step.name ?? '',
          });
        }
      }

      return {
        distance: route.distance,                    // meters
        duration: route.duration,                    // seconds
        geometry: route.geometry.coordinates,        // [lng, lat][]  (GeoJSON)
        steps,
      };
    } catch (err) {
      console.error('[MapTilerRoutingService] getRoute error:', err);
      return null;
    }
  }

  /**
   * Convert GeoJSON [lng, lat][] → Leaflet [lat, lng][]
   * Always use this before passing coordinates to react-leaflet / L.polyline.
   */
  getRouteLatLngs(geometry: [number, number][]): [number, number][] {
    return geometry.map(([lng, lat]) => [lat, lng]);
  }

  /**
   * Human-readable duration string from seconds.
   * e.g. 3780 → "1h 3m"
   */
  static formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  }

  /**
   * Human-readable distance from meters.
   * e.g. 3200 → "3.2 km"
   */
  static formatDistance(meters: number): string {
    return meters >= 1000
      ? `${(meters / 1000).toFixed(1)} km`
      : `${Math.round(meters)} m`;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
let _instance: MapTilerRoutingService | null = null;

export const getMapTilerRoutingService = (): MapTilerRoutingService => {
  if (!_instance) {
    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
    if (!apiKey) {
      throw new Error(
        'VITE_MAPTILER_API_KEY is not set. Add it to your frontend .env file.'
      );
    }
    _instance = new MapTilerRoutingService(apiKey);
  }
  return _instance;
};