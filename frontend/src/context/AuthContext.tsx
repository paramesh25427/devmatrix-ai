import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/contract';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (credential: string, role?: string) => Promise<void>;
  loginDemo: (role?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('devmatrix_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const token = localStorage.getItem('devmatrix_token');
      if (token) {
        try {
          const profile = await apiClient.getMe();
          setUser(profile);
          localStorage.setItem('devmatrix_user', JSON.stringify(profile));
        } catch {
          // Token invalid or expired
          apiClient.logout();
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    verifyAuth();
  }, []);

  const loginWithGoogle = async (credential: string, role: string = 'Delivery Manager') => {
    setIsLoading(true);
    try {
      const res = await apiClient.loginWithGoogle(credential, role);
      setUser(res.user);
      localStorage.setItem('devmatrix_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async (role: string = 'Delivery Manager') => {
    setIsLoading(true);
    try {
      const res = await apiClient.demoLogin('manager@devmatrix.ai', 'Alex Morgan', role);
      setUser(res.user);
      localStorage.setItem('devmatrix_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
