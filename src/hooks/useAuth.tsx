import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const localToken = localStorage.getItem('site_auth_token');
      const headers: Record<string, string> = {};
      if (localToken) {
        headers['Authorization'] = `Bearer ${localToken}`;
      }

      const response = await fetch('/api/auth/check', { headers });
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(!!data.authenticated);
        if (data.authenticated && data.token) {
          localStorage.setItem('site_auth_token', data.token);
        }
        return !!data.authenticated;
      }
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const login = async (password: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('site_auth_token', data.token);
        }
        setIsAuthenticated(true);
        return true;
      } else {
        const data = await response.json();
        setError(data.error || 'Incorrect password');
        return false;
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      localStorage.removeItem('site_auth_token');
      // Vercel serverless function expects standard HTTP POST
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        checkAuth,
      }}
    >
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
