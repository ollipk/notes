import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AbcAdapter, Player, Score } from './abc/types';
import { PauseIcon, PlayIcon, RestartIcon } from './icons';
import { controlClass, iconButtonClass, labelClass } from './styles';

/** Tempo choices in percent of the written tempo. Slower is the main learning feature. */
export const TEMPOS = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120] as const;

type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface PlaybackControlsProps {
  adapter: AbcAdapter | undefined;
  score: Score | undefined;
  /** The transposition the score is shown in; playback uses the same key. */
  semitones: number;
  tempo: number;
  onTempoChange: (tempo: number) => void;
}

/**
 * Play/pause, restart and tempo. Audio starts only from the Play button. Mount a new instance
 * (with a React `key`) when the tune, variant or transposition changes; unmounting stops playback.
 */
export function PlaybackControls({
  adapter,
  score,
  semitones,
  tempo,
  onTempoChange,
}: PlaybackControlsProps) {
  const { t, i18n } = useTranslation();
  const tempoId = useId();
  const [status, setStatus] = useState<Status>('idle');
  const player = useRef<Player | null>(null);

  useEffect(
    () => () => {
      player.current?.dispose();
      player.current = null;
    },
    [],
  );

  const fail = () => {
    player.current?.dispose();
    player.current = null;
    setStatus('error');
  };

  const play = async () => {
    if (!adapter || !score) return;
    if (!adapter.supportsAudio()) {
      setStatus('error');
      return;
    }
    player.current ??= adapter.createPlayer(score, {
      semitones,
      tempo,
      onEnded: () => setStatus('paused'),
    });
    setStatus('loading');
    try {
      await player.current.play();
      setStatus('playing');
    } catch {
      fail();
    }
  };

  const pause = () => {
    player.current?.pause();
    setStatus('paused');
  };

  const changeTempo = (next: number) => {
    onTempoChange(next);
    player.current?.setTempo(next).catch(fail);
  };

  const percent = new Intl.NumberFormat(i18n.resolvedLanguage, { style: 'percent' });
  const playing = status === 'playing';

  return (
    <div role="group" aria-label={t('player.label')} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <button
          type="button"
          aria-label={playing ? t('player.pause') : t('player.play')}
          disabled={!adapter || !score || status === 'loading'}
          onClick={playing ? pause : () => void play()}
          className={iconButtonClass}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          type="button"
          aria-label={t('player.restart')}
          disabled={status !== 'playing' && status !== 'paused'}
          onClick={() => player.current?.restart()}
          className={iconButtonClass}
        >
          <RestartIcon />
        </button>
        <div className="flex flex-col gap-1">
          <label htmlFor={tempoId} className={labelClass}>
            {t('player.tempo')}
          </label>
          <select
            id={tempoId}
            value={tempo}
            onChange={(event) => changeTempo(Number(event.target.value))}
            className={controlClass}
          >
            {TEMPOS.map((value) => (
              <option key={value} value={value}>
                {percent.format(value / 100)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p aria-live="polite" className="text-sm text-stone-700 dark:text-stone-300">
        {status === 'loading' && t('player.loading')}
        {status === 'error' && t('player.error')}
      </p>
    </div>
  );
}
