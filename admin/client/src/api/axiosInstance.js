import axios from 'axios';
import { isTokenExpired, clearAdminSession } from '../utils/token';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
});

api.interceptors.request.use((config) => {
  const isLoginRequest = config.url?.includes('/api/admin/login');
  const token = localStorage.getItem('adminToken');

  if (token && !isLoginRequest) {
    if (isTokenExpired(token)) {
      clearAdminSession();
      window.dispatchEvent(
        new CustomEvent('admin:session-expired', {
          detail: { message: 'Session expired. Please log in again.' },
        })
      );
      const controller = new AbortController();
      controller.abort('Session expired');
      config.signal = controller.signal;
      return config;
    }
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error) || error.message === 'Session expired') {
      return Promise.reject(error);
    }

    const isLoginRequest = error.config?.url?.includes('/api/admin/login');
    const isIncorrectCurrentPassword =
      error.config?.url?.includes('/api/admin/change-password') &&
      error.response?.data?.message === 'Current password is incorrect';

    if (error.response?.status === 401 && !isLoginRequest && !isIncorrectCurrentPassword) {
      clearAdminSession();
      const message = error.response?.data?.message || 'Session expired. Please log in again.';
      window.dispatchEvent(
        new CustomEvent('admin:session-expired', {
          detail: { message },
        })
      );
    }

    return Promise.reject(error);
  }
);

export default api;

