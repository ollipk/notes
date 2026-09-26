import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Key, Tonic } from '@notes/domain';

/** Letter names with ♯/♭, the same in every language, e.g. `F♯`, `B♭`. */
export function tonicName({ letter, accidental }: Tonic): string {
  return `${letter}${accidental === 1 ? '♯' : accidental === -1 ? '♭' : ''}`;
}

/** Returns a function that names a key in the current language, e.g. "F♯ minor", "F♯-molli". */
export function useKeyName(): (key: Key) => string {
  const { t } = useTranslation();
  return useCallback(
    (key: Key) => t('key.name', { tonic: tonicName(key.tonic), mode: t(`key.mode.${key.mode}`) }),
    [t],
  );
}
