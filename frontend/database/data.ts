import { User, Restaurant, MenuItem, Collection, City, RestaurantSuggestion, LocalFood } from '../types.ts';

export const AHMEDABAD_LOCALITIES = [
  "Sindhu Bhavan Road", "Vastrapur", "Satellite", "Prahlad Nagar", "Bopal", 
  "C.G. Road", "Maninagar", "Navrangpura", "Drive-in Road", "Gota", "Thaltej",
  "Manek Chowk", "Lal Darwaja", "Science City Road", "New CG Road", "Paldi"
];

export const INITIAL_USERS: User[] = [
  {
    _id: 'u1',
    name: 'Admin User',
    email: 'admin@flavorfinder.com',
    role: 'admin',
    createdAt: Date.now(),
    password: 'admin123'
  },
  {
    _id: 'u2',
    name: 'Demo Customer',
    email: 'diner@gmail.com',
    role: 'customer',
    createdAt: Date.now(),
    password: 'password123'
  },
  {
    _id: 'u3',
    name: 'Demo Delivery Partner',
    email: 'delivery@demo.local',
    role: 'delivery',
    createdAt: Date.now(),
    password: 'delivery123'
  },
  {
    _id: 'u4',
    name: 'Demo Restaurant Owner',
    email: 'restaurant@demo.local',
    role: 'restaurant',
    createdAt: Date.now(),
    password: 'restaurant123'
  }
];

export const INITIAL_CITIES: City[] = [
  { 
    _id: 'city-ahmedabad', 
    name: 'Ahmedabad', 
    coords: { latitude: 22.9897239, longitude: 72.5986676, lat: 22.9897239, lng: 72.5986676 }, 
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BaG1lZGFiYWQ8L3RleHQ+PC9zdmc+'
  }
];

