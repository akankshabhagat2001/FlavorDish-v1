
import React from 'react';

interface LocationPermissionPromptProps {
  onAllow: () => void;
  onDismiss: () => void;
}

const LocationPermissionPrompt: React.FC<LocationPermissionPromptProps> = ({ onAllow, onDismiss }) => {
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1050] w-full max-w-xl px-4 animate-slide-up">
      <div className="bg-white/95 backdrop-blur-xl border border-gray-100 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#EF4F5F]/5 rounded-full blur-2xl"></div>
        
        <div className="w-16 h-16 bg-[#FFF4F5] rounded-2xl flex items-center justify-center text-[#EF4F5F] flex-shrink-0 shadow-inner">
          <i className="fa-solid fa-location-crosshairs text-2xl animate-pulse"></i>
        </div>
        
        <div className="flex-grow text-center md:text-left">
          <h3 className="text-lg font-black text-gray-900 tracking-tight mb-1">Personalize your food feed</h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Allow location access to discover local hidden gems, get accurate delivery times, and see exclusive offers available in your area.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={onAllow}
            className="flex-1 md:flex-none bg-[#EF4F5F] text-white px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#EF4F5F]/20 hover:bg-[#d43d4c] transition-all whitespace-nowrap"
          >
            Enable Now
          </button>
          <button 
            onClick={onDismiss}
            className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
            title="Dismiss"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionPrompt;
