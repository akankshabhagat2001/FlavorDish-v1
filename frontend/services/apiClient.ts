import axios, { AxiosError, AxiosResponse } from 'axios';
import { API_URL } from './runtimeConfig';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as any;
    
    // Handle 401 - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      return Promise.reject(error);
    }

    // Don't retry for client errors (4xx) except 408, 429
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      if (![408, 429].includes(error.response.status)) {
        return Promise.reject(error);
      }
    }

    // Setup retry
    config.retryCount = config.retryCount || 0;

    if (
      config.retryCount < DEFAULT_RETRY_CONFIG.maxRetries &&
      (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED' || error.response?.status === 503)
    ) {
      config.retryCount++;
      const delay = DEFAULT_RETRY_CONFIG.exponentialBackoff
        ? DEFAULT_RETRY_CONFIG.retryDelay * Math.pow(2, config.retryCount - 1)
        : DEFAULT_RETRY_CONFIG.retryDelay;

      console.warn(
        `API request failed (attempt ${config.retryCount}/${DEFAULT_RETRY_CONFIG.maxRetries}). Retrying in ${delay}ms...`,
        error.message
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    return Promise.reject(error);
  }
);

// Helper to make requests with custom retry config
export const apiWithRetry = async <T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  retryConfig: Partial<RetryConfig> = {}
): Promise<T> => {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: AxiosError | null = null;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error) {
      lastError = error as AxiosError;

      if (
        attempt < config.maxRetries &&
        (error instanceof AxiosError) &&
        (error.code === 'ECONNABORTED' || 
         error.code === 'ECONNREFUSED' || 
         error.response?.status === 503 ||
         error.response?.status === 429)
      ) {
        const delay = config.exponentialBackoff
          ? config.retryDelay * Math.pow(2, attempt - 1)
          : config.retryDelay;
        
        console.warn(
          `Request failed (attempt ${attempt}/${config.maxRetries}). Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }

  throw lastError;
};

export default api;
