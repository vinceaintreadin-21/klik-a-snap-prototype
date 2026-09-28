import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { clearTokens, getAccessToken, getRefreshToken, storeTokens } from '../utils/jwt';
import { useIdleLogout } from '../hooks/useIdleLogout';
import SessionTimeoutModal from '../components/shared/SessionTimeoutModal';

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: (onLogout?: () => void) => Promise<void>; 
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async (onLogout?: () => void) => {
    try {
      onLogout?.()
      const refresh = getRefreshToken();
      await api.post('auth/logout/', { refresh });
    } catch (err){
      console.error('Logout error', err)
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  // Signs the user out after a full hour without interaction. The countdown is
  // shown for the last 5 minutes so an active user is never surprised by it.
  const { warningOpen, secondsUntilLogout, staySignedIn, logOutNow } = useIdleLogout({
    onIdle: logout,
    enabled: !!user,
  });

  // 1. Initial Load: Check for token and fetch profile
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token && !user) {
        try {
          // Verify token and get fresh user data (is_staff, etc.)
          const res = await api.get('auth/me/');
          setUser(res.data);
        } catch (err) {
          // Only an actual auth rejection ends the session. A network blip or
          // a 5xx must not log the user out — the interceptor already handles
          // renewal, and bailing out here would be unrecoverable.
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 401 || status === 403) {
            console.error("Session expired or invalid token");
            await logout();
          } else {
            console.error("Could not verify session", err);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [logout]);

  // 2. Login Logic
  const login = async (credentials: any) => {
    const res = await api.post('/auth/login/', credentials);
    const { access, refresh } = res.data.tokens;

    storeTokens(access, refresh);

    const profile = await api.get('auth/me/');
    setUser(profile.data);
  };

  // 3. Register Logic (Now auto-logs in based on your refined backend)
  const register = async (data: any) => {
    const res = await api.post('auth/register/', data);

    if (res.data.tokens) {
      storeTokens(res.data.tokens.access, res.data.tokens.refresh);

      // Fetch full profile instead of using register response data
      const profile = await api.get('/auth/me/');
      setUser(profile.data);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
      {warningOpen && (
        <SessionTimeoutModal
          secondsRemaining={secondsUntilLogout}
          onStay={staySignedIn}
          onLogout={logOutNow}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};