import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type en from '../locales/en.json';

export type LanguageCode = keyof typeof en.language.names;

interface LanguageSelectProps {
  languages: readonly LanguageCode[];
}

export function LanguageSelect({ languages }: LanguageSelectProps) {
  const { t, i18n } = useTranslation();
  const id = useId();

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-stone-700 dark:text-stone-300">
        {t('language.label')}
      </label>
      <select
        id={id}
        value={i18n.resolvedLanguage}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
        className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-900 focus:ring-2 focus:ring-amber-600 focus:outline-none dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
      >
        {languages.map((code) => (
          <option key={code} value={code} lang={code}>
            {t(`language.names.${code}`, { lng: code })}
          </option>
        ))}
      </select>
    </div>
  );
}
