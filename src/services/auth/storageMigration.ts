/**
 * Storage Migration Helper
 * Migrates old AsyncStorage keys to new SecureStore-compatible format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const OLD_KEYS = {
  AUTH_TOKEN: '@teamcal:auth_token',
  USER: '@teamcal:user',
  ONBOARDING: '@teamcal:onboarding_complete',
  THEME: '@teamcal:theme',
};

/**
 * Migrates data from old AsyncStorage keys to new format
 * Should be called once on app startup
 */
export async function migrateStorageKeys(): Promise<void> {
  try {
    console.log('[StorageMigration] Checking for old keys...');
    
    // Remove old keys that are no longer compatible with SecureStore
    const keysToRemove = Object.values(OLD_KEYS);
    
    for (const key of keysToRemove) {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        console.log(`[StorageMigration] Removing old key: ${key}`);
        await AsyncStorage.removeItem(key);
      }
    }
    
    console.log('[StorageMigration] Migration complete');
  } catch (error) {
    console.error('[StorageMigration] Error during migration:', error);
    // Don't throw - migration failure shouldn't block app startup
  }
}
