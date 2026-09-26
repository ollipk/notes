import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import fi from '../locales/fi.json';

/** English is the default, the fallback and the source of truth for all keys. */
export const resources = {
  en: { translation: en },
  fi: { translation: fi },
} as const;

export const supportedLanguages = Object.keys(resources) as (keyof typeof resources)[];

export const LANGUAGE_STORAGE_KEY = 'notes.language';

/** Keeps `<html lang>` and the document title in sync with the active language. */
function syncDocument(): void {
  document.documentElement.lang = i18n.resolvedLanguage ?? 'en';
  document.title = i18n.t('app.name');
}

i18n.on('languageChanged', syncDocument);

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export default i18n;
