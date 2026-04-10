
import React from 'react';
import { GroundingChunk, DiscoveryResult } from '../types';

interface LocalDiscoveryProps {
  locationName: string;
  insights: DiscoveryResult | null;
  loading: boolean;
}

const LocalDiscovery: React.FC<LocalDiscoveryProps> = ({ locationName, insights, loading }) => {
  if (loading) {
    return (
      <div className="mb-12 bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
          <div className="h-5 bg-gray-50 rounded w-full"></div>
          <div className="h-5 bg-gray-50 rounded w-11/12"></div>
          <div className="h-5 bg-gray-50 rounded w-4/5"></div>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="mb-12 bg-gradient-to-br from-white to-[#FFF9FA] rounded-[40px] p-10 border border-[#EF4F5F]/15 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-10 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
        <i className="fa-solid fa-map-location-dot text-[200px] text-[#EF4F5F]"></i>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-[#EF4F5F] text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl shadow-[#EF4F5F]/20 ring-4 ring-white">
            <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">AI Insights for {locationName}</h2>
        </div>

        <p className="text-gray-800 leading-relaxed mb-8 max-w-4xl text-lg font-medium tracking-tight">
          {insights.text}
        </p>

        {insights.groundingChunks && insights.groundingChunks.length > 0 && (
          <div className="pt-6 border-t border-[#EF4F5F]/10">
            <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-[3px] mb-5">Verified Recommendations</h4>
            <div className="flex flex-wrap gap-4">
              {insights.groundingChunks.map((chunk, idx) => {
                const item = chunk.maps || chunk.web;
                if (!item) return null;
                return (
                  <a 
                    key={idx}
                    href={item.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border-2 border-gray-100 text-sm font-black text-gray-800 hover:border-[#EF4F5F] hover:text-[#EF4F5F] transition-all shadow-md hover:shadow-xl active:scale-95"
                  >
                    <i className="fa-solid fa-location-dot text-[#EF4F5F] text-lg"></i>
                    {item.title}
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-40"></i>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalDiscovery;
