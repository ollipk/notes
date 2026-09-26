import { describe, expect, it } from 'vitest';
import { chordSymbols, hasChords, tuneHasChords, withoutChordSymbols } from './chordSymbols';
import type { Tune } from './tune';

const tune = (body: string) => `X: 1\nT: "Quoted" title\nN: a "G" in a note\nK: G\n${body}`;

describe('chordSymbols', () => {
  it('lists the chord symbols in the body, in order', () => {
    expect(chordSymbols(tune('|:"G"G3 "D7"ABd|"Em"e2 "C"c:|\n|"D/F#"d4|'))).toEqual([
      'G',
      'D7',
      'Em',
      'C',
      'D/F#',
    ]);
  });

  it('skips header fields, annotations, comments and field lines', () => {
    const abc = tune(
      '"^Slow"G2 "_rit."A2 "<(" "@1,2 x" "Am"A2 % "C" in a comment\nw: "G" lyrics\n',
    );
    expect(chordSymbols(abc)).toEqual(['Am']);
  });

  it('has no chord symbols without a K: line', () => {
    expect(chordSymbols('X: 1\n"G"G2')).toEqual([]);
  });
});

describe('hasChords', () => {
  it('is true when the body has a chord', () => {
    expect(hasChords({ abc: tune('"G"GAB') })).toBe(true);
  });

  it('is false for melody only, annotations only, or text that is not a chord', () => {
    expect(hasChords({ abc: tune('GAB') })).toBe(false);
    expect(hasChords({ abc: tune('"^fine"GAB') })).toBe(false);
    expect(hasChords({ abc: tune('"intro"GAB') })).toBe(false);
  });

  it('is true for a tune when any variant has chords', () => {
    const variants = [{ abc: tune('GAB') }, { abc: tune('"C"c') }];
    expect(tuneHasChords({ variants } as unknown as Tune)).toBe(true);
    expect(tuneHasChords({ variants: [variants[0]] } as unknown as Tune)).toBe(false);
  });
});

describe('withoutChordSymbols', () => {
  it('removes chords and keeps everything else', () => {
    const abc = tune('|:"G"G3 "^Slow""D7"ABd|"Em"e2:| % "C"\nw: "G"');
    expect(withoutChordSymbols(abc)).toBe(tune('|:G3 "^Slow"ABd|e2:| % "C"\nw: "G"'));
  });

  it('leaves a tune without chords unchanged', () => {
    const abc = tune('GAB|c2');
    expect(withoutChordSymbols(abc)).toBe(abc);
  });
});
