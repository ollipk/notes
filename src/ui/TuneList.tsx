import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { Tune, TuneId } from '../domain/tune';
import { countryName } from './TuneMeta';

interface TuneListProps {
  tunes: readonly Tune[];
  tuneHref: (id: TuneId) => string;
}

export function TuneList({ tunes, tuneHref }: TuneListProps) {
  const { t, i18n } = useTranslation();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h2 id={headingId} className="sr-only">
        {t('catalog.heading')}
      </h2>
      <ul className="flex flex-col divide-y divide-stone-200 dark:divide-stone-800">
        {tunes.map(({ id, variants }) => {
          const [first] = variants;
          return (
            <li key={id}>
              <a
                href={tuneHref(id)}
                className="-mx-3 flex min-h-14 flex-col justify-center gap-0.5 rounded-lg px-3 py-2 hover:bg-stone-200/60 focus:ring-2 focus:ring-amber-600 focus:outline-none active:bg-stone-200 dark:hover:bg-stone-800 dark:active:bg-stone-800"
              >
                <span className="text-lg font-semibold text-amber-800 dark:text-amber-400">
                  {first.titles[0]}
                </span>
                <span className="text-stone-700 dark:text-stone-300">
                  {t('catalog.summary', {
                    type: t(`tuneType.${first.type}`),
                    country: countryName(first.origin.country, i18n.resolvedLanguage),
                    count: variants.length,
                  })}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
