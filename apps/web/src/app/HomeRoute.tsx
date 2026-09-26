import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { searchTunes, type Tune } from '@notes/domain';
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
  onVisit,
}: {
  languages: readonly LanguageCode[];
  tunes: readonly Tune[];
  /** Called when the page is shown, so the tune page knows it can go back to it. */
  onVisit: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // The field keeps what was typed and the URL follows it. Reading the field back from the URL
  // drops letters typed faster than the router updates. The page mounts again when the player
  // comes back from a tune, so it starts from the URL then.
  const [query, setQuery] = useState(() => params.get('q') ?? '');

  useEffect(onVisit, [onVisit]);

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
      onQueryChange={(next) => {
        setQuery(next);
        setParams(next === '' ? {} : { q: next }, { replace: true });
      }}
      onOpenTune={(id) => navigate(tunePath(id))}
      tuneHref={tuneHref}
    />
  );
}
