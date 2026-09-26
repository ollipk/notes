import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { TuneVariant } from '../domain/tune';

/** Source, transcriber and notes, below the score. */
export function TuneDetails({ variant }: { variant: TuneVariant }) {
  const { t } = useTranslation();
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2 text-sm text-stone-700 dark:text-stone-300"
    >
      <h2 id={headingId} className="text-base font-semibold text-stone-900 dark:text-stone-100">
        {t('tune.details')}
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="font-medium">{t('tune.source')}</dt>
        <dd>{variant.source}</dd>
        <dt className="font-medium">{t('tune.transcriber')}</dt>
        <dd>{variant.transcriber}</dd>
        {variant.notes.length > 0 && (
          <>
            <dt className="font-medium">{t('tune.notes')}</dt>
            <dd className="flex flex-col gap-1">
              {variant.notes.map((note, index) => (
                <p key={index}>{note}</p>
              ))}
            </dd>
          </>
        )}
      </dl>
    </section>
  );
}
