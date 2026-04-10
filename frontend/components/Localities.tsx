
import React, { useState } from 'react';
import { Locality } from '../types';

interface LocalitiesProps {
  city: string;
  localities: Locality[];
  loading?: boolean;
}

const Localities: React.FC<LocalitiesProps> = ({ city, localities, loading }) => {
  const [expandedLocality, setExpandedLocality] = useState<string | null>(null);
  const cityName = city.split(',')[0] || 'your city';

  if (loading && localities.length === 0) {
    return (
      <div className="mb-20">
        <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">
          Exploring localities in <span className="text-[#EF4F5F]">{cityName}</span>...
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 border border-gray-100 rounded-3xl animate-pulse bg-gray-50 h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (localities.length === 0 && !loading) return null;

  return (
    <div className="mb-20 animate-fade-in">
      <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
        Popular localities in <span className="text-[#EF4F5F] italic">{cityName}</span>
      </h2>
      <p className="text-gray-600 mb-10 text-lg font-medium">Click to discover top-rated spots and street food gems</p>
      
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 transition-all duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        {localities.map((loc, idx) => (
          <div key={idx} className="flex flex-col">
            <div 
              onClick={() => setExpandedLocality(expandedLocality === loc.name ? null : loc.name)}
              className={`p-6 border-2 border-gray-100 rounded-[32px] hover:shadow-2xl transition-all cursor-pointer flex items-center justify-between group bg-white ${expandedLocality === loc.name ? 'border-[#EF4F5F] ring-4 ring-[#EF4F5F]/5' : 'hover:border-gray-200'}`}
            >
              <div className="flex-1 min-w-0 pr-6">
                <h4 className="text-xl text-gray-900 group-hover:text-[#EF4F5F] truncate font-black tracking-tight">{loc.name}</h4>
                <p className="text-sm text-gray-700 font-bold uppercase tracking-widest mt-1">{loc.places} places</p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedLocality === loc.name ? 'bg-[#EF4F5F] text-white' : 'bg-gray-50 text-gray-400 group-hover:text-gray-900'}`}>
                <i className={`fa-solid ${expandedLocality === loc.name ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]`}></i>
              </div>
            </div>
            
            {expandedLocality === loc.name && loc.highlights && (
              <div className="mt-3 p-6 bg-[#FFF9FA] rounded-[32px] border-2 border-[#EF4F5F]/15 animate-slide-up space-y-4 shadow-xl">
                <h5 className="text-[11px] font-black text-[#EF4F5F] uppercase tracking-[3px] mb-2">Must Visit Eateries</h5>
                {loc.highlights.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-sm group/item">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${h.type.toLowerCase().includes('lari') || h.type.toLowerCase().includes('street') ? 'bg-orange-500' : 'bg-[#EF4F5F]'}`}></div>
                      <span className="font-black text-gray-900 truncate max-w-[160px] tracking-tight">{h.name}</span>
                      <span className="text-[9px] text-gray-700 font-black uppercase bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm">{h.type}</span>
                    </div>
                    {h.website && (
                      <a 
                        href={h.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#EF4F5F] hover:text-[#d43d4c] flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-50"
                      >
                        <i className="fa-solid fa-location-dot text-[10px]"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {localities.length > 0 && (
          <div className="p-6 border-2 border-dashed border-gray-200 rounded-[32px] hover:border-[#EF4F5F] hover:bg-[#FFF4F5] transition-all cursor-pointer flex items-center justify-center gap-3 group bg-gray-50/50">
             <span className="text-gray-700 font-black uppercase tracking-widest text-xs">Explore more areas</span>
             <i className="fa-solid fa-chevron-down text-xs text-gray-400 group-hover:translate-y-1 transition-transform group-hover:text-[#EF4F5F]"></i>
          </div>
        )}
      </div>
    </div>
  );
};

export default Localities;
