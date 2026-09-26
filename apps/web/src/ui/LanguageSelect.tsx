import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type en from '../locales/en.json';
import { controlClass, labelClass } from './styles';

export type LanguageCode = keyof typeof en.language.names;

interface LanguageSelectProps {
  languages: readonly LanguageCode[];
}

export function LanguageSelect({ languages }: LanguageSelectProps) {
  const { t, i18n } = useTranslation();
  const id = useId();

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClass}>
        {t('language.label')}
      </label>
      <select
        id={id}
        value={i18n.resolvedLanguage}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
        className={controlClass}
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
