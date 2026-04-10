
import React, { useMemo, useState, useEffect } from 'react';
import { MenuItem, Restaurant, LatLng } from '../types.ts';
import MapView from './MapView.tsx';

interface CartItem {
  item: MenuItem;
  restaurant: Restaurant;
  qty: number;
}

interface CartModalProps {
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onCheckout: (paymentMethod: string, address: string) => void;
  currentLocation: string;
  locationCoords: LatLng | null;
  onOpenLocationPicker: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ 
  items, 
  onClose, 
  onUpdateQty, 
  onCheckout, 
  currentLocation,
  locationCoords,
  onOpenLocationPicker
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod' | 'wallet'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detailedAddress, setDetailedAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [triggerShake, setTriggerShake] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number>(25);
  const [savedAddress, setSavedAddress] = useState<string | null>(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showSavedMoney, setShowSavedMoney] = useState(false);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const subtotal = useMemo(() => items.reduce((a, b) => a + (b.item.price * b.qty), 0), [items]);
  const platformFee = 15;
  const gst = Math.round((subtotal - couponDiscount) * 0.05); // 5% GST
  const savedMoney = couponDiscount;
  const total = subtotal + deliveryFee + platformFee + gst - couponDiscount;

  const validateCoupon = (code: string) => {
    // Sample coupons for demo/testing
    const validCoupons: { [key: string]: { discount: number; code: string } } = {
      'WELCOME50': { discount: 50, code: 'WELCOME50' },
      'ZOMATO100': { discount: 100, code: 'ZOMATO100' },
      'FLAT80': { discount: 80, code: 'FLAT80' },
      'AHMEDABAD20': { discount: 20, code: 'AHMEDABAD20' }
    };

    const upperCode = code.toUpperCase().trim();
    if (validCoupons[upperCode]) {
      const discount = validCoupons[upperCode].discount;
      setCouponDiscount(Math.min(discount, subtotal)); // Can't discount more than subtotal
      setCouponError(null);
      setShowSavedMoney(true);
      return true;
    } else if (code.length > 0) {
      setCouponError('Invalid coupon code');
      setCouponDiscount(0);
      return false;
    }
    return false;
  };

