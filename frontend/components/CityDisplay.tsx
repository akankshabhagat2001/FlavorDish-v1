import React, { useState, useEffect } from 'react';
import { locationFilterService, LocationStatus } from '../services/locationFilterService';

interface CityDisplayProps {
  onCityDetected?: (city: string, status: LocationStatus) => void;
  showChangeOption?: boolean;
}

export default function CityDisplay({ onCityDetected, showChangeOption = true }: CityDisplayProps) {
  const [currentCity, setCurrentCity] = useState<string>('Ahmedabad');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [availableCities] = useState<string[]>(['Ahmedabad', 'Gandhinagar', 'Vadodara']);
  const [locationStatus, setLocationStatus] = useState<LocationStatus | null>(null);
  const [detecting, setDetecting] = useState(false);

  // Load saved city on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedCity');
    const savedLocation = localStorage.getItem('userLocation');
    
    if (saved) {
      setCurrentCity(saved);
    }
    
    if (savedLocation) {
      try {
        const status = JSON.parse(savedLocation);
        setLocationStatus(status);
      } catch (e) {
        console.error('Error parsing location status:', e);
      }
    }
  }, []);

  const handleDetectLocation = async () => {
    setDetecting(true);
    try {
      const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          reject,
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });

      const status = await locationFilterService.checkServiceArea(
        position.latitude,
        position.longitude
      );

      setLocationStatus(status);
      setCurrentCity(status.city);
      localStorage.setItem('selectedCity', status.city);
      localStorage.setItem('userLocation', JSON.stringify(status));

      if (onCityDetected) {
        onCityDetected(status.city, status);
      }

      setShowCityPicker(false);
    } catch (error) {
      console.error('Error detecting location:', error);
      // Use default
      const defaultStatus = locationFilterService.forceAhmedabad();
      setLocationStatus(defaultStatus);
      setCurrentCity('Ahmedabad');
      localStorage.setItem('selectedCity', 'Ahmedabad');
    } finally {
      setDetecting(false);
    }
  };

  const handleSelectCity = (city: string) => {
    setCurrentCity(city);
    localStorage.setItem('selectedCity', city);
    
    // Create status for selected city
    const status: LocationStatus = {
      isInServiceArea: true,
      city: city,
      distance: 0,
      message: `📍 Delivering in ${city}`,
      canOrder: true,
    };
    
    setLocationStatus(status);
    localStorage.setItem('userLocation', JSON.stringify(status));
    
    if (onCityDetected) {
      onCityDetected(city, status);
    }
    
    setShowCityPicker(false);
  };

  return (
    <div className="relative">
      {/* City Display Button (Zomato Style) */}
      <button
        onClick={() => setShowCityPicker(!showCityPicker)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        title={locationStatus?.message || 'Change city'}
      >
        <span className="text-xl">📍</span>
        <div className="text-left">
          <p className="text-xs text-gray-500 font-semibold">DELIVERY TO</p>
          <p className="text-sm font-black text-gray-800">{currentCity}</p>
        </div>
        <span className="text-gray-400">▼</span>
      </button>

      {/* City Picker Dropdown */}
      {showCityPicker && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1000]">
          {/* Auto-Detect Option */}
          <button
            onClick={handleDetectLocation}
            disabled={detecting}
            className="w-full px-6 py-4 text-left hover:bg-gray-50 border-b border-gray-100 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            <span className="text-xl">{detecting ? '🔄' : '📍'}</span>
            <div>
              <p className="font-bold text-gray-800">
                {detecting ? 'Detecting...' : 'Detect Current Location'}
              </p>
              <p className="text-xs text-gray-500">Auto-detect your position</p>
            </div>
          </button>

          {/* Divider */}
          <div className="px-6 py-3">
            <p className="text-xs font-bold text-gray-400">OUR CITIES</p>
          </div>

          {/* Available Cities */}
          <div>
            {availableCities.map((city) => (
              <button
                key={city}
                onClick={() => handleSelectCity(city)}
                className={`w-full px-6 py-4 text-left hover:bg-blue-50 transition-all flex items-center justify-between border-b border-gray-100 last:border-b-0 ${
                  currentCity === city
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏙️</span>
                  <div>
                    <p className="font-bold text-gray-800">{city}</p>
                    <p className="text-xs text-gray-500">
                      {city === 'Ahmedabad' && 'Primary City'}
                      {city === 'Gandhinagar' && 'Coming Soon'}
                      {city === 'Vadodara' && 'Coming Soon'}
                    </p>
                  </div>
                </div>
                {currentCity === city && (
                  <span className="text-xl">✅</span>
                )}
              </button>
            ))}
          </div>

          {/* Footer Message */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
            <p className="text-xs text-gray-600 text-center">
              We're expanding to more cities soon! 🚀
            </p>
          </div>
        </div>
      )}

      {/* Close picker when clicking outside */}
      {showCityPicker && (
        <div
          className="fixed inset-0 z-[999]"
          onClick={() => setShowCityPicker(false)}
        />
      )}
    </div>
  );
}
