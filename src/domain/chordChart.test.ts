import { describe, expect, it } from 'vitest';
import { buildChordChart, chartHasChords, type ChordEvent } from './chordChart';

/**
 * Events from a compact notation: `|` bar, `|:` repeat start, `:|` repeat end, `[1` ending,
 * `P:X` part, anything else a chord. `:|` and `|:` include their bar line.
 */
function events(text: string): ChordEvent[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((token): ChordEvent[] => {
      if (token === '|') return [{ kind: 'bar' }];
      if (token === '|:') return [{ kind: 'repeatStart' }];
      if (token === ':|') return [{ kind: 'repeatEnd' }, { kind: 'bar' }];
      if (token === ':|:') return [{ kind: 'repeatEnd' }, { kind: 'bar' }, { kind: 'repeatStart' }];
      if (token.startsWith('[')) return [{ kind: 'ending', value: token.slice(1) }];
      if (token.startsWith('P:')) return [{ kind: 'part', value: token.slice(2) }];
      return [{ kind: 'chord', value: token }];
    });
}

const chords = (text: string) =>
  buildChordChart(events(text)).parts.map(({ label, bars }) => [
    label,
    bars.map((bar) => bar.chords.join(' ')),
  ]);

describe('buildChordChart', () => {
  it('puts the chords of each bar in order', () => {
    expect(chords('G | D7 G | Em | C D |')).toEqual([['A', ['G', 'D7 G', 'Em', 'C D']]]);
  });

  it('infers parts from repeats', () => {
    expect(chords('|: G | D :| |: Em | C :|')).toEqual([
      ['A', ['G', 'D']],
      ['B', ['Em', 'C']],
    ]);
  });

  it('starts a part after a repeat end even without a repeat start', () => {
    expect(chords('G | D :| Em | C | Am | D |')).toEqual([
      ['A', ['G', 'D']],
      ['B', ['Em', 'C', 'Am', 'D']],
    ]);
  });

  it('splits parts at a double repeat', () => {
    expect(chords('|: G | D :|: C | D :|')).toEqual([
      ['A', ['G', 'D']],
      ['B', ['C', 'D']],
    ]);
  });

  it('marks repeats on the bars', () => {
    const [part] = buildChordChart(events('|: G | D :|')).parts;
    expect(part?.bars).toEqual([
      { chords: ['G'], repeatStart: true },
      { chords: ['D'], repeatEnd: true },
    ]);
  });

  it('keeps first and second endings in the same part', () => {
    const chart = buildChordChart(events('|: G | [1 D :| [2 D7 | |: C | G :|'));
    expect(chart.parts.map(({ label }) => label)).toEqual(['A', 'B']);
    expect(chart.parts[0]?.bars).toEqual([
      { chords: ['G'], repeatStart: true },
      { chords: ['D'], repeatEnd: true, ending: '1' },
      { chords: ['D7'], ending: '2' },
    ]);
  });

  it('takes part labels from P: fields', () => {
    expect(chords('P:Intro G | D | P:Verse |: C | G :| |: Am | D :|')).toEqual([
      ['Intro', ['G', 'D']],
      ['Verse', ['C', 'G', 'Am', 'D']],
    ]);
  });

  it('marks bars without chords as carried', () => {
    const [part] = buildChordChart(events('G | | D G | |')).parts;
    expect(part?.bars).toEqual([
      { chords: ['G'] },
      { chords: ['G'], carried: true },
      { chords: ['D', 'G'] },
      { chords: ['G'], carried: true },
    ]);
  });

  it('carries the last chord into the next part', () => {
    const chart = buildChordChart(events('|: G | D :| |: | C :|'));
    expect(chart.parts[1]?.bars[0]).toEqual({ chords: ['D'], carried: true, repeatStart: true });
  });

  it('drops a leading pickup bar without chords', () => {
    expect(chords('| G | D |')).toEqual([['A', ['G', 'D']]]);
    // The repeat before the pickup starts at the first full bar.
    expect(buildChordChart(events('|: | G | D :|')).parts[0]?.bars[0]).toEqual({
      chords: ['G'],
      repeatStart: true,
    });
  });

  it('drops a pickup without chords at the start of a P: part', () => {
    expect(chords('P:A | G | D | P:B | C | G |')).toEqual([
      ['A', ['G', 'D']],
      ['B', ['C', 'G']],
    ]);
  });

  it('keeps a leading bar with chords', () => {
    expect(chords('D | G |')).toEqual([['A', ['D', 'G']]]);
  });

  it('closes a last bar without a final bar line', () => {
    expect(chords('G | D')).toEqual([['A', ['G', 'D']]]);
  });

  it('is empty without events or chords', () => {
    expect(buildChordChart([])).toEqual({ parts: [] });
    const melodyOnly = buildChordChart(events('| | |'));
    expect(chartHasChords(melodyOnly)).toBe(false);
    expect(chartHasChords(buildChordChart(events('G |')))).toBe(true);
  });
});
