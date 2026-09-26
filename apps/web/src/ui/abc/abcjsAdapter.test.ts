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
  scoreAbc,
} from '@notes/domain';
import type { PlaybackMode } from '../settings';
import { audioParams, chordEvents, renderParams } from './abcjsAdapter';

const tune = (key: string, body: string) =>
  scoreAbc(`X:1\nT:Test\nM:4/4\nL:1/4\nK:${key}\n${body}\n`);

function parse(abc: string, semitones: number) {
  const [parsed] = abcjs.parseOnly(abc, renderParams({ semitones, scale: 1, width: 400 }));
  if (parsed === undefined) throw new Error('No tune parsed');
  return parsed;
}

function notes(abc: string, semitones: number, playback: PlaybackMode) {
  const { tracks } = parse(abc, semitones).setUpAudio(audioParams(semitones, playback));
  return tracks.map((track) => track.filter((e) => e.cmd === 'note'));
}

function notePitches(abc: string, semitones: number): number[][] {
  return notes(abc, semitones, 'melodyAndAccompaniment').map((track) => track.map((e) => e.pitch));
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

  it('plays the melody alone, with accompaniment, or the accompaniment alone', () => {
    const abc = tune('C', '"C"CEGc|"G"GBdg|');
    const volumes = (playback: PlaybackMode) =>
      notes(abc, 0, playback).map((track) => Math.max(...track.map((e) => e.volume)));

    expect(audioParams(0, 'melody')).toEqual({ midiTranspose: 0, chordsOff: true });
    expect(audioParams(3, 'accompanimentOnly')).toEqual({ midiTranspose: 3, voicesOff: true });
    expect(audioParams(-2, 'melodyAndAccompaniment')).toEqual({ midiTranspose: -2 });

    // One track per voice, then the chord track when chords play.
    expect(volumes('melody')).toHaveLength(1);
    const [melody, chords] = volumes('melodyAndAccompaniment');
    expect(melody).toBeGreaterThan(0);
    expect(chords).toBeGreaterThan(0);
    const [silentMelody, onlyChords] = volumes('accompanimentOnly');
    expect(silentMelody).toBe(0);
    expect(onlyChords).toBeGreaterThan(0);
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

  describe('chordEvents', () => {
    it('lists bars, chords, repeats and endings in playing order', () => {
      const abc = tune('G', '|:"G"G2 "D7"AB|[1"C"c4:|[2"D"d4|]\n|:"Em"E4|"^slow"E4:|');
      expect(chordEvents(abc)).toEqual([
        { kind: 'repeatStart' },
        { kind: 'chord', value: 'G' },
        { kind: 'chord', value: 'D7' },
        { kind: 'bar' },
        { kind: 'ending', value: '1' },
        { kind: 'chord', value: 'C' },
        { kind: 'repeatEnd' },
        { kind: 'bar' },
        { kind: 'ending', value: '2' },
        { kind: 'chord', value: 'D' },
        { kind: 'bar' },
        { kind: 'repeatStart' },
        { kind: 'chord', value: 'Em' },
        { kind: 'bar' },
        { kind: 'repeatEnd' },
        { kind: 'bar' },
      ]);
    });

    it('reports P: fields in the body as parts', () => {
      const abc = tune('D', 'P:A\n"D"D4|\nP:B\n"G"G4|');
      expect(chordEvents(abc)).toEqual([
        { kind: 'part', value: 'A' },
        { kind: 'chord', value: 'D' },
        { kind: 'bar' },
        { kind: 'part', value: 'B' },
        { kind: 'chord', value: 'G' },
        { kind: 'bar' },
      ]);
    });

    it('ends a last bar without a bar line, with the accidental signs abcjs uses', () => {
      expect(chordEvents(tune('C', '"Bb/F"C4|"C"c4'))).toEqual([
        { kind: 'chord', value: 'B♭/F' },
        { kind: 'bar' },
        { kind: 'chord', value: 'C' },
        { kind: 'bar' },
      ]);
    });
  });
});
