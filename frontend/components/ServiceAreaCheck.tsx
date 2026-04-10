import React, { useState, useEffect } from 'react';
import { locationFilterService, LocationStatus } from '../services/locationFilterService';

interface ServiceAreaCheckProps {
  onLocationVerified?: (status: LocationStatus) => void;
  onOutsideArea?: (status: LocationStatus) => void;
}

export default function ServiceAreaCheck({ onLocationVerified, onOutsideArea }: ServiceAreaCheckProps) {
  const [status, setStatus] = useState<LocationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Auto-check location on mount
  useEffect(() => {
    checkServiceArea();
  }, []);

  const checkServiceArea = async () => {
    setLoading(true);
    try {
      // Get user's GPS location
      const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => {
            console.warn('Location permission denied, using default:', err);
            // Use default Ahmedabad if permission denied
            resolve({ latitude: 23.0225, longitude: 72.5714 } as any);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });

      // Check if in service area
      const locationStatus = await locationFilterService.checkServiceArea(
        position.latitude,
        position.longitude
      );

      setStatus(locationStatus);

      if (locationStatus.isInServiceArea) {
        // Save to localStorage
        localStorage.setItem('userLocation', JSON.stringify(locationStatus));
        if (onLocationVerified) onLocationVerified(locationStatus);
      } else {
        setShowModal(true);
        if (onOutsideArea) onOutsideArea(locationStatus);
      }
    } catch (error) {
      console.error('Error checking service area:', error);
      // Default to Ahmedabad on error
      const defaultStatus = locationFilterService.forceAhmedabad();
      setStatus(defaultStatus);
      if (onLocationVerified) onLocationVerified(defaultStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCity = () => {
    checkServiceArea();
    setShowModal(false);
  };

  // Show modal if outside service area
  if (showModal && status && !status.isInServiceArea) {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-4 text-6xl">📍</div>
          
          <h2 className="text-2xl font-black text-gray-800 mb-4">
            Service Not Available
          </h2>

          <p className="text-lg text-gray-600 mb-2">
            Your current location: <strong>{status.city}</strong>
          </p>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-bold">
              ❌ {status.message}
            </p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-blue-700 text-sm">
              ✅ We're currently operating in: <strong>Ahmedabad</strong>
            </p>
            <p className="text-blue-600 text-xs mt-2">
              Distance: {status.distance} km from Ahmedabad
            </p>
          </div>

          <button
            onClick={handleChangeCity}
            className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all mb-3"
          >
            🔄 Retry Location Check
          </button>

          <button
            onClick={() => {
              // Force Ahmedabad location
              const forcedStatus = locationFilterService.forceAhmedabad();
              setStatus(forcedStatus);
              localStorage.setItem('userLocation', JSON.stringify(forcedStatus));
              setShowModal(false);
              if (onLocationVerified) onLocationVerified(forcedStatus);
            }}
            className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl transition-all"
          >
            📍 Set to Ahmedabad
          </button>

          <p className="text-xs text-gray-500 mt-4">
            We'll soon expand to more cities. Follow us for updates!
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center">
        <div className="bg-white rounded-full p-6 shadow-xl">
          <div className="animate-spin">
            <span className="text-4xl">📍</span>
          </div>
          <p className="text-center text-sm text-gray-600 mt-4 font-bold">
            Detecting your location...
          </p>
        </div>
      </div>
    );
  }

  return null; // Don't render anything if in service area
}
