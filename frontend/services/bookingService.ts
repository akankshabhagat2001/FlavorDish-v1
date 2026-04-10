import api from './authService';

export const bookingService = {
  createBooking: async (bookingData: {
    restaurantId: string;
    bookingDate: string;
    timeSlot: {
      startTime: string;
      endTime: string;
      duration: number;
    };
    numberOfGuests: number;
    specialRequests?: string;
    customerDetails: {
      name: string;
      phone: string;
      email?: string;
    };
    paymentType: 'prepaid' | 'postpaid';
  }) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  }
};
