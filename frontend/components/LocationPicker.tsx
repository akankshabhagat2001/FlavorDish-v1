
import React, { useState, useEffect, useRef } from 'react';
import { LatLng, City } from '../types';
import { GoogleGenAI } from "@google/genai";

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (name: string, coords: LatLng) => void;
  onDetectLocation: () => void;
  isLocating: boolean;
  cities?: City[];
}

const RECENT_LOCATIONS_KEY = 'flavorfinder_recent_locations';

const LocationPicker: React.FC<LocationPickerProps> = ({ isOpen, onClose, onSelect, onDetectLocation, isLocating, cities = [] }) => {
  const [recentLocations, setRecentLocations] = useState<{name: string, coords: LatLng}[]>([]);
  const [manualQuery, setManualQuery] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_LOCATIONS_KEY);
    if (stored) setRecentLocations(JSON.parse(stored));
  }, [isOpen]);

  useEffect(() => {
    const google = (window as any).google;
    if (isOpen && searchInputRef.current && google && google.maps && google.maps.places) {
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'in' }
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
          const coords = {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          const name = place.formatted_address || place.name || '';
          saveRecentLocation(name, coords);
          onSelect(name, coords);
          onClose();
        }
      });
    }
  }, [isOpen]);

  const saveRecentLocation = (name: string, coords: LatLng) => {
    const newLocs = [{name, coords}, ...recentLocations.filter(l => l.name !== name)].slice(0, 5);
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(newLocs));
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim() || isResolving) return;

    setIsResolving(true);
    try {
      // Use strictly defined API client creation
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find the precise Latitude and Longitude for "${manualQuery}, India". Return as JSON: {"lat": number, "lng": number, "address": string}`,
        config: { responseMimeType: "application/json" }
      });
      
      const text = response.text || '{}';
      const data = JSON.parse(text);
      
      if (data.lat && data.lng) {
        const coords = {
          latitude: data.lat,
          longitude: data.lng,
          lat: data.lat,
          lng: data.lng,
        };
        const name = data.address || manualQuery;
        saveRecentLocation(name, coords);
        onSelect(name, coords);
        onClose();
      }
    } catch (err) {
      console.error("Manual resolution failed:", err);
    } finally {
      setIsResolving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">Change Location</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Free Discovery, Restricted Delivery</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all text-gray-400">
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto no-scrollbar flex-1">
          <form onSubmit={handleManualSearch} className="relative">
            <i className={`fa-solid ${isResolving ? 'fa-spinner fa-spin' : 'fa-magnifying-glass'} absolute left-5 top-1/2 -translate-y-1/2 text-[#EF4F5F] text-xl`}></i>
            <input 
              ref={searchInputRef}
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Enter area, street, or a specific landmark..."
              className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-2xl border-2 border-transparent outline-none focus:bg-white focus:border-[#EF4F5F] focus:ring-4 focus:ring-[#EF4F5F]/5 transition-all font-bold text-gray-800 shadow-inner"
            />
            {manualQuery.trim() && (
              <button 
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#EF4F5F] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#d43d4c]"
              >
                Go
              </button>
            )}
          </form>

          <button 
            onClick={onDetectLocation}
            className="w-full flex items-center justify-between p-5 bg-[#FFF4F5] rounded-2xl border-2 border-[#EF4F5F]/10 group hover:bg-[#EF4F5F] transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#EF4F5F] shadow-lg group-hover:scale-110 transition-transform">
                <i className={`fa-solid ${isLocating ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'} text-xl`}></i>
              </div>
              <div className="text-left">
                <div className="text-base font-black text-[#EF4F5F] group-hover:text-white">Use current location</div>
                <div className="text-[10px] text-gray-400 group-hover:text-white/80 uppercase tracking-widest font-black">Using GPS</div>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-[#EF4F5F] group-hover:text-white group-hover:translate-x-2 transition-all"></i>
          </button>

          {cities.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-6">Currently Serving These Hubs</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {cities.map((city) => (
                  <button 
                    key={city._id}
                    onClick={() => { onSelect(city.name, city.coords); onClose(); }}
                    className="flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-xl hover:scale-105 border border-transparent hover:border-gray-100 transition-all group text-center"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden shadow-md border-2 border-transparent group-hover:border-[#EF4F5F] transition-all">
                      <img src={city.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop'} alt={city.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-black text-gray-700 group-hover:text-[#EF4F5F] uppercase tracking-tight leading-tight">{city.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {recentLocations.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4">Saved / Recent Addresses</h3>
              <div className="space-y-3">
                {recentLocations.map((loc, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { onSelect(loc.name, loc.coords); onClose(); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-[#EF4F5F] hover:bg-[#FFF4F5] transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[#EF4F5F] group-hover:text-white transition-colors">
                      <i className="fa-solid fa-clock-rotate-left"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{loc.name}</p>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Recent Address</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
