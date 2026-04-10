import React from 'react';

interface OrderCompletePageProps {
  onReturnHome: () => void;
  onTrackOrder: () => void;
  lastOrderId?: string;
  totalAmount?: number;
}

const OrderCompletePage: React.FC<OrderCompletePageProps> = ({ 
  onReturnHome, 
  onTrackOrder, 
  lastOrderId = 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
  totalAmount = 0
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-2xl text-center border border-gray-100 flex flex-col items-center animate-slide-up relative overflow-hidden">
        
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50 to-white -z-10"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-50 -z-10"></div>
        <div className="absolute top-20 -left-10 w-32 h-32 bg-[#EF4F5F]/10 rounded-full blur-2xl opacity-50 -z-10"></div>

        {/* Success Icon */}
        <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-4xl shadow-xl shadow-green-200 mb-6 relative">
          <i className="fa-solid fa-check animate-bounce"></i>
          
          {/* Confetti particles */}
          <div className="absolute top-0 text-xs animate-ping" style={{ animationDelay: '0.1s', top: '-10px', left: '10px'}}>✨</div>
          <div className="absolute top-0 text-xs animate-ping text-yellow-400" style={{ animationDelay: '0.3s', top: '10px', right: '-10px'}}>🎉</div>
          <div className="absolute top-0 text-xs animate-ping text-[#EF4F5F]" style={{ animationDelay: '0.2s', bottom: '10px', left: '-20px'}}>🎊</div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-sm font-semibold text-gray-500 mb-8 max-w-[280px]">
          Your requested meal is being prepared. It will be out for delivery soon.
        </p>

        <div className="w-full bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100 shadow-inner">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 border-dashed">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</span>
            <span className="text-sm font-black text-gray-900">{lastOrderId}</span>
          </div>
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 border-dashed">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Paid</span>
            <span className="text-sm font-black text-emerald-600">₹{totalAmount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Est. Delivery</span>
            <span className="text-sm font-black text-gray-900">~ 35 mins</span>
          </div>
        </div>

        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={onTrackOrder}
            className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-[#EF4F5F] to-[#D62828] hover:shadow-lg hover:shadow-[#EF4F5F]/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Track Order Status
          </button>
          
          <button 
            onClick={onReturnHome}
            className="w-full py-4 rounded-xl font-black text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-sm"
          >
            Return to Home
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default OrderCompletePage;
