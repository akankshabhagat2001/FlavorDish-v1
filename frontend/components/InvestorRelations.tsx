
import React from 'react';

const InvestorRelations: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => {
  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div className="bg-gray-900 text-white py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <button onClick={onGoBack} className="mb-12 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <i className="fa-solid fa-arrow-left"></i> Back to Home
          </button>
          <h1 className="text-6xl font-black mb-6 tracking-tighter italic">Investor Relations</h1>
          <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
            Leading the digital transformation of the food services industry. Building a global ecosystem for food and beverage.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            { label: 'Market Presence', value: '24+ Countries', icon: 'fa-globe' },
            { label: 'Active Monthly Users', value: '85M+', icon: 'fa-users' },
            { label: 'Yearly Growth', value: '42%', icon: 'fa-chart-line' }
          ].map((stat, i) => (
            <div key={i} className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#EF4F5F] shadow-sm mb-6">
                <i className={`fa-solid ${stat.icon} text-xl`}></i>
              </div>
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">{stat.label}</h3>
              <p className="text-4xl font-black text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold tracking-tight">Financial Highlights</h2>
            <div className="bg-[#FFF4F5] p-10 rounded-3xl border border-[#EF4F5F]/10">
              <div className="flex items-end gap-2 mb-8 h-48">
                {[40, 65, 55, 90, 80, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-[#EF4F5F] rounded-t-lg transition-all hover:scale-105" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed italic">
                "Our Q4 performance reflects robust organic growth and operational excellence across our delivery and dining segments."
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold tracking-tight">Recent Disclosures</h2>
            <div className="space-y-4">
              {[
                'Annual Report 2024 - Financial Statements',
                'Q1 2025 Earnings Call Presentation',
                'Environmental, Social and Governance (ESG) Report',
                'Shareholder Meeting Minutes - May 2025'
              ].map((report, i) => (
                <div key={i} className="flex items-center justify-between p-6 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <i className="fa-solid fa-file-pdf text-[#EF4F5F] text-xl"></i>
                    <span className="font-medium text-gray-800 group-hover:text-[#EF4F5F]">{report}</span>
                  </div>
                  <i className="fa-solid fa-download text-gray-300"></i>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorRelations;
