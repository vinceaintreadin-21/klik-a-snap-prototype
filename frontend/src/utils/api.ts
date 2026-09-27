import axios from 'axios';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpiringSoon,
  storeTokens,
} from './jwt';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Endpoints that must never carry an Authorization header — they are how we
// obtain the header in the first place.
const AUTH_ENDPOINTS = ['auth/login/', 'auth/register/', 'auth/logout/', 'auth/refresh/'];

const isAuthEndpoint = (url?: string): boolean =>
  !!url && AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));

// Called when the session is unrecoverable. Hard redirect so no in-flight
// component keeps rendering a shell the user can no longer authenticate.
const forceLogout = (): void => {
  clearTokens();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Shared across concurrent 401s so a burst of parallel requests triggers one
// refresh round-trip rather than a stampede that trips the auth throttle.
let refreshInFlight: Promise<string> | null = null;

export const refreshAccessToken = (): Promise<string> => {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.reject(new Error('No refresh token'));

  // baseURL already ends in /api, so this must be a single `auth/`.
  refreshInFlight = api
    .post('auth/refresh/', { refresh: refreshToken })
    .then((res) => {
      const access = res.data?.access as string | undefined;
      if (!access) throw new Error('Refresh response missing access token');
      storeTokens(access, res.data?.refresh);
      return access;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
};

// True only when the server rejected the *refresh* token itself, which is the
// one failure that genuinely ends the session. A 404/500/network error must
// not log the user out.
const isRefreshRejected = (error: unknown): boolean => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403;
};

api.interceptors.request.use(async (config) => {
  if (isAuthEndpoint(config.url)) return config;

  let token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Renew ahead of expiry while the user is active, so the session slides
  // forward instead of dying on a fixed wall-clock schedule. Skipped when
  // there's nothing to refresh with, which is the normal logged-out state.
  if (isTokenExpiringSoon(token) && getRefreshToken()) {
    try {
      token = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      if (isRefreshRejected(error)) forceLogout();
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    // A failure on the refresh call itself: the response interceptor's guard
    // below keeps us out of here, so this only rejects the caller.
    if (isAuthEndpoint(originalRequest?.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest?._retry) {
      forceLogout();
      return Promise.reject(error);
    }

    if (originalRequest) originalRequest._retry = true;

    try {
      const access = await refreshAccessToken();
      if (originalRequest) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${access}`;
      }
      return api(originalRequest!);
    } catch (refreshError) {
      if (isRefreshRejected(refreshError)) {
        forceLogout();
        return Promise.reject(refreshError);
      }
      // Transient server/network problem — keep the session, let this one
      // request fail. The next request will try to refresh again.
      return Promise.reject(error);
    }
  },
);

export default api;
