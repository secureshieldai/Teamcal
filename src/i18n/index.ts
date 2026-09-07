/**
 * i18n Configuration
 * Multi-language support using i18next and react-i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import { secureStorage } from '../services/auth/secureStorage';

// Import locale files
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import it from './locales/it.json';
import ru from './locales/ru.json';
import tr from './locales/tr.json';
import nl from './locales/nl.json';
import id from './locales/id.json';

// Storage key for selected language
const LANGUAGE_KEY = 'app_language';

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    pt: { translation: pt },
    zh: { translation: zh },
    ar: { translation: ar },
    hi: { translation: hi },
    ja: { translation: ja },
    ko: { translation: ko },
    it: { translation: it },
    ru: { translation: ru },
    tr: { translation: tr },
    nl: { translation: nl },
    id: { translation: id },
  },
  fallbackLng: 'en',
  lng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v3',
});

/**
 * Get saved language from storage
 */
export async function getSavedLanguage(): Promise<string | null> {
  try {
    return await secureStorage.getSecureItem(LANGUAGE_KEY);
  } catch (error) {
    console.error('[i18n] Error getting saved language:', error);
    return null;
  }
}

/**
 * Save language to storage
 */
export async function saveLanguage(languageCode: string): Promise<void> {
  try {
    await secureStorage.setSecureItem(LANGUAGE_KEY, languageCode);
  } catch (error) {
    console.error('[i18n] Error saving language:', error);
    throw error;
  }
}

/**
 * Change app language
 */
export async function changeLanguage(languageCode: string): Promise<void> {
  try {
    // Change i18next language
    await i18n.changeLanguage(languageCode);
    
    // Save to storage
    await saveLanguage(languageCode);
    
    // Handle RTL for Arabic
    const isRTL = languageCode === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      // Note: Requires app restart to fully apply RTL changes
      console.warn('[i18n] RTL setting changed. Some UI elements may require app restart.');
    }
  } catch (error) {
    console.error('[i18n] Error changing language:', error);
    throw error;
  }
}

/**
 * Initialize language from storage
 */
export async function initializeLanguage(): Promise<string> {
  try {
    const savedLanguage = await getSavedLanguage();
    
    if (savedLanguage) {
      await i18n.changeLanguage(savedLanguage);
      
      // Set RTL for Arabic
      const isRTL = savedLanguage === 'ar';
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
      }
      
      return savedLanguage;
    }
    
    return 'en'; // Default language
  } catch (error) {
    console.error('[i18n] Error initializing language:', error);
    return 'en';
  }
}

/**
 * Supported languages configuration
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
] as const;

export default i18n;
