/**
 * API Configuration
 * Centralized API settings and helpers
 */

import { APP_CONFIG, HTTP_STATUS, ERROR_CODES } from './constants';
import { ENV } from './env';

export const API_CONFIG = {
  BASE_URL: ENV.API_URL,
  TIMEOUT: APP_CONFIG.API.TIMEOUT,
  
  HEADERS: {
    CONTENT_TYPE: 'application/json',
    ACCEPT: 'application/json',
  },
  
  RETRY: {
    COUNT: APP_CONFIG.API.RETRY_COUNT,
    DELAY: APP_CONFIG.API.RETRY_DELAY,
    STATUS_CODES: [HTTP_STATUS.TOO_MANY_REQUESTS, HTTP_STATUS.SERVICE_UNAVAILABLE],
  },
} as const;

// API Endpoints (organized by domain)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_EMAIL: '/auth/verification/verify',
    RESEND_VERIFICATION: '/auth/verification/resend',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    FIREBASE: '/auth/firebase',
    PASSWORD_RESET_REQUEST: '/auth/password-reset/request',
    PASSWORD_RESET_VERIFY: '/auth/password-reset/verify',
    PASSWORD_RESET_COMPLETE: '/auth/password-reset/complete',
    CHANGE_PASSWORD: '/auth/password',
    DELETE_ACCOUNT: '/auth/account',
  },
  
  USER: {
    PROFILE: '/user/profile',
    AVATAR: '/user/avatar',
    GOALS: '/user/goals',
    NOTIFICATIONS: '/user/notifications',
    LEVEL: '/user/level',
    SUMMARY: '/user/summary',
  },
  
  TRACKER: {
    BASE: '/tracker',
    ENTRY: (tracker: string) => `/tracker/${tracker}`,
    TODAY: (tracker: string) => `/tracker/${tracker}/today`,
    LAST_N: (tracker: string) => `/tracker/${tracker}/lastn`,
    STREAK: (tracker: string) => `/tracker/${tracker}/streak`,
    TODAY_SUMMARY: '/tracker/today-summary',
  },
  
  FASTING: {
    ACTIVE: '/fasting/active',
    START: '/fasting/start',
    STOP: '/fasting/stop',
    EXTEND: '/fasting/extend',
    HISTORY: '/fasting/history',
    ANALYTICS: '/fasting/analytics',
  },
  
  MEALS: {
    LOG: '/meals/log',
    TODAY: '/meals/today',
    SCAN_LOG: '/meals/scan-log',
  },
  
  CHALLENGES: {
    BASE: '/challenges',
    FEATURED: '/challenges/featured',
    DETAIL: (id: string) => `/challenges/${id}`,
    JOIN: (id: string) => `/challenges/${id}/join`,
    PROGRESS: (id: string) => `/challenges/${id}/progress`,
  },
  
  WORKOUTS: {
    BASE: '/workouts',
    TODAY: '/workouts/today',
    HISTORY: '/workouts/history',
    DETAIL: (id: string) => `/workouts/${id}`,
    LOG: '/workouts/log',
  },
  
  SOCIAL: {
    FEED: '/social/feed',
    USERS: '/social/users',
    LEADERBOARD: '/social/leaderboard',
    USER_PROFILE: (id: string) => `/social/users/${id}`,
  },
  
  POSTS: {
    BASE: '/posts',
    MINE: '/posts/mine',
    FEED: '/posts/feed',
    DETAIL: (id: string) => `/posts/${id}`,
    LIKE: (id: string) => `/posts/${id}/like`,
    COMMENTS: (id: string) => `/posts/${id}/comments`,
    IMAGE: '/posts/image',
  },
  
  GROUPS: {
    BASE: '/groups',
    DETAIL: (id: string) => `/groups/${id}`,
    JOIN: (id: string) => `/groups/${id}/join`,
    ACTIVITY: (id: string) => `/groups/${id}/activity`,
    STORIES: '/groups/stories',
  },
  
  MARKETPLACE: {
    PRODUCTS: '/marketplace/products',
    FEATURED: '/marketplace/products/featured',
    CATEGORIES: '/marketplace/categories',
    SEARCH: '/marketplace/search',
    DETAIL: (id: string) => `/marketplace/products/${id}`,
  },
  
  CHANNELS: {
    BASE: '/channels',
    DETAIL: (id: string) => `/channels/${id}`,
    POSTS: (id: string) => `/channels/${id}/posts`,
    SUBSCRIBE: (id: string) => `/channels/${id}/subscribe`,
    ANALYTICS: (id: string) => `/channels/${id}/analytics`,
  },
} as const;

// Helper to build query strings
export function buildQueryString(params: Record<string, unknown>): string {
  const filtered = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  
  return filtered ? `?${filtered}` : '';
}

// Helper to check if error is retryable
export function isRetryableError(statusCode?: number): boolean {
  if (!statusCode) return false;
  return API_CONFIG.RETRY.STATUS_CODES.includes(statusCode as 429 | 503);
}

// Map HTTP status to error code
export function getErrorCode(statusCode?: number): string {
  switch (statusCode) {
    case HTTP_STATUS.UNAUTHORIZED:
      return ERROR_CODES.AUTH_INVALID_TOKEN;
    case HTTP_STATUS.UNPROCESSABLE:
      return ERROR_CODES.VALIDATION_ERROR;
    default:
      return ERROR_CODES.UNKNOWN_ERROR;
  }
}
