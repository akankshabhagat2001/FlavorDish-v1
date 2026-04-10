
import React from 'react';

const PartnerOnboarding: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => {
  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div className="relative h-[600px] flex items-center px-4 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1600&h=800&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="Restaurant Kitchen"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <button onClick={onGoBack} className="mb-12 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <i className="fa-solid fa-arrow-left"></i> Back to Marketplace
          </button>
          <div className="max-w-xl">
            <h1 className="text-6xl font-black text-white mb-6 tracking-tighter leading-tight">Partner with us to grow your business</h1>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              Reach more customers, increase your revenue and scale your kitchen with FlavorFinder.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-[#EF4F5F] text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:bg-[#d43d4c] transition-all">
                Register Your Restaurant
              </button>
              <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all">
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why partner with FlavorFinder?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Get more orders, better visibility, and advanced analytics to streamline your operations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
          {[
            { title: 'Global Visibility', desc: 'Get seen by millions of foodies searching for their next meal every day.', icon: 'fa-eye' },
            { title: 'Logistics Support', desc: 'Our fleet of delivery partners ensures your food reaches customers hot and fast.', icon: 'fa-truck-fast' },
            { title: 'Merchant App', desc: 'Manage your orders, menu, and track payments in real-time with our dedicated app.', icon: 'fa-mobile-screen' }
          ].map((item, i) => (
            <div key={i} className="text-center group">
              <div className="w-20 h-20 bg-[#FFF4F5] rounded-3xl flex items-center justify-center text-[#EF4F5F] mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
                <i className={`fa-solid ${item.icon} text-3xl`}></i>
              </div>
              <h3 className="text-xl font-bold mb-4">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 rounded-[40px] p-12 border border-gray-100 flex flex-col lg:flex-row gap-16 items-center">
           <div className="lg:w-1/2">
             <h2 className="text-4xl font-bold mb-8 leading-tight">Ready to boost your restaurant?</h2>
             <p className="text-gray-600 mb-8 text-lg">Leave your details and our team will get back to you within 24 hours.</p>
             <div className="space-y-6">
                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500">
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <span>Instant menu updates</span>
                </div>
                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500">
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <span>Real-time payouts</span>
                </div>
             </div>
           </div>
           
           <div className="lg:w-1/2 w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
             <form className="space-y-4">
                <input type="text" placeholder="Restaurant Name" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#EF4F5F]" />
                <input type="text" placeholder="Owner Name" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#EF4F5F]" />
                <input type="email" placeholder="Business Email" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#EF4F5F]" />
                <input type="tel" placeholder="Mobile Number" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#EF4F5F]" />
                <button className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all">Submit Interest</button>
             </form>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerOnboarding;
