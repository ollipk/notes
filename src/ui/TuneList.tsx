import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { Tune, TuneId } from '../domain/tune';

interface TuneListProps {
  tunes: readonly Tune[];
  tuneHref: (id: TuneId) => string;
}

export function TuneList({ tunes, tuneHref }: TuneListProps) {
  const { t } = useTranslation();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-2xl font-semibold">
        {t('catalog.heading')}
      </h2>
      <ul className="flex flex-col gap-2">
        {tunes.map(({ id, variants }) => {
          const [first] = variants;
          return (
            <li key={id}>
              <a
                href={tuneHref(id)}
                className="-mx-3 flex min-h-11 flex-col gap-1 rounded-lg px-3 py-2 hover:bg-stone-200/60 focus:ring-2 focus:ring-amber-600 focus:outline-none dark:hover:bg-stone-800"
              >
                <span className="text-lg font-medium text-amber-800 dark:text-amber-400">
                  {first.titles[0]}
                </span>
                <span className="text-stone-700 dark:text-stone-300">
                  {t('catalog.summary', {
                    type: t(`tuneType.${first.type}`),
                    country: first.origin.country,
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
