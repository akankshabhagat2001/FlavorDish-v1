
import React, { useState, useEffect } from 'react';

interface Slide {
  title: string;
  subtitle: string;
  content: React.ReactNode;
  bg: string;
}

const ProjectPresentation: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      title: "flavorfinder",
      subtitle: "The Future of AI-Powered Dining Discovery",
      bg: "bg-gray-900",
      content: (
        <div className="text-center">
          <div className="text-[#EF4F5F] text-9xl mb-8 font-black italic tracking-tighter animate-pulse">FF</div>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            A next-generation platform bridging the gap between hungry foodies, local restaurants, and strategic investors using Google Gemini AI.
          </p>
        </div>
      )
    },
    {
      title: "The Problem",
      subtitle: "Why we built this",
      bg: "bg-white",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Static Search", desc: "Traditional platforms rely on outdated filters and static lists.", icon: "fa-search-minus" },
            { title: "Siloed Data", desc: "No real-time grounding for news, trending events, or map updates.", icon: "fa-database" },
            { title: "One-Size-Fits-All", desc: "Discovery lacks personal contextual understanding.", icon: "fa-user-slash" }
          ].map((item, i) => (
            <div key={i} className="p-8 border border-gray-100 rounded-[40px] text-center bg-gray-50">
              <i className={`fa-solid ${item.icon} text-4xl text-[#EF4F5F] mb-6`}></i>
              <h3 className="text-xl font-bold mb-4">{item.title}</h3>
              <p className="text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "The Solution",
      subtitle: "Gemini 2.5 & 3 Integration",
      bg: "bg-[#FFF4F5]",
      content: (
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-6">
            <h3 className="text-3xl font-bold leading-tight">Hyper-Personalized Discovery via Grounding</h3>
            <p className="text-gray-600 text-lg">
              Unlike traditional apps, FlavorFinder uses <strong>Google Maps Grounding</strong> to verify restaurant data in real-time.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 font-medium">
                <i className="fa-solid fa-check-circle text-green-500"></i> AI Foodie Assistant (Contextual Q&A)
              </li>
              <li className="flex items-center gap-3 font-medium">
                <i className="fa-solid fa-check-circle text-green-500"></i> Real-time Local Insights
              </li>
              <li className="flex items-center gap-3 font-medium">
                <i className="fa-solid fa-check-circle text-green-500"></i> Verified Map Locations & Directions
              </li>
            </ul>
          </div>
          <div className="lg:w-1/2 bg-white p-10 rounded-[40px] shadow-2xl border border-[#EF4F5F]/10">
             <div className="w-full h-64 bg-gray-900 rounded-3xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#EF4F5F] via-transparent to-transparent"></div>
                <i className="fa-solid fa-brain text-8xl text-[#EF4F5F] animate-bounce"></i>
             </div>
          </div>
        </div>
      )
    },
    {
      title: "Multi-Role Ecosystem",
      subtitle: "Value for everyone",
      bg: "bg-white",
      content: (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { role: "Foodies", desc: "Discover & order with AI guidance.", icon: "fa-heart", color: "text-[#EF4F5F]" },
            { role: "Partners", desc: "Onboarding & growth analytics.", icon: "fa-store", color: "text-blue-500" },
            { role: "Investors", desc: "Real-time market insights.", icon: "fa-chart-line", color: "text-green-500" },
            { role: "Admins", desc: "Total platform governance.", icon: "fa-user-shield", color: "text-purple-500" }
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-3xl border border-gray-100 hover:shadow-xl transition-all">
              <i className={`fa-solid ${item.icon} text-3xl ${item.color} mb-4`}></i>
              <h4 className="font-bold text-lg mb-2">{item.role}</h4>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Tech Stack",
      subtitle: "Modern & Performant",
      bg: "bg-gray-900",
      content: (
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { name: "React 19", icon: "fa-react" },
            { name: "Tailwind CSS", icon: "fa-css3-alt" },
            { name: "Google Gemini API", icon: "fa-robot" },
            { name: "Google Maps SDK", icon: "fa-map-marked-alt" },
            { name: "TypeScript", icon: "fa-code" }
          ].map((tech, i) => (
            <div key={i} className="bg-white/5 border border-white/10 px-8 py-6 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors">
              <i className={`fa-brands ${tech.icon} fa-solid text-2xl text-[#EF4F5F]`}></i>
              <span className="text-white font-bold">{tech.name}</span>
            </div>
          ))}
        </div>
      )
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slide = slides[currentSlide];

  return (
    <div className={`fixed inset-0 z-[300] ${slide.bg} transition-colors duration-700 flex flex-col items-center justify-center p-8`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center">
        <div className="text-[#EF4F5F] font-black italic text-2xl tracking-tighter">flavorfinder <span className="text-gray-400 not-italic font-medium text-sm ml-2">Deck 2025</span></div>
        <button 
          onClick={onExit}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 h-1 bg-[#EF4F5F] transition-all duration-500" style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}></div>

      {/* Slide Content */}
      <div className="max-w-7xl w-full animate-fade-in flex flex-col items-center">
        <div className="text-center mb-12">
          <h2 className={`text-6xl font-black mb-4 tracking-tight ${slide.bg === 'bg-gray-900' ? 'text-white' : 'text-gray-900'}`}>
            {slide.title}
          </h2>
          <p className="text-[#EF4F5F] font-bold uppercase tracking-widest text-sm">{slide.subtitle}</p>
        </div>
        
        <div className="w-full">
          {slide.content}
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-12 flex justify-between items-center">
        <button 
          onClick={prevSlide}
          className="text-gray-400 hover:text-[#EF4F5F] transition-colors flex items-center gap-4 group"
        >
          <i className="fa-solid fa-arrow-left text-xl group-hover:-translate-x-2 transition-transform"></i>
          <span className="font-bold uppercase tracking-widest text-xs">Previous</span>
        </button>
        
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${currentSlide === i ? 'bg-[#EF4F5F] w-8' : 'bg-gray-400/20'}`}></div>
          ))}
        </div>

        <button 
          onClick={nextSlide}
          className="text-gray-400 hover:text-[#EF4F5F] transition-colors flex items-center gap-4 group"
        >
          <span className="font-bold uppercase tracking-widest text-xs">Next Slide</span>
          <i className="fa-solid fa-arrow-right text-xl group-hover:translate-x-2 transition-transform"></i>
        </button>
      </div>
    </div>
  );
};

export default ProjectPresentation;
