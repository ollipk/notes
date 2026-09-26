import { useTranslation } from 'react-i18next';
import type { TuneVariant } from '../domain/tune';

/** The country's name in the given language, or the code if the browser does not know it. */
export function countryName(code: string, language: string | undefined): string {
  try {
    return new Intl.DisplayNames(language, { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function TuneMeta({ variant }: { variant: TuneVariant }) {
  const { t, i18n } = useTranslation();
  const { country, region } = variant.origin;
  const countryLabel = countryName(country, i18n.resolvedLanguage);

  const items = [
    t(`tuneType.${variant.type}`),
    region === undefined ? countryLabel : t('tune.origin', { country: countryLabel, region }),
    ...(variant.composer === undefined ? [] : [t('tune.composer', { composer: variant.composer })]),
  ];

  return (
    <ul className="flex flex-wrap gap-x-2 text-stone-700 dark:text-stone-300 [&>li+li]:before:mr-2 [&>li+li]:before:content-['·']">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
