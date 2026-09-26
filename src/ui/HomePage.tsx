import { useTranslation } from 'react-i18next';
import type { Tune, TuneId } from '../domain/tune';
import { LanguageSelect, type LanguageCode } from './LanguageSelect';
import { TuneList } from './TuneList';

interface HomePageProps {
  languages: readonly LanguageCode[];
  tunes: readonly Tune[];
  tuneHref: (id: TuneId) => string;
}

export function HomePage({ languages, tunes, tuneHref }: HomePageProps) {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-4xl font-bold tracking-tight">{t('app.name')}</h1>
        <LanguageSelect languages={languages} />
      </header>
      <TuneList tunes={tunes} tuneHref={tuneHref} />
    </main>
  );
}