export const INITIAL_RESTAURANTS: Restaurant[] = [
  // Enhanced restaurants with complete information
  {
    _id: 'res1',
    ownerId: 'u1',
    name: 'Agashiye - The Heritage',
    description: 'Iconic terrace restaurant offering authentic Gujarati thali in a heritage setting.',
    cuisine: ['Gujarati', 'Heritage', 'Pure Veg'],
    location: {
      address: 'Lal Darwaja, Ahmedabad',
      latitude: 22.9955,
      longitude: 72.5910
    },
    rating: 4.8,
    isOpen: true,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BZ2FzaHllPC90ZXh0Pjwvc3ZnPg==',
    deliveryTime: '45 min',
    costForTwo: 2200,
    tablePrice: 500,
    chairPrice: 200,
    createdAt: Date.now(),
    signatureDish: {
      name: 'Unlimited Royal Thali',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Sb3lYWwgVGhhbGk8L3RleHQ+PC9zdmc+'
    }
  },
  {
    _id: 'res2',
    ownerId: 'u1',
    name: "Jasuben's Pizza",
    description: 'The legendary thin-crust pizza that defined Ahmedabad street food for generations. Famous for authentic flavor with Indian spices and secret recipe. Lal Darwaja institution for over 30 years.',
    cuisine: ['Pizza', 'Gujarati', 'Street Food'],
    location: {
      address: 'Law Garden Area, Lal Darwaja, Ahmedabad 380001',
      latitude: 23.1901,
      longitude: 72.5404
    },
    phone: '+91 79-2650-5240',
    rating: 4.5,
    isOpen: true,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5KYXN1YmVuJ3MgUGl6emE8L3RleHQ+PC9zdmc+',
    deliveryTime: '20 min',
    costForTwo: 350,
    tablePrice: 80,
    chairPrice: 40,
    createdAt: Date.now(),
    signatureDish: {
      name: 'Special Gujarati Spiced Pizza',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HdWphcmF0aSBQaXp6YTwvdGV4dD48L3N2Zz4='
    }
  },
  {
    _id: 'res3',
    ownerId: 'u1',
    name: 'Cafe Coffee Day - Navrangpura',
    description: 'Premium hangout spot and cafe chain with quality coffee, healthy snacks, and a vibrant ambiance perfect for work or casual meetups.',
    cuisine: ['Cafe', 'Coffee', 'Snacks', 'Healthy'],
    location: {
      address: 'Navrangpura, Ahmedabad 380009',
      latitude: 22.988,
      longitude: 72.601
    },
    phone: '+91 79-2646-5210',
    rating: 4.3,
    isOpen: true,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DQ0Q8L3RleHQ+PC9zdmc+',
    deliveryTime: '25 min',
    costForTwo: 600,
    tablePrice: 150,
    chairPrice: 75,
    createdAt: Date.now(),
    signatureDish: {
      name: 'Premium Arabica Coffee',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QcmVtaXVtIENvZmZlZTwvdGV4dD48L3N2Zz4='
    }
  },
  {
    _id: 'res4',
    ownerId: 'u1',
    name: 'Havmor Ice Cream - C.G. Road',
    description: 'Premium ice cream chain established in 1995, serving delicious artisanal ice creams, innovative frozen treats, smooth shakes and authentic desserts.',
    cuisine: ['Ice Cream', 'Desserts', 'Beverages', 'Frozen Treats'],
    location: {
      address: 'C.G. Road, Ahmedabad 380009',
      latitude: 23.0228,
      longitude: 72.5498
    },
    phone: '+91 79-2644-4850',
    rating: 4.4,
    isOpen: true,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5IYXZtb3I8L3RleHQ+PC9zdmc+',
    deliveryTime: '18 min',
    costForTwo: 400,
    tablePrice: 100,
    chairPrice: 50,
    createdAt: Date.now(),
    signatureDish: {
      name: 'Butterscotch & Date Ice Cream',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CdXR0ZXJzY290Y2g8L3RleHQ+PC9zdmc+'
    }
  },
  {
    _id: 'res5',
    ownerId: 'u1',
    name: 'Honest Restaurant - Satellite',
    description: 'Popular premium restaurant chain serving authentic Indian cuisine with modern ambiance and exceptional service quality.',
    cuisine: ['Indian', 'North Indian', 'Chinese', 'Modern'],
    location: {
      address: 'Satellite, Ahmedabad 380015',
      latitude: 23.035,
      longitude: 72.585
    },
    phone: '+91 79-2614-0055',
    rating: 4.3,
    isOpen: true,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Ib25lc3Q8L3RleHQ+PC9zdmc+',
    deliveryTime: '28 min',
    costForTwo: 800,
    tablePrice: 200,
    chairPrice: 100,
    createdAt: Date.now(),
    signatureDish: {
      name: 'Paneer Butter Masala with Naan',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QYW5lZXIgQ3Vycnk8L3RleHQ+PC9zdmc+'
    }
  },
  {
    _id: 'res6',
    ownerId: 'u1',
    name: 'The Noodle House - Asian',
    description: 'Premium Asian cuisine restaurant specializing in authentic Thai, Chinese and Indo-Chinese noodles and wok-cooked delicacies.',
    cuisine: ['Asian', 'Chinese', 'Thai', 'Noodles'],
    location: {
      address: 'Satellite, Ahmedabad 380015',
      latitude: 23.0427,
      longitude: 72.5506
    },
    phone: '+91 79-2614-2233',
    rating: 4.4,
    isOpen: true,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Ob29kbGVzPC90ZXh0Pjwvc3ZnPg==',
    deliveryTime: '30 min',
    costForTwo: 700,
    tablePrice: 180,
    chairPrice: 90,
    createdAt: Date.now(),
    signatureDish: {
      name: 'Chow Mein with Egg',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Ob29kbGVzPC90ZXh0Pjwvc3ZnPg=='
    }
  },
  {
    _id: 'res7',
    ownerId: 'u1',
    name: 'Burger King - S.G. Highway',
    description: 'American fast food chain serving flame-grilled burgers, crispy fries, and refreshing beverages. Late-night friendly with drive-thru service.',
    cuisine: ['Fast Food', 'American', 'Burgers'],
    location: {
      address: 'S.G. Highway, Ahmedabad 380054',
      latitude: 23.027,
      longitude: 72.507
    },
    phone: '+91 79-4001-2468',
    rating: 4.1,
    isOpen: true,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CdXJnZXIgS2luZzwvdGV4dD48L3N2Zz4=',
    deliveryTime: '20 min',
    costForTwo: 500,
    tablePrice: 120,
    chairPrice: 60,
    createdAt: Date.now(),
    signatureDish: {
      name: 'Whopper Burger',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5XaG9wcGVyPC90ZXh0Pjwvc3ZnPg=='
    }
  },
  {
    _id: 'res8',
    ownerId: 'u1',
    name: 'Domino\'s Pizza - Thaltej',
    description: 'World\'s largest pizza delivery company serving fresh, hot pizzas with quality ingredients. 30-minute delivery guarantee.',
    cuisine: ['Pizza', 'Italian', 'Fast Food'],
    location: {
      address: 'Thaltej, Ahmedabad 380054',
      latitude: 23.052,
      longitude: 72.499
    },
    phone: '+91 79-4022-1234',
    rating: 4.2,
    isOpen: true,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Eb21pbm9zPC90ZXh0Pjwvc3ZnPg==',
    deliveryTime: '25 min',
    costForTwo: 400,
    tablePrice: 100,
    chairPrice: 50,
    createdAt: Date.now(),
    signatureDish: {
      name: 'Margherita Pizza',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYXJnaGVyaXRhPC90ZXh0Pjwvc3ZnPg=='
    }
  },
  {
    _id: 'res9',
    ownerId: 'u1',
    name: 'Subway - Vastrapur',
    description: 'Healthy fast food chain offering fresh, made-to-order sandwiches, wraps, and salads with customizable ingredients.',
    cuisine: ['Sandwiches', 'Healthy', 'Fast Food', 'American'],
    location: {
      address: 'Vastrapur, Ahmedabad 380015',
      latitude: 23.039,
      longitude: 72.530
    },
    phone: '+91 79-2676-1234',
    rating: 4.0,
    isOpen: true,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TdWJ3YXk8L3RleHQ+PC9zdmc+',
    deliveryTime: '15 min',
    costForTwo: 300,
    tablePrice: 80,
    chairPrice: 40,
    createdAt: Date.now(),
    signatureDish: {
      name: 'Italian BMT Sub',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JVEEgU3ViPC90ZXh0Pjwvc3ZnPg=='
    }
  },
  {
    _id: 'res10',
    ownerId: 'u1',
    name: 'Barbeque Nation - S.G. Highway',
    description: 'Premium buffet restaurant specializing in live grill barbecue with unlimited food, mocktails, and desserts. Perfect for celebrations.',
    cuisine: ['Barbeque', 'Buffet', 'Grill', 'Indian'],
    location: {
      address: 'S.G. Highway, Ahmedabad 380054',
      latitude: 23.025,
      longitude: 72.509
    },
    phone: '+91 79-4001-2345',
    rating: 4.5,
    isOpen: true,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CQk4gTmF0aW9uPC90ZXh0Pjwvc3ZnPg==',
    deliveryTime: '35 min',
    costForTwo: 1500,
    tablePrice: 400,
    chairPrice: 200,
    createdAt: Date.now(),
    signatureDish: {
      name: 'Live Grill Barbeque Buffet',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5MaXZlIEdyaWxsPC90ZXh0Pjwvc3ZnPg=='
    }
  },
  {
    _id: 'res11',
    ownerId: 'u1',
    name: 'The Bombay Canteen - Fine Dining',
    description: 'Award-winning fine dining restaurant offering modern Indian cuisine with innovative presentations and exceptional service.',
    cuisine: ['Fine Dining', 'Modern Indian', 'Contemporary'],
    location: {
      address: 'Ellis Bridge, Ahmedabad 380006',
      latitude: 23.025,
      longitude: 72.564
    },
    phone: '+91 79-2640-1234',
    rating: 4.7,
    isOpen: true,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Cb21iYXkgQ2FudGVlbjwvdGV4dD48L3N2Zz4=',
    deliveryTime: '40 min',
    costForTwo: 2000,
    tablePrice: 500,
    chairPrice: 250,
    createdAt: Date.now(),
    signatureDish: {
      name: 'Modern Thali Experience',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Nb2Rlcm4gVGhhbGk8L3RleHQ+PC9zdmc+'
    }
  },
  {
    _id: 'res12',
    ownerId: 'u1',
    name: 'KFC - Satellite',
    description: 'World-famous fried chicken restaurant serving crispy, juicy chicken with signature sauces and sides. Family-friendly with kids menu.',
    cuisine: ['Fast Food', 'Chicken', 'American'],
    location: {
      address: 'Satellite, Ahmedabad 380015',
      latitude: 23.038,
      longitude: 72.583
    },
    phone: '+91 79-2692-1234',
    rating: 4.1,
    isOpen: true,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5LRkM8L3RleHQ+PC9zdmc+',
    deliveryTime: '22 min',
    costForTwo: 450,
    tablePrice: 110,
    chairPrice: 55,
    createdAt: Date.now(),
    signatureDish: {
      name: 'Original Recipe Chicken',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GUkVORExZPC90ZXh0Pjwvc3ZnPg=='
    }
  },
  {
    _id: 'res13',
    ownerId: 'u1',
    name: 'Neon Nights Lounge & Club',
    description: 'Premier nightlife destination offering an exclusive VIP clubbing experience, electric music, and a world-class ambient bar.',
    cuisine: ['Nightlife', 'Clubs', 'Bar', 'Continental'],
    location: {
      address: 'Sindhu Bhavan Road, Ahmedabad',
      latitude: 23.045,
      longitude: 72.505
    },
    phone: '+91 79-9999-8888',
    rating: 4.9,
    isOpen: true,
    imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80',
    deliveryTime: '45 min',
    costForTwo: 5000,
    tablePrice: 2000,
    chairPrice: 1000,
    createdAt: Date.now(),
    signatureDish: {
      name: 'VIP Lounge Experience',
      imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80'
    }
  }
];

