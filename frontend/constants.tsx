
import { Restaurant, Collection, FoodInspirationItem, TopBrand, MenuItem } from './types.ts';

// Exclusive Ahmedabad Sample Restaurants
export const RESTAURANTS: Restaurant[] = [
  {
    _id: '1',
    ownerId: 'u1',
    name: 'Agashiye - The House of MG',
    rating: 4.8,
    cuisine: ['Gujarati', 'Heritage', 'Veg'],
    costForTwo: 2200,
    location: {
      address: 'Lal Darwaja, Ahmedabad',
      latitude: 23.0248,
      longitude: 72.5815
    },
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BZ2FzaHllPC90ZXh0Pjwvc3ZnPg==',
    deliveryTime: '45 min',
    isOpen: true,
    description: 'Iconic terrace restaurant offering authentic Gujarati thali in a heritage setting.',
    createdAt: Date.now()
  },
  {
    _id: '2',
    ownerId: 'u1',
    name: 'Kuro - Renaissance',
    rating: 4.6,
    cuisine: ['Japanese', 'Asian', 'Fine Dining'],
    costForTwo: 3500,
    location: {
      address: 'Sola, Ahmedabad',
      latitude: 23.0645,
      longitude: 72.5284
    },
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5LdXJvPC90ZXh0Pjwvc3ZnPg==',
    deliveryTime: '50 min',
    isOpen: true,
    description: 'Premium Japanese cuisine and sushi lounge.',
    createdAt: Date.now()
  },
  {
    _id: '3',
    ownerId: 'u1',
    name: 'Caffe Piano - The Grand Bhagwati',
    rating: 4.4,
    cuisine: ['Italian', 'Continental', 'Veg'],
    costForTwo: 1800,
    location: {
      address: 'S.G. Highway, Ahmedabad',
      latitude: 23.0416,
      longitude: 72.5126
    },
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYWZmZSBQaWFubzwvdGV4dD48L3N2Zz4=',
    deliveryTime: '35 min',
    isOpen: true,
    description: 'A luxurious multi-cuisine dining experience with live music.',
    createdAt: Date.now()
  },
  {
    _id: '4',
    ownerId: 'u1',
    name: 'The Project Cafe',
    rating: 4.5,
    cuisine: ['Cafe', 'Desserts', 'Healthy Food'],
    costForTwo: 900,
    location: {
      address: 'Navrangpura, Ahmedabad',
      latitude: 23.0373,
      longitude: 72.5531
    },
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9qZWN0IENhZmU8L3RleHQ+PC9zdmc+',
    deliveryTime: '25 min',
    isOpen: true,
    description: 'A creative space where food meets art and design.',
    createdAt: Date.now()
  },
  {
    _id: '5',
    ownerId: 'u1',
    name: 'Manek Chowk Street Treats',
    rating: 4.7,
    cuisine: ['Street Food', 'Gujarati Snacks'],
    costForTwo: 300,
    location: {
      address: 'Manek Chowk, Old Ahmedabad',
      latitude: 23.0248,
      longitude: 72.5873,
      googleMapsUrl: 'https://goo.gl/maps/SjV8bRjVshConcPu9'
    },
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYW5layBDaG93azwvdGV4dD48L3N2Zz4=',
    deliveryTime: '20 min',
    isOpen: true,
    description: 'The heartbeat of Ahmedabad late-night food culture.',
    createdAt: Date.now()
  },
  {
    _id: '6',
    ownerId: 'u1',
    name: 'Rajwadu',
    rating: 4.4,
    cuisine: ['Gujarati', 'Rajasthani', 'Traditional'],
    costForTwo: 1800,
    location: {
      address: 'Vastrapur, Ahmedabad',
      latitude: 23.0417,
      longitude: 72.4964,
      googleMapsUrl: 'https://goo.gl/maps/5obJi73pRWNa7H4X8'
    },
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5SYWp3YXVkZTwvdGV4dD48L3N2Zz4=',
    deliveryTime: '40 min',
    isOpen: true,
    description: 'Heritage dining with courtyard ambience and authentic Gujarati thali.',
    createdAt: Date.now()
  },
  {
    _id: '7',
    ownerId: 'u1',
    name: 'Cafe Alfresco',
    rating: 4.3,
    cuisine: ['Cafe', 'Sandwiches', 'Desserts'],
    costForTwo: 700,
    location: {
      address: 'Navrangpura, Ahmedabad',
      latitude: 23.0351,
      longitude: 72.5452,
      googleMapsUrl: 'https://goo.gl/maps/boMwF84Z1VpD4u4V7'
    },
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYWZlIEFscmVzY288L3RleHQ+PC9zdmc+',
    deliveryTime: '30 min',
    isOpen: true,
    description: 'Cozy neighbourhood cafe with breakfast specials and strong coffee.',
    createdAt: Date.now()
  },
  {
    _id: '8',
    ownerId: 'u1',
    name: 'Barbeque Nation',
    rating: 4.5,
    cuisine: ['Barbecue', 'North Indian', 'Biryani'],
    costForTwo: 1400,
    location: {
      address: 'Thaltej Cross Road, S.G. Highway, Ahmedabad',
      latitude: 23.0350,
      longitude: 72.4890,
      googleMapsUrl: 'https://goo.gl/maps/X2oULzSK3XhHEFsy8'
    },
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CYXJiZXF1ZSBOYXRpb248L3RleHQ+PC9zdmc+',
    deliveryTime: '35 min',
    isOpen: true,
    description: 'Popular all-you-can-eat barbeque with late-night availability on SG Highway.',
    createdAt: Date.now()
  },
  {
    _id: '9',
    ownerId: 'u1',
    name: 'Flat Top - S.G. Highway',
    rating: 4.2,
    cuisine: ['Continental', 'Asian', 'Bar Food'],
    costForTwo: 900,
    location: {
      address: 'S.G. Highway, Ahmedabad',
      latitude: 23.0361,
      longitude: 72.5032,
      googleMapsUrl: 'https://goo.gl/maps/4KYBV7zsdZ7B8QLL8'
    },
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GbGF0IFRvcDwvdGV4dD48L3N2Zz4=',
    deliveryTime: '30 min',
    isOpen: false,
    description: 'Trendy all-day diner at SG Highway serving quick bites and desserts.',
    createdAt: Date.now()
  },
  {
    _id: '10',
    ownerId: 'u1',
    name: "Taniya's Kitchen",
    rating: 4.7,
    cuisine: ['Indian', 'Gujarati', 'Street Food'],
    costForTwo: 600,
    location: {
      address: 'Naranpura, Ahmedabad',
      latitude: 23.0486,
      longitude: 72.5584,
      googleMapsUrl: 'https://goo.gl/maps/8tDYghAZp5B2WdPYA'
    },
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI3NTAiIHZpZXdCb3g9IjAgMCAxMDAwIDc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5UYW5peSdzIEtpdGNoZW48L3RleHQ+PC9zdmc=',
    deliveryTime: '25 min',
    isOpen: true,
    description: 'Popular local late-night spot in Navrangpura with hearty desi snacks.',
    createdAt: Date.now()
  }
];

