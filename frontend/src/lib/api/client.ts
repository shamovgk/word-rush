// frontend/src/lib/api/client.ts
import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

console.log('API_URL:', API_URL); // Для отладки

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    console.log('Request to:', config.url);
    console.log('Token:', token ? 'Present' : 'Missing');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Исправление 7A
apiClient.interceptors.response.use(
  (response) => {
    console.log('Response from:', response.config.url, 'Status:', response.status);
    return response;
  },
  async (error) => {
    // Исправление 7A: Обработка Network Error
    if (!error.response) {
      console.error('Network Error - проверьте подключение к серверу');
      console.error('API URL:', API_URL);
      console.error('Error details:', error.message);
      
      const networkError = new Error(
        'Не удается подключиться к серверу. Проверьте:\n' +
        '1. Запущен ли backend (npm run start:dev)\n' +
        '2. Правильно ли настроен EXPO_PUBLIC_API_URL в .env\n' +
        '3. Доступен ли сервер по адресу: ' + API_URL
      );
      return Promise.reject(networkError);
    }
    
    console.error('Response error:', error.response?.status, error.response?.data);
    
    const originalRequest = error.config;

    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = useAuthStore.getState().refreshToken;
      
      if (!refreshToken) {
        console.log('No refresh token, logging out');
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        console.log('Attempting to refresh token');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        useAuthStore.getState().setTokens(accessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // Форматируем ошибку для удобства
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error ||
                        error.message ||
                        'Произошла неизвестная ошибка';
    
    const formattedError = new Error(errorMessage);
    return Promise.reject(formattedError);
  }
);

export default apiClient;