export const INITIAL_RESTAURANT_SUGGESTIONS: RestaurantSuggestion[] = [];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    _id: 'm1',
    restaurantId: 'res1',
    itemName: 'Royal Gujarati Thali',
    description: 'Unlimited servings of Farsan, Main Course, and authentic Sweets.',
    price: 1100,
    category: 'Main Course',
    isAvailable: true,
    isVeg: true,
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5UaGFsaTwvdGV4dD48L3N2Zz4='
  },
  {
    _id: 'm2',
    restaurantId: 'res2',
    itemName: "Signature Cheese Pizza",
    description: 'Traditional thin crust topped with our secret spice mix and extra cheese.',
    price: 180,
    category: 'Pizza',
    isAvailable: true,
    isVeg: true,
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QaXp6YTwvdGV4dD48L3N2Zz4='
  },
  {
    _id: 'm3',
    restaurantId: 'res4',
    itemName: "Butterscotch Ice Cream",
    description: 'Rich and creamy butterscotch flavored ice cream topped with nuts.',
    price: 120,
    category: 'Desserts',
    isAvailable: true,
    isVeg: true,
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JY2UgQ3JlYW08L3RleHQ+PC9zdmc+'
  },
  {
    _id: 'm4',
    restaurantId: 'res5',
    itemName: "Paneer Butter Masala",
    description: 'Creamy tomato-based curry with soft paneer cubes and aromatic spices.',
    price: 280,
    category: 'Main Course',
    isAvailable: true,
    isVeg: true,
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QYW5lZXIgTWFzYWxhPC90ZXh0Pjwvc3ZnPg=='
  },
  {
    _id: 'm5',
    restaurantId: 'res6',
    itemName: "Italian BMT Sub",
    description: 'Ham, salami, pepperoni and cheese with lettuce, tomatoes and mayo.',
    price: 220,
    category: 'Sandwiches',
    isAvailable: true,
    isVeg: false,
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TVUI8L3RleHQ+PC9zdmc+'
  }
];

