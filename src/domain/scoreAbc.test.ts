import { describe, expect, it } from 'vitest';
import { scoreAbc } from './scoreAbc';

const file = (key: string, body = '|:"Em"EFGA B2:|') =>
  [
    'X: 1',
    'T: The Tune',
    'T: Another Name',
    'C: Trad.',
    'R: reel',
    'O: IE',
    'S: Someone',
    'Z: Someone else',
    'N: A note',
    '% a comment',
    'M: 4/4',
    'L: 1/8',
    'Q: 1/4=100',
    `K:${key}`,
    body,
    'T: Part B',
    '',
  ].join('\n');

describe('scoreAbc', () => {
  it('keeps only the musical header fields', () => {
    expect(scoreAbc(file(' G'))).toBe(
      [
        'X: 1',
        '% a comment',
        'M: 4/4',
        'L: 1/8',
        'Q: 1/4=100',
        'K: G',
        '|:"Em"EFGA B2:|',
        'T: Part B',
        '',
      ].join('\n'),
    );
  });

  it.each([
    [' G', 'K: G'],
    [' Am', 'K: Am'],
    [' Edor', 'K:D'],
    ['Amix', 'K:D'],
    ['F#dor clef=treble', 'K:E clef=treble'],
    ['Bbphr', 'K:Gb'],
    [' none', 'K: none'],
  ])('writes K:%s as %s', (key, expected) => {
    expect(scoreAbc(file(key)).split('\n')).toContain(expected);
  });

  it('returns text without K: unchanged', () => {
    expect(scoreAbc('X:1\nT:x')).toBe('X:1\nT:x');
  });
});
