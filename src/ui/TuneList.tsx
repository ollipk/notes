import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { Tune } from '../domain/tune';

interface TuneListProps {
  tunes: readonly Tune[];
}

export function TuneList({ tunes }: TuneListProps) {
  const { t } = useTranslation();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-2xl font-semibold">
        {t('catalog.heading')}
      </h2>
      <ul className="flex flex-col gap-4">
        {tunes.map(({ id, variants }) => {
          const [first] = variants;
          return (
            <li key={id} className="flex flex-col gap-1">
              <span className="text-lg font-medium">{first.titles[0]}</span>
              <span className="text-stone-700 dark:text-stone-300">
                {t('catalog.summary', {
                  type: t(`tuneType.${first.type}`),
                  country: first.origin.country,
                  count: variants.length,
                })}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
