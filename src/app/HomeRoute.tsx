import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { searchTunes } from '../domain/search';
import type { Tune } from '../domain/tune';
import { HomePage } from '../ui/HomePage';
import type { LanguageCode } from '../ui/LanguageSelect';
import { tuneHref, tunePath } from './routes';

/**
 * `/#/?q=<query>`. The query lives in the URL, so going back from a tune shows the same results
 * (ADR 9). Typing replaces the history entry instead of adding one per letter.
 */
export function HomeRoute({
  languages,
  tunes,
}: {
  languages: readonly LanguageCode[];
  tunes: readonly Tune[];
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';

  const results = useMemo(
    () => searchTunes(tunes, query, (type) => t(`tuneType.${type}`)),
    // `t` changes with the language, and so do the type labels.
    [tunes, query, t],
  );

  return (
    <HomePage
      languages={languages}
      tunes={results}
      query={query}
      onQueryChange={(next) => setParams(next === '' ? {} : { q: next }, { replace: true })}
      onOpenTune={(id) => navigate(tunePath(id))}
      tuneHref={tuneHref}
    />
  );
}