export const COLLECTIONS: Collection[] = [
  {
    _id: 'c1',
    title: 'Heritage Dining in Ahmedabad',
    places: 3,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5IZXJpdGFnZSBEaW5pbmc8L3RleHQ+PC9zdmc+',
    topPlaces: [
      { name: 'Agashiye - House of MG', website: 'https://goo.gl/maps/8sx8E7E7xCcXWn4M9'},
      { name: 'Rajwadu', website: 'https://goo.gl/maps/5obJi73pRWNa7H4X8'},
      { name: 'Gordhan Thal', website: 'https://goo.gl/maps/d6QA4ZfxqYvUu1yD8'}
    ]
  },
  {
    _id: 'c2',
    title: 'S.G. Highway Late Nights',
    places: 3,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5MYXRlIE5pZ2h0czwvdGV4dD48L3N2Zz4=',
    topPlaces: [
      { name: 'Barbeque Nation SG Highway', website: 'https://goo.gl/maps/X2oULzSK3XhHEFsy8'},
      { name: 'Flat Top SG Highway', website: 'https://goo.gl/maps/4KYBV7zsdZ7B8QLL8'},
      { name: 'Caffe Piano - Grand Bhagwati', website: 'https://goo.gl/maps/fk5kKR9r3s62'}
    ]
  },
  {
    _id: 'c3',
    title: 'Cafe Hopping in Navrangpura',
    places: 4,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYWZlIEhvcHBpbmc8L3RleHQ+PC9zdmc=',
    topPlaces: [
      { name: 'The Project Cafe', website: 'https://goo.gl/maps/2TtnUBsvu9F7zVte8'},
      { name: 'Cafe Alfresco', website: 'https://goo.gl/maps/boMwF84Z1VpD4u4V7'},
      { name: 'Turquoise Villa', website: 'https://goo.gl/maps/4w7UCqBHVU6G1sTt8'},
      { name: 'Taniya\'s Kitchen', website: 'https://goo.gl/maps/8tDYghAZp5B2WdPYA'}
    ]
  },
  {
    _id: 'c4',
    title: 'Explore Ahmedabad Foods',
    places: 5,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZlZjAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiNmNjY2MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FeHBsb3JlIEZvb2RzPC90ZXh0Pjwvc3ZnPg==',
    topPlaces: [
      { name: 'Agashiye - House of MG', website: 'https://goo.gl/maps/8sx8E7E7xCcXWn4M9'},
      { name: 'Barbeque Nation SG Highway', website: 'https://goo.gl/maps/X2oULzSK3XhHEFsy8'},
      { name: 'Cafe Alfresco', website: 'https://goo.gl/maps/boMwF84Z1VpD4u4V7'},
      { name: 'Manek Chowk Food Street', website: 'https://goo.gl/maps/SjV8bRjVshConcPu9'}
    ]
  },
  {
    _id: 'c5',
    title: 'Street Food & Laris',
    places: 6,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TdHJlZXQgRm9vZDwvdGV4dD48L3N2Zz4=',
    topPlaces: [
      { name: 'Manek Chowk Food Street', website: 'https://goo.gl/maps/SjV8bRjVshConcPu9'},
      { name: 'Taniya\'s Kitchen', website: 'https://goo.gl/maps/8tDYghAZp5B2WdPYA'},
      { name: 'Law Garden Khau Gali', website: ''}
    ]
  }
];

