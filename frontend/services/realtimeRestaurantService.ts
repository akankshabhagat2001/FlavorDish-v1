// Real-time restaurant data service with automatic sync
import { io } from 'socket.io-client';
import api from './apiClient';

interface RealtimeRestaurantService {
  getRestaurants: (options?: any) => Promise<any[]>;
  subscribeToUpdates: (callback: (restaurants: any[]) => void) => void;
  unsubscribeFromUpdates: () => void;
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
}

class RealtimeRestaurantService implements RealtimeRestaurantService {
  private socket: any = null;
  private updateCallbacks: ((restaurants: any[]) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private autoRefreshInterval: any = null;
  private apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  constructor() {
    this.connect();
  }

  connect() {
    try {
      const socketUrl = this.apiBaseUrl.replace(':5000', '');
      this.socket = io(socketUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        transports: ['websocket', 'polling'],
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('✅ Real-time connection established');
        this.reconnectAttempts = 0;
        this.startAutoRefresh();
        this.socket.emit('subscribe_restaurants');
      });

      this.socket.on('restaurant_updated', (data: any) => {
        console.log('🔄 Restaurant updated in real-time:', data);
        this.notifySubscribers();
      });

      this.socket.on('restaurant_created', (data: any) => {
        console.log('✨ New restaurant created:', data);
        this.notifySubscribers();
      });

      this.socket.on('restaurant_deleted', (data: any) => {
        console.log('🗑️ Restaurant deleted:', data);
        this.notifySubscribers();
      });

      this.socket.on('restaurants_batch_update', (data: any) => {
        console.log('📊 Batch restaurant update:', data);
        this.notifySubscribers();
      });

      this.socket.on('disconnect', () => {
        console.log('⚠️ Real-time connection lost');
        this.stopAutoRefresh();
      });

      this.socket.on('connect_error', (error: any) => {
        console.warn('Connection error:', error);
        this.reconnectAttempts++;
      });
    } catch (error) {
      console.warn('Socket.IO initialization skipped:', error);
      this.startAutoRefresh();
    }
  }

  private startAutoRefresh() {
    // Auto-refresh every 30 seconds even with WebSocket connection
    if (!this.autoRefreshInterval) {
      this.autoRefreshInterval = setInterval(() => {
        this.notifySubscribers();
      }, 30000);
    }
  }

  private stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  private notifySubscribers() {
    // Notify all subscribers when data changes
    this.getRestaurants().then(restaurants => {
      this.updateCallbacks.forEach(callback => {
        try {
          callback(restaurants);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    });
  }

  async getRestaurants(options?: any): Promise<any[]> {
    try {
      const response = await api.get('/restaurants', { params: options || { limit: 100 } });
      const restaurants = response.data?.restaurants || response.data?.data || response.data || [];
      return Array.isArray(restaurants) ? restaurants : [];
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
  }

  subscribeToUpdates(callback: (restaurants: any[]) => void) {
    this.updateCallbacks.push(callback);
    // Call immediately with current data
    this.notifySubscribers();
  }

  unsubscribeFromUpdates() {
    this.updateCallbacks = [];
  }

  disconnect() {
    this.stopAutoRefresh();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const realtimeRestaurantService = new RealtimeRestaurantService();