import type { ReactNode, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { ChordChartIcon, MoreIcon, NotesChordsIcon, NotesIcon, PauseIcon, PlayIcon } from './icons';
import type { DisplayMode } from './settings';
import { iconButtonClass } from './styles';
import type { PlayerStatus } from './usePlayer';

interface BottomBarProps {
  /** The transposition stepper, or nothing when the key cannot be transposed. */
  transposition: ReactNode;
  playerStatus: PlayerStatus;
  canPlay: boolean;
  onPlay: () => void;
  onPause: () => void;
  moreButton: Ref<HTMLButtonElement>;
  onMore: () => void;
  /** The display mode shown, which the View button's icon reflects. */
  displayMode: DisplayMode;
  viewButton: Ref<HTMLButtonElement>;
  onView: () => void;
}

const VIEW_ICONS: Record<DisplayMode, () => React.JSX.Element> = {
  notes: NotesIcon,
  notesAndChords: NotesChordsIcon,
  chordChart: ChordChartIcon,
};

const primaryButtonClass =
  'inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-700 text-white focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:outline-none disabled:opacity-40 dark:bg-amber-500 dark:text-stone-950';

/**
 * The tune page's controls, fixed to the bottom of the screen within thumb reach: transpose,
 * play, View (display and playback modes) and "More". Clears the iPhone home indicator with the safe-area inset.
 */
export function BottomBar({
  transposition,
  playerStatus,
  canPlay,
  onPlay,
  onPause,
  moreButton,
  onMore,
  displayMode,
  viewButton,
  onView,
}: BottomBarProps) {
  const { t } = useTranslation();
  const playing = playerStatus === 'playing';
  const ViewIcon = VIEW_ICONS[displayMode];

  return (
    <div
      role="group"
      aria-label={t('tune.controls')}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-300 bg-stone-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-700 dark:bg-stone-900/95 print:hidden"
    >
      <p
        aria-live="polite"
        className="mx-auto max-w-3xl px-4 text-sm text-stone-700 empty:hidden dark:text-stone-300"
      >
        {playerStatus === 'loading' && t('player.loading')}
        {playerStatus === 'error' && t('player.error')}
      </p>
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-2 py-2">
        <div className="flex min-w-0 flex-1">{transposition}</div>
        <button
          type="button"
          aria-label={playing ? t('player.pause') : t('player.play')}
          disabled={!canPlay}
          onClick={playing ? onPause : onPlay}
          className={primaryButtonClass}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          ref={viewButton}
          type="button"
          aria-label={t('view.button', { mode: t(`view.display.${displayMode}`) })}
          aria-haspopup="dialog"
          onClick={onView}
          className={iconButtonClass}
        >
          <ViewIcon />
        </button>
        <button
          ref={moreButton}
          type="button"
          aria-label={t('tune.more')}
          aria-haspopup="dialog"
          onClick={onMore}
          className={iconButtonClass}
        >
          <MoreIcon />
        </button>
      </div>
    </div>
  );
}
