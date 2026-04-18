import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-expired'));
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: any) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  verifyOtp: async (data: any) => {
    const res = await api.post('/auth/verify-email-otp', data);
    return res.data;
  },
  sendEmailOtp: async (data: { email: string }) => {
    const res = await api.post('/auth/send-email-otp', data);
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  },
  getToken: () => {
    return localStorage.getItem('token');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-expired'));
  },
  updateProfile: async (data: any) => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },
  adminLogin: async (credentials: any) => {
    const res = await api.post('/auth/admin-login', credentials);
    return res.data;
  },
  adminSignup: async (data: any) => {
    const res = await api.post('/auth/admin/signup', data);
    return res.data;
  },
  requestOtp: async (data: any) => {
    const res = await api.post('/auth/send-sms-otp', typeof data === 'string' ? { phone: data } : data);
    return res.data;
  },
  requestEmailOtp: async (data: any) => {
    const res = await api.post('/auth/send-email-otp', typeof data === 'string' ? { email: data } : data);
    return res.data;
  },
  verifyEmailOtp: async (email: string, otp: string) => {
    const res = await api.post('/auth/verify-email-otp', { email, otp });
    return res.data;
  },
  changePassword: async (data: any) => {
    const res = await api.post('/auth/change-password', data);
    return res.data;
  }
};

export default api;