/**
 * App Providers Wrapper
 * Centralized provider configuration for the entire application
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../context/AuthContext';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';
import { validateEnv, ENV } from '../config/env';
import { APP_CONFIG } from '../config/constants';

// Validate environment variables on app start
if (ENV.IS_PROD) {
  validateEnv();
}

// Configure React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: APP_CONFIG.QUERY.STALE_TIME,
      cacheTime: APP_CONFIG.QUERY.CACHE_TIME,
      retry: APP_CONFIG.QUERY.RETRY,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface Props {
  children: React.ReactNode;
}

export function AppProviders({ children }: Props) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // TODO: Send to error tracking service (Sentry, etc.)
        if (ENV.IS_DEV) {
          console.error('[ErrorBoundary] Error caught:', error);
          console.error('[ErrorBoundary] Error info:', errorInfo);
        }
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
