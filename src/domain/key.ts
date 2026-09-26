import { SEMITONES_PER_OCTAVE, semitonesUp } from './pitch';
import { err, ok, type Result } from './result';

/** Modes with their own key signature. Ionian is `major` and aeolian is `minor`. */
export const MODES = [
  'major',
  'minor',
  'dorian',
  'mixolydian',
  'lydian',
  'phrygian',
  'locrian',
] as const;
export type Mode = (typeof MODES)[number];

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];

/** −1 = flat, 0 = natural, 1 = sharp. */
export type Accidental = -1 | 0 | 1;

export interface Tonic {
  letter: Letter;
  accidental: Accidental;
}

export interface Key {
  tonic: Tonic;
  mode: Mode;
}

const LETTER_PITCH_CLASS: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Position of each natural letter on the circle of fifths, counted from C. */
const LETTER_FIFTHS: Record<Letter, number> = { F: -1, C: 0, G: 1, D: 2, A: 3, E: 4, B: 5 };
const FIFTHS_ORDER: readonly Letter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];

/** How far each mode's key signature is from the major key on the same tonic, in fifths. */
const MODE_FIFTHS: Record<Mode, number> = {
  lydian: 1,
  major: 0,
  mixolydian: -1,
  dorian: -2,
  minor: -3,
  phrygian: -4,
  locrian: -5,
};

/** ABC recognises a mode by its first three letters, case-insensitively. */
const MODE_PREFIXES: Record<string, Mode> = {
  maj: 'major',
  ion: 'major',
  min: 'minor',
  aeo: 'minor',
  dor: 'dorian',
  mix: 'mixolydian',
  lyd: 'lydian',
  phr: 'phrygian',
  loc: 'locrian',
};

const mod12 = (n: number) => semitonesUp(0, n);

/**
 * Tonic, optional accidental, optional mode, then optional `name=value` modifiers such as
 * `clef=bass`. Anything else (`none`, `HP`, explicit accidentals) is not supported.
 */
const KEY_PATTERN = /^\s*([A-Ga-g])([#b]?)\s*([A-Za-z]*)((?:\s+[A-Za-z-]+=\S+)*)\s*$/;

/** Parses an ABC `K:` value such as `G`, `Am`, `F#mix` or `Bb dorian`. */
export function parseKey(value: string): Result<Key, string> {
  const match = KEY_PATTERN.exec(value);
  const letter = match?.[1]?.toUpperCase() as Letter | undefined;
  if (match === null || letter === undefined) {
    return err(`"${value}" is not a key this app can transpose.`);
  }
  const accidental: Accidental = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0;
  const modeWord = (match[3] ?? '').toLowerCase();
  const mode =
    modeWord === ''
      ? 'major'
      : modeWord === 'm'
        ? 'minor'
        : modeWord.length >= 3
          ? MODE_PREFIXES[modeWord.slice(0, 3)]
          : undefined;
  if (mode === undefined) {
    return err(`"${value}" has an unknown mode "${match[3] ?? ''}".`);
  }
  return ok({ tonic: { letter, accidental }, mode });
}

/** Pitch class of a tonic: 0 = C … 11 = B. */
export function pitchClass(tonic: Tonic): number {
  return mod12(LETTER_PITCH_CLASS[tonic.letter] + tonic.accidental);
}

/** Key signature as a count of fifths: positive = sharps, negative = flats. */
export function keySignatureFifths(key: Key): number {
  return LETTER_FIFTHS[key.tonic.letter] + 7 * key.tonic.accidental + MODE_FIFTHS[key.mode];
}

/** Spells the key on a pitch class so its signature has the fewest accidentals (sharps on a tie). */
function spellKey(tonicPitchClass: number, mode: Mode): Key {
  const candidates = LETTERS.flatMap((letter): Key[] => {
    const offset = semitonesUp(LETTER_PITCH_CLASS[letter], tonicPitchClass);
    const accidental = offset === 0 ? 0 : offset === 1 ? 1 : offset === 11 ? -1 : undefined;
    return accidental === undefined ? [] : [{ tonic: { letter, accidental }, mode }];
  });
  const cost = (key: Key) => {
    const fifths = keySignatureFifths(key);
    // Equal counts: prefer sharps.
    return Math.abs(fifths) * 2 + (fifths < 0 ? 1 : 0);
  };
  const [best] = candidates.sort((a, b) => cost(a) - cost(b));
  if (best === undefined) throw new Error('Every pitch class has a spelling');
  return best;
}

/** The key `semitones` away, in the same mode, spelled with the fewest accidentals. */
export function transposeKey(key: Key, semitones: number): Key {
  return spellKey(mod12(pitchClass(key.tonic) + semitones), key.mode);
}

/** The nearest transposition (−5 to +6 semitones) from `from` to a key on `target`. */
export function semitonesToKey(from: Key, target: Tonic): number {
  const up = semitonesUp(pitchClass(from.tonic), pitchClass(target));
  return up > SEMITONES_PER_OCTAVE / 2 ? up - SEMITONES_PER_OCTAVE : up;
}

/** The twelve keys in a mode, from C upwards, for a key selector. */
export function keyChoices(mode: Mode): Key[] {
  return Array.from({ length: SEMITONES_PER_OCTAVE }, (_, pc) => spellKey(pc, mode));
}

/**
 * The major key with the same key signature, e.g. D for E dorian, or `undefined` for signatures
 * beyond seven sharps or flats.
 */
export function relativeMajor(key: Key): Key | undefined {
  const index = keySignatureFifths(key) + 1; // F is one fifth below C.
  const letter = FIFTHS_ORDER[((index % 7) + 7) % 7];
  const accidental = Math.floor(index / 7);
  if (letter === undefined || (accidental !== -1 && accidental !== 0 && accidental !== 1)) {
    return undefined;
  }
  return { tonic: { letter, accidental }, mode: 'major' };
}

/** ABC spelling of a key, e.g. `F#m`, `Bbdor`. */
export function formatAbcKey(key: Key): string {
  const accidental = key.tonic.accidental === 1 ? '#' : key.tonic.accidental === -1 ? 'b' : '';
  const mode: Record<Mode, string> = {
    major: '',
    minor: 'm',
    dorian: 'dor',
    mixolydian: 'mix',
    lydian: 'lyd',
    phrygian: 'phr',
    locrian: 'loc',
  };
  return `${key.tonic.letter}${accidental}${mode[key.mode]}`;
}
