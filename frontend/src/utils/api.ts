import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const isAuthEndpoint = config.url?.includes('auth/login/') || 
                         config.url?.includes('auth/register/') ||
                         config.url?.includes('auth/logout/') ||
                         config.url?.includes('auth/refresh/');
  
  if (!isAuthEndpoint) {  
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Stop immediately if it's an auth endpoint or already retried
    if (
      originalRequest._retry ||
      originalRequest.url?.includes('auth/login/') ||
      originalRequest.url?.includes('auth/register/') ||
      originalRequest.url?.includes('auth/logout/') ||
      originalRequest.url?.includes('auth/refresh/')  // <-- critical: breaks the loop
    ) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await api.post('api/auth/refresh/', { refresh: refreshToken });
        const { access } = res.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);  
  }
);

export default api;