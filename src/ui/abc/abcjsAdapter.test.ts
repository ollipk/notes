/**
 * Checks the adapter's options against the real abcjs parser and sequencer. jsdom cannot draw
 * the SVG, but parsing and building the audio sequence do not need a browser.
 */
import abcjs from 'abcjs';
import { describe, expect, it } from 'vitest';
import {
  keyChoices,
  keySignatureFifths,
  MODES,
  formatAbcKey,
  transposeKey,
} from '../../domain/key';
import { scoreAbc } from '../../domain/scoreAbc';
import { audioParams, renderParams } from './abcjsAdapter';

const tune = (key: string, body: string) =>
  scoreAbc(`X:1\nT:Test\nM:4/4\nL:1/4\nK:${key}\n${body}\n`);

function parse(abc: string, semitones: number) {
  const [parsed] = abcjs.parseOnly(abc, renderParams({ semitones, scale: 1, width: 400 }));
  if (parsed === undefined) throw new Error('No tune parsed');
  return parsed;
}

function notePitches(abc: string, semitones: number): number[][] {
  const { tracks } = parse(abc, semitones).setUpAudio(audioParams(semitones));
  return tracks.map((track) => track.filter((e) => e.cmd === 'note').map((e) => e.pitch));
}

function renderedFifths(abc: string, semitones: number): number {
  const key = parse(abc, semitones).lines[0]?.staff?.[0]?.key;
  const accidentals = key?.accidentals ?? [];
  return accidentals.length * (accidentals[0]?.acc === 'flat' ? -1 : 1);
}

describe('abcjs adapter', () => {
  it('draws one SVG per staff line, so a printed line is never split across pages', () => {
    expect(renderParams({ semitones: 0, scale: 1, width: 400 })).toMatchObject({
      oneSvgPerLine: true,
      visualTranspose: 0,
    });
  });

  it('plays in the displayed key, chords included', () => {
    const abc = tune('C', '"C"CEGc|');
    const pitchClasses = (pitches: number[] = []) => pitches.map((p) => ((p % 12) + 12) % 12);
    const [melody, chords] = notePitches(abc, 0);
    for (const semitones of [-12, -5, -1, 2, 7, 12]) {
      const [transposedMelody, transposedChords] = notePitches(abc, semitones);
      expect(transposedMelody).toEqual(melody?.map((pitch) => pitch + semitones));
      // abcjs keeps the accompaniment in a fixed register, so compare pitch classes.
      expect(pitchClasses(transposedChords)).toEqual(
        pitchClasses(chords?.map((pitch) => pitch + semitones)),
      );
    }
  });

  it('transposes chord symbols with the notes', () => {
    const [chord] =
      parse(tune('Am', '"Am"A4|'), 2)
        .lines[0]?.staff?.[0]?.voices?.[0]?.flatMap((el) => ('chord' in el ? (el.chord ?? []) : []))
        .map((c) => c.name) ?? [];
    expect(chord).toBe('Bm');
  });

  it('draws the same key signature as transposeKey spells, in every mode', () => {
    const mismatches: string[] = [];
    for (const mode of MODES) {
      for (const key of keyChoices(mode)) {
        const abc = tune(formatAbcKey(key), 'C4|');
        for (let semitones = -12; semitones <= 12; semitones++) {
          const expected = keySignatureFifths(transposeKey(key, semitones));
          const actual = renderedFifths(abc, semitones);
          if (actual !== expected) {
            mismatches.push(
              `${formatAbcKey(key)}${semitones >= 0 ? '+' : ''}${semitones}: ${actual} ≠ ${expected}`,
            );
          }
        }
      }
    }
    expect(mismatches).toEqual([]);
  });
});
