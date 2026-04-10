import { io } from 'socket.io-client';
import { SOCKET_URL } from './runtimeConfig';

const socket = io(SOCKET_URL);

export const socketService = {
  connect: () => {
    socket.connect();
  },

  disconnect: () => {
    socket.disconnect();
  },

  joinOrder: (orderId: string) => {
    socket.emit('join-order', orderId);
  },

  onOrderStatusUpdate: (callback: (order: any) => void) => {
    socket.on('order-status-update', callback);
  },

  onNewOrder: (callback: (order: any) => void) => {
    socket.on('new-order', callback);
  },

  onDeliveryAssigned: (callback: (order: any) => void) => {
    socket.on('delivery-assigned', callback);
  },

  offOrderStatusUpdate: () => {
    socket.off('order-status-update');
  },

  offNewOrder: () => {
    socket.off('new-order');
  },

  offDeliveryAssigned: () => {
    socket.off('delivery-assigned');
  }
};

export default socket;