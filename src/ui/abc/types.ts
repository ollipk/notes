/**
 * The small interface the tune page uses for sheet music and playback. The only implementation,
 * `abcjsAdapter.ts`, is the only module that imports abcjs; it is loaded lazily with `loadAbc()`.
 * Component tests replace it with a fake, since jsdom cannot render abcjs meaningfully.
 */

import type { ChordEvent } from '../../domain/chordChart';
import type { PlaybackMode } from '../settings';

declare const scoreBrand: unique symbol;
/** A rendered score. Opaque outside the adapter. */
export interface Score {
  readonly [scoreBrand]: true;
}

export interface RenderOptions {
  /** Transposition in semitones, applied to notes, key signature and chord symbols. */
  semitones: number;
  /** Size of the notation relative to the default fit-to-width size, e.g. 1.2. */
  scale: number;
  /** Width in CSS pixels available for the score. */
  width: number;
}

export interface PlayerOptions {
  /** Must be the same transposition the score is shown in. */
  semitones: number;
  /** Melody, melody with the chords as accompaniment, or the accompaniment alone. */
  playback: PlaybackMode;
  /** Tempo as a percentage of the written tempo. */
  tempo: number;
  /** Called when playback reaches the end of the tune. */
  onEnded: () => void;
}

export interface Player {
  /** Starts or resumes playback. The first call must come from a user gesture. */
  play(): Promise<void>;
  pause(): void;
  /** Jumps back to the start, keeping the play/pause state. */
  restart(): void;
  setTempo(percent: number): Promise<void>;
  /** Stops playback and releases the audio. */
  dispose(): void;
}

export interface AbcAdapter {
  /** Renders `abc` into `element`, replacing its content. */
  renderScore(element: HTMLElement, abc: string, options: RenderOptions): Score;
  supportsAudio(): boolean;
  /**
   * A player for `abc`, which keeps its chord symbols even when the score is shown without them,
   * so accompaniment can play in every display mode, the chord chart included.
   */
  createPlayer(abc: string, options: PlayerOptions): Player;
  /**
   * The bars, repeats, parts and chord symbols of `abc`, untransposed, for the chord chart. abcjs
   * writes accidentals in chord symbols as ♯ and ♭.
   */
  chordEvents(abc: string): ChordEvent[];
}
