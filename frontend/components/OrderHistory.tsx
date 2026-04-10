
import React, { useState, useEffect, useMemo } from 'react';
import { Order, Restaurant, LatLng, Booking, User } from '../types.ts';
import { orderService, restaurantService } from '../services';
import { bookingService } from '../services/bookingService';
import { socketService } from '../services/socketService';
import MapView from './MapView.tsx';
import ChatModal from './ChatModal.tsx';
import ReviewModal from './ReviewModal.tsx';
import DeliveryTrackingMap from './DeliveryTrackingMap.tsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OrderHistoryProps {
  userCoords: LatLng;
  onGoHome: () => void;
  onOrderAgain: (order: Order) => void;
  currentUser: User | null;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ userCoords, onGoHome, onOrderAgain, currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackRes, setTrackRes] = useState<Restaurant | null>(null);
  const [courierPos, setCourierPos] = useState<LatLng | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'bookings'>('orders');
  const [ratingModal, setRatingModal] = useState<{ order: Order | null; foodRating: number; deliveryRating: number; restaurantRating: number; review: string }>({ order: null, foodRating: 0, deliveryRating: 0, restaurantRating: 0, review: '' });
  const [ratingFeedback, setRatingFeedback] = useState('');
  
  // Phase 2B: New modal states
  const [chatModalOrder, setChatModalOrder] = useState<Order | null>(null);
  const [reviewModalOrder, setReviewModalOrder] = useState<Order | null>(null);
  const [deliveryTrackingOrder, setDeliveryTrackingOrder] = useState<Order | null>(null);

  const isPartner = currentUser?.role === 'restaurant';

  const fetchData = async () => {
    if (!currentUser) return;

    try {
      let orderRes: Order[] = [];
      let bookingRes: Booking[] = [];

      if (isPartner) {
        // For restaurant owners, get orders for their restaurants
        const myRestaurantsResponse = await restaurantService.getMyRestaurants();
        const myRestaurants = myRestaurantsResponse?.restaurants || [];
        if (myRestaurants.length > 0) {
          const restaurantOrders = await orderService.getRestaurantOrders({ page: 1, limit: 200 });
          orderRes = restaurantOrders?.orders || [];
        }
      } else {
        // For customers, get their orders and bookings
        const myOrders = await orderService.getMyOrders({ page: 1, limit: 200 });
        orderRes = myOrders?.orders || [];
        
        try {
          const myBookings = await bookingService.getMyBookings();
          bookingRes = myBookings?.bookings || [];
        } catch (e) { console.error('Booking fetch fail', e); }
      }

      setOrders(orderRes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setBookings(bookingRes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Connect to socket for real-time updates
    socketService.connect();

    // Listen for order status updates
    socketService.onOrderStatusUpdate((updatedOrder) => {
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
        )
      );
    });

    return () => {
      socketService.disconnect();
      socketService.offOrderStatusUpdate();
    };
  }, [currentUser]);

  const handleTrackOrder = async (order: Order) => {
    try {
      const res = await restaurantService.getRestaurantById(order.restaurantId);
      setTrackRes(res?.restaurant || res);
      setTrackingOrder(order);
      setCourierPos({
        latitude: (res?.restaurant || res)?.location?.latitude || 23.0225,
        longitude: (res?.restaurant || res)?.location?.longitude || 72.5714,
        lat: (res?.restaurant || res)?.location?.latitude || 23.0225,
        lng: (res?.restaurant || res)?.location?.longitude || 72.5714
      });
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const exportToPDF = async (order: Order) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #EF4F5F; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #EF4F5F; margin: 0; font-size: 28px;">FlavorFinder</h1>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Order Invoice</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h3 style="margin: 0 0 10px 0; color: #333;">Order Details</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Order ID:</strong> #${order._id.slice(0, 8)}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Status:</strong> ${order.orderStatus?.replace('_', ' ').toUpperCase()}</p>
          </div>
          <div>
            <h3 style="margin: 0 0 10px 0; color: #333;">Restaurant</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>${order.restaurantName}</strong></p>
            <p style="margin: 5px 0; font-size: 14px;">${order.deliveryAddress || 'N/A'}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Item</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">Qty</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">Price</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map((item: any) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">${item.name || item.itemName}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.quantity || item.qty}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${item.price}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${(item.price * (item.quantity || item.qty)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; border-top: 2px solid #eee; padding-top: 20px;">
          <div style="flex: 1;"></div>
          <div style="text-align: right;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>Subtotal:</strong> ₹${order.subtotal ?? order.totalAmount}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Delivery Fee:</strong> ₹${order.deliveryFee ?? 40}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Tax:</strong> ₹${order.tax ?? 0}</p>
            <p style="margin: 10px 0; font-size: 18px; color: #EF4F5F;"><strong>Total: ₹${order.totalAmount}</strong></p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Thank you for choosing FlavorFinder!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`FlavorFinder-Info-${order._id.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      document.body.removeChild(element);
    }
  };

  const exportBookingPDF = async (booking: Booking) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">FlavorFinder</h1>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Table Reservation Bill</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h3 style="margin: 0 0 10px 0; color: #333;">Reservation Details</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>ID:</strong> #${booking._id.slice(0, 8)}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Placed On:</strong> ${new Date(booking.createdAt).toLocaleString()}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Scheduled For:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Guests:</strong> ${booking.guests || booking.numberOfGuests}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Payment Type:</strong> ${booking.bookingStatus === 'paid' || booking.paymentStatus === 'paid' ? 'Prepaid Online' : 'Postpaid / Pay at Table'}</p>
          </div>
          <div>
            <h3 style="margin: 0 0 10px 0; color: #333;">Restaurant</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>${booking.restaurantName || (booking.restaurantId as any)?.name}</strong></p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Reservation Charge / Est. Bill</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">Base charge based on guests</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${booking.totalAmount || booking.estimatedBill || 0}</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Thank you for choosing FlavorFinder!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`FlavorFinder-Booking-${booking._id.slice(0, 8)}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      document.body.removeChild(element);
    }
  };

  useEffect(() => {
    if (!trackRes || !courierPos) return;
    const dest = userCoords;
    let timer: NodeJS.Timeout;

    const step = () => {
      if (!courierPos || !dest) return;

      const latDiff = dest.latitude - courierPos.latitude;
      const lngDiff = dest.longitude - courierPos.longitude;
      const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

      if (dist < 0.0002) {
        return;
      }

      const newPos = {
        latitude: courierPos.latitude + latDiff * 0.1,
        longitude: courierPos.longitude + lngDiff * 0.1,
        lat: courierPos.latitude + latDiff * 0.1,
        lng: courierPos.longitude + lngDiff * 0.1
      };

      setCourierPos(newPos);
      timer = setTimeout(step, 1800);
    };

    step();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [trackRes, courierPos, userCoords]);

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto py-8">
      {trackingOrder && trackRes && (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex flex-col">
          <div className="bg-white p-6 flex justify-between items-center border-b border-gray-100">
             <div>
                <h2 className="text-xl font-black text-gray-900">Live Delivery Track</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payload #{trackingOrder._id.slice(0, 8)}</p>
             </div>
             <button onClick={() => { setTrackingOrder(null); setTrackRes(null); }} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all">
               <i className="fa-solid fa-xmark text-xl"></i>
             </button>
          </div>
          <div className="flex-1 relative">
             <MapView 
               restaurants={trackRes ? [trackRes] : []} 
               center={trackRes ? { 
                 latitude: (trackRes.location.latitude + userCoords.latitude) / 2, 
                 longitude: (trackRes.location.longitude + userCoords.longitude) / 2,
                 lat: (trackRes.location.latitude + userCoords.latitude) / 2,
                 lng: (trackRes.location.longitude + userCoords.longitude) / 2
               } : userCoords}
               onRestaurantClick={() => {}}
               onClose={() => {}}
               courierPosition={courierPos}
               destinationPosition={userCoords}
               showTrace={true}
             />
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-6">
                <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-gray-100 flex items-center gap-6">
                   <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#EF4F5F] shadow-inner">
                      <i className="fa-solid fa-motorcycle text-2xl"></i>
                   </div>
                   <div className="flex-1">
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[3px] mb-1">On the way</p>
                      <h4 className="font-black text-gray-900 text-lg">Arriving in 12 mins</h4>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-10 px-4 gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-gray-900">
            {isPartner ? 'Merchant Stream' : 'Activity Hub'}
          </h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
            {isPartner ? 'Live Incoming Payload Status' : 'Real-time Life Events'}
          </p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-2">
           <button onClick={() => setActiveTab('orders')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-white text-[#EF4F5F] shadow-sm' : 'text-gray-400'}`}>
              {isPartner ? 'Sales' : 'Orders'}
           </button>
           <button onClick={() => setActiveTab('bookings')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'bookings' ? 'bg-white text-[#EF4F5F] shadow-sm' : 'text-gray-400'}`}>Tables</button>
        </div>
      </div>

      {ratingModal.order && (
        <div className="fixed inset-0 bg-black/60 z-[1200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-black mb-4">Rate Order #{ratingModal.order._id.slice(0, 8)}</h3>
            <div className="space-y-3">
              <label className="block text-xs font-bold">Food Rating</label>
              <input type="range" min={1} max={5} value={ratingModal.foodRating || 3} onChange={(e) => setRatingModal((s) => ({ ...s, foodRating: Number(e.target.value) }))} />
              <p>{ratingModal.foodRating || 3}/5</p>
              <label className="block text-xs font-bold">Delivery Rating</label>
              <input type="range" min={1} max={5} value={ratingModal.deliveryRating || 3} onChange={(e) => setRatingModal((s) => ({ ...s, deliveryRating: Number(e.target.value) }))} />
              <p>{ratingModal.deliveryRating || 3}/5</p>
              <label className="block text-xs font-bold">Restaurant Rating</label>
              <input type="range" min={1} max={5} value={ratingModal.restaurantRating || 3} onChange={(e) => setRatingModal((s) => ({ ...s, restaurantRating: Number(e.target.value) }))} />
              <p>{ratingModal.restaurantRating || 3}/5</p>
              <label className="block text-xs font-bold">Review</label>
              <textarea value={ratingModal.review} onChange={(e) => setRatingModal((s) => ({ ...s, review: e.target.value }))} className="w-full border rounded-xl p-2" />
              {ratingFeedback && (<p className="text-sm text-green-600">{ratingFeedback}</p>)}
              <div className="flex gap-2 mt-3">
                <button className="flex-1 bg-[#EF4F5F] text-white py-2 rounded-xl" onClick={async () => {
                  if (!ratingModal.order) return;
                  try {
                    await orderService.rateOrder(ratingModal.order._id, { foodRating: ratingModal.foodRating || 3, deliveryRating: ratingModal.deliveryRating || 3, restaurantRating: ratingModal.restaurantRating || 3, review: ratingModal.review });
                    setRatingFeedback('Thanks for your review!');
                    setTimeout(() => setRatingModal({ order: null, foodRating: 0, deliveryRating: 0, restaurantRating: 0, review: '' }), 1200);
                  } catch (err) {
                    setRatingFeedback('Failed to submit review, try again.');
                  }
                }}>Submit</button>
                <button className="flex-1 border border-gray-300 py-2 rounded-xl" onClick={() => setRatingModal({ order: null, foodRating: 0, deliveryRating: 0, restaurantRating: 0, review: '' })}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 px-4">
        {isLoading ? (
          <div className="flex flex-col items-center py-24"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-[#EF4F5F]"></i></div>
        ) : (
          <div className="space-y-6">
             {orders.length === 0 && activeTab === 'orders' ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-[48px] py-20 text-center">
                   <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No activity recorded</p>
                </div>
             ) : activeTab === 'orders' ? orders.map(order => (
                <div key={order._id} className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm hover:shadow-2xl transition-all flex flex-col sm:flex-row gap-8 items-center">
                   <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center flex-shrink-0 shadow-inner ${isPartner ? 'bg-emerald-50 text-emerald-600' : 'bg-[#FFF4F5] text-[#EF4F5F]'}`}>
                      <i className={`fa-solid ${isPartner ? 'fa-arrow-trend-up' : 'fa-receipt'} text-2xl`}></i>
                   </div>
                   <div className="flex-grow w-full">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{order.restaurant?.name || 'Restaurant'}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                               #{order._id.slice(0, 8)} • Ordered on {new Date(order.createdAt).toLocaleString()}
                            </p>
                            <div className="mt-2">
                               <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                 order.paymentMethod === 'cash_on_delivery' 
                                 ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                 : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                               }`}>
                                 {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Paid Online'}
                               </span>
                            </div>
                         </div>
                         <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-900 border-emerald-100' : 'bg-orange-50 text-orange-900 border-orange-100'}`}>
                             {order.status?.replace('_', ' ') || 'pending'}
                         </span>
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                         <span className="text-xl font-black text-gray-900">₹{order.totalAmount}</span>
                         <div className="flex gap-4 flex-wrap">
                            {!isPartner && order.status === 'out_for_delivery' && (
                               <button onClick={() => setDeliveryTrackingOrder(order)} className="bg-orange-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl animate-pulse">LIVE TRACK</button>
                            )}
                            {!isPartner && (order.status === 'preparing' || order.status === 'ready' || order.status === 'out_for_delivery') && (
                               <button onClick={() => setChatModalOrder(order)} className="bg-purple-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all flex items-center gap-2">
                                 <i className="fa-solid fa-comment-dots"></i> Chat
                               </button>
                            )}
                            {order.status === 'delivered' && !order.ratings?.food && (
                               <button onClick={() => setReviewModalOrder(order)} className="bg-blue-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-2xl transition-all flex items-center gap-2">
                                 <i className="fa-solid fa-star"></i> Review
                               </button>
                            )}
                            {order.status === 'delivered' && (
                               <button onClick={() => exportToPDF(order)} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">EXPORT PDF</button>
                            )}
                            <button onClick={() => handleTrackOrder(order)} className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">VIEW DETAILS</button>
                         </div>
                      </div>
                   </div>
                </div>
             )) : bookings.map(booking => (
                <div key={booking._id} className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm hover:shadow-2xl transition-all flex flex-col sm:flex-row gap-8 items-center">
                   <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[28px] flex items-center justify-center flex-shrink-0 shadow-inner">
                      <i className="fa-solid fa-calendar-check text-2xl"></i>
                   </div>
                   <div className="flex-grow w-full">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{(booking.restaurantId as any)?.name || booking.restaurantName}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                               Booked on {new Date(booking.createdAt).toLocaleString()}
                            </p>
                            <p className="text-[11px] text-gray-600 font-bold mt-1">
                               {new Date(booking.bookingDate).toLocaleDateString()} @ {booking.timeSlot?.startTime || booking.bookingTime} • {booking.numberOfGuests || booking.guests} Guests
                            </p>
                            <div className="mt-2">
                               <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                 booking.paymentStatus === 'paid' || booking.bookingStatus === 'paid'
                                 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                 : 'bg-amber-100 text-amber-800 border border-amber-200'
                               }`}>
                                 {booking.paymentStatus === 'paid' || booking.bookingStatus === 'paid' ? 'Prepaid Booking' : 'Postpaid (Pay at table)'}
                               </span>
                            </div>
                         </div>
                         <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${booking.bookingStatus === 'confirmed' ? 'bg-emerald-50 text-emerald-900 border-emerald-100' : 'bg-orange-50 text-orange-900 border-orange-100'}`}>
                             {booking.bookingStatus || booking.status}
                         </span>
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-4">
                         <span className="text-xl font-black text-gray-900">Est. ₹{booking.estimatedBill || booking.totalAmount || 0}</span>
                         <div className="flex gap-4">
                            <button onClick={() => exportBookingPDF(booking)} className="bg-blue-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">EXPORT PDF BILL</button>
                         </div>
                      </div>
                      {booking.specialRequests && (
                        <p className="text-sm text-gray-500 mt-2 italic">"{booking.specialRequests}"</p>
                      )}
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {chatModalOrder && (
        <ChatModal 
          orderId={chatModalOrder._id}
          restaurantId={chatModalOrder.restaurantId}
          customerId={currentUser?._id || ''}
          restaurantName={chatModalOrder.restaurant?.name || 'Restaurant'}
          currentUserId={currentUser?._id || ''}
          userRole={isPartner ? 'restaurant' : 'customer'}
          onClose={() => setChatModalOrder(null)}
        />
      )}

      {/* Review Modal */}
      {reviewModalOrder && (
        <ReviewModal 
          orderId={reviewModalOrder._id}
          restaurantId={reviewModalOrder.restaurantId}
          customerId={currentUser?._id || ''}
          customerName={currentUser?.name || 'Customer'}
          restaurantName={reviewModalOrder.restaurant?.name || 'Restaurant'}
          onClose={() => setReviewModalOrder(null)}
          onReviewSubmitted={() => {
            setReviewModalOrder(null);
            fetchData(); // Refresh orders to show updated review status
          }}
        />
      )}

      {/* Delivery Tracking Map */}
      {deliveryTrackingOrder && (
        <DeliveryTrackingMap 
          orderId={deliveryTrackingOrder._id}
          userLocation={userCoords}
          restaurantLocation={{ latitude: trackRes?.location.latitude || 23.0225, longitude: trackRes?.location.longitude || 72.5714 }}
          deliveryPartnerLocation={courierPos || userCoords}
          status={deliveryTrackingOrder.status as any}
          onClose={() => {
            setDeliveryTrackingOrder(null);
            setTrackingOrder(null);
            setTrackRes(null);
          }}
        />
      )}
    </div>
  );
};

export default OrderHistory;
