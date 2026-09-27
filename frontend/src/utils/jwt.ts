export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// Refresh the access token this long before it actually expires, so in-flight
// requests never race the expiry. Keeps the session alive while the user is
// active instead of bouncing them on a wall-clock schedule.
export const REFRESH_THRESHOLD_SECONDS = 300;

interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

// Decode a JWT's payload without verifying the signature. Client-side only —
// this decides *when to renew*, never whether a token is authentic.
export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized)) as JwtPayload;
  } catch {
    return null;
  }
};

export const getTokenExpiry = (token: string | null): number | null => {
  if (!token) return null;
  return decodeJwt(token)?.exp ?? null;
};

export const isTokenExpired = (token: string | null, skewSeconds = 10): boolean => {
  const exp = getTokenExpiry(token);
  if (exp === null) return true; // unparseable token = treat as expired
  return exp < Date.now() / 1000 + skewSeconds;
};

export const isTokenExpiringSoon = (
  token: string | null,
  thresholdSeconds = REFRESH_THRESHOLD_SECONDS,
): boolean => {
  const exp = getTokenExpiry(token);
  if (exp === null) return true;
  return exp - Date.now() / 1000 < thresholdSeconds;
};

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const storeTokens = (access: string, refresh?: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Drops only the access token, keeping the refresh token so the next call can
// still renew. Used when a token is rejected but the session is still valid.
export const clearAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};
