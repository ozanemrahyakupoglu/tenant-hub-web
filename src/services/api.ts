import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // httpOnly cookie'lerin her istekle gönderilmesi için
});

// Request interceptor: her isteğe accessToken ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: 401 gelirse refresh token (httpOnly cookie) ile yenile
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // refreshToken httpOnly cookie olarak otomatik gönderilir
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        setAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        clearAccessToken();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export function setAccessToken(accessToken: string) {
  localStorage.setItem('accessToken', accessToken);
}

export function clearAccessToken() {
  localStorage.removeItem('accessToken');
}

export function getAccessToken() {
  return localStorage.getItem('accessToken');
}

export default api;
