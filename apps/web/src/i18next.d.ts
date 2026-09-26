import 'i18next';
import type en from './locales/en.json';

// Type-checks translation keys against en.json, the source of truth.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}
