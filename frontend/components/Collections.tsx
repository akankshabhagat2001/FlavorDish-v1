
import React, { useState, useMemo } from 'react';
import { Collection, Restaurant } from '../types';

interface CollectionsProps {
  city?: string;
  collections: Collection[];
  restaurants?: Restaurant[];
  loading?: boolean;
  onCollectionClick?: (collection: Collection, restaurants: Restaurant[], isExplore?: boolean) => void;
  onViewMap?: (restaurant: Restaurant) => void;
}

const DEFAULT_COLLECTION_IMAGE = 'https://images.unsplash.com/photo-1555939594-58d7cb561cab?w=1200&q=90&auto=format&fit=crop';

const Collections: React.FC<CollectionsProps> = ({ city, collections, restaurants = [], loading, onCollectionClick, onViewMap }) => {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const cityName = city?.split(',')[0] || 'Ahmedabad';

  // Dynamic collection generation based on restaurant data
  const dynamicCollections = useMemo(() => {
    const collections: Collection[] = [];

    // Local Heritage Foods Collection
    const heritageRestaurants = restaurants.filter(r => 
      r.cuisine.some(c => ['gujarati', 'heritage', 'traditional', 'thali'].includes(c.toLowerCase())) ||
      r.name.toLowerCase().includes('agashiye') || 
      r.name.toLowerCase().includes('rajwadu') ||
      r.location.address.toLowerCase().includes('lal darwaja')
    );

    if (heritageRestaurants.length > 0) {
      collections.push({
        _id: 'dynamic-heritage',
        title: 'Local Heritage Foods',
        places: heritageRestaurants.length,
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561cab?w=800&q=80',
        topPlaces: heritageRestaurants.slice(0, 3).map(r => ({
          name: r.name,
          website: r.location.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.location.address)}`
        }))
      });
    }

    // Street Food Collection
    const streetFoodRestaurants = restaurants.filter(r => 
      r.cuisine.some(c => ['street food', 'fast food', 'snacks'].includes(c.toLowerCase())) ||
      r.location.address.toLowerCase().includes('manek chowk') ||
      r.location.address.toLowerCase().includes('law garden')
    );

    if (streetFoodRestaurants.length > 0) {
      collections.push({
        _id: 'dynamic-street-food',
        title: 'Street Food Delights',
        places: streetFoodRestaurants.length,
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
        topPlaces: streetFoodRestaurants.slice(0, 3).map(r => ({
          name: r.name,
          website: r.location.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.location.address)}`
        }))
      });
    }

    // Cafe Culture Collection
    const cafeRestaurants = restaurants.filter(r => 
      r.cuisine.some(c => ['cafe', 'continental', 'coffee', 'desserts'].includes(c.toLowerCase())) ||
      r.location.address.toLowerCase().includes('navrangpura') ||
      r.location.address.toLowerCase().includes('vastrapur')
    );

    if (cafeRestaurants.length > 0) {
      collections.push({
        _id: 'dynamic-cafes',
        title: 'Cafe Culture',
        places: cafeRestaurants.length,
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
        topPlaces: cafeRestaurants.slice(0, 3).map(r => ({
          name: r.name,
          website: r.location.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.location.address)}`
        }))
      });
    }

    // Fine Dining Collection
    const fineDiningRestaurants = restaurants.filter(r => 
      r.rating >= 4.2 && r.costForTwo >= 1000 ||
      r.cuisine.some(c => ['fine dining', 'italian', 'japanese', 'continental'].includes(c.toLowerCase()))
    );

    if (fineDiningRestaurants.length > 0) {
      collections.push({
        _id: 'dynamic-fine-dining',
        title: 'Fine Dining Experience',
        places: fineDiningRestaurants.length,
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        topPlaces: fineDiningRestaurants.slice(0, 3).map(r => ({
          name: r.name,
          website: r.location.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.location.address)}`
        }))
      });
    }

    // Late Night Collection
    const lateNightRestaurants = restaurants.filter(r => 
      r.location.address.toLowerCase().includes('s.g. highway') ||
      r.location.address.toLowerCase().includes('thaltej') ||
      r.cuisine.some(c => ['barbeque', 'pizza', 'burgers'].includes(c.toLowerCase()))
    );

    if (lateNightRestaurants.length > 0) {
      collections.push({
        _id: 'dynamic-late-night',
        title: 'Late Night Cravings',
        places: lateNightRestaurants.length,
        imageUrl: 'https://images.unsplash.com/photo-1543521521-5c0f1b4e8f0e?w=800&q=80',
        topPlaces: lateNightRestaurants.slice(0, 3).map(r => ({
          name: r.name,
          website: r.location.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.location.address)}`
        }))
      });
    }

    return collections;
  }, [restaurants]);

  // Combine static and dynamic collections
  const allCollections = useMemo(() => {
    return [...collections, ...dynamicCollections];
  }, [collections, dynamicCollections]);

  const getRestaurantsForCollection = (collectionId: string): Restaurant[] => {
    // Handle dynamic collections
    if (collectionId.startsWith('dynamic-')) {
      const type = collectionId.replace('dynamic-', '');
      switch (type) {
        case 'heritage':
          return restaurants.filter(r => 
            r.cuisine.some(c => ['gujarati', 'heritage', 'traditional', 'thali'].includes(c.toLowerCase())) ||
            r.name.toLowerCase().includes('agashiye') || 
            r.name.toLowerCase().includes('rajwadu') ||
            r.location.address.toLowerCase().includes('lal darwaja')
          );
        case 'street-food':
          return restaurants.filter(r => 
            r.cuisine.some(c => ['street food', 'fast food', 'snacks'].includes(c.toLowerCase())) ||
            r.location.address.toLowerCase().includes('manek chowk') ||
            r.location.address.toLowerCase().includes('law garden')
          );
        case 'cafes':
          return restaurants.filter(r => 
            r.cuisine.some(c => ['cafe', 'continental', 'coffee', 'desserts'].includes(c.toLowerCase())) ||
            r.location.address.toLowerCase().includes('navrangpura') ||
            r.location.address.toLowerCase().includes('vastrapur')
          );
        case 'fine-dining':
          return restaurants.filter(r => 
            r.rating >= 4.2 && r.costForTwo >= 1000 ||
            r.cuisine.some(c => ['fine dining', 'italian', 'japanese', 'continental'].includes(c.toLowerCase()))
          );
        case 'budget':
          return restaurants.filter(r => 
            r.costForTwo <= 500 && r.rating >= 4.0
          );
        case 'late-night':
          return restaurants.filter(r => 
            r.location.address.toLowerCase().includes('s.g. highway') ||
            r.location.address.toLowerCase().includes('thaltej') ||
            r.cuisine.some(c => ['barbeque', 'pizza', 'burgers'].includes(c.toLowerCase()))
          );
        default:
          return [];
      }
    }

    // Handle static collections
    const collectionMap: { [key: string]: (r: Restaurant) => boolean } = {
      'c1': (r) => r.cuisine.some(c => ['heritage', 'gujarati', 'traditional', 'thali'].includes(c.toLowerCase())) || r.name.toLowerCase().includes('agashiye') || r.name.toLowerCase().includes('rajwadu'),
      'c2': (r) => r.location.address.toLowerCase().includes('s.g. highway') || r.location.address.toLowerCase().includes('sg highway') || r.location.address.toLowerCase().includes('thaltej'),
      'c3': (r) => r.location.address.toLowerCase().includes('navrangpura') || r.cuisine.some(c => ['cafe', 'desserts', 'street food'].includes(c.toLowerCase())),
      'c4': (r) => r.rating >= 4.5 && r.isOpen,
    };

    const filterFn = collectionMap[collectionId];
    return filterFn ? restaurants.filter(filterFn) : [];
  };

  // Collection images mapping - using unsplash URLs for authentic restaurant imagery
  const collectionImages: { [key: string]: string } = {
    'c1': 'https://images.unsplash.com/photo-1555939594-58d7cb561cab?w=800&q=80', // Authentic Indian
    'c2': 'https://images.unsplash.com/photo-1543521521-5c0f1b4e8f0e?w=800&q=80', // Casual Dining
    'c3': 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80', // Cafes & Desserts
    'c4': 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80', // Rooftop & Fine Dining
    'dynamic-heritage': 'https://images.unsplash.com/photo-1555939594-58d7cb561cab?w=800&q=80',
    'dynamic-street-food': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'dynamic-cafes': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
    'dynamic-fine-dining': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    'dynamic-budget': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&q=80',
    'dynamic-late-night': 'https://images.unsplash.com/photo-1543521521-5c0f1b4e8f0e?auto=format&fit=crop&w=1200&q=90',
  };

  const getCollectionCount = (collectionId: string) => {
    const matched = getRestaurantsForCollection(collectionId);
    return matched.length;
  };

  const getOpenCount = (collectionId: string) => {
    const matched = getRestaurantsForCollection(collectionId);
    return matched.filter(r => r.isOpen).length;
  };

  const categoryOptions = ['All', 'Heritage', 'Street Food', 'Cafe', 'Fine Dining', 'Late Night', 'Popular'];

  const filteredCollections = categoryFilter === 'All'
    ? allCollections
    : allCollections.filter((c) => {
        const map = {
          'Heritage': ['c1', 'dynamic-heritage'],
          'Street Food': ['c2', 'dynamic-street-food'],
          'Cafe': ['c3', 'dynamic-cafes'],
          'Fine Dining': ['c4', 'dynamic-fine-dining'],
          'Late Night': ['dynamic-late-night'],
          'Popular': ['c1', 'c2', 'c3', 'c4', 'dynamic-heritage', 'dynamic-street-food', 'dynamic-cafes', 'dynamic-fine-dining'],
        };
        return map[categoryFilter as keyof typeof map]?.includes(c._id);
      });

  // As requested, hide the first 4 collection cards to keep UI focused on recommendation blocks
  const visibleCollections = filteredCollections.slice(4);

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection);
    if (collection._id === 'c4') {
      // For Explore Ahmedabad Foods collection
      onCollectionClick?.(collection, [], true);
    } else {
      const collectionRestaurants = getRestaurantsForCollection(collection._id);
      onCollectionClick?.(collection, collectionRestaurants);
    }
  };

  if (loading && collections.length === 0) {
    return (
      <div className="mb-12">
        <div className="h-10 bg-gray-100 rounded w-64 mb-2 animate-pulse"></div>
        <div className="h-6 bg-gray-50 rounded w-96 mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-80 bg-gray-50 rounded-[12px] animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="mb-8">
        <div className="sticky top-24 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-[#1c1c1c] mb-1">Collections</h2>
              <p className="text-sm text-gray-500 font-light mr-6">
                Explore curated lists of top restaurants, cafes, pubs, and bars in <span className="font-semibold text-gray-700">{cityName}</span>, based on trends
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Quick Action:</span>
              <button
                onClick={() => {
                  setCategoryFilter('Heritage');
                  // Scroll to show the filtered collections
                  setTimeout(() => {
                    window.scrollTo({ top: window.scrollY + 100, behavior: 'smooth' });
                  }, 100);
                }}
                className="bg-[#EF4F5F] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md hover:bg-[#d03d4f] transition-all hover:scale-105"
              >
                <i className="fa-solid fa-utensils mr-2"></i>Explore Local Foods
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {categoryOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategoryFilter(option)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${categoryFilter === option ? 'bg-[#EF4F5F] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        {visibleCollections.map((c) => {
          const total = getCollectionCount(c._id);
          const open = getOpenCount(c._id);
          const imageUrl = c.imageUrl || collectionImages[c._id] || 'https://images.unsplash.com/photo-1555939594-58d7cb561cab?w=800&q=80';
          const cRestaurants = getRestaurantsForCollection(c._id);
          const resolvedImage = failedImages[c._id]
            ? DEFAULT_COLLECTION_IMAGE
            : (c.imageUrl || collectionImages[c._id] || DEFAULT_COLLECTION_IMAGE);

          return (
            <div
              key={c._id}
              className="relative h-84 rounded-3xl overflow-hidden cursor-pointer group shadow-xl border-2 border-white/40 transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-[#EF4F5F]"
              onClick={() => handleCollectionClick(c)}
            >
              <img
                src={resolvedImage}
                alt={c.title}
                onError={() => setFailedImages(prev => ({ ...prev, [c._id]: true }))}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white mb-3 border-2 border-white/40 hover:border-white/60 transition shadow-lg">
                  <i className="fa-solid fa-star text-yellow-300"></i>
                  {c._id === 'c4' ? 'Top Rated' : 'Collection'}
                </span>
                <h3 className="text-2xl font-black text-white leading-tight drop-shadow-2xl mb-2">{c.title}</h3>
                <p className="text-sm text-white/95 mt-1 font-semibold">
                  <i className="fa-solid fa-store mr-2 text-orange-300"></i>{total} Places • <i className="fa-solid fa-check-circle mr-1 text-green-300"></i>{open} Open
                </p>
                <p className="text-xs text-white/80 mt-2 line-clamp-2 italic font-light">{c.title === 'Heritage Dining' ? 'Authentic traditional recipes' : 'Curated for your taste'}</p>
                {cRestaurants.length > 0 && onViewMap && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewMap(cRestaurants[0]);
                    }}
                    className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-[#EF4F5F] to-orange-500 text-white text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg hover:shadow-2xl transition hover:scale-105"
                  >
                    <i className="fa-solid fa-map-location-dot"></i>
                    See on Map
                  </button>
                )}
              </div>
              <div className="absolute top-4 right-4 bg-gradient-to-r from-[#EF4F5F] to-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg">
                {open} live
              </div>
            </div>
          );
        })}
      </div>

      {selectedCollection && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="relative h-56">
              <img src={selectedCollection.imageUrl || collectionImages[selectedCollection._id] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600'} className="w-full h-full object-cover" alt={selectedCollection.title} />
              <div className="absolute inset-0 bg-black/50"></div>
              <button onClick={() => setSelectedCollection(null)} className="absolute top-4 right-4 text-white hover:rotate-90 transition-transform w-10 h-10 flex items-center justify-center bg-black/20 rounded-full">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-3xl font-semibold mb-1">{selectedCollection.title}</h3>
                <p className="text-white/80 font-light text-sm italic">Curated by FlavorFinder Experts</p>
              </div>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[2px] mb-6">Trending in this Collection</h4>
              <div className="space-y-4">
                {(selectedCollection.topPlaces || []).length > 0 ? (
                   selectedCollection.topPlaces?.map((place, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-[#FFF4F5] border border-transparent hover:border-[#EF4F5F]/10 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#EF4F5F] shadow-sm font-semibold text-sm">
                          {i + 1}
                        </div>
                        <span className="font-medium text-gray-800 group-hover:text-[#EF4F5F]">{place.name}</span>
                      </div>
                      {place.website && (
                        <a 
                          href={place.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-white p-2 rounded-lg text-gray-400 hover:text-[#EF4F5F] hover:shadow-md transition-all flex items-center gap-1 px-3"
                        >
                          <i className="fa-solid fa-location-dot text-[10px]"></i>
                          <span className="text-[11px] font-semibold uppercase">Map</span>
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <i className="fa-solid fa-magnifying-glass text-3xl text-gray-200 mb-4 block"></i>
                    <p className="text-gray-400 text-sm font-light italic">Syncing live places for this collection...</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setSelectedCollection(null)}
                className="mt-10 w-full bg-[#EF4F5F] text-white py-4 rounded-xl font-semibold shadow-lg shadow-[#EF4F5F]/20 hover:bg-[#d43d4c] transition-all"
              >
                Close Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collections;
