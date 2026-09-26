import abcjs, { type AbcVisualParams, type SynthOptions, type TuneObject } from 'abcjs';
import 'abcjs/abcjs-audio.css';
import type { ChordEvent } from '../../domain/chordChart';
import type { PlaybackMode } from '../settings';
import type { AbcAdapter, Player, PlayerOptions, RenderOptions, Score } from './types';

/** abcjs's default left and right padding, in unscaled units. */
const PADDING = 15;
/** Roughly how wide a bar is at scale 1, used to choose the number of bars per line. */
const BAR_WIDTH = 120;

/**
 * Rendering options: transposition, zoom and fit to width. The score is laid out for the width
 * divided by the zoom scale and then scaled to fit, so zooming in gives fewer, larger bars per
 * line, on phones and wide screens alike.
 */
export function renderParams({ semitones, scale, width }: RenderOptions): AbcVisualParams {
  const staffwidth = Math.max(100, width / scale - 2 * PADDING);
  return {
    visualTranspose: semitones,
    responsive: 'resize',
    scale,
    staffwidth,
    wrap: {
      minSpacing: 1.2,
      maxSpacing: 2.2,
      preferredMeasuresPerLine: Math.max(4, Math.round(staffwidth / BAR_WIDTH)),
    },
    add_classes: true,
    // One SVG per staff line, so printing can keep each line on one page (ADR 9).
    oneSvgPerLine: true,
  };
}

/**
 * Audio options. abcjs plays the notes as written unless told otherwise: its sequencer subtracts
 * `visualTranspose` again. `midiTranspose` makes playback match the displayed key, chords
 * included.
 *
 * abcjs plays chord symbols as an accompaniment track. `chordsOff` leaves that track out, and
 * `voicesOff` silences the melody (its notes get velocity 0) while the chord track still plays.
 */
export function audioParams(semitones: number, playback: PlaybackMode = 'melody'): SynthOptions {
  return {
    midiTranspose: semitones,
    ...(playback === 'melody' && { chordsOff: true }),
    ...(playback === 'accompanimentOnly' && { voicesOff: true }),
  };
}

const toScore = (tune: TuneObject) => tune as unknown as Score;

/** Parses `abc` for audio, in the same transposition as the displayed score. */
function parseForAudio(abc: string, semitones: number): TuneObject {
  const [tune] = abcjs.parseOnly(abc, { visualTranspose: semitones });
  if (tune === undefined) throw new Error('The tune could not be parsed');
  return tune;
}

/** Chord symbols above the staff; other positions are annotations, not chords. */
const ANNOTATION_POSITIONS = new Set(['left', 'right', 'below', 'above']);

interface ParsedChord {
  name: string;
  position?: string;
  rel_position?: unknown;
}

interface ParsedElement {
  el_type: string;
  type?: string;
  title?: string;
  startEnding?: string;
  chord?: ParsedChord[];
}

/**
 * The chord chart events of `abc`, from the first voice of the first staff. A bar line only ends
 * a bar when music came before it, so bar lines at the start of a line make no empty bars.
 */
export function chordEvents(abc: string): ChordEvent[] {
  const [tune] = abcjs.parseOnly(abc);
  const events: ChordEvent[] = [];
  let music = false;
  for (const line of tune?.lines ?? []) {
    const voice = (line.staff?.[0]?.voices?.[0] ?? []) as unknown as ParsedElement[];
    for (const element of voice) {
      if (element.el_type === 'part') {
        events.push({ kind: 'part', value: element.title ?? '' });
      } else if (element.el_type === 'bar') {
        const type = element.type ?? '';
        const ends = type === 'bar_right_repeat' || type === 'bar_dbl_repeat';
        const starts = type === 'bar_left_repeat' || type === 'bar_dbl_repeat';
        if (ends) events.push({ kind: 'repeatEnd' });
        if (music) events.push({ kind: 'bar' });
        music = false;
        if (starts) events.push({ kind: 'repeatStart' });
        if (element.startEnding !== undefined) {
          events.push({ kind: 'ending', value: element.startEnding });
        }
      } else if (element.el_type === 'note') {
        music = true;
        for (const chord of element.chord ?? []) {
          const annotation =
            chord.rel_position !== undefined ||
            (chord.position !== undefined && ANNOTATION_POSITIONS.has(chord.position));
          if (!annotation) events.push({ kind: 'chord', value: chord.name });
        }
      }
    }
  }
  if (music) events.push({ kind: 'bar' });
  return events;
}

function createPlayer(abc: string, { semitones, playback, tempo, onEnded }: PlayerOptions): Player {
  const controller = new abcjs.synth.SynthController();
  // The controller's own (English) buttons are built in a detached element and never shown;
  // the page has translated controls.
  controller.load(document.createElement('div'), { onFinished: onEnded }, { displayPlay: false });
  let warp = tempo;
  let loaded = false;
  let disposed = false;

  const load = async () => {
    if (loaded) return;
    // The starting tempo. setWarp() would prepare the audio twice on the first play.
    (controller as unknown as { warp: number }).warp = warp;
    // `true`: called from a user gesture, so abcjs may start the AudioContext and load the soundfont.
    const response = await controller.setTune(
      parseForAudio(abc, semitones),
      true,
      audioParams(semitones, playback),
    );
    if (response.status !== 'created') {
      throw new Error(`Audio could not be initialised: ${response.status}`);
    }
    // A soundfont that fails to load does not reject; it only lists the missing notes.
    const notes = (response as { notesStatus?: { loaded: string[]; cached: string[] } })
      .notesStatus;
    if (notes && notes.loaded.length + notes.cached.length === 0) {
      throw new Error('The soundfont could not be loaded');
    }
    loaded = true;
  };

  return {
    async play() {
      await load();
      // The page may have been left while the soundfont was loading.
      if (disposed) return;
      // Typed as void, but returns a promise that rejects if the AudioContext cannot resume.
      await (controller.play() as unknown as Promise<unknown>);
    },
    pause() {
      controller.pause();
    },
    restart() {
      controller.restart();
    },
    async setTempo(percent) {
      warp = percent;
      if (loaded) await controller.setWarp(percent);
    },
    dispose() {
      disposed = true;
      controller.pause();
      (controller as unknown as { destroy(): void }).destroy();
    },
  };
}

export const abcjsAdapter: AbcAdapter = {
  renderScore(element, abc, options) {
    const [tune] = abcjs.renderAbc(element, abc, renderParams(options));
    return toScore(tune);
  },
  supportsAudio: () => abcjs.synth.supportsAudio(),
  createPlayer,
  chordEvents,
};
