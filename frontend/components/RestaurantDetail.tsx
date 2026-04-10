
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Restaurant, Review, MenuItem, TableBooking } from '../types.ts';
import { foodService } from '../services';
import apiClient from '../services/apiClient';

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onClose: () => void;
  currentUser: any;
  cartItems?: { item: MenuItem; qty: number }[];
  onUpdateQty?: (id: string, delta: number) => void;
}

const StarRating = ({ rating, setRating, interactive = false }: { rating: number; setRating?: (r: number) => void; interactive?: boolean }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} type="button" disabled={!interactive} onClick={() => setRating?.(star)} className={`${interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'} transition-all`}>
        <i className={`fa-solid fa-star ${star <= rating ? 'text-orange-400' : 'text-gray-200'} ${interactive ? 'text-2xl' : 'text-sm'}`}></i>
      </button>
    ))}
  </div>
);

export default function RestaurantDetail({ restaurant, onClose, currentUser }: RestaurantDetailProps) {
  const [activeTab, setActiveTab] = useState('Order Online');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Booking State
  const [bookingForm, setBookingForm] = useState({
    guests: 2,
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: '19:00',
    paymentMethod: 'cash',
    specialRequests: ''
  });
  const [bookingStatus, setBookingStatus] = useState<null | 'success'>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get menu items for this restaurant
        const foods = await foodService.getFoods({ restaurant: restaurant._id });
        setMenuItems(foods);

        // For now, keep reviews empty or implement review service later
        setReviews([]);
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
        // Fallback to local data if API fails
        setMenuItems(restaurant.menu ?? []);
        setReviews([]);
      }
    };
    fetchData();
  }, [restaurant]);

  // Check if user is following this restaurant
  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!currentUser || currentUser.role !== 'customer') return;
      
      try {
        const response = await apiClient.get('/users/following');
        const followingIds = response.data.followingRestaurants.map((r: any) => r._id);
        setIsFollowing(followingIds.includes(restaurant._id));
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };
    
    checkFollowingStatus();
  }, [currentUser, restaurant._id]);

  const handleFollowToggle = async () => {
    if (!currentUser || currentUser.role !== 'customer') {
      alert('Please login as a customer to follow restaurants.');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiClient.delete(`/users/follow/${restaurant._id}`);
        setIsFollowing(false);
      } else {
        await apiClient.post(`/users/follow/${restaurant._id}`);
        setIsFollowing(true);
      }
    } catch (error: any) {
      console.error('Follow/unfollow error:', error);
      alert(error.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const bookingTotal = useMemo(() => {
    const tablePrice = restaurant.tablePrice || 0;
    const chairPrice = restaurant.chairPrice || 0;
    return tablePrice + (chairPrice * bookingForm.guests);
  }, [restaurant, bookingForm.guests]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Please login as a diner to book.");
    
    // TODO: Implement booking through API service
    // For now, just show success
    setBookingStatus('success');
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-white overflow-y-auto animate-fade-in no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button onClick={onClose} className="mb-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-2">
           <i className="fa-solid fa-arrow-left"></i> Back to Ahmedabad Marketplace
        </button>

        <div className="rounded-[40px] overflow-hidden h-[450px] mb-10 shadow-2xl relative bg-gray-50 group">
           <img src={restaurant.image ?? restaurant.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={restaurant.name} />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
           <div className="absolute bottom-10 left-10 right-10 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-6xl font-black tracking-tighter mb-2">{restaurant.name}</h1>
                  <p className="text-xl font-medium opacity-90">{restaurant.cuisine.join(' • ')}</p>
                </div>
                {currentUser && currentUser.role === 'customer' && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${
                      isFollowing
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                    } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <i className={`fa-solid ${isFollowing ? 'fa-heart' : 'fa-heart-o'}`}></i>
                    {followLoading ? 'Loading...' : (isFollowing ? 'Following' : 'Follow')}
                  </button>
                )}
              </div>
           </div>
        </div>

        <div className="flex gap-10 border-b border-gray-100 mb-8 overflow-x-auto no-scrollbar">
          {['Order Online', 'Book a Table', 'About', 'Reviews'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-5 text-lg transition-all relative ${activeTab === tab ? 'text-[#EF4F5F] font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}>
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#EF4F5F] rounded-t-full"></div>}
            </button>
          ))}
        </div>

        <div className="pb-32">
          {activeTab === 'Order Online' && (
            <div className="animate-fade-in space-y-10">
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <input type="text" placeholder="Search for your favorite dishes..." className="w-full max-w-xl p-5 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-[#EF4F5F]/20 transition-all shadow-inner" value={menuSearch} onChange={e => setMenuSearch(e.target.value)} />
                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">Pure Veg Available</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {menuItems.filter((m: any) => m.name.toLowerCase().includes(menuSearch.toLowerCase())).map((item: any) => {
                   const isUnavailable = item.isAvailable === false || item.available === false;
                   return (
                     <div key={item._id} className={`p-8 bg-white border border-gray-100 rounded-[40px] flex gap-8 hover:shadow-2xl transition-all relative ${isUnavailable ? 'opacity-60 grayscale' : 'group'}`}>
                        {item.price <= 500 && (
                          <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg z-10">Budget Friendly</div>
                        )}
                        {isUnavailable && (
                          <div className="absolute top-4 right-4 bg-gray-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg z-10">Currently Unavailable</div>
                        )}
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-2">
                             <div className={`w-3 h-3 border-2 ${item.isVeg ? 'border-emerald-500' : 'border-red-500'} p-[2px] flex items-center justify-center`}><div className={`w-full h-full rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`}></div></div>
                             <h4 className="text-2xl font-black text-gray-900 leading-tight">{item.name}</h4>
                           </div>
                           <p className="text-gray-400 text-sm font-medium mb-6 line-clamp-2">{item.description}</p>
                           <div className="flex items-center gap-6">
                             <p className="text-2xl font-black text-gray-900">₹{item.price}</p>
                             <button
                               disabled={isUnavailable}
                               onClick={() => window.dispatchEvent(new CustomEvent('addToCart', { detail: { item, restaurant } }))}
                               className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${isUnavailable ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-[#EF4F5F]'}`}
                             >
                               {isUnavailable ? 'Out of Stock' : 'Add to Cart'}
                             </button>
                           </div>
                        </div>
                        <div className={`w-40 h-40 rounded-3xl overflow-hidden shadow-xl flex-shrink-0 bg-gray-50 ${isUnavailable ? '' : 'group-hover:scale-105 transition-transform'}`}>
                          <img src={item.image} className="w-full h-full object-cover" alt="" />
                        </div>
                     </div>
                   );
                 })}
              </div>
            </div>
          )}

          {activeTab === 'About' && (
            <div className="animate-fade-in max-w-4xl space-y-12">
               <div>
                  <h3 className="text-3xl font-black text-gray-900 mb-6">Our Story</h3>
                  <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                    {restaurant.description || "Welcome to our kitchen! We take pride in serving high-quality, authentic flavors that bring joy to your table. Join us for a memorable dining experience."}
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Operational Info</h4>
                     <div className="space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#EF4F5F] shadow-sm"><i className="fa-solid fa-clock"></i></div>
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Opening Hours</p>
                              <p className="text-sm font-bold text-gray-800">{restaurant.openingHours || "11:00 AM - 11:00 PM"}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#EF4F5F] shadow-sm"><i className="fa-solid fa-phone"></i></div>
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Contact Support</p>
                              <p className="text-sm font-bold text-gray-800">{restaurant.contactPhone || "+91 99999 00000"}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {restaurant.signatureDish && (
                    <div className="bg-[#FFF4F5] p-8 rounded-[40px] border border-[#EF4F5F]/10 flex flex-col items-center text-center">
                       <h4 className="text-[10px] font-black text-[#EF4F5F] uppercase tracking-widest mb-6">Must Try Signature</h4>
                       <div className="w-32 h-32 rounded-full overflow-hidden mb-4 shadow-xl ring-4 ring-white">
                          <img src={restaurant.signatureDish.imageUrl} className="w-full h-full object-cover" alt="" />
                       </div>
                       <h5 className="text-xl font-black text-gray-900">{restaurant.signatureDish.name}</h5>
                       <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Chef's Special Recommendation</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'Book a Table' && (
            <div className="max-w-4xl mx-auto py-10 animate-fade-in">
              {bookingStatus === 'success' ? (
                <div className="bg-emerald-50 p-16 rounded-[48px] text-center border border-emerald-100">
                  <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"><i className="fa-solid fa-check text-4xl"></i></div>
                  <h3 className="text-3xl font-black text-emerald-900 mb-4">Table Confirmed!</h3>
                  <p className="text-emerald-700 font-medium">Your spot at {restaurant.name} is reserved. We'll see you on {bookingForm.bookingDate} at {bookingForm.bookingTime}.</p>
                  <button onClick={() => setBookingStatus(null)} className="mt-8 bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest">Book Another</button>
                </div>
              ) : (
                <div className="bg-white border border-gray-100 p-12 rounded-[48px] shadow-2xl flex flex-col md:flex-row gap-12">
                   <div className="flex-1 space-y-6">
                      <h3 className="text-4xl font-black tracking-tighter">Reserve your table</h3>
                      <p className="text-gray-500 font-medium">Book instantly and pay either now or directly at the restaurant.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Diners</p>
                           <input type="number" min="1" value={bookingForm.guests} onChange={e => setBookingForm({...bookingForm, guests: parseInt(e.target.value) || 1})} className="bg-transparent text-xl font-black outline-none w-full" />
                        </div>
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                           <input type="date" min={new Date().toISOString().split('T')[0]} value={bookingForm.bookingDate} onChange={e => setBookingForm({...bookingForm, bookingDate: e.target.value})} className="bg-transparent text-xl font-black outline-none w-full" />
                        </div>
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Time</p>
                           <input type="time" value={bookingForm.bookingTime} onChange={e => setBookingForm({...bookingForm, bookingTime: e.target.value})} className="bg-transparent text-xl font-black outline-none w-full" />
                        </div>
                      </div>

                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Special Requests (Optional)</p>
                         <textarea 
                           value={bookingForm.specialRequests} 
                           onChange={e => setBookingForm({...bookingForm, specialRequests: e.target.value})} 
                           className="bg-transparent text-sm font-bold outline-none w-full h-20 resize-none"
                           placeholder="Any allergies or special occasions?"
                         />
                      </div>
                      
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Settlement Strategy</p>
                         <div className="flex gap-4">
                            {['cash', 'online'].map(method => (
                              <button key={method} onClick={() => setBookingForm({...bookingForm, paymentMethod: method})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${bookingForm.paymentMethod === method ? 'bg-gray-900 text-white border-gray-900 shadow-xl' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>
                                {method === 'cash' ? 'Pay at Venue' : 'Pre-pay Now'}
                              </button>
                            ))}
                         </div>
                      </div>

                      <div className="p-6 bg-[#FFF4F5] rounded-2xl border border-[#EF4F5F]/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Table Charge</span>
                          <span className="font-black text-gray-900">₹{restaurant.tablePrice || 0}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Chair Charge ({bookingForm.guests} x ₹{restaurant.chairPrice || 0})</span>
                          <span className="font-black text-gray-900">₹{(restaurant.chairPrice || 0) * bookingForm.guests}</span>
                        </div>
                        <div className="pt-4 border-t border-[#EF4F5F]/10 flex justify-between items-center">
                          <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total Payable</span>
                          <span className="text-2xl font-black text-[#EF4F5F]">₹{bookingTotal}</span>
                        </div>
                      </div>
                      
                      <button onClick={handleBooking} className="w-full bg-[#EF4F5F] text-white py-6 rounded-[30px] font-black text-sm uppercase tracking-[4px] shadow-2xl shadow-[#EF4F5F]/20 hover:scale-105 active:scale-95 transition-all">Confirm Reservation</button>
                   </div>
                   
                   <div className="md:w-72 bg-gray-50 rounded-[40px] p-8 border border-gray-100 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-[#EF4F5F] shadow-sm mb-6"><i className="fa-solid fa-clock-rotate-left text-3xl"></i></div>
                      <h4 className="font-black text-gray-900 mb-2">Instant Approval</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Most bookings are confirmed within seconds during business hours.</p>
                   </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Reviews' && (
            <div className="max-w-4xl mx-auto py-10 animate-fade-in space-y-16">
              <div className="bg-white border border-gray-100 rounded-[48px] p-12 shadow-xl">
                <h3 className="text-3xl font-black text-gray-900 mb-8">Diner Feedback</h3>
                <StarRating rating={5} setRating={() => {}} interactive />
                <textarea placeholder="Tell us about the flavors, service, and vibe..." className="w-full mt-6 p-8 bg-gray-50 border-2 border-transparent rounded-[32px] outline-none focus:bg-white focus:border-[#EF4F5F] h-40 font-medium transition-all" />
                <button className="mt-8 bg-gray-900 text-white px-12 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all">Publish Community Review</button>
              </div>
              <div className="space-y-10">
                <h3 className="text-3xl font-black border-b border-gray-100 pb-6 tracking-tight">Recent Diners</h3>
                {reviews.length === 0 ? <p className="text-gray-400 font-medium italic">No reviews yet for this spot. Be the first!</p> : reviews.map(rev => (
                  <div key={rev._id} className="bg-white border border-gray-50 p-10 rounded-[40px] shadow-sm flex gap-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center font-black text-xl text-gray-400 flex-shrink-0">{rev.userId.charAt(0)}</div>
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <p className="font-black text-gray-900 text-xl tracking-tight">Verified Diner</p>
                        <StarRating rating={rev.rating} />
                      </div>
                      <p className="text-gray-500 font-medium italic text-lg leading-relaxed">"{rev.comment}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
