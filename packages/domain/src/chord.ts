import {
  pitchClass,
  spellPitchClass,
  type Accidental,
  type Key,
  type Letter,
  type Tonic,
} from './key';
import { err, ok, type Result } from './result';

/** A chord symbol such as `Am7` or `D/F#`. */
export interface Chord {
  root: Tonic;
  /** Everything between the root and the bass, kept as written: `m`, `7`, `maj7`, `sus4`, … */
  quality: string;
  /** The bass note of a slash chord. */
  bass?: Tonic;
}

/**
 * Root, optional accidental, the quality, then an optional slash bass. The quality may not
 * contain spaces, slashes or quotes; `N.C.`, `(G)` and free text are not chords.
 */
const CHORD_PATTERN = /^([A-G])([#b♯♭]?)([^\s/"]*)(?:\/([A-G])([#b♯♭]?))?$/;
const QUALITY_PATTERN = /^(?:[a-zA-Z0-9+#♯♭°ø()-]*)$/;

const accidental = (sign: string | undefined): Accidental =>
  sign === '#' || sign === '♯' ? 1 : sign === 'b' || sign === '♭' ? -1 : 0;

/** Parses an ABC chord symbol such as `G`, `Am7`, `F#m`, `Bbmaj7` or `D/F#`. */
export function parseChord(symbol: string): Result<Chord, string> {
  const match = CHORD_PATTERN.exec(symbol.trim());
  const quality = match?.[3] ?? '';
  // A quality starting with a letter note name would be a second chord, e.g. `GD`.
  if (match === null || !QUALITY_PATTERN.test(quality) || /^[A-G]/.test(quality)) {
    return err(`"${symbol}" is not a chord symbol.`);
  }
  const root: Tonic = { letter: match[1] as Letter, accidental: accidental(match[2]) };
  const chord: Chord = { root, quality };
  if (match[4] !== undefined) {
    chord.bass = { letter: match[4] as Letter, accidental: accidental(match[5]) };
  }
  return ok(chord);
}

/**
 * Transposes a chord's root and bass by `semitones`, spelled for `targetKey`: notes of the key's
 * scale take its letters, other notes use sharps in sharp keys and flats in flat keys.
 */
export function transposeChord(chord: Chord, semitones: number, targetKey: Key): Chord {
  const move = (note: Tonic) => spellPitchClass(pitchClass(note) + semitones, targetKey);
  const moved: Chord = { root: move(chord.root), quality: chord.quality };
  if (chord.bass !== undefined) moved.bass = move(chord.bass);
  return moved;
}

const ASCII: Record<Accidental, string> = { [-1]: 'b', 0: '', 1: '#' };
const MUSIC: Record<Accidental, string> = { [-1]: '♭', 0: '', 1: '♯' };

/** Writes a chord back as text, with ASCII (`Bb`) or music (`B♭`) accidentals. */
export function formatChord(chord: Chord, style: 'ascii' | 'music' = 'ascii'): string {
  const signs = style === 'ascii' ? ASCII : MUSIC;
  const note = (tonic: Tonic) => `${tonic.letter}${signs[tonic.accidental]}`;
  const bass = chord.bass === undefined ? '' : `/${note(chord.bass)}`;
  return `${note(chord.root)}${chord.quality}${bass}`;
}

/**
 * Transposes a chord symbol for display. A symbol that cannot be parsed is returned as written.
 */
export function transposeChordSymbol(
  symbol: string,
  semitones: number,
  targetKey: Key,
  style: 'ascii' | 'music' = 'ascii',
): string {
  const chord = parseChord(symbol);
  return chord.ok ? formatChord(transposeChord(chord.value, semitones, targetKey), style) : symbol;
}
