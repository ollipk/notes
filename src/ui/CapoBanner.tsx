import { useTranslation } from 'react-i18next';
import type { CapoSuggestion } from '../domain/capo';
import { formatChord } from '../domain/chord';

/** "Capo 3 · play G shapes", above the chords it applies to. Nothing without a capo. */
export function CapoBanner({ suggestion }: { suggestion: CapoSuggestion }) {
  const { t } = useTranslation();
  if (suggestion.capo === 0) return null;
  const { tonic, mode } = suggestion.shapeKey;
  const shape = formatChord({ root: tonic, quality: mode === 'minor' ? 'm' : '' }, 'music');
  return (
    <p
      role="note"
      className="mx-auto w-full max-w-xl rounded-lg bg-amber-100 px-3 py-2 text-center text-lg font-semibold text-amber-950 dark:bg-amber-900/60 dark:text-amber-50 print:mx-0 print:bg-transparent print:px-0 print:text-left"
    >
      {t('capo.banner', { capo: suggestion.capo, shape })}
    </p>
  );
}
