import axios from 'axios';
import { authStore } from '../features/auth/store/authStore';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = typeof process.env.VITE_API_BASE_URL !== 'undefined' 
  ? process.env.VITE_API_BASE_URL 
  : 'http://localhost:3000';

const axiosInstance: any = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add JWT and idempotency key
axiosInstance.interceptors.request.use(
  (config: any) => {
    const token = authStore.getState().token;
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add idempotency key for POST requests
    if (config.method?.toUpperCase() === 'POST') {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers['Idempotency-Key'] = uuidv4();
    }

    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response: any) => {
    return response;
  },
  (error: any) => {
    if (error.response?.status === 401) {
      // Clear auth store on 401 Unauthorized
      authStore.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
