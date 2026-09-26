/** Number of semitones in an octave. */
export const SEMITONES_PER_OCTAVE = 12;

/**
 * Upward distance in semitones from one pitch class to another, in the range 0–11.
 * Pitch classes are integers where 0 = C, 1 = C♯/D♭, …, 11 = B; any integer is accepted.
 */
export function semitonesUp(from: number, to: number): number {
  const diff = (to - from) % SEMITONES_PER_OCTAVE;
  return diff < 0 ? diff + SEMITONES_PER_OCTAVE : diff;
}
