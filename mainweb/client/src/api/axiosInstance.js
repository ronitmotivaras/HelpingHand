import axios from 'axios';

const rawBaseUrl = process.env.REACT_APP_API_URL;
let baseURL = '/api';

if (rawBaseUrl) {
  const clean = rawBaseUrl.replace(/\/+$/, '');
  baseURL = clean.endsWith('/api') ? clean : `${clean}/api`;
}

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

