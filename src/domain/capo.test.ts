import { describe, expect, it } from 'vitest';
import { capoSuggestion } from './capo';
import { formatAbcKey, parseKey, type Key } from './key';

function key(abc: string): Key {
  const result = parseKey(abc);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

const suggest = (abc: string) => {
  const { capo, shapeKey } = capoSuggestion(key(abc));
  return `${capo} ${formatAbcKey(shapeKey)}`;
};

describe('capoSuggestion', () => {
  it.each([
    ['C', '0 C'],
    ['C#', '1 C'],
    ['Db', '1 C'],
    ['D', '0 D'],
    ['Eb', '1 D'],
    ['E', '0 E'],
    ['F', '3 D'],
    ['F#', '4 D'],
    ['G', '0 G'],
    ['Ab', '1 G'],
    ['A', '0 A'],
    ['Bb', '3 G'],
    ['B', '4 G'],
  ])('major: %s → capo %s', (sounding, expected) => {
    expect(suggest(sounding)).toBe(expected);
  });

  it.each([
    ['Cm', '3 Am'],
    ['C#m', '4 Am'],
    ['Dm', '0 Dm'],
    ['Ebm', '1 Dm'],
    ['Em', '0 Em'],
    ['Fm', '1 Em'],
    ['F#m', '2 Em'],
    ['Gm', '3 Em'],
    ['G#m', '4 Em'],
    ['Am', '0 Am'],
    ['Bbm', '1 Am'],
    ['Bm', '2 Am'],
  ])('minor: %s → capo %s', (sounding, expected) => {
    expect(suggest(sounding)).toBe(expected);
  });

  it('never needs more than capo 7', () => {
    for (const mode of ['', 'm']) {
      for (const tonic of ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']) {
        expect(capoSuggestion(key(tonic + mode)).capo).toBeLessThanOrEqual(7);
      }
    }
  });

  it('uses the tonic chord of modal keys', () => {
    expect(suggest('Edor')).toBe('0 Em');
    expect(suggest('Ador')).toBe('0 Am');
    expect(suggest('Dmix')).toBe('0 D');
    expect(suggest('Bbmix')).toBe('3 G');
    expect(suggest('Fdor')).toBe('1 Em');
  });
});
