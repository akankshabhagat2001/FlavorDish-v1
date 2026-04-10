
import React, { useState, useEffect } from 'react';
import { Restaurant, User } from '../types.ts';
import { restaurantService } from '../services';

interface RestaurantCardProps {
  restaurant: Restaurant;
  currentUser: User | null;
  onClick: (restaurant: Restaurant) => void;
  onMapViewClick?: (restaurant: Restaurant) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, currentUser, onClick, onMapViewClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isOwner = currentUser?.role === 'restaurant' && 
                  (restaurant.ownerId === currentUser._id || restaurant.name.toLowerCase().includes(currentUser.name.toLowerCase()));
  const [isSavedAddress, setIsSavedAddress] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`savedRestaurantAddress-${restaurant._id}`);
    setIsSavedAddress(!!saved);
  }, [restaurant._id]);

  const handleSaveRestaurantAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    const addressData = `${restaurant.name} | ${restaurant.location.address}`;
    localStorage.setItem(`savedRestaurantAddress-${restaurant._id}`, addressData);
    setIsSavedAddress(true);
  };

  const handleRemoveRestaurantAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem(`savedRestaurantAddress-${restaurant._id}`);
    setIsSavedAddress(false);
  };

  const handleAdminDelist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`AUTHORITY OVERRIDE: Delist "${restaurant.name}" from marketplace?`)) {
      setIsUpdating(true);
      await restaurantService.deleteRestaurant(restaurant._id);
      setIsUpdating(false);
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    await restaurantService.updateRestaurant(restaurant._id, { isOpen: !restaurant.isOpen } as any);
    setIsUpdating(false);
  };

  const fallbackImage = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80&auto=format&fit=crop";

  const getOptimizedImageUrl = (rawUrl: string) => {
    if (!rawUrl) return fallbackImage;
    try {
      if (rawUrl.includes('images.unsplash.com')) {
        const url = new URL(rawUrl);
        url.searchParams.set('w', '1200');
        url.searchParams.set('q', '90');
        url.searchParams.set('auto', 'format');
        url.searchParams.set('fit', 'crop');
        return url.toString();
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  const imageSrc = imageError ? fallbackImage : getOptimizedImageUrl(restaurant.imageUrl || restaurant.image);

  return (
    <div 
      className="group bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer h-full flex flex-col relative"
      onClick={() => onClick(restaurant)}
    >
      {/* Authority Action Overlays */}
      {(isAdmin || isOwner) && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
           {isAdmin && (
             <button 
               onClick={handleAdminDelist}
               disabled={isUpdating}
               className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-xl hover:bg-red-600 transition-all border border-white/20"
               title="Admin: Remove Restaurant"
             >
               {isUpdating ? <i className="fa-solid fa-spinner fa-spin text-xs"></i> : <i className="fa-solid fa-trash-can text-xs"></i>}
             </button>
           )}
           {isOwner && (
             <button 
               onClick={handleToggleStatus}
               disabled={isUpdating}
               className={`px-4 h-10 rounded-xl flex items-center justify-center shadow-xl transition-all border border-white/20 font-black text-[9px] uppercase tracking-widest ${restaurant.isOpen ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}`}
               title="Owner: Toggle Open/Closed"
             >
               {isUpdating ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : null}
               {restaurant.isOpen ? 'Live' : 'Hidden'}
             </button>
           )}
        </div>
      )}

      {/* Main Banner Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <i className="fa-solid fa-utensils text-gray-200 text-3xl"></i>
          </div>
        )}
        
        <img 
          src={imageSrc} 
          srcSet={restaurant.imageUrl?.includes('images.unsplash.com') ? `${getOptimizedImageUrl(restaurant.imageUrl)} 1200w, ${restaurant.imageUrl.replace('w=800','w=600').replace('q=80','q=70')} 600w` : undefined}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          alt={restaurant.name} 
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 
            ${imageLoaded ? 'opacity-100' : 'opacity-0'} 
            ${!restaurant.isOpen ? 'grayscale contrast-50 opacity-60' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />

        {/* Closed Overlay */}
        {!restaurant.isOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
             <span className="bg-white/95 px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-[3px] text-gray-900 shadow-2xl border border-gray-100">Currently Offline</span>
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg flex items-center gap-1 border border-white/20">
          <i className="fa-solid fa-star text-orange-500"></i> {restaurant.rating.toFixed(1)}
        </div>

        {/* Offer Badge - Dynamic based on discount */}
        {restaurant.discount && restaurant.discount > 0 && (
          <div className="absolute top-4 left-16 bg-gradient-to-r from-[#EF4F5F] to-[#FF6B7B] text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg border border-white/20 animate-pulse">
            <i className="fa-solid fa-tag mr-1"></i> {restaurant.discount}% OFF
          </div>
        )}

        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {isSavedAddress ? (
            <button
              onClick={handleRemoveRestaurantAddress}
              className="bg-white/90 text-gray-800 px-2 py-1 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-red-100"
            >
              <i className="fa-solid fa-bookmark"></i>
              <span className="ml-1">Saved</span>
            </button>
          ) : (
            <button
              onClick={handleSaveRestaurantAddress}
              className="bg-white/90 text-[#EF4F5F] px-2 py-1 rounded-xl border border-[#EF4F5F]/20 text-[10px] font-black uppercase tracking-widest hover:bg-[#EF4F5F]/10"
            >
              <i className="fa-regular fa-bookmark"></i>
              <span className="ml-1">Save Address</span>
            </button>
          )}
        </div>

        {/* Location / Directions Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const destination = `${restaurant.name}, ${restaurant.location.address}`;

            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const origin = `${position.coords.latitude},${position.coords.longitude}`;
                  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
                  window.open(mapsUrl, '_blank');
                },
                () => {
                  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
                  window.open(mapsUrl, '_blank');
                },
                { enableHighAccuracy: true, timeout: 7000 }
              );
            } else {
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
              window.open(mapsUrl, '_blank');
            }
          }}
          title="Open in Google Maps"
          className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white text-gray-800 shadow-md rounded-full p-2 border border-white/40 transition-all"
        >
          <i className="fa-solid fa-location-dot text-sm"></i>
        </button>

        {/* Signature Dish Preview - Spotlight Style */}
        {restaurant.signatureDish && (
          <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10">
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl flex items-center gap-3 shadow-xl border border-white/20">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
                <img src={restaurant.signatureDish.imageUrl} className="w-full h-full object-cover" alt={restaurant.signatureDish.name} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-[#EF4F5F] uppercase tracking-widest leading-none mb-1">Ahmedabad's Best</p>
                <p className="text-[11px] font-black text-gray-900 truncate tracking-tight">{restaurant.signatureDish.name}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-xl font-black text-gray-900 tracking-tight truncate group-hover:text-[#EF4F5F] transition-colors flex items-center gap-2 heading-readable">
            {restaurant.name}
            {isOwner && <i className="fa-solid fa-crown text-[#EF4F5F] text-[10px]" title="Owned by You"></i>}
          </h3>
        </div>
        
        <div className="flex items-center gap-2 mb-4 mt-2 overflow-hidden">
          <span className="flex-shrink-0 text-[9px] font-black bg-gray-50 text-gray-500 border border-gray-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
            {restaurant.cuisine[0]}
          </span>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">
            {restaurant.cuisine.slice(1).join(', ')}
          </p>
        </div>

        {/* Full Address with Area/Locality */}
        <div className="space-y-2 mb-3">
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.location.address)}`} target="_blank" rel="noopener noreferrer" className="flex gap-2 items-start text-[10px] text-gray-500 font-bold uppercase tracking-wide hover:text-[#EF4F5F] transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <i className="fa-solid fa-location-dot flex-shrink-0 mt-1"></i>
            <span className="line-clamp-2 hover:underline inline">{restaurant.location.address}</span>
            <i className="fa-solid fa-arrow-up-right-from-square text-[8px] mt-1 ml-1 opacity-70"></i>
          </a>
          {restaurant.location.area && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.location.area + ' ' + (restaurant.location.zipCode || ''))}`} target="_blank" rel="noopener noreferrer" className="flex gap-2 items-center text-[9px] text-gray-400 font-bold uppercase tracking-wide px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 w-fit hover:bg-gray-100 transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <i className="fa-solid fa-map-pin flex-shrink-0"></i>
              <span className="font-semibold">{restaurant.location.area}</span>
              {restaurant.location.zipCode && <span className="text-gray-300">•</span>}
              {restaurant.location.zipCode && <span>{restaurant.location.zipCode}</span>}
            </a>
          )}
        </div>
        
        <div className="mt-auto flex justify-between items-center pt-5 border-t border-gray-50 gap-2 flex-wrap">
           <div className="flex flex-col">
             <span className="text-sm font-black text-gray-900">₹{restaurant.costForTwo}</span>
             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">For Two</span>
           </div>
           <div className="flex items-center gap-2">
             {/* Service Type Badges */}
             <div className="flex gap-1">
               {restaurant.delivery && (
                 <span className="text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest bg-green-50 text-green-600 border border-green-200 flex items-center gap-1">
                   <i className="fa-solid fa-truck text-xs"></i>
                   Delivery
                 </span>
               )}
               {restaurant.dine_in && (
                 <span className="text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
                   <i className="fa-solid fa-utensils text-xs"></i>
                   Dine-in
                 </span>
               )}
             </div>

             {/* Delivery Time Badge */}
             <span className="text-[9px] font-black px-3 py-2 rounded-lg uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1 whitespace-nowrap">
               <i className="fa-solid fa-clock text-xs"></i>
               {restaurant.deliveryTime} mins
             </span>

             {/* View on Map Button */}
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 onMapViewClick?.(restaurant);
               }}
               title="View on Map"
               className="text-[10px] font-black px-3 py-2 rounded-lg uppercase tracking-widest transition-all shadow-sm bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 hover:shadow-md flex items-center gap-1 whitespace-nowrap"
             >
               <i className="fa-solid fa-map text-xs"></i>
               Map
             </button>

             {/* View Menu Button */}
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 onClick(restaurant);
               }}
               className={`text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 whitespace-nowrap ${restaurant.isOpen ? 'bg-[#FFF4F5] text-[#EF4F5F] border border-[#EF4F5F]/10 hover:bg-[#EF4F5F] hover:text-white hover:shadow-md' : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'}`}
               disabled={!restaurant.isOpen}
               title={restaurant.isOpen ? 'View Menu' : 'Restaurant Closed'}
             >
               <i className="fa-solid fa-book-open text-xs"></i>
               Menu
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
