import { useCallback, useMemo } from 'react';
import {
  capoSuggestion,
  type CapoSuggestion,
  transposeChordSymbol,
  buildChordChart,
  type ChordChart,
  hasChords,
  withoutChordSymbols,
  transposeKey,
  type Key,
  type TuneVariant,
} from '@notes/domain';
import type { AbcAdapter } from './abc/types';
import type { DisplayMode, PlaybackMode, PlayerSettings } from './settings';

interface ChordViewOptions {
  variant: TuneVariant;
  /** The ABC prepared for the renderer, with its chord symbols. */
  source: string;
  /** The written key, when the tune can be transposed. */
  writtenKey: Key | undefined;
  semitones: number;
  settings: PlayerSettings;
  adapter: AbcAdapter | undefined;
}

export interface ChordView {
  hasChords: boolean;
  /** What is shown. A tune without chords shows its notes, whatever the setting. */
  displayMode: DisplayMode;
  /** The ABC for the score: without chord symbols in "notes" mode. */
  scoreSource: string;
  /** A tune without chords plays its melody, whatever the setting. */
  playback: PlaybackMode;
  /** The capo banner's suggestion, when capo shapes are on and chords are shown. */
  capo: CapoSuggestion | undefined;
  /** The chord chart, in chart mode once the adapter has loaded. */
  chart: ChordChart | undefined;
  /** A chord symbol as shown: transposed, as a capo shape when capo shapes are on. */
  displayChord: (symbol: string) => string;
}

/**
 * How the tune's chords are shown and played, from the device settings (ADR 10). The settings
 * are never changed here: a tune without chords only falls back for itself.
 */
export function useChordView({
  variant,
  source,
  writtenKey,
  semitones,
  settings,
  adapter,
}: ChordViewOptions): ChordView {
  const chords = useMemo(() => hasChords(variant), [variant]);
  const displayMode: DisplayMode = chords ? settings.displayMode : 'notes';
  const scoreSource = useMemo(
    () => (displayMode === 'notes' ? withoutChordSymbols(source) : source),
    [displayMode, source],
  );

  const capo =
    chords && settings.capoShapes && displayMode !== 'notes' && writtenKey !== undefined
      ? capoSuggestion(transposeKey(writtenKey, semitones))
      : undefined;
  const capoFret = capo?.capo ?? 0;

  const chart = useMemo(
    () =>
      displayMode === 'chordChart' && adapter !== undefined
        ? buildChordChart(adapter.chordEvents(source))
        : undefined,
    [displayMode, adapter, source],
  );

  const displayChord = useCallback(
    (symbol: string) => {
      if (writtenKey === undefined) return symbol;
      // Capo shapes sound `capoFret` semitones higher than they are fingered.
      const shift = semitones - capoFret;
      return transposeChordSymbol(symbol, shift, transposeKey(writtenKey, shift), 'music');
    },
    [writtenKey, semitones, capoFret],
  );

  return {
    hasChords: chords,
    displayMode,
    scoreSource,
    playback: chords ? settings.playbackMode : 'melody',
    capo,
    chart,
    displayChord,
  };
}
