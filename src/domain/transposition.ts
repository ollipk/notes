/** Transposition is limited to one octave either way. */
export const MIN_SEMITONES = -12;
export const MAX_SEMITONES = 12;

/**
 * Reads a transposition from a URL parameter. Anything that is not a whole number from −12 to 12
 * falls back to 0, so a mistyped link still opens the tune.
 */
export function parseSemitones(value: string | null): number {
  if (value === null || !/^[+-]?\d{1,2}$/.test(value.trim())) return 0;
  const semitones = Number(value.trim());
  return semitones >= MIN_SEMITONES && semitones <= MAX_SEMITONES ? semitones : 0;
}
