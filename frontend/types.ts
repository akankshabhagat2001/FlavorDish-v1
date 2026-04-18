
export type RoleType = "customer" | "restaurant" | "delivery" | "admin";
export type UserType = RoleType;
export type OrderStatusType = "pending" | "placed" | "confirmed" | "preparing" | "ready" | "picked_up" | "out_for_delivery" | "dispatched" | "in-transit" | "near" | "delivered" | "cancelled";
export type PaymentStatusType = "pending" | "paid" | "failed";
export type DeliveryStatusType = "assigned" | "picked" | "delivered";
export type BookingStatusType = "confirmed" | "cancelled" | "pending" | "paid";

export type SortOption = 'relevance' | 'rating' | 'delivery_time' | 'cost_low' | 'cost_high';

export enum Category {
  Delivery = "delivery",
  DiningOut = "dining_out",
  Nightlife = "nightlife",
  StreetFood = "street_food"
}

export interface UserAddress {
  street: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: RoleType;
  createdAt: number;
  password?: string;
  phone?: string;
  address?: UserAddress[];
  savedAddresses?: {
    id: string;
    label: string;
    details: string;
    isDefault?: boolean;
  }[];
  walletBalance?: number;
  restaurantId?: string;
}

export interface LatLng {
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
}

export interface Restaurant {
  _id: string;
  ownerId: string;
  name: string;
  description: string;
  cuisine: string[];
  location: {
    address: string;
    area?: string;
    city?: string;
    zipCode?: string;
    latitude: number;
    longitude: number;
    lat?: number;
    lng?: number;
    googleMapsUrl?: string;
  };
  rating: number;
  reviewCount?: number;
  discount?: number;
  isOpen: boolean;
  imageUrl: string;
  thumbnailUrl?: string;
  image?: string;
  deliveryTime: string;
  costForTwo: number;
  createdAt: number;
  walletBalance?: number;
  menu?: MenuItem[];
  signatureDish?: {
    name: string;
    imageUrl: string;
  };
  contactPhone?: string;
  phone?: string;
  openingHours?: string;
  tablePrice?: number;
  chairPrice?: number;
  type?: string;
  dine_in?: boolean;
  delivery?: boolean;
}

export interface MenuItem {
  _id: string;
  restaurantId: string;
  itemName: string;
  name?: string;
  sku?: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  available?: boolean;
  image: string;
  originalPrice?: number;
  discount?: number;
  discountedPrice?: number;
  isVeg?: boolean;
  prepTime?: string;
  preparationTime?: number;
  nutritionalInfo?: string;
  tags?: string[];
  isPopular?: boolean;
  ratings?: number;
  reviews?: number;
  updatedAt?: number;
  createdAt?: Date;
}

export interface Order {
  _id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  restaurant?: Restaurant;
  items: any[];
  totalAmount: number;
  subtotal?: number;
  deliveryFee?: number;
  tax?: number;
  orderStatus: OrderStatusType;
  status?: OrderStatusType;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  ratings?: {
    food?: number;
    delivery?: number;
    restaurant?: number;
  };
  deliveryAddress?: string;
  review?: string;
  createdAt: number;
  paymentStatus?: PaymentStatusType;
  paymentMethod?: string;
  deliveryPartner?: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
  };
  deliveryPartnerStatus?: 'pending' | 'accepted' | 'rejected';
}

export interface LocalityHighlight {
  name: string;
  type: string;
  website?: string;
}

export interface Locality {
  name: string;
  places: number;
  highlights?: LocalityHighlight[];
}

export interface CollectionPlace {
  name: string;
  website?: string;
}

export interface Collection {
  _id: string;
  title: string;
  places: number;
  imageUrl: string;
  topPlaces?: CollectionPlace[];
}

export interface RestaurantSuggestion {
  _id: string;
  name: string;
  cuisine: string[];
  description: string;
  location: string;
  contactPerson: string;
  phone: string;
  email: string;
  website?: string;
  suggestedBy: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface City {
  _id: string;
  name: string;
  coords: LatLng;
  imageUrl: string;
  aliases?: string[];
}

export interface FoodInspirationItem {
  id: string;
  title: string;
  imageUrl: string;
}

export interface TopBrand {
  id: string;
  name: string;
  time: string;
  imageUrl: string;
}

export interface Payment {
  _id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
  createdAt: number;
}

export interface Delivery {
  _id: string;
  orderId: string;
  partnerId: string;
  status: DeliveryStatusType;
  updatedAt: number;
}

export interface Review {
  _id: string;
  userId: string;
  restaurantId: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface TableBooking {
  _id: string;
  userId: string;
  restaurantId: string | { _id: string; name: string; images?: string[]; [key: string]: any };
  restaurantName?: string;
  guests?: number;
  numberOfGuests?: number;
  bookingDate: string;
  bookingTime?: string;
  timeSlot?: { startTime: string; endTime: string };
  specialRequests?: string;
  bookingStatus?: BookingStatusType;
  status?: string;
  totalAmount?: number;
  estimatedBill?: number;
  reservationFee?: number;
  paymentStatus?: string;
  createdAt: number;
}

export type Booking = TableBooking;

export interface DiscoveryResult {
  text: string;
  groundingChunks: any[];
}

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
  web?: {
    uri: string;
    title: string;
  };
}

export type AppViewState =
  | 'home'
  | 'city_listing'
  | 'restaurant'
  | 'history'
  | 'login'
  | 'register'
  | 'profile'
  | 'admin'
  | 'partner'
  | 'delivery'
  | 'presentation'
  | 'investor'
  | 'customer-dashboard'
  | 'explore_ahmedabad'
  | 'restaurant_detail'
  | 'order_complete'
  | 'book_table'
  | 'about'
  | 'team'
  | 'blog'
  | 'careers'
  | 'report_fraud'
  | 'contact'
  | 'feeding_india'
  | 'hyperpure'
  | 'flavorland'
  | 'weather'
  | 'apps'
  | 'enterprise'
  | 'privacy'
  | 'terms'
  | 'sitemap'
  | 'blinkit'
  | 'test_routing';

export interface LocalFood {
  _id: string;
  id?: string;
  name: string;
  gujarati: string;
  origin: string;
  story: string;
  spiceLevel: number;
  isVeg: boolean;
  restaurants: string[];
  rating: number;
  availability: string;
  ingredients: string[];
  nutritionHint: string;
  category: 'sweets' | 'main' | 'street' | 'beverage' | 'snack' | string;
  imageUrl?: string;
}
