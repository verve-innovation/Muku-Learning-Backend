import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [apiUrl, setApiUrl] = useState<string>(() => localStorage.getItem('muku_admin_api_url') || 'http://localhost:3000');

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

  const login = (newToken: string) => setToken(newToken);
  const logout = () => setToken(null);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, apiUrl, setApiUrl, login, logout }}>
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
