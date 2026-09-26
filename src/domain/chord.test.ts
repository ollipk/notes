import { describe, expect, it } from 'vitest';
import { formatChord, parseChord, transposeChord, transposeChordSymbol } from './chord';
import { parseKey, type Key } from './key';

function key(abc: string): Key {
  const result = parseKey(abc);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('parseChord', () => {
  it.each([
    ['G', 'G', 0, ''],
    ['Am', 'A', 0, 'm'],
    ['D7', 'D', 0, '7'],
    ['Em7', 'E', 0, 'm7'],
    ['Cmaj7', 'C', 0, 'maj7'],
    ['Bdim', 'B', 0, 'dim'],
    ['Caug', 'C', 0, 'aug'],
    ['Dsus2', 'D', 0, 'sus2'],
    ['Asus4', 'A', 0, 'sus4'],
    ['G6', 'G', 0, '6'],
    ['A9', 'A', 0, '9'],
    ['Bm7b5', 'B', 0, 'm7b5'],
    ['F#m', 'F', 1, 'm'],
    ['Bb', 'B', -1, ''],
    ['Ebmaj7', 'E', -1, 'maj7'],
    ['C#dim7', 'C', 1, 'dim7'],
    ['G+', 'G', 0, '+'],
  ])('%s has root %s (%i) and quality "%s"', (symbol, letter, accidental, quality) => {
    const chord = parseChord(symbol);
    expect(chord).toEqual({ ok: true, value: { root: { letter, accidental }, quality } });
  });

  it('reads the bass of a slash chord', () => {
    expect(parseChord('D/F#')).toEqual({
      ok: true,
      value: {
        root: { letter: 'D', accidental: 0 },
        quality: '',
        bass: { letter: 'F', accidental: 1 },
      },
    });
    expect(parseChord('Am7/G')).toMatchObject({ ok: true, value: { quality: 'm7' } });
  });

  it.each(['', 'N.C.', 'H', 'g', '(G)', 'G D', 'GD', 'D/X', 'Am/', 'intro'])(
    'rejects "%s"',
    (symbol) => {
      expect(parseChord(symbol).ok).toBe(false);
    },
  );

  it('round-trips through formatChord', () => {
    for (const symbol of ['G', 'F#m7', 'Bbmaj7', 'D/F#', 'Ebsus4/Bb']) {
      const chord = parseChord(symbol);
      expect(chord.ok && formatChord(chord.value)).toBe(symbol);
    }
  });

  it('formats with music accidentals', () => {
    const chord = parseChord('Bb/F#');
    expect(chord.ok && formatChord(chord.value, 'music')).toBe('B♭/F♯');
  });
});

describe('transposeChord', () => {
  const up = (symbol: string, semitones: number, target: string) =>
    transposeChordSymbol(symbol, semitones, key(target));

  it('moves the root and keeps the quality', () => {
    expect(up('G', 2, 'A')).toBe('A');
    expect(up('Em7', 2, 'A')).toBe('F#m7');
    expect(up('Cmaj7', 2, 'A')).toBe('Dmaj7');
  });

  it('spells with flats in flat keys', () => {
    // G → B♭: C becomes E♭, D7 becomes F7, Em becomes Gm.
    expect(up('C', 3, 'Bb')).toBe('Eb');
    expect(up('D7', 3, 'Bb')).toBe('F7');
    expect(up('Em', 3, 'Bb')).toBe('Gm');
    expect(up('G', -1, 'Gb')).toBe('Gb');
  });

  it('spells with sharps in sharp keys', () => {
    expect(up('G', 4, 'B')).toBe('B');
    expect(up('C', 4, 'B')).toBe('E');
    expect(up('Em', 4, 'B')).toBe('G#m');
    expect(up('D', 4, 'B')).toBe('F#');
  });

  it('spells notes outside the scale by the key direction', () => {
    // A chromatic B♭ chord in C major (sharp side) is A♯; in F major it is B♭.
    expect(up('Bb', 0, 'C')).toBe('A#');
    expect(up('A#', 0, 'F')).toBe('Bb');
  });

  it('transposes the bass of a slash chord', () => {
    expect(up('D/F#', 3, 'Bb')).toBe('F/A');
    expect(up('G/B', 1, 'Ab')).toBe('Ab/C');
    expect(up('C/G', -5, 'D')).toBe('G/D');
  });

  it('uses the scale of minor and modal keys', () => {
    expect(up('Am', 2, 'Bm')).toBe('Bm');
    expect(up('G', 2, 'Bm')).toBe('A');
    expect(up('F', 2, 'Bm')).toBe('G');
    expect(up('Em', 1, 'Fdor')).toBe('Fm');
    expect(up('D', 1, 'Fdor')).toBe('Eb');
  });

  it('works on parsed chords', () => {
    const chord = parseChord('Am7');
    expect(chord.ok && formatChord(transposeChord(chord.value, 5, key('F')))).toBe('Dm7');
  });

  it('returns an unparseable symbol as written', () => {
    expect(up('N.C.', 3, 'Bb')).toBe('N.C.');
  });
});
