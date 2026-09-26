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

/** Returns a function that names a variant's origin, e.g. "Sweden, Hälsingland". */
export function useOriginText(): (variant: TuneVariant) => string {
  const { t, i18n } = useTranslation();
  return ({ origin: { country, region } }) => {
    const countryLabel = countryName(country, i18n.resolvedLanguage);
    return region === undefined
      ? countryLabel
      : t('tune.origin', { country: countryLabel, region });
  };
}

export function TuneMeta({ variant }: { variant: TuneVariant }) {
  const { t } = useTranslation();
  const originText = useOriginText();

  const items = [
    t(`tuneType.${variant.type}`),
    originText(variant),
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
