/**
 * Secure Storage Service
 * Handles secure storage for sensitive data (tokens, credentials)
 * Uses expo-secure-store for encrypted storage on device
 * 
 * SECURITY: Never use AsyncStorage for sensitive data!
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { APP_CONFIG } from '../../app/config/constants';

// SecureStore is only available on native platforms
const IS_SECURE_AVAILABLE = Platform.OS !== 'web';

/**
 * Secure storage for sensitive data (tokens, credentials)
 * Falls back to AsyncStorage on web (for development only)
 */
class SecureStorageService {
  // ── Token Management ────────────────────────────────────────────────
  
  async getToken(): Promise<string | null> {
    try {
      if (IS_SECURE_AVAILABLE) {
        return await SecureStore.getItemAsync(APP_CONFIG.CACHE_KEYS.AUTH_TOKEN);
      }
      // Fallback for web (dev only - not secure!)
      return await AsyncStorage.getItem(APP_CONFIG.CACHE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('[SecureStorage] Error getting token:', error);
      return null;
    }
  }
  
  async setToken(token: string): Promise<void> {
    try {
      if (IS_SECURE_AVAILABLE) {
        await SecureStore.setItemAsync(APP_CONFIG.CACHE_KEYS.AUTH_TOKEN, token);
      } else {
        await AsyncStorage.setItem(APP_CONFIG.CACHE_KEYS.AUTH_TOKEN, token);
      }
    } catch (error) {
      console.error('[SecureStorage] Error setting token:', error);
      throw error;
    }
  }
  
  async removeToken(): Promise<void> {
    try {
      if (IS_SECURE_AVAILABLE) {
        await SecureStore.deleteItemAsync(APP_CONFIG.CACHE_KEYS.AUTH_TOKEN);
      } else {
        await AsyncStorage.removeItem(APP_CONFIG.CACHE_KEYS.AUTH_TOKEN);
      }
    } catch (error) {
      console.error('[SecureStorage] Error removing token:', error);
    }
  }
  
  // ── User Data (non-sensitive) ──────────────────────────────────────
  
  async getUser<T>(): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(APP_CONFIG.CACHE_KEYS.USER);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      console.error('[SecureStorage] Error getting user:', error);
      return null;
    }
  }
  
  async setUser(user: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(APP_CONFIG.CACHE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('[SecureStorage] Error setting user:', error);
      throw error;
    }
  }
  
  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(APP_CONFIG.CACHE_KEYS.USER);
    } catch (error) {
      console.error('[SecureStorage] Error removing user:', error);
    }
  }
  
  // ── Session Management ─────────────────────────────────────────────
  
  async setSession(token: string, user: unknown): Promise<void> {
    try {
      await Promise.all([
        this.setToken(token),
        this.setUser(user),
      ]);
    } catch (error) {
      console.error('[SecureStorage] Error setting session:', error);
      throw error;
    }
  }
  
  async clearSession(): Promise<void> {
    try {
      await Promise.all([
        this.removeToken(),
        this.removeUser(),
      ]);
    } catch (error) {
      console.error('[SecureStorage] Error clearing session:', error);
    }
  }
  
  // ── Generic Secure Storage ─────────────────────────────────────────
  
  async getSecureItem(key: string): Promise<string | null> {
    try {
      if (IS_SECURE_AVAILABLE) {
        return await SecureStore.getItemAsync(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`[SecureStorage] Error getting item ${key}:`, error);
      return null;
    }
  }
  
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (IS_SECURE_AVAILABLE) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`[SecureStorage] Error setting item ${key}:`, error);
      throw error;
    }
  }
  
  async removeSecureItem(key: string): Promise<void> {
    try {
      if (IS_SECURE_AVAILABLE) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`[SecureStorage] Error removing item ${key}:`, error);
    }
  }
}

export const secureStorage = new SecureStorageService();

// Backward compatibility (temporary during migration)
export const storage = {
  getToken: () => secureStorage.getToken(),
  setToken: (token: string) => secureStorage.setToken(token),
  removeToken: () => secureStorage.removeToken(),
  getUser: <T>() => secureStorage.getUser<T>(),
  setUser: (user: object) => secureStorage.setUser(user),
  removeUser: () => secureStorage.removeUser(),
  setSession: (token: string, user: object) => secureStorage.setSession(token, user),
  clear: () => secureStorage.clearSession(),
};
