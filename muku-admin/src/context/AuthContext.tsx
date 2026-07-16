import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  apiUrl: string;
  setApiUrl: (url: string) => void;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('muku_admin_jwt'));
  const [apiUrl, setApiUrl] = useState<string>(() => {
    const saved = localStorage.getItem('muku_admin_api_url');
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    if (saved && saved !== 'http://localhost:3000') {
      return saved;
    }
    if (currentOrigin.includes('localhost')) {
      return saved || 'http://localhost:3000';
    }
    return currentOrigin;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('muku_admin_jwt', token);
    } else {
      localStorage.removeItem('muku_admin_jwt');
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('muku_admin_api_url', apiUrl);
  }, [apiUrl]);

  const login = useCallback((newToken: string) => setToken(newToken), []);
  const logout = useCallback(() => setToken(null), []);

  const value = useMemo(() => ({
    token,
    isAuthenticated: !!token,
    apiUrl,
    setApiUrl,
    login,
    logout
  }), [token, apiUrl, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
