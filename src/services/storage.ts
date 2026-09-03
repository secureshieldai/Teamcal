/**
 * Legacy Storage Service
 * DEPRECATED: Use src/services/auth/secureStorage.ts instead
 * This file is kept for backward compatibility only
 */

import { storage as secureStorage } from './auth/secureStorage';

// Re-export secure storage for backward compatibility
export const storage = secureStorage;
