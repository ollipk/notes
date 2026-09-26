import { describe, expect, it } from 'vitest';
import { parseSemitones } from './transposition';

describe('parseSemitones', () => {
  it.each([
    ['2', 2],
    ['-3', -3],
    ['+4', 4],
    ['12', 12],
    ['-12', -12],
    ['0', 0],
  ])('reads %j as %i', (value, expected) => {
    expect(parseSemitones(value)).toBe(expected);
  });

  it.each([null, '', 'abc', '1.5', '13', '-13', '100', '2x', '1e1', ' '])(
    'falls back to 0 for %j',
    (value) => {
      expect(parseSemitones(value)).toBe(0);
    },
  );
});
