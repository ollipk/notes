import { useEffect, useRef, useState } from 'react';
import type { AbcAdapter, Player, Score } from './abc/types';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface UsePlayerOptions {
  adapter: AbcAdapter | undefined;
  score: Score | undefined;
  /** The transposition the score is shown in; playback uses the same key. */
  semitones: number;
  tempo: number;
  /**
   * Changes when the tune, variant or transposition changes. Playback then stops and the next
   * Play starts from the new score. Leaving the page stops it too.
   */
  resetKey: string;
}

/** Playback state. Audio starts only from `play()`, which must be called from a user gesture. */
export function usePlayer({ adapter, score, semitones, tempo, resetKey }: UsePlayerOptions) {
  const player = useRef<Player | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [statusKey, setStatusKey] = useState(resetKey);
  if (statusKey !== resetKey) {
    setStatusKey(resetKey);
    setStatus('idle');
  }

  useEffect(
    () => () => {
      player.current?.dispose();
      player.current = null;
    },
    [resetKey],
  );

  const play = async () => {
    if (!adapter || !score) return;
    if (!adapter.supportsAudio()) {
      setStatus('error');
      return;
    }
    const current = (player.current ??= adapter.createPlayer(score, {
      semitones,
      tempo,
      onEnded: () => {
        if (player.current === current) setStatus('paused');
      },
    }));
    setStatus('loading');
    try {
      await current.play();
      // Ignore the result if playback was reset while the sound was loading.
      if (player.current === current) setStatus('playing');
    } catch {
      if (player.current !== current) return;
      current.dispose();
      player.current = null;
      setStatus('error');
    }
  };

  const fail = () => {
    player.current?.dispose();
    player.current = null;
    setStatus('error');
  };

  return {
    status,
    canPlay: adapter !== undefined && score !== undefined && status !== 'loading',
    canRestart: status === 'playing' || status === 'paused',
    play: () => void play(),
    pause: () => {
      player.current?.pause();
      setStatus('paused');
    },
    restart: () => player.current?.restart(),
    setTempo: (percent: number) => {
      player.current?.setTempo(percent).catch(fail);
    },
  };
}
