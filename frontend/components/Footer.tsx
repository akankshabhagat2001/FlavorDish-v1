
import React from 'react';
import { AppViewState } from '../types';

interface FooterProps {
  onViewChange?: (view: AppViewState) => void;
}

const Footer: React.FC<FooterProps> = ({ onViewChange }) => {
  const handleNavigate = (view: AppViewState | undefined) => {
    if (view) onViewChange?.(view);
  };

  return (
    <footer className="bg-[#f8f8f8] pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: Logo and Region Selectors */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
          <div 
            className="text-4xl font-black text-gray-900 italic tracking-tighter cursor-pointer"
            onClick={() => handleNavigate('home')}
          >
            flavorfinder
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-800 bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-all">
              <span className="flex items-center gap-2">
                <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-5 h-3 object-cover rounded-sm" />
                India
              </span>
              <i className="fa-solid fa-chevron-down text-[10px] text-gray-400"></i>
            </div>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-800 bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-all">
              <i className="fa-solid fa-globe text-xs text-gray-500"></i> 
              English 
              <i className="fa-solid fa-chevron-down text-[10px] text-gray-400"></i>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-12 mb-16">
          <div>
            <h5 className="font-black text-xs tracking-[2px] uppercase mb-6 text-gray-900">About flavorfinder</h5>
            <ul className="space-y-3 text-sm text-gray-500 font-medium">
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('about')}>About Us</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('presentation')}>Project Deck</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('team')}>Who We Are</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('blog')}>Blog</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('careers')}>Work With Us</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('investor')}>Investor Relations</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('report_fraud')}>Report Fraud</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('contact')}>Contact Us</li>
            </ul>
          </div>

          <div>
            <h5 className="font-black text-xs tracking-[2px] uppercase mb-6 text-gray-900">Flavorverse</h5>
            <ul className="space-y-3 text-sm text-gray-500 font-medium">
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('home')}>FlavorFinder</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('feeding_india')}>Feeding India</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('hyperpure')}>Hyperpure</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('flavorland')}>Flavorland</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('weather')}>Weather Union</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors font-bold text-green-600" onClick={() => handleNavigate('blinkit')}>Blinkit</li>
            </ul>
          </div>

          <div>
            <h5 className="font-black text-xs tracking-[2px] uppercase mb-6 text-gray-900">For Restaurants</h5>
            <ul className="space-y-3 text-sm text-gray-500 font-medium">
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('partner')}>Partner With Us</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('apps')}>Apps For You</li>
            </ul>
            <h5 className="font-black text-xs tracking-[2px] uppercase mt-8 mb-6 text-gray-900">For Enterprises</h5>
            <ul className="space-y-3 text-sm text-gray-500 font-medium">
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('enterprise')}>FlavorFinder For Enterprise</li>
            </ul>
          </div>

          <div>
            <h5 className="font-black text-xs tracking-[2px] uppercase mb-6 text-gray-900">Learn More</h5>
            <ul className="space-y-3 text-sm text-gray-500 font-medium">
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('privacy')}>Privacy</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('terms')}>Terms</li>
              <li className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleNavigate('sitemap')}>Sitemap</li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <h5 className="font-black text-xs tracking-[2px] uppercase mb-6 text-gray-900">Social Links</h5>
            <div className="flex gap-3 mb-8">
              {[
                { icon: 'fa-linkedin-in', bg: 'bg-gray-900' },
                { icon: 'fa-instagram', bg: 'bg-gray-900' },
                { icon: 'fa-twitter', bg: 'bg-gray-900' },
                { icon: 'fa-youtube', bg: 'bg-gray-900' },
                { icon: 'fa-facebook', bg: 'bg-gray-900' }
              ].map((social, i) => (
                <div 
                  key={i} 
                  className={`w-8 h-8 ${social.bg} text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer text-xs`}
                >
                  <i className={`fa-brands ${social.icon}`}></i>
                </div>
              ))}
            </div>
            <div className="space-y-4">
               <div className="bg-gray-900 text-white rounded-lg px-4 py-3 text-xs font-bold text-center">
                 🔜 Coming to App Store
               </div>
               <div className="bg-gray-900 text-white rounded-lg px-4 py-3 text-xs font-bold text-center">
                 🔜 Coming to Play Store
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
            By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies. All trademarks are properties of their respective owners. 2025-2026 © FlavorFinder™ Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
