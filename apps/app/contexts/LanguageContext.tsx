'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { changeLanguage, getCurrentLanguage, Language, languages, defaultLanguage } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  isLoading: boolean;
  languages: typeof languages;
  t: ReturnType<typeof useTranslation>['t'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n: i18nInstance } = useTranslation();
  const [language, setLanguageState] = useState<Language>(getCurrentLanguage());
  const [isLoading, setIsLoading] = useState(!i18n.isInitialized);

  // Update language state when i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguageState(lng as Language);
    };

    i18nInstance.on('languageChanged', handleLanguageChange);

    // Set initial loading state
    if (i18n.isInitialized) {
      setIsLoading(false);
      setLanguageState(getCurrentLanguage());
    } else {
      const handleInitialized = () => {
        setIsLoading(false);
        setLanguageState(getCurrentLanguage());
      };
      i18nInstance.on('initialized', handleInitialized);

      return () => {
        i18nInstance.off('initialized', handleInitialized);
        i18nInstance.off('languageChanged', handleLanguageChange);
      };
    }

    return () => {
      i18nInstance.off('languageChanged', handleLanguageChange);
    };
  }, [i18nInstance]);

  const setLanguage = useCallback(async (newLanguage: Language) => {
    setIsLoading(true);
    try {
      await changeLanguage(newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isLoading,
        languages,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Re-export for convenience
export { languages, defaultLanguage, Language };
