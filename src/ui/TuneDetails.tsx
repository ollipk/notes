import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { TuneVariant } from '../domain/tune';

interface TuneDetailsProps {
  variant: TuneVariant;
  /** The address of this page, printed so a reader of the paper copy can find it again. */
  pageUrl: string;
}

/** Source, transcriber and notes, below the score. In print: source, transcriber and address. */
export function TuneDetails({ variant, pageUrl }: TuneDetailsProps) {
  const { t } = useTranslation();
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2 text-sm text-stone-700 dark:text-stone-300"
    >
      <h2
        id={headingId}
        className="text-base font-semibold text-stone-900 dark:text-stone-100 print:hidden"
      >
        {t('tune.details')}
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="font-medium">{t('tune.source')}</dt>
        <dd>{variant.source}</dd>
        <dt className="font-medium">{t('tune.transcriber')}</dt>
        <dd>{variant.transcriber}</dd>
        {variant.notes.length > 0 && (
          <>
            <dt className="font-medium print:hidden">{t('tune.notes')}</dt>
            <dd className="flex flex-col gap-1 print:hidden">
              {variant.notes.map((note, index) => (
                <p key={index}>{note}</p>
              ))}
            </dd>
          </>
        )}
        <dt className="hidden font-medium print:block">{t('print.address')}</dt>
        <dd className="hidden break-all print:block">{pageUrl}</dd>
      </dl>
    </section>
  );
}
