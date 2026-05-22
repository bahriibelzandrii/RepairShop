import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Якщо 401 і ще не пробували оновити токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        
        // Оновлюємо токен в сторі
        const { user } = useAuthStore.getState();
        useAuthStore.getState().setAuth(user, data.accessToken);
        
        // Повторюємо запит з новим токеном
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Якщо refresh token прострочений
        useAuthStore.getState().logout();
        useToastStore.getState().addToast('Сесія закінчилась. Увійдіть знову.', 'error');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    const message = error.response?.data?.message || 'Сталася помилка з`єднання';
    
    // Не показуємо тост для 401 (обробляється вище) і специфічних помилок валідації
    if (error.response?.status !== 401 && error.response?.status !== 400) {
      useToastStore.getState().addToast(message, 'error');
    }

    return Promise.reject(error);
  }
);

export default api;
