/**
 * The small interface the tune page uses for sheet music and playback. The only implementation,
 * `abcjsAdapter.ts`, is the only module that imports abcjs; it is loaded lazily with `loadAbc()`.
 * Component tests replace it with a fake, since jsdom cannot render abcjs meaningfully.
 */

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
  /** Must be the same transposition the score was rendered with. */
  semitones: number;
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
  createPlayer(score: Score, options: PlayerOptions): Player;
}