export const FOOD_INSPIRATION: FoodInspirationItem[] = [
  { id: 'i1', title: 'Gujarati Thali', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5UaGFsaTwvdGV4dD48L3N2Zz4=' },
  { id: 'i2', title: 'Khaman', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5LaGFtYW48L3RleHQ+PC9zdmc+' },
  { id: 'i3', title: 'Fafda Jalebi', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GYWZkYTwvdGV4dD48L3N2Zz4=' },
  { id: 'i4', title: 'Manek Chowk Special', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYW5layBDaG93azwvdGV4dD48L3N2Zz4=' },
];

export const TOP_BRANDS: TopBrand[] = [
  { id: 'b1', name: "Jasuben's Old Pizza", time: '22 min', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5KYXN1YmVuJ3MgUGl6emE8L3RleHQ+PC9zdmc+' },
  { id: 'b2', name: "Gwalia Sweets", time: '28 min', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Hd2FsaWEgU3dlZXRzPC90ZXh0Pjwvc3ZnPg==' },
  { id: 'b3', name: "Choice Snack Bar", time: '20 min', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DaG9pY2UgU25hY2s8L3RleHQ+PC9zdmc+' },
  { id: 'b4', name: "Ninis Kitchen", time: '25 min', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5OmluaXMgS2l0Y2hlbjwvdGV4dD48L3N2Zz4=' }
];
