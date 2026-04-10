import { 
  User, Restaurant, MenuItem, Order, Payment, Delivery, Review, TableBooking,
  RoleType, Collection as CollectionType, City, BookingStatusType, RestaurantSuggestion, LocalFood 
} from '../types.ts';
import { INITIAL_USERS, INITIAL_RESTAURANTS, INITIAL_MENU_ITEMS, COLLECTIONS, INITIAL_CITIES, INITIAL_RESTAURANT_SUGGESTIONS, INITIAL_LOCAL_FOODS } from './data.ts';

type Listener = () => void;

class MongoCollection<T extends { _id: string }> {
  private key: string;
  private listeners: Set<Listener> = new Set();

  constructor(name: string) {
    this.key = `flavorfinder_mongo_${name}`;
  }

  private getAll(): T[] {
    const data = localStorage.getItem(this.key);
    if (!data) return [];

    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn(`Invalid localStorage data for ${this.key}, resetting.`, e);
      localStorage.removeItem(this.key);
      return [];
    }
  }

  private saveAll(data: T[]): void {
    localStorage.setItem(this.key, JSON.stringify(data));
    this.notify();
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  async find(query: Partial<T> = {}): Promise<T[]> {
    const all = this.getAll();
    return all.filter(item => {
      for (const key in query) {
        if (query[key] !== undefined && (item as any)[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async findOne(query: Partial<T>): Promise<T | null> {
    const results = await this.find(query);
    return results[0] || null;
  }

  async insertOne(item: Omit<T, '_id'>): Promise<T> {
    const all = this.getAll();
    const newItem = { ...item, _id: Math.random().toString(36).substr(2, 9) } as T;
    all.push(newItem);
    this.saveAll(all);
    return newItem;
  }

  async updateOne(id: string, updates: Partial<T>): Promise<T | null> {
    const all = this.getAll();
    const index = all.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    all[index] = { ...all[index], ...updates };
    this.saveAll(all);
    return all[index];
  }

  async deleteOne(id: string): Promise<boolean> {
    const all = this.getAll();
    const newAll = all.filter(item => item._id !== id);
    if (all.length === newAll.length) return false;
    this.saveAll(newAll);
    return true;
  }

  seed(items: T[]) {
    if (this.getAll().length === 0) {
      this.saveAll(items);
    }
  }
}

export class Database {
  public users = new MongoCollection<User>('users');
  public restaurants = new MongoCollection<Restaurant>('restaurants');
  public menuItems = new MongoCollection<MenuItem>('menuItems');
  public orders = new MongoCollection<Order>('orders');
  public payments = new MongoCollection<Payment>('payments');
  public deliveries = new MongoCollection<Delivery>('deliveries');
  public reviews = new MongoCollection<Review>('reviews');
  public bookings = new MongoCollection<TableBooking>('tableBookings');
  public cities = new MongoCollection<City>('cities');
  public collections = new MongoCollection<CollectionType>('collections');
  public restaurantSuggestions = new MongoCollection<RestaurantSuggestion>('restaurantSuggestions');
  public localFoods = new MongoCollection<LocalFood>('localFoods');
  
  private initialized = false;

  constructor() {
    this.init();
  }

  async init() {
    if (this.initialized) return;
    this.users.seed(INITIAL_USERS);
    this.restaurants.seed(INITIAL_RESTAURANTS);
    this.menuItems.seed(INITIAL_MENU_ITEMS);
    this.collections.seed(COLLECTIONS as any);
    this.cities.seed(INITIAL_CITIES);
    this.restaurantSuggestions.seed(INITIAL_RESTAURANT_SUGGESTIONS as any);
    this.localFoods.seed(INITIAL_LOCAL_FOODS);
    this.initialized = true;
  }

  async createOrder(data: any) {
    const res = await this.restaurants.findOne({ _id: data.restaurantId });
    return this.orders.insertOne({
      ...data,
      restaurantName: res?.name || 'Local Kitchen',
      orderStatus: 'placed',
      createdAt: Date.now()
    });
  }

  async createBooking(data: any) {
    const res = await this.restaurants.findOne({ _id: data.restaurantId });
    return this.bookings.insertOne({
      ...data,
      restaurantName: res?.name || 'Restaurant',
      bookingStatus: 'confirmed',
      createdAt: Date.now()
    });
  }

  async updateBookingStatus(bookingId: string, status: BookingStatusType) {
    return this.bookings.updateOne(bookingId, { bookingStatus: status });
  }

  async acceptOrder(orderId: string) {
    return this.orders.updateOne(orderId, { deliveryPartnerStatus: 'accepted' });
  }

  async rejectOrder(orderId: string) {
    return this.orders.updateOne(orderId, { deliveryPartnerStatus: 'rejected' });
  }

  async login(email: string, role: RoleType = 'customer'): Promise<User> {
    const user = await this.users.findOne({ email });
    if (user) {
      localStorage.setItem('flavorfinder_user', JSON.stringify(user));
      return user;
    }
    const newUser = await this.users.insertOne({
      name: email.split('@')[0],
      email,
      role,
      createdAt: Date.now(),
    });
    localStorage.setItem('flavorfinder_user', JSON.stringify(newUser));
    return newUser;
  }

  getCurrentUser(): User | null {
    const saved = localStorage.getItem('flavorfinder_user');
    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Invalid localStorage flavorfinder_user, resetting.', e);
      localStorage.removeItem('flavorfinder_user');
      return null;
    }
  }

  logout() {
    localStorage.removeItem('flavorfinder_user');
  }

  getCart() {
    const saved = localStorage.getItem('flavorfinder_cart');
    if (!saved) return [];

    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Invalid localStorage flavorfinder_cart, resetting.', e);
      localStorage.removeItem('flavorfinder_cart');
      return [];
    }
  }

  setCart(data: any) {
    localStorage.setItem('flavorfinder_cart', JSON.stringify(data));
  }
}

export const db = new Database();
