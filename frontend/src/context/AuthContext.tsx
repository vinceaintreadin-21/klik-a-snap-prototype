import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

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

  // 1. Initial Load: Check for token and fetch profile
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token && !user) {
        try {
          // Verify token and get fresh user data (is_staff, etc.)
          const res = await api.get('/auth/me/');
          setUser(res.data);
        } catch (err) {
          console.error("Session expired or invalid token");
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // 2. Login Logic
  const login = async (credentials: any) => {
    const res = await api.post('/auth/login/', credentials);
    const { access, refresh } = res.data.tokens;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    const profile = await api.get('/auth/me/');
    setUser(profile.data);
  };

  // 3. Register Logic (Now auto-logs in based on your refined backend)
  const register = async (data: any) => {
    const res = await api.post('/auth/register/', data);

    if (res.data.tokens) {
      localStorage.setItem('access_token', res.data.tokens.access);
      localStorage.setItem('refresh_token', res.data.tokens.refresh);

      // Fetch full profile instead of using register response data
      const profile = await api.get('/auth/me/');
      setUser(profile.data);
    }
  };

  const logout = async (onLogout?: () => void) => {
    try {
      onLogout?.()
      const refresh = localStorage.getItem('refresh_token');
      await api.post('/auth/logout/', { refresh });
    } catch (err){
      console.error('Logout error', err)
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }

  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};