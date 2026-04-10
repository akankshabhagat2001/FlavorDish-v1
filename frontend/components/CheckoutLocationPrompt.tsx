import React, { useEffect, useState } from 'react';
import { gpsLocationService } from '../services/gpsLocationService.ts';

interface CheckoutLocationPromptProps {
  onLocationReady: (coords: { latitude: number; longitude: number } | null) => void;
  onCancel: () => void;
}

const CheckoutLocationPrompt: React.FC<CheckoutLocationPromptProps> = ({ onLocationReady, onCancel }) => {
  const [status, setStatus] = useState<'checking' | 'requesting' | 'success' | 'denied'>('checking');
  const [locationData, setLocationData] = useState<any>(null);

  useEffect(() => {
    const checkLocation = async () => {
      try {
        // Try to get location immediately
        const coords = await gpsLocationService.getCurrentLocation();
        setLocationData(coords);
        setStatus('success');
        console.log('✅ Location ready:', coords);
      } catch (error: any) {
        if (error.code === 1) {
          // Permission denied
          setStatus('denied');
        } else {
          // Other errors, request again
          setStatus('requesting');
        }
      }
    };

    checkLocation();
  }, []);

  const handleRetry = async () => {
    setStatus('requesting');
    try {
      const coords = await gpsLocationService.getCurrentLocation();
      setLocationData(coords);
      setStatus('success');
    } catch (error) {
      setStatus('denied');
    }
  };

  if (status === 'success' && locationData) {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <i className="fa-solid fa-check text-3xl text-green-600"></i>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Location Ready!</h3>
            <p className="text-gray-600 text-sm mb-6">
              ✅ Your GPS location has been detected.<br/>
              Coordinates: <span className="font-bold">{locationData.latitude.toFixed(4)}</span>, 
              <span className="font-bold">{locationData.longitude.toFixed(4)}</span>
            </p>
            <button
              onClick={() => onLocationReady(locationData)}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-black py-3 rounded-xl transition-all text-sm uppercase tracking-widest transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              ✓ Continue to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <i className="fa-solid fa-location-dot text-3xl text-red-600"></i>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Location Permission Denied</h3>
            <p className="text-gray-600 text-sm mb-6">
              Your browser location permission is disabled.<br/>
              <br/>
              <strong>To fix:</strong><br/>
              1. Click location icon (🔒) in browser address bar<br/>
              2. Select "Allow" for GPS access<br/>
              3. Refresh page and try again
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleRetry}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black py-3 rounded-xl transition-all text-sm uppercase tracking-widest transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                🔄 Retry
              </button>
              <button
                onClick={() => onLocationReady(null)}
                className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-900 font-black py-3 rounded-xl transition-all text-sm uppercase tracking-widest transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Continue Anyway
              </button>
            </div>
            <button
              onClick={onCancel}
              className="mt-3 w-full text-gray-500 hover:text-gray-700 font-bold text-sm"
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-spin">
            <i className="fa-solid fa-location-crosshairs text-3xl text-blue-600"></i>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Detecting Your Location</h3>
          <p className="text-gray-600 text-sm mb-6">
            Please allow access to your GPS location for safe and accurate delivery.
          </p>
          <div className="w-full bg-blue-100 px-4 py-2 rounded-xl text-xs text-blue-700 font-bold mb-6 border border-blue-200">
            📍 Your location will only be used for this delivery
          </div>
          <button
            onClick={onCancel}
            className="w-full text-gray-500 hover:text-gray-700 font-bold text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutLocationPrompt;
