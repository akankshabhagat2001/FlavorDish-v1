import io, { Socket } from 'socket.io-client';

const normalizeApiUrl = (url: string) => {
  let normalized = url.trim();
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  if (normalized.endsWith('/api')) {
    normalized = normalized.slice(0, -4);
  }
  return normalized;
};

const rawSocketUrl = (import.meta.env as any).VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = normalizeApiUrl(rawSocketUrl);

interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'customer' | 'restaurant';
  message: string;
  timestamp: number;
  read: boolean;
}

interface ChatRoom {
  roomId: string;
  orderId: string;
  restaurantId: string;
  customerId: string;
  messages: ChatMessage[];
}

class ChatService {
  private socket: Socket | null = null;
  private rooms: Map<string, ChatRoom> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(SOCKET_URL, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
          autoConnect: true,
        });

        this.socket.on('connect', () => {
          console.log('Chat socket connected:', this.socket?.id);
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.warn('Chat connection error:', error);
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(error);
          }
        });

        this.socket.on('disconnect', () => {
          console.log('Chat socket disconnected');
        });

        // Message received event
        this.socket.on('receive-message', (data: ChatMessage) => {
          const room = this.rooms.get(data.id);
          if (room) {
            room.messages.push(data);
          }
        });

        // Typing indicator
        this.socket.on('user-typing', (data: { roomId: string; user: string; isTyping: boolean }) => {
          // Emit typing event to UI
          window.dispatchEvent(
            new CustomEvent('chat:typing', {
              detail: data,
            })
          );
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  joinChatRoom(orderId: string, restaurantId: string, customerId: string): void {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }

    const roomId = `order-${orderId}`;
    this.socket.emit('join-chat', { roomId, orderId, restaurantId, customerId });

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        roomId,
        orderId,
        restaurantId,
        customerId,
        messages: [],
      });
    }
  }

  leaveChatRoom(roomId: string): void {
    if (!this.socket) return;
    this.socket.emit('leave-chat', { roomId });
    this.rooms.delete(roomId);
  }

  sendMessage(roomId: string, senderId: string, senderRole: 'customer' | 'restaurant', message: string): void {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }

    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      sender: senderId,
      senderRole,
      message,
      timestamp: Date.now(),
      read: false,
    };

    this.socket.emit('send-message', { roomId, ...chatMessage });

    // Add to local messages
    const room = this.rooms.get(roomId);
    if (room) {
      room.messages.push(chatMessage);
    }
  }

  sendTypingIndicator(roomId: string, userId: string, isTyping: boolean): void {
    if (!this.socket) return;
    this.socket.emit('typing', { roomId, userId, isTyping });
  }

  getMessages(roomId: string): ChatMessage[] {
    const room = this.rooms.get(roomId);
    return room ? room.messages : [];
  }

  markMessagesAsRead(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.messages.forEach(msg => {
        msg.read = true;
      });
    }
  }

  getUnreadCount(roomId: string): number {
    const room = this.rooms.get(roomId);
    if (!room) return 0;
    return room.messages.filter(msg => !msg.read).length;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const chatService = new ChatService();
export type { ChatMessage, ChatRoom };
