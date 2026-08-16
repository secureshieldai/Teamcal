import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api/auth.service';
import { storage } from '../services/storage';
import type { User } from '../types/api';
import { getFirebaseIdToken, type SocialProvider } from '../services/firebaseAuth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, acceptedTerms: boolean, referralCode?: string) => Promise<string>;
  verifyEmail: (verificationToken: string, code: string) => Promise<void>;
  socialLogin: (provider: SocialProvider) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Rehydrate from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const [token, user] = await Promise.all([
          storage.getToken(),
          storage.getUser<User>(),
        ]);
        if (token && user) {
          setState({ user, token, isLoading: false, isAuthenticated: true });
          // Refresh user in background to get latest data
          authService.me().then((fresh) => {
            setState((prev) => ({ ...prev, user: fresh }));
          }).catch(() => { /* token might be expired — logout handled by interceptor */ });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await authService.login(email, password);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, acceptedTerms: boolean, referralCode?: string) => {
      const { verificationToken } = await authService.register(email, password, name, acceptedTerms, referralCode);
      return verificationToken;
    },
    []
  );

  const verifyEmail = useCallback(async (verificationToken: string, code: string) => {
    const { token, user } = await authService.verifyEmail(verificationToken, code);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  const socialLogin = useCallback(async (provider: SocialProvider) => {
    const idToken = await getFirebaseIdToken(provider);
    const { token, user } = await authService.firebase(idToken);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await authService.me();
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, verifyEmail, socialLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
