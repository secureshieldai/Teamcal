/**
 * Environment Configuration
 * Centralized environment variable management
 */

export const ENV = {
  // API Configuration
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'https://teamcal-mr7g.onrender.com/api',
  API_TIMEOUT: 15000,
  
  // Firebase Configuration
  FIREBASE: {
    API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  },
  
  // Google OAuth
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  
  // Claude AI
  CLAUDE_API_KEY: process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '',
  
  // Feature Flags (for gradual rollout)
  FEATURES: {
    USE_NEW_AUTH: false, // Toggle new auth implementation
    USE_REACT_QUERY: false, // Toggle React Query
    ENABLE_BIOMETRIC: false, // Biometric authentication
  },
  
  // Environment
  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,
} as const;

// Validate required environment variables
export function validateEnv() {
  const required = [
    { key: 'API_URL', value: ENV.API_URL },
    { key: 'FIREBASE_API_KEY', value: ENV.FIREBASE.API_KEY },
  ];
  
  const missing = required.filter(({ value }) => !value);
  
  if (missing.length > 0 && ENV.IS_PROD) {
    console.error('Missing required environment variables:', missing.map(m => m.key));
    throw new Error('Missing required environment variables');
  }
}
