import { useTranslation } from 'react-i18next';
import type { Tune, TuneId } from '@notes/domain';
import { LanguageSelect, type LanguageCode } from './LanguageSelect';
import { SearchField } from './SearchField';
import { TuneList } from './TuneList';

interface HomePageProps {
  languages: readonly LanguageCode[];
  /** The tunes matching `query`, best match first. */
  tunes: readonly Tune[];
  query: string;
  onQueryChange: (query: string) => void;
  /** Opens a tune, e.g. the first result when Enter is pressed. */
  onOpenTune: (id: TuneId) => void;
  tuneHref: (id: TuneId) => string;
}

export function HomePage({
  languages,
  tunes,
  query,
  onQueryChange,
  onOpenTune,
  tuneHref,
}: HomePageProps) {
  const { t } = useTranslation();
  const [first] = tunes;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-4 py-4 sm:px-8 sm:py-8">
      <header className="flex items-end justify-between gap-4">
        <h1 className="pb-2 text-2xl font-bold tracking-tight">{t('app.name')}</h1>
        <LanguageSelect languages={languages} />
      </header>
      <SearchField
        value={query}
        onChange={onQueryChange}
        onSubmit={() => {
          if (first) onOpenTune(first.id);
        }}
      />
      {tunes.length > 0 ? (
        <TuneList tunes={tunes} tuneHref={tuneHref} />
      ) : (
        <p role="status" className="py-4 text-lg text-stone-700 dark:text-stone-300">
          {t('search.noResults', { query: query.trim() })}
        </p>
      )}
    </main>
  );
}
