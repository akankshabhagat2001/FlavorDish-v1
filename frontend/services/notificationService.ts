interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string; // For grouping
  badge?: string;
  sound?: string;
  actions?: Array<{ action: string; title: string }>;
  data?: Record<string, any>;
}

interface SubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private hasPermission = false;

  async initialize(): Promise<void> {
    try {
      // Check browser support
      if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        console.warn('Notifications not supported in this browser');
        return;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register(
        new URL('../serviceWorker.ts', import.meta.url),
        { scope: '/' }
      );

      console.log('Service Worker registered');

      // Request notification permission
      this.requestPermission();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (Notification.permission === 'granted') {
        this.hasPermission = true;
        return true;
      }

      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        this.hasPermission = permission === 'granted';
        return this.hasPermission;
      }

      return false;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async sendNotification(options: NotificationOptions): Promise<void> {
    try {
      if (!this.hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) return;
      }

      if (!this.registration) {
        console.warn('Service Worker not registered');
        return;
      }

      await this.registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/notification-icon.png',
        badge: options.badge || '/notification-badge.png',
        tag: options.tag || 'flavorfinder-notification',
        requireInteraction: true,
        actions: options.actions || [],
        data: options.data || {},
        ...options,
      });

      // Play notification sound if provided
      if (options.sound) {
        this.playSound(options.sound);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Specific notification types
  async notifyOrderConfirmed(orderId: string, eta: number): Promise<void> {
    await this.sendNotification({
      title: 'Order Confirmed! 🎉',
      body: `Your order is confirmed! Estimated delivery in ${eta} minutes.`,
      tag: `order-${orderId}`,
      icon: '/icons/order-confirmed.png',
      data: { orderId, type: 'order_confirmed' },
    });
  }

  async notifyOrderPreparing(restaurantName: string, orderId: string): Promise<void> {
    await this.sendNotification({
      title: 'Order Preparing 👨‍🍳',
      body: `${restaurantName} is preparing your food!`,
      tag: `order-${orderId}`,
      data: { orderId, type: 'order_preparing' },
    });
  }

  async notifyOrderReady(orderId: string): Promise<void> {
    await this.sendNotification({
      title: 'Order Ready! 📦',
      body: 'Your order is ready for pickup!',
      tag: `order-${orderId}`,
      data: { orderId, type: 'order_ready' },
    });
  }

  async notifyOrderDispatched(driverName: string, orderId: string): Promise<void> {
    await this.sendNotification({
      title: 'Order Dispatched 🚗',
      body: `${driverName} is on the way to deliver your order!`,
      tag: `order-${orderId}`,
      data: { orderId, type: 'order_dispatched', driverName },
    });
  }

  async notifyOrderNearby(orderId: string): Promise<void> {
    await this.sendNotification({
      title: 'Almost Here! 📍',
      body: 'Your delivery partner is just 2 minutes away!',
      tag: `order-${orderId}`,
      data: { orderId, type: 'order_nearby' },
      sound: '/sounds/nearby-alert.mp3',
    });
  }

  async notifyOrderDelivered(orderId: string): Promise<void> {
    await this.sendNotification({
      title: 'Order Delivered! ✅',
      body: 'Please rate your experience and leave a review.',
      tag: `order-${orderId}`,
      data: { orderId, type: 'order_delivered' },
      actions: [{ action: 'rate', title: 'Rate Order' }],
    });
  }

  async notifyChatMessage(senderName: string, orderId: string, message: string): Promise<void> {
    await this.sendNotification({
      title: `Message from ${senderName} 💬`,
      body: message.substring(0, 100),
      tag: `chat-${orderId}`,
      data: { orderId, type: 'chat_message', senderName },
    });
  }

  async notifyPromo(title: string, description: string, code?: string): Promise<void> {
    await this.sendNotification({
      title: `${title} 🎉`,
      body: `${description}${code ? ` Code: ${code}` : ''}`,
      tag: 'promo', // Don't group promos
      data: { type: 'promo', code },
    });
  }

  private playSound(soundPath: string): void {
    try {
      const audio = new Audio(soundPath);
      audio.play().catch(err => console.warn('Could not play notification sound:', err));
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  async getSubscription(): Promise<SubscriptionData | null> {
    try {
      if (!this.registration) return null;
      const sub = await this.registration.pushManager.getSubscription();
      if (sub && sub.toJSON) {
        const json = sub.toJSON() as any;
        return {
          endpoint: json.endpoint || '',
          keys: json.keys || { p256dh: '', auth: '' }
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  async subscribeForPushNotifications(): Promise<SubscriptionData | null> {
    try {
      if (!this.registration) return null;

      const vapidKey = process.env.VITE_VAPID_PUBLIC_KEY || '';
      const uint8Array = this.urlBase64ToUint8Array(vapidKey);

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: uint8Array.buffer as ArrayBuffer,
      });

      const json = subscription.toJSON() as any;
      return {
        endpoint: json.endpoint || '',
        keys: json.keys || { p256dh: '', auth: '' }
      };
    } catch (error) {
      console.error('Subscription failed:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array(rawData.split('').map(char => char.charCodeAt(0)));
  }

  async closeAllNotifications(): Promise<void> {
    try {
      if (!this.registration) return;
      const notifications = await this.registration.getNotifications();
      notifications.forEach(notification => notification.close());
    } catch (error) {
      console.error('Error closing notifications:', error);
    }
  }

  isPermissionGranted(): boolean {
    return Notification.permission === 'granted';
  }

  isPermissionDenied(): boolean {
    return Notification.permission === 'denied';
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'Notification' in window;
  }
}

export const notificationService = new NotificationService();
