import { describe, expect, it } from 'vitest';
import {
  formatAbcKey,
  keyChoices,
  keySignatureFifths,
  MODES,
  parseKey,
  relativeMajor,
  semitonesToKey,
  spellPitchClass,
  transposeKey,
  type Key,
  type Mode,
} from './key';

function key(abc: string): Key {
  const result = parseKey(abc);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

const abc = formatAbcKey;

describe('parseKey', () => {
  it.each([
    ['G', 'G'],
    ['Am', 'Am'],
    ['Amin', 'Am'],
    ['A minor', 'Am'],
    ['AM', 'Am'],
    ['Edor', 'Edor'],
    ['E Dorian', 'Edor'],
    ['F#mix', 'F#mix'],
    ['Bb', 'Bb'],
    ['Bbm', 'Bbm'],
    ['Clyd', 'Clyd'],
    ['EPhr', 'Ephr'],
    ['Bloc', 'Bloc'],
    ['Dion', 'D'],
    ['Dmaj', 'D'],
    ['Aaeo', 'Am'],
    [' D ', 'D'],
    ['D clef=bass', 'D'],
  ])('parses %j as %s', (input, expected) => {
    expect(abc(key(input))).toBe(expected);
  });

  it.each(['', 'none', 'HP', 'Hp', 'H', 'D =c', 'Dxyz', 'Dmo', 'D##'])('rejects %j', (input) => {
    expect(parseKey(input).ok).toBe(false);
  });
});

describe('keySignatureFifths', () => {
  it.each([
    ['C', 0],
    ['G', 1],
    ['F', -1],
    ['Am', 0],
    ['Edor', 2],
    ['Amix', 2],
    ['Flyd', 0],
    ['Ephr', 0],
    ['Bloc', 0],
    ['F#m', 3],
    ['C#', 7],
    ['Cb', -7],
  ])('%s has %i', (input, fifths) => {
    expect(keySignatureFifths(key(input))).toBe(fifths);
  });
});

describe('transposeKey', () => {
  it('keeps the mode', () => {
    for (const mode of MODES) {
      expect(transposeKey({ tonic: { letter: 'D', accidental: 0 }, mode }, 3).mode).toBe(mode);
    }
  });

  it.each([
    ['C', 10, 'Bb'],
    ['C', -2, 'Bb'],
    ['C', 1, 'Db'],
    ['C', 6, 'F#'],
    ['C', -6, 'F#'],
    ['G', -1, 'F#'],
    ['Em', 2, 'F#m'],
    ['Am', 1, 'Bbm'],
    ['Am', -1, 'G#m'],
    ['Am', 6, 'D#m'],
    ['Edor', -3, 'C#dor'],
    ['Edor', 4, 'G#dor'],
    ['Edor', 1, 'Fdor'],
    ['Amix', 1, 'Bbmix'],
    ['Flyd', 6, 'Blyd'],
    ['Ephr', 1, 'Fphr'],
    ['Bloc', 1, 'Cloc'],
    ['B', 1, 'C'],
    ['Bm', 1, 'Cm'],
    ['C', 12, 'C'],
    ['C', -12, 'C'],
  ])('%s + %i = %s', (from, semitones, expected) => {
    expect(abc(transposeKey(key(from), semitones))).toBe(expected);
  });

  it('never uses more than six accidentals', () => {
    for (const mode of MODES) {
      for (const choice of keyChoices(mode)) {
        expect(Math.abs(keySignatureFifths(choice))).toBeLessThanOrEqual(6);
      }
    }
  });

  it('round-trips: transposing by n and then by −n returns the original key', () => {
    for (const mode of MODES) {
      for (const original of keyChoices(mode)) {
        for (let n = -12; n <= 12; n++) {
          expect(transposeKey(transposeKey(original, n), -n)).toEqual(original);
        }
      }
    }
  });
});

describe('semitonesToKey', () => {
  const tonic = (input: string) => key(input).tonic;

  it.each([
    ['G', 'A', 2],
    ['G', 'F', -2],
    ['G', 'C', 5],
    ['G', 'C#', 6],
    ['G', 'Db', 6],
    ['G', 'D', -5],
    ['G', 'G', 0],
    ['B', 'C', 1],
    ['C', 'B', -1],
  ])('%s to %s is %i', (from, target, expected) => {
    expect(semitonesToKey(key(from), tonic(target))).toBe(expected);
  });
});

describe('keyChoices', () => {
  it.each<[Mode, string[]]>([
    ['major', ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']],
    ['minor', ['Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm']],
    [
      'dorian',
      [
        'Cdor',
        'C#dor',
        'Ddor',
        'Ebdor',
        'Edor',
        'Fdor',
        'F#dor',
        'Gdor',
        'G#dor',
        'Ador',
        'Bbdor',
        'Bdor',
      ],
    ],
  ])('lists twelve %s keys from C upwards', (mode, expected) => {
    expect(keyChoices(mode).map(abc)).toEqual(expected);
  });
});

describe('relativeMajor', () => {
  it.each([
    ['Edor', 'D'],
    ['Am', 'C'],
    ['F#m', 'A'],
    ['Amix', 'D'],
    ['C#dor', 'B'],
    ['Flyd', 'C'],
    ['Cb', 'Cb'],
  ])('of %s is %s', (input, expected) => {
    expect(abc(relativeMajor(key(input)) ?? key('C'))).toBe(expected);
  });

  it('is undefined beyond seven accidentals', () => {
    expect(relativeMajor(key('B#lyd'))).toBeUndefined();
  });
});

describe('spellPitchClass', () => {
  const spell = (pc: number, k: string) => {
    const tonic = spellPitchClass(pc, key(k));
    return `${tonic.letter}${tonic.accidental === 1 ? '#' : tonic.accidental === -1 ? 'b' : ''}`;
  };

  it('uses the letters of the key scale', () => {
    expect([0, 2, 4, 5, 7, 9, 11].map((pc) => spell(pc, 'C'))).toEqual([
      'C',
      'D',
      'E',
      'F',
      'G',
      'A',
      'B',
    ]);
    expect(spell(10, 'F')).toBe('Bb');
    expect(spell(6, 'D')).toBe('F#');
    expect(spell(5, 'F#')).toBe('E#');
    expect(spell(11, 'Gb')).toBe('Cb');
    expect(spell(3, 'Cm')).toBe('Eb');
  });

  it('prefers naturals, then the key direction, outside the scale', () => {
    expect(spell(5, 'D')).toBe('F');
    expect(spell(1, 'G')).toBe('C#');
    expect(spell(1, 'Bb')).toBe('Db');
    expect(spell(6, 'C')).toBe('F#');
    expect(spell(-2, 'C')).toBe('A#');
  });
});
