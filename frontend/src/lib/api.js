import axios from 'axios';
import {
  getStoredToken,
  removeStoredToken,
  removeStoredUser,
} from '@/lib/token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeStoredToken();
      removeStoredUser();
    }

    return Promise.reject({
      status: error.response?.status ?? 500,
      message:
        error.response?.data?.message ||
        error.message ||
        'Terjadi kesalahan saat menghubungi server.',
      errors: error.response?.data?.errors ?? null,
      original: error,
    });
  }
);

export default api;
