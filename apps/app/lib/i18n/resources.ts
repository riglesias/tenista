import en from './locales/en';
import es from './locales/es';

export const resources = {
  en: {
    ...en,
  },
  es: {
    ...es,
  },
} as const;

export type Language = keyof typeof resources;

export const languages: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

export const defaultLanguage: Language = 'en';
