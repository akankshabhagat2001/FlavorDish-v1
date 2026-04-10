
import React, { useState } from 'react';
import { getAIFoodSuggestions } from '../services/geminiService';
import { LatLng, DiscoveryResult } from '../types';

interface FoodieAssistantProps {
  userLocation: LatLng | null;
}

const FoodieAssistant: React.FC<FoodieAssistantProps> = ({ userLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);

  const handleAsk = async () => {
    if (!query.trim()) return;
    
    // Ensure we have coordinates for grounded AI suggestions
    if (!userLocation) {
       alert("Please enable location services for personalized recommendations.");
       return;
    }

    setLoading(true);
    const data = await getAIFoodSuggestions(query, userLocation);
    setResult(data);
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[60] bg-[#EF4F5F] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
      >
        <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 group-hover:ml-2 whitespace-nowrap font-bold">
          Foodie AI
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in flex flex-col max-h-[90vh]">
            <div className="bg-[#EF4F5F] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-robot text-xl"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Local Foodie AI</h3>
                  <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">
                    {userLocation ? 'Location Active' : 'Global Mode'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {!result && !loading && (
                <div className="text-center mb-6">
                  <p className="text-gray-500 mb-6 italic text-sm">"I can help you find the best spots nearby using real-time maps grounding."</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Best Pizza nearby', 'Romantic dining', 'Spicy Street Food', 'Open Late'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setQuery(tag)}
                        className="text-xs border border-gray-200 px-4 py-2 rounded-full text-gray-600 hover:border-[#EF4F5F] hover:bg-[#FFF4F5] hover:text-[#EF4F5F] transition-all"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask for local recommendations..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#EF4F5F]/20 focus:border-[#EF4F5F] transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                />
                <button 
                  onClick={handleAsk}
                  disabled={loading}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl disabled:opacity-50 hover:bg-black transition-colors"
                >
                  {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                </button>
              </div>

              {loading && (
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-4/6 animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-gray-50 rounded-xl animate-pulse"></div>
                    <div className="h-20 bg-gray-50 rounded-xl animate-pulse"></div>
                  </div>
                </div>
              )}

              {result && (
                <div className="animate-fade-in">
                  <div className="prose prose-sm text-gray-800 mb-6 whitespace-pre-wrap leading-relaxed">
                    {result.text}
                  </div>

                  {result.groundingChunks && result.groundingChunks.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Sources & Locations</h4>
                      <div className="space-y-2">
                        {result.groundingChunks.map((chunk, idx) => {
                          const item = chunk.maps || chunk.web;
                          if (!item) return null;
                          return (
                            <a 
                              key={idx}
                              href={item.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-[#FFF4F5] hover:border-[#EF4F5F]/20 border border-transparent transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#EF4F5F] shadow-sm">
                                  <i className={`fa-solid ${chunk.maps ? 'fa-location-dot' : 'fa-globe'}`}></i>
                                </div>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-[#EF4F5F]">{item.title}</span>
                              </div>
                              <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-gray-300 group-hover:text-[#EF4F5F]"></i>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => {setResult(null); setQuery('');}}
                    className="mt-8 w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Ask something else
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FoodieAssistant;
