/**
 * App Constants
 * Centralized application constants
 */

export const APP_CONFIG = {
  NAME: 'TeamCal',
  VERSION: '1.0.0',
  BUNDLE_ID: 'com.teamcal.app',
  
  // Deep Linking
  DEEP_LINK_SCHEME: 'teamcal://',
  
  // Cache Keys
  CACHE_KEYS: {
    AUTH_TOKEN: '@teamcal:auth_token',
    USER: '@teamcal:user',
    ONBOARDING: '@teamcal:onboarding_complete',
    THEME: '@teamcal:theme',
  },
  
  // API
  API: {
    TIMEOUT: 15000,
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000,
  },
  
  // React Query
  QUERY: {
    STALE_TIME: 5 * 60 * 1000, // 5 minutes
    CACHE_TIME: 10 * 60 * 1000, // 10 minutes
    RETRY: 2,
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  
  // Timers
  POLLING_INTERVAL: 30_000, // 30 seconds (reduced from 15s)
  BACKGROUND_REFETCH_INTERVAL: 60_000, // 1 minute
  
  // Validation
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  
  // File Upload
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Social
  MAX_POST_LENGTH: 5000,
  MAX_COMMENT_LENGTH: 1000,
  MAX_BIO_LENGTH: 500,
  
  // Health Tracking
  HEALTH: {
    DEFAULT_WATER_GOAL: 2000, // ml
    DEFAULT_STEPS_GOAL: 10000,
    DEFAULT_CALORIE_GOAL: 2000,
    DEFAULT_FAST_HOURS: 16,
    DEFAULT_SLEEP_HOURS: 8,
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_CODES = {
  // Auth Errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  
  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Generic
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;
