import abcjs, { type AbcVisualParams, type SynthOptions, type TuneObject } from 'abcjs';
import 'abcjs/abcjs-audio.css';
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
  };
}

/**
 * Audio options. abcjs plays the notes as written unless told otherwise: its sequencer subtracts
 * `visualTranspose` again. `midiTranspose` makes playback match the displayed key.
 */
export function audioParams(semitones: number): SynthOptions {
  return { midiTranspose: semitones };
}

const toScore = (tune: TuneObject) => tune as unknown as Score;
const toTune = (score: Score) => score as unknown as TuneObject;

function createPlayer(score: Score, { semitones, tempo, onEnded }: PlayerOptions): Player {
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
    const response = await controller.setTune(toTune(score), true, audioParams(semitones));
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
};
