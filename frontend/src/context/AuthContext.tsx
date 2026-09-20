import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrUsername: string, pass: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('subsidy_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    setIsLoading(true);
    const storedToken = localStorage.getItem('subsidy_auth_token');
    if (storedToken) {
      try {
        const res = await api.getCurrentUser();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch (err) {
        logout();
      }
    } else {
      setUser(null);
      setToken(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (emailOrUsername: string, pass: string): Promise<User> => {
    const res = await api.login(emailOrUsername, pass);
    if (res.success && res.user) {
      localStorage.setItem('subsidy_auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (payload: any): Promise<User> => {
    const res = await api.register(payload);
    if (res.success && res.user) {
      localStorage.setItem('subsidy_auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('subsidy_auth_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.switchDemoRole(role);
      if (res.success && res.user) {
        localStorage.setItem('subsidy_auth_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
      }
      throw new Error('Failed to switch demo role');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getCurrentUser();
      if (res.success) {
        setUser(res.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
        refreshUser,
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
