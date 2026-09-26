import { pitchClass, type Key, type Letter, type Mode, type Tonic } from './key';
import { semitonesUp } from './pitch';

export const MAX_CAPO = 7;

export interface CapoSuggestion {
  /** Fret for the capo; 0 means no capo. */
  capo: number;
  /** The key the guitarist fingers, in `major` or `minor`. */
  shapeKey: Key;
}

/** Modes whose tonic chord is minor, so guitarists play them with minor shapes. */
const MINOR_MODES: ReadonlySet<Mode> = new Set(['minor', 'dorian', 'phrygian', 'locrian']);

/** Guitar-friendly keys that need no capo. */
const OPEN_MAJOR: readonly Letter[] = ['C', 'G', 'D', 'A', 'E'];
const OPEN_MINOR: readonly Letter[] = ['A', 'E', 'D'];
/**
 * Shapes used with a capo. A and E shapes are fine open but rarely chosen with a capo, so a key
 * such as B♭ is played capo 3 with G shapes rather than capo 1 with A shapes.
 */
const CAPO_MAJOR: readonly Letter[] = ['G', 'C', 'D'];
const CAPO_MINOR: readonly Letter[] = ['A', 'E', 'D'];

const natural = (letter: Letter): Tonic => ({ letter, accidental: 0 });

/**
 * The capo position and chord shapes for playing in `soundingKey` on guitar: no capo when the key
 * is guitar-friendly, otherwise the lowest capo (up to 7) that gives G, C or D shapes, or Am, Em
 * or Dm shapes in minor keys. Modal keys use the shapes of their tonic chord.
 */
export function capoSuggestion(soundingKey: Key): CapoSuggestion {
  const minor = MINOR_MODES.has(soundingKey.mode);
  const mode = minor ? 'minor' : 'major';
  const sounding = pitchClass(soundingKey.tonic);
  const open = minor ? OPEN_MINOR : OPEN_MAJOR;
  const withCapo = minor ? CAPO_MINOR : CAPO_MAJOR;

  const openShape = open.find((letter) => pitchClass(natural(letter)) === sounding);
  if (openShape !== undefined) return { capo: 0, shapeKey: { tonic: natural(openShape), mode } };

  const [best] = withCapo
    .map((letter) => ({ letter, capo: semitonesUp(pitchClass(natural(letter)), sounding) }))
    .filter(({ capo }) => capo <= MAX_CAPO)
    .sort((a, b) => a.capo - b.capo);
  if (best === undefined) throw new Error('Every key has a shape within capo 7');
  return { capo: best.capo, shapeKey: { tonic: natural(best.letter), mode } };
}
