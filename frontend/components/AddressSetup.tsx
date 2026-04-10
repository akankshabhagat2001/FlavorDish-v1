import React, { useState, useEffect } from 'react';
import { gpsLocationService } from '../services/gpsLocationService';
import { authService } from '../services/authService';

interface AddressSetupProps {
  onAddressSet?: (address: {
    street: string;
    latitude: number;
    longitude: number;
  }) => void;
  onClose?: () => void;
}

export default function AddressSetup({ onAddressSet, onClose }: AddressSetupProps) {
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  // Auto-detect address on component mount
  useEffect(() => {
    const storedAddress = localStorage.getItem('userHomeAddress');
    if (storedAddress) {
      try {
        const parsed = JSON.parse(storedAddress);
        setAddress(parsed.street || '');
        setLatitude(parsed.latitude || 0);
        setLongitude(parsed.longitude || 0);
      } catch (e) {
        console.error('Error parsing stored address:', e);
      }
    }
  }, []);

  const handleDetectLocation = async () => {
    setDetecting(true);
    setError(null);
    try {
      const result = await gpsLocationService.detectHomeAddress();
      if (result) {
        setAddress(result.address);
        setLatitude(result.latitude);
        setLongitude(result.longitude);
      } else {
        setError('Could not detect your location. Please enable GPS and try again.');
      }
    } catch (err: any) {
      setError(
        err.message === 'User denied geolocation'
          ? 'Please enable location permission in your browser settings'
          : 'Failed to detect location. Please try again.'
      );
    } finally {
      setDetecting(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!address.trim()) {
      setError('Please enter or detect your home address');
      return;
    }

    setLoading(true);
    try {
      // Save to localStorage for quick access
      localStorage.setItem(
        'userHomeAddress',
        JSON.stringify({
          street: address,
          latitude,
          longitude,
        })
      );

      // Try to save to database via API
      try {
        await authService.updateProfile({
          address: {
            street: address,
            coordinates: {
              latitude,
              longitude,
            },
          },
        });
      } catch (apiError) {
        console.warn('Could not sync address to server:', apiError);
        // Still proceed even if API call fails (offline mode)
      }

      if (onAddressSet) {
        onAddressSet({
          street: address,
          latitude,
          longitude,
        });
      }

      alert('✓ Home address saved successfully!');
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-black text-gray-800 mb-6">Set Home Address</h2>

        {/* Address Input */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-600 mb-3">
            Your Home Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your home address or click 'Detect Location' to auto-fill"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[#EF4F5F] resize-none"
            rows={3}
          />
          {address && (
            <p className="text-xs text-green-600 mt-2">
              📍 Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleDetectLocation}
            disabled={detecting}
            className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-all"
          >
            {detecting ? '🔄 Detecting...' : '📍 Detect My Location'}
          </button>

          <button
            onClick={handleSaveAddress}
            disabled={loading || !address.trim()}
            className="w-full px-6 py-3 bg-[#EF4F5F] hover:bg-[#E63E4D] disabled:bg-gray-300 text-white font-bold rounded-xl transition-all"
          >
            {loading ? '⏳ Saving...' : '✓ Save Address'}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
            >
              Cancel
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-6 text-center">
          We'll use your home address for faster delivery ordering and tracking 🏠
        </p>
      </div>
    </div>
  );
}
