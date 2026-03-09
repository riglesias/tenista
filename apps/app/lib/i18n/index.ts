import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resources, defaultLanguage, Language, languages } from './resources';

const LANGUAGE_STORAGE_KEY = '@tenista_language';

// Get the device's locale and extract the language code
// expo-localization requires native modules, so we handle it gracefully
function getDeviceLanguage(): Language {
  try {
    // Dynamically import expo-localization to avoid crashes if native module isn't available
    const Localization = require('expo-localization');
    const locales = Localization.getLocales?.();
    if (locales && locales.length > 0) {
      const deviceLang = locales[0].languageCode;
      // Check if device language is supported
      if (deviceLang && deviceLang in resources) {
        return deviceLang as Language;
      }
    }
  } catch (error) {
    // expo-localization not available (e.g., in Expo Go or web)
    console.warn('expo-localization not available, using default language:', error);
  }
  return defaultLanguage;
}

// Language detector for AsyncStorage
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // First, try to get saved language preference
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && savedLanguage in resources) {
        callback(savedLanguage);
        return;
      }

      // Fall back to device language
      const deviceLanguage = getDeviceLanguage();
      callback(deviceLanguage);
    } catch (error) {
      console.warn('Error detecting language:', error);
      callback(defaultLanguage);
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.warn('Error caching language:', error);
    }
  },
};

// Initialize i18next
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: defaultLanguage,
    defaultNS: 'common',
    ns: ['common', 'auth', 'settings', 'onboarding', 'community', 'league', 'match', 'profile', 'errors'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for React Native compatibility
    },
    compatibilityJSON: 'v4', // For proper pluralization support
  });

// Helper function to change language
export async function changeLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

// Helper function to get current language
export function getCurrentLanguage(): Language {
  return (i18n.language as Language) || defaultLanguage;
}

// Helper function to check if language is ready
export function isLanguageReady(): boolean {
  return i18n.isInitialized;
}

export { resources, languages, defaultLanguage, Language, LANGUAGE_STORAGE_KEY };
export default i18n;
