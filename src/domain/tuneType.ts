/**
 * Controlled vocabulary for the `R:` (rhythm) field of a tune file.
 *
 * `other` is the escape hatch. To add a type, extend this list in a PR and add a
 * `tuneType.<id>` label to every locale file.
 */
export const TUNE_TYPES = [
  'polska',
  'waltz',
  'schottische',
  'mazurka',
  'polka',
  'hambo',
  'march',
  'minuet',
  'quadrille',
  'halling',
  'springar',
  'pols',
  'reel',
  'jig',
  'slip-jig',
  'hornpipe',
  'air',
  'song',
  'other',
] as const;

export type TuneType = (typeof TUNE_TYPES)[number];

export function isTuneType(value: string): value is TuneType {
  return (TUNE_TYPES as readonly string[]).includes(value);
}