export const COLLECTIONS: Collection[] = [
  {
    _id: 'c1',
    title: 'Heritage Dining',
    places: 12,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5IZXJpdGFnZSBEaW5pbmc8L3RleHQ+PC9zdmc+'
  },
  {
    _id: 'c2',
    title: 'Street Food Gems',
    places: 24,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TdHJlZXQgRm9vZDwvZGV4dD48L3N2Zz4='
  },
  {
    _id: 'c3',
    title: 'Cafe Culture',
    places: 18,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYWZlIEN1bHR1cmU8L3RleHQ+PC9zdmc+'
  }
];

export const INITIAL_LOCAL_FOODS: LocalFood[] = [
  {
    _id: '1',
    name: 'Khaman',
    gujarati: 'ખમણ',
    origin: 'Gujarat',
    story: 'An ancient delicacy from the fertile plains of Gujarat, Khaman is a spongy, savory cake believed to have originated during the Mughal era. It\'s traditionally served as a breakfast item and is light enough to eat throughout the day.',
    spiceLevel: 2,
    isVeg: true,
    restaurants: ['Mamta Snacks', 'Aditi Restaurant', 'Gujarati Bhavan'],
    rating: 4.8,
    availability: 'Year-round',
    ingredients: ['Chickpea flour', 'Turmeric', 'Ginger-green chili', 'Mustard seeds', 'Asafoetida'],
    nutritionHint: 'High in protein, low fat, rich calcium',
    category: 'sweets',
    imageUrl: 'https://images.unsplash.com/photo-1585238341710-4913b1ea13d5?w=400&q=80'
  },
  {
    _id: '2',
    name: 'Fafda-Jalebi',
    gujarati: 'ફાફડા-જલેબી',
    origin: 'Gujarat',
    story: 'The iconic breakfast combo of Gujarat, Fafda (savory chickpea noodles) paired with Jalebi (sweet spirals). Traditionally eaten on Sundays and festivals, this combination symbolizes the balance of sweet and savory in Gujarati cuisine.',
    spiceLevel: 3,
    isVeg: true,
    restaurants: ['Mahaveer Fafda House', 'Ojas Sweets', 'Rajbhog Sweets'],
    rating: 4.7,
    availability: 'Year-round',
    ingredients: ['Maida flour', 'Chickpea flour', 'Turmeric', 'Chili powder', 'Jaggery', 'Saffron'],
    nutritionHint: 'Energy-rich, perfect breakfast food',
    category: 'street',
    imageUrl: 'https://images.unsplash.com/photo-1585238341710-4913b1ea13d5?w=400&q=80'
  },
  {
    _id: '3',
    name: 'Dal Dhokli',
    gujarati: 'દાળ ઢોકલી',
    origin: 'Gujarat',
    story: 'A comfort food from rural Gujarat, Dal Dhokli combines lentils with hand-rolled wheat dough. It\'s a one-pot meal traditionally cooked in every Gujarati household, representing simplicity and home-cooked warmth.',
    spiceLevel: 2,
    isVeg: true,
    restaurants: ['Home Tastes', 'Gujarati Kitchen', 'Rasoi Express'],
    rating: 4.6,
    availability: 'Year-round',
    ingredients: ['Moong dal', 'Tuvar dal', 'Wheat flour', 'Turmeric', 'Cumin', 'Asafoetida'],
    nutritionHint: 'Complete meal - protein + carbs, aids digestion',
    category: 'main',
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80'
  },
  {
    _id: '4',
    name: 'Handvo',
    gujarati: 'હાંડવો',
    origin: 'Gujarat',
    story: 'A nutritious savory cake made with mixed vegetables and lentils, Handvo is often prepared for special occasions. Legend says it was invented by a Gujarati mother who wanted to hide lentils and vegetables in a delicious snack for her children.',
    spiceLevel: 2,
    isVeg: true,
    restaurants: ['Authentic Spice', 'Gujarati Delight', 'Snack Corner'],
    rating: 4.5,
    availability: 'Year-round',
    ingredients: ['Moong dal', 'Rice', 'Mixed vegetables', 'Ginger', 'Green chili', 'Turmeric'],
    nutritionHint: 'Rich in vitamins, minerals and protein',
    category: 'snack',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80'
  },
  {
    _id: '5',
    name: 'Undhiyu',
    gujarati: 'ઉંધિયું',
    origin: 'Gujarat (Surat)',
    story: 'A festive specialty from Surat, Undhiyu is a slow-cooked vegetable casserole traditionally buried in hot coal (\'undha\' means underground). It\'s a labor of love served during celebrations and weddings.',
    spiceLevel: 3,
    isVeg: true,
    restaurants: ['Surat Special', 'Celebration Foods', 'Festival Kitchen'],
    rating: 4.9,
    availability: 'Seasonal (Oct-Feb)',
    ingredients: ['Mixed vegetables', 'Peas', 'Potatoes', 'Ridged gourd', 'Turmeric', 'Ginger-garlic paste'],
    nutritionHint: 'Rich, wholesome, vegetable-based',
    category: 'main',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'
  },
  {
    _id: '6',
    name: 'Jalebi',
    gujarati: 'જલેબી',
    origin: 'Gujarat',
    story: 'The spiral-shaped sweet sensation that has been part of Indian sweets for centuries. In Gujarat, Jalebi is not just a sweet but a cultural symbol, enjoyed at festivals, celebrations, and as an evening snack with chai.',
    spiceLevel: 0,
    isVeg: true,
    restaurants: ['Ojas Sweets', 'Rajbhog Sweets', 'Mahaveer Sweet House'],
    rating: 4.7,
    availability: 'Year-round',
    ingredients: ['Maida', 'Saffron', 'Cardamom', 'Jaggery syrup', 'Ghee'],
    nutritionHint: 'Pure indulgence, best eaten fresh',
    category: 'sweets',
    imageUrl: 'https://images.unsplash.com/photo-1673066169645-c32b8b036daa?w=400&q=80'
  },
  {
    _id: '7',
    name: 'Basundi',
    gujarati: 'બાસુંડી',
    origin: 'Gujarat',
    story: 'A creamy, cardamom-flavored dessert made from condensed milk and dry fruits. Basundi is traditionally served during Diwali and other celebrations, symbolizing prosperity and abundance in Gujarati culture.',
    spiceLevel: 0,
    isVeg: true,
    restaurants: ['Ojas Sweets', 'Rajbhog', 'Sweet Traditions'],
    rating: 4.8,
    availability: 'Year-round',
    ingredients: ['Milk', 'Condensed milk', 'Cardamom', 'Saffron', 'Dry fruits', 'Ghee'],
    nutritionHint: 'Rich in calcium and nutrients',
    category: 'sweets',
    imageUrl: 'https://images.unsplash.com/photo-1585517281975-c3400ca199e7?w=400&q=80'
  },
  {
    _id: '8',
    name: 'Makhani Milk',
    gujarati: 'મખણી દૂધ',
    origin: 'Gujarat',
    story: 'A traditional Gujarati beverage made with milk, ghee, and nuts. It\'s often served at weddings and celebrations, believed to bring strength and wellness. The butter-rich drink is a symbol of Gujarati hospitality.',
    spiceLevel: 0,
    isVeg: true,
    restaurants: ['Milk Delight', 'Heritage Cafe', 'Traditional Tastes'],
    rating: 4.6,
    availability: 'Year-round',
    ingredients: ['Milk', 'Ghee', 'Almonds', 'Cashews', 'Cardamom', 'Saffron'],
    nutritionHint: 'Nutritious, energizing drink',
    category: 'beverage',
    imageUrl: 'https://images.unsplash.com/photo-1585238341710-4913b1ea13d5?w=400&q=80'
  }
];
