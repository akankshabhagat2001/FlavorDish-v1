
import { Restaurant, Order, UserType } from '../types.ts';
import { RESTAURANTS } from '../constants.tsx';

// Fix: Constraint should use _id to match global types
class Collection<T extends { _id: string }> {
  private key: string;

  constructor(name: string) {
    this.key = `flavorfinder_db_${name}`;
  }

  private getAll(): T[] {
    const data = localStorage.getItem(this.key);
    return data ? JSON.parse(data) : [];
  }

  private saveAll(data: T[]): void {
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  async find(query: Partial<T> = {}): Promise<T[]> {
    const all = this.getAll();
    return all.filter(item => {
      for (const key in query) {
        if ((item as any)[key] !== (query as any)[key]) return false;
      }
      return true;
    });
  }

  async findOne(query: Partial<T>): Promise<T | null> {
    const results = await this.find(query);
    return results[0] || null;
  }

  async create(item: Omit<T, '_id'>): Promise<T> {
    const all = this.getAll();
    // Fix: Generate _id instead of id
    const newItem = { ...item, _id: Math.random().toString(36).substr(2, 9) } as T;
    all.push(newItem);
    this.saveAll(all);
    return newItem;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const all = this.getAll();
    // Fix: Find by _id
    const index = all.findIndex(item => item._id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    this.saveAll(all);
    return all[index];
  }

  async delete(id: string): Promise<boolean> {
    const all = this.getAll();
    // Fix: Filter by _id
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

// Fix: Standardize User interface to use _id
interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserType;
  joined: string;
}

export const db = {
  restaurants: new Collection<Restaurant>('restaurants'),
  users: new Collection<User>('users'),
  orders: new Collection<Order>('orders'),
  cart: {
    get: () => JSON.parse(localStorage.getItem('flavorfinder_cart') || '[]'),
    set: (data: any) => localStorage.setItem('flavorfinder_cart', JSON.stringify(data)),
    clear: () => localStorage.removeItem('flavorfinder_cart')
  },

  async init() {
    this.restaurants.seed(RESTAURANTS as any);
    
    const users = await this.users.find();
    let guestUser;
    if (users.length === 0) {
      // Fix: Use valid lowercase RoleType values
      await this.users.create({
        name: 'John Admin',
        email: 'admin@flavor.com',
        role: 'admin',
        joined: new Date().toISOString()
      });
      guestUser = await this.users.create({
        name: 'Guest User',
        email: 'user@gmail.com',
        role: 'customer',
        joined: new Date().toISOString()
      });
    } else {
      guestUser = users.find(u => u.role === 'customer');
    }

    // Seed mock orders for tracking demo
    const existingOrders = await this.orders.find();
    if (existingOrders.length === 0 && guestUser) {
      const firstRes = RESTAURANTS[0];
      // Fix: Use correct interface property names (_id, totalAmount, orderStatus)
      await this.orders.create({
        userId: guestUser._id,
        restaurantId: firstRes._id,
        restaurantName: firstRes.name,
        items: [{ menuItemId: 'm1', name: 'Butter Chicken', qty: 1, price: 450 }],
        totalAmount: 490,
        orderStatus: 'out_for_delivery',
        paymentStatus: 'paid',
        createdAt: Date.now() - 1000 * 60 * 15
      } as any);
      await this.orders.create({
        userId: guestUser._id,
        restaurantId: RESTAURANTS[1]._id,
        restaurantName: RESTAURANTS[1].name,
        items: [{ menuItemId: 'm3', name: 'Sushi Platter', qty: 1, price: 1200 }],
        totalAmount: 1260,
        orderStatus: 'delivered',
        paymentStatus: 'paid',
        createdAt: Date.now() - 1000 * 60 * 60 * 24
      } as any);
    }
  },

  getCurrentUser() {
    const saved = localStorage.getItem('flavorfinder_user');
    return saved ? JSON.parse(saved) : null;
  },

  // Fix: Default role should be 'customer' to match RoleType
  async login(email: string, role: UserType = 'customer') {
    const user = await this.users.findOne({ email });
    if (user) {
      localStorage.setItem('flavorfinder_user', JSON.stringify(user));
      return user;
    }
    const newUser = await this.users.create({
      name: email.split('@')[0],
      email,
      role,
      joined: new Date().toISOString()
    });
    localStorage.setItem('flavorfinder_user', JSON.stringify(newUser));
    return newUser;
  },

  logout() {
    localStorage.removeItem('flavorfinder_user');
  }
};