  // Load saved delivery address and profile addresses
  useEffect(() => {
    try {
      const stored = localStorage.getItem('savedDeliveryAddress');
      if (stored) {
        setSavedAddress(stored);
      }
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u && u.savedAddresses && u.savedAddresses.length > 0) {
          setUserAddresses(u.savedAddresses);
          const def = u.savedAddresses.find((a: any) => a.isDefault);
          if (def) setSelectedAddressId(def.id);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Real-time validation logic
  useEffect(() => {
    const validate = () => {
      if (selectedAddressId !== 'manual' && selectedAddressId !== null) {
        return null; // Validated via profile
      }
      if (detailedAddress.trim().length === 0) {
        return "Detailed address is required for delivery.";
      }
      if (detailedAddress.trim().length < 10) {
        return "Address is too short. Please provide more details (e.g. house number).";
      }
      const hasLetters = /[a-zA-Z]/.test(detailedAddress);
      const hasNumbers = /[0-9]/.test(detailedAddress);
      if (!hasLetters || !hasNumbers) {
        return "Please include house/flat number and street name for accurate delivery.";
      }
      return null;
    };

    setAddressError(validate());
  }, [detailedAddress, selectedAddressId]);

  if (items.length === 0) return null;

  const restaurant = items[0].restaurant;

  const handlePlaceOrder = () => {
    setIsTouched(true);
    if (addressError) {
      setTriggerShake(true);
      setTimeout(() => setTriggerShake(false), 500);
      return;
    }

    let finalAddress = detailedAddress.trim();
    if (selectedAddressId && selectedAddressId !== 'manual') {
      const selected = userAddresses.find(a => a.id === selectedAddressId);
      if (selected) {
        finalAddress = `${selected.label} - ${selected.details}`;
      }
    } else {
      if (saveAddress && finalAddress.length > 0) {
        try {
          localStorage.setItem('savedDeliveryAddress', finalAddress);
          setSavedAddress(finalAddress);
        } catch {}
      }
    }

    setIsProcessing(true);
    setTimeout(() => {
      onCheckout(paymentMethod, `${finalAddress}, ${currentLocation}`);
      setIsProcessing(false);
    }, 1500);
  };

  const handleDeliveryFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setDeliveryFee(0);
      return;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setDeliveryFee(parsed);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-gray-800">Checkout</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{restaurant.name}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all">
            <i className="fa-solid fa-xmark text-xl text-gray-400"></i>
          </button>
        </div>

        <div className="flex-grow p-6 overflow-y-auto no-scrollbar space-y-8">
          
          {/* Location Status Alert - Show if coordinates available */}
          {locationCoords && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-2xl border-2 border-emerald-200 flex items-center gap-3 shadow-sm animate-fade-in">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-check text-white text-sm"></i>
              </div>
              <div>
                <p className="text-xs font-black text-emerald-700 uppercase tracking-tight">✅ Location Detected</p>
                <p className="text-[10px] text-emerald-600">Your GPS coordinates are ready for delivery</p>
              </div>
            </div>
          )}
          
          {!locationCoords && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-amber-200 flex items-center gap-3 shadow-sm animate-fade-in">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <i className="fa-solid fa-location-dot text-white text-sm"></i>
              </div>
              <div>
                <p className="text-xs font-black text-amber-700 uppercase tracking-tight">⚠️ Enable Location</p>
                <p className="text-[10px] text-amber-600">Allow GPS access for delivery tracking</p>
              </div>
            </div>
          )}
          
          {/* 1. Delivery Address with Map Preview & Validation */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Destination</h3>
            
            {/* GPS LOCATION CARD - Show Coordinates */}
            {locationCoords && (
              <div className="bg-gradient-to-br from-[#EF4F5F]/10 to-[#EF4F5F]/5 p-4 rounded-2xl border-2 border-[#EF4F5F]/30 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#EF4F5F] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#EF4F5F]/30">
                    <i className="fa-solid fa-location-crosshairs text-white text-lg"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">📍 Your GPS Location</p>
                    <div className="bg-white/60 px-3 py-2 rounded-lg border border-[#EF4F5F]/20 font-mono text-xs text-gray-800 break-all">
                      <p className="font-bold text-[#EF4F5F]">Latitude:</p>
                      <p className="text-gray-700 mb-2">{locationCoords.latitude.toFixed(6)}</p>
                      <p className="font-bold text-[#EF4F5F]">Longitude:</p>
                      <p className="text-gray-700">{locationCoords.longitude.toFixed(6)}</p>
                    </div>
                    <button 
                      onClick={onOpenLocationPicker}
                      className="text-[10px] text-[#EF4F5F] font-black uppercase tracking-widest hover:underline mt-2 block"
                    >
                      🔄 Update Location
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {locationCoords && (
              <div className="h-44 w-full rounded-[24px] overflow-hidden border border-gray-100 shadow-inner relative group bg-gray-50">
                <MapView 
                  restaurants={[]} 
                  center={locationCoords} 
                  onRestaurantClick={() => {}} 
                  onClose={() => {}} 
                  isInline={true}
                  destinationPosition={locationCoords}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-4 h-4 bg-[#EF4F5F] rounded-full border-2 border-white shadow-xl animate-bounce"></div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4 group hover:bg-white hover:border-[#EF4F5F]/20 transition-all">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#EF4F5F] shadow-sm">
                <i className="fa-solid fa-location-dot"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-tight truncate">Base Location: {currentLocation}</p>
                <button 
                  onClick={onOpenLocationPicker}
                  className="text-[10px] text-[#EF4F5F] font-black uppercase tracking-widest hover:underline mt-1"
                >
                  Change City/Area
                </button>
              </div>
            </div>

            {userAddresses.length > 0 && (
              <div className="space-y-3 mt-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Address</p>
                <div className="bg-red-50/50 p-2 rounded-2xl border border-red-100 flex flex-col gap-2">
                  {userAddresses.map(addr => (
                    <label key={addr.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr.id ? 'bg-white border-[#EF4F5F] shadow-sm' : 'bg-transparent border-transparent hover:bg-white/60'}`}>
                      <input type="radio" name="address_sel" className="mt-1 accent-[#EF4F5F]" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} />
                      <div>
                        <p className="text-xs font-black text-gray-900">{addr.label}</p>
                        <p className="text-xs text-gray-600 line-clamp-1">{addr.details}</p>
                      </div>
                    </label>
                  ))}
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedAddressId === 'manual' ? 'bg-white border-[#EF4F5F] shadow-sm' : 'bg-transparent border-transparent hover:bg-white/60'}`}>
                    <input type="radio" name="address_sel" className="accent-[#EF4F5F]" checked={selectedAddressId === 'manual' || selectedAddressId === null} onChange={() => setSelectedAddressId('manual')} />
                    <p className="text-xs font-black text-gray-900">+ Add New Address Manually</p>
                  </label>
                </div>
              </div>
            )}

            {(!userAddresses.length || selectedAddressId === 'manual' || selectedAddressId === null) && (
              <>
                {savedAddress && (
                  <div className="bg-white p-3 border border-gray-100 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Saved Local Address</p>
                      <button
                        onClick={() => {
                          setUseSavedAddress(!useSavedAddress);
                          if (!useSavedAddress) {
                            setDetailedAddress(savedAddress);
                            setAddressError(null);
                          }
                        }}
                        className={`text-[10px] font-bold ${useSavedAddress ? 'text-emerald-500' : 'text-gray-400'} hover:underline`}
                      >
                        {useSavedAddress ? 'Using saved address' : 'Use saved address'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-700 mt-1 break-words">{savedAddress}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    id="save-address"
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="h-4 w-4 text-[#EF4F5F] border-gray-300 rounded"
                  />
                  <label htmlFor="save-address" className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                    Save this locally for future
                  </label>
                </div>

                {/* Detailed Address Input with Validation */}
                <div className={`space-y-2 ${triggerShake ? 'animate-shake' : ''}`}>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Detailed Address (House No, Building, Landmark)</label>
                  <textarea
                    value={detailedAddress}
                    onBlur={() => setIsTouched(true)}
                    onChange={(e) => {
                      setDetailedAddress(e.target.value);
                      if (!isTouched) setIsTouched(true);
                    }}
                    placeholder="e.g. Flat 402, Skyline Apartments, Near Central Park..."
                    className={`w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 outline-none transition-all font-bold text-sm resize-none h-24 shadow-inner ${
                      addressError && isTouched 
                      ? 'border-red-200 focus:border-red-500 bg-red-50/30' 
                      : !addressError && detailedAddress.length > 0
                      ? 'border-emerald-100 focus:border-emerald-500 focus:bg-white'
                      : 'border-transparent focus:border-[#EF4F5F] focus:bg-white'
                    }`}
                  />
                  <div className="flex items-center justify-between min-h-[20px]">
                    {addressError && isTouched ? (
                      <p className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1 animate-fade-in">
                        <i className="fa-solid fa-triangle-exclamation"></i> {addressError}
                      </p>
                    ) : !addressError && detailedAddress.length > 0 ? (
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1 animate-fade-in">
                        <i className="fa-solid fa-circle-check"></i> Ready for delivery
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                        Detailed info helps us reach you faster.
                      </p>
                    )}
                    <span className={`text-[10px] font-black ${detailedAddress.length >= 10 && !addressError ? 'text-emerald-500' : 'text-gray-300'}`}>
                      {detailedAddress.length}/10 min
                    </span>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* 2. Order Summary */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Breakdown</h3>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-[28px] overflow-hidden shadow-sm">
              <div className="p-5 space-y-4">
                {items.map((cartItem) => (
                  <div key={cartItem.item._id} className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                        <img src={cartItem.item.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-800 truncate">{cartItem.item.itemName}</h4>
                        <p className="text-[10px] text-gray-400 font-bold">Qty: {cartItem.qty} x ₹{cartItem.item.price}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-sm font-black text-gray-900">₹{cartItem.item.price * cartItem.qty}</p>
                      <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <button onClick={() => onUpdateQty(cartItem.item._id, -1)} className="text-gray-400 hover:text-[#EF4F5F] px-1"><i className="fa-solid fa-minus text-[8px]"></i></button>
                        <span className="text-[10px] font-black min-w-[12px] text-center">{cartItem.qty}</span>
                        <button onClick={() => onUpdateQty(cartItem.item._id, 1)} className="text-gray-400 hover:text-green-500 px-1"><i className="fa-solid fa-plus text-[8px]"></i></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-50/80 p-5 space-y-3 border-t border-gray-100">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Subtotal</span>
                  <span className="text-gray-800 font-bold">₹{subtotal}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-xs bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <span className="text-emerald-600 font-bold">💰 Coupon Discount</span>
                    <span className="text-emerald-700 font-bold">-₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-semibold">Delivery & Packaging Fee</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Adjustable for testing</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-gray-200 focus-within:border-[#EF4F5F] transition-all">
                    <span className="text-[10px] font-black text-gray-400">₹</span>
                    <input 
                      type="number"
                      value={deliveryFee}
                      onChange={handleDeliveryFeeChange}
                      min="0"
                      className="w-12 bg-transparent outline-none font-black text-right text-gray-900 text-[11px]"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Govt. Taxes (GST)</span>
                  <span className="text-gray-800 font-bold">₹{gst}</span>
                </div>
                {showSavedMoney && couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs bg-[#EF4F5F]/10 p-2 rounded-lg border border-[#EF4F5F]/30">
                    <span className="text-[#EF4F5F] font-black">✨ You Saved</span>
                    <span className="text-[#EF4F5F] font-black text-lg">₹{couponDiscount}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Grand Total</span>
                  <span className="text-xl font-black text-gray-900">₹{total}</span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Coupon / Promo Code */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Apply Coupon Code</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  if (e.target.value.length === 0) {
                    setCouponDiscount(0);
                    setCouponError(null);
                  }
                }}
                placeholder="Enter coupon code (e.g. WELCOME50)"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#EF4F5F] outline-none text-sm font-semibold placeholder-gray-400 transition-all"
              />
              <button
                onClick={() => validateCoupon(couponCode)}
                className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all font-bold text-sm"
              >
                Apply
              </button>
            </div>
            {couponError && (
              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1">
                <i className="fa-solid fa-triangle-exclamation"></i> {couponError}
              </p>
            )}
            {couponDiscount > 0 && (
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">✅ Coupon Applied!</p>
                <p className="text-sm text-emerald-700 font-bold mt-1">You saved ₹{couponDiscount} with code <span className="font-black">{couponCode.toUpperCase()}</span></p>
              </div>
            )}
            <p className="text-[9px] text-gray-400 font-semibold">Sample codes: WELCOME50, ZOMATO100, FLAT80, AHMEDABAD20</p>
          </section>

          {/* 4. Payment Method */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Method</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'upi', label: 'UPI (GPay / PhonePe)', icon: 'fa-mobile-screen-button', desc: 'Instant & Secure' },
                { id: 'card', label: 'Credit / Debit Card', icon: 'fa-credit-card', desc: 'Visa, Mastercard, Amex' },
                { id: 'wallet', label: 'FlavourFinder Wallet', icon: 'fa-wallet', desc: 'Available Balance: ₹500' },
                { id: 'cod', label: 'Cash on Delivery', icon: 'fa-hand-holding-dollar', desc: 'Pay when order arrives' }
              ].map((method: any) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    paymentMethod === method.id 
                      ? 'bg-[#EF4F5F]/5 border-[#EF4F5F] shadow-sm' 
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === method.id ? 'bg-[#EF4F5F] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <i className={`fa-solid ${method.icon} text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${paymentMethod === method.id ? 'text-[#EF4F5F]' : 'text-gray-600'}`}>
                      {method.label}
                    </p>
                    <p className="text-[10px] text-gray-400 font-semibold">{method.desc}</p>
                  </div>
                  {paymentMethod === method.id && (
                    <div className="flex-shrink-0 w-5 h-5 bg-[#EF4F5F] rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-check text-[10px] text-white"></i>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-white border-t border-gray-100">
          <button 
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className={`w-full py-5 rounded-[20px] font-black text-lg transition-all flex items-center justify-between px-8 relative transform ${
              isProcessing 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50' 
              : 'bg-gradient-to-r from-[#EF4F5F] to-[#E63946] text-white shadow-xl shadow-[#EF4F5F]/30 hover:from-[#E63946] hover:to-[#D62828] hover:shadow-2xl hover:scale-105 active:scale-95'
            }`}
          >
            {isProcessing ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="inline-block w-5 h-5 border-3 border-gray-300 border-t-gray-700 rounded-full animate-spin"></span>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-start text-left">
                   <span className="text-[10px] font-black uppercase tracking-[2px] opacity-70">Pay via {paymentMethod.toUpperCase()}</span>
                   <span className="leading-none">₹{total}</span>
                </div>
                <div className="flex items-center gap-2 uppercase tracking-widest text-sm">
                  {addressError && isTouched ? 'Check Address' : 'Place Order'} <i className="fa-solid fa-chevron-right text-sm"></i>
                </div>
              </>
            )}
          </button>
          {addressError && isTouched && (
            <p className="text-[9px] text-center text-red-400 font-black uppercase tracking-widest mt-3 animate-pulse">
              Please enter a valid detailed address to proceed
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartModal;
