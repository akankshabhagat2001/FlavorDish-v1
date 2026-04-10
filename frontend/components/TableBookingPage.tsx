import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';
import { User } from '../types';

interface TableBookingPageProps {
  restaurantId: string;
  restaurantName: string;
  onClose: () => void;
  onBookingComplete: (details: any) => void;
  isNightclub?: boolean;
}

const TableBookingPage: React.FC<TableBookingPageProps> = ({ 
  restaurantId, 
  restaurantName, 
  onClose, 
  onBookingComplete,
  isNightclub = false
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentType, setPaymentType] = useState<'prepaid'|'postpaid'>('postpaid');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Get current user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!date || !time) {
      setErrorMessage('Please select a date and time');
      return;
    }

    if (!currentUser) {
      setErrorMessage('Please login to book a table');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const payload = {
        restaurantId,
        bookingDate: date,
        timeSlot: {
          startTime: time,
          endTime: addHoursToTime(time, 2), // Assume 2-hour booking
          duration: 120
        },
        numberOfGuests: guests,
        specialRequests,
        customerDetails: {
          name: currentUser.name,
          phone: currentUser.phone || '9999999999',
          email: currentUser.email
        },
        paymentType
      };
      
      const response = await bookingService.createBooking(payload);
      
      setIsSubmitting(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        onBookingComplete({ ...payload, _id: response.booking?._id || 'pending' });
      }, 2000);
    } catch(err: any) {
      console.error('Booking error:', err);
      setIsSubmitting(false);
      const errorMsg = err?.response?.data?.message || err?.response?.data?.error || 'Error creating booking. Please try again.';
      setErrorMessage(errorMsg);
      
      // Show alert only if it's a critical error
      if (err?.code === 'ECONNREFUSED' || err?.message === 'Network Error') {
        alert("Backend server is not running. Please ensure the server is started at http://localhost:5000");
      }
    }
  };

  // Helper function to add hours to time string
  const addHoursToTime = (timeStr: string, hours: number): string => {
    const [time, period] = timeStr.split(' ');
    const [h, m] = time.split(':').map(Number);
    let newH = h + hours;
    let newPeriod = period;
    
    if (newH >= 12) {
      newPeriod = period === 'AM' ? 'PM' : 'AM';
      newH = newH % 12 || 12;
    }
    
    return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${newPeriod}`;
  };

  // Generate some available times
  const timeSlots = ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'];

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div className="relative bg-white w-full max-w-md rounded-[32px] p-8 text-center animate-slide-up shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-20 bg-emerald-500 -z-10"></div>
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto -mt-4 shadow-xl border-4 border-emerald-500 mb-6 relative">
            <i className="fa-solid fa-calendar-check text-3xl text-emerald-500"></i>
            <div className="absolute top-0 text-xs animate-ping left-0">✨</div>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">{isNightclub ? 'VIP Entry Reserved!' : 'Table Reserved!'}</h2>
          <p className="text-gray-500 font-semibold mb-6">Your {isNightclub ? 'reservation' : 'table'} at {restaurantName} is confirmed.</p>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center text-sm font-bold">
            <span className="text-gray-400">Date</span><span className="text-gray-900">{date} at {time}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center text-sm font-bold mt-2">
            <span className="text-gray-400">Table for</span><span className="text-gray-900">{guests} People</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-gray-800">{isNightclub ? 'Reserve VIP Entry / Table' : 'Book a Table'}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{restaurantName}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all">
            <i className="fa-solid fa-xmark text-xl text-gray-400"></i>
          </button>
        </div>

        <div className="flex-grow p-6 overflow-y-auto no-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                <i className="fa-solid fa-exclamation-circle text-red-600 text-xl flex-shrink-0 mt-0.5"></i>
                <div>
                  <p className="text-sm font-bold text-red-700">{errorMessage}</p>
                  <p className="text-xs text-red-600 mt-1">Make sure you're logged in and the backend server is running.</p>
                </div>
              </div>
            )}
            
            {/* Guests */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Number of Guests</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setGuests(Math.max(1, guests-1))} className="w-12 h-12 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-[#EF4F5F] font-black transition-all">
                  <i className="fa-solid fa-minus"></i>
                </button>
                <div className="flex-1 h-12 flex items-center justify-center font-black text-2xl text-gray-900 bg-gray-50 rounded-xl border border-gray-100">
                  {guests}
                </div>
                <button type="button" onClick={() => setGuests(guests+1)} className="w-12 h-12 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-green-500 font-black transition-all">
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Select Date</label>
              <input 
                type="date" 
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#EF4F5F] outline-none font-bold text-gray-800 transition-all font-sans"
              />
            </div>

            {/* Time Slots */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block flex justify-between">
                <span>Select Time</span>
                <span className="text-emerald-500">Available</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map(t => (
                  <button 
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                      time === t ? 'bg-[#EF4F5F] text-white border-[#EF4F5F] shadow-lg shadow-[#EF4F5F]/30 scale-[1.02]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block flex justify-between">
                <span>Special Requests</span>
                <span className="font-semibold opacity-50">Optional</span>
              </label>
              <textarea 
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Birthdays, anniversaries, allergies..."
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-semibold text-sm resize-none h-24 transition-all"
              />
            </div>

            {/* Payment Type */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Payment Type</label>
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentType('postpaid')}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${paymentType === 'postpaid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Pay at Table (Postpaid)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('prepaid')}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${paymentType === 'prepaid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Pay Now (Prepaid)
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100">
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={!date || !time || isSubmitting}
            className={`w-full py-5 rounded-[20px] font-black text-lg transition-all flex items-center justify-center gap-2 ${
               !date || !time || isSubmitting
               ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
               : 'bg-gray-900 text-white shadow-xl shadow-gray-900/30 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>Reserve for {guests} <i className="fa-solid fa-arrow-right ml-1"></i></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default TableBookingPage;
