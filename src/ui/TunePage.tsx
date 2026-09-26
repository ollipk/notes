import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseKey } from '../domain/key';
import { scoreAbc } from '../domain/scoreAbc';
import type { Tune, TuneVariant, VariantId } from '../domain/tune';
import type { Score } from './abc/types';
import { useAbcAdapter } from './abc/useAbcAdapter';
import { BottomBar } from './BottomBar';
import { BackIcon, ExitFullScreenIcon, FullScreenIcon } from './icons';
import { ScoreView } from './ScoreView';
import { Sheet } from './Sheet';
import { labelClass, plainIconButtonClass, textButtonClass } from './styles';
import { TempoControls } from './TempoControls';
import { KeyPicker, KeyStepper } from './TranspositionControls';
import { TuneDetails } from './TuneDetails';
import { TuneMeta } from './TuneMeta';
import { useFocusMode } from './useFocusMode';
import { usePlayer } from './usePlayer';
import { useZoom } from './useZoom';
import { VariantSelect } from './VariantSelect';
import { ZoomControls } from './ZoomControls';

/** Focus mode: the score card fills the screen (ADR 9). */
const focusModeClass = 'fixed inset-0 z-50 overflow-y-auto bg-white';

interface TunePageProps {
  tune: Tune;
  variant: TuneVariant;
  /** Transposition from the URL. Ignored when the tune's key cannot be transposed. */
  semitones: number;
  homeHref: string;
  /** Back to the home page, e.g. to the search results the tune was opened from. */
  onBack: () => void;
  onVariantChange: (variantId: VariantId) => void;
  onSemitonesChange: (semitones: number) => void;
}

/**
 * Score first (ADR 9): a one-line header, the score, then the details. The controls are in a bar
 * at the bottom of the screen; the less frequent ones are in the "More" sheet.
 */
export function TunePage({
  tune,
  variant,
  semitones,
  homeHref,
  onBack,
  onVariantChange,
  onSemitonesChange,
}: TunePageProps) {
  const { t, i18n } = useTranslation();
  const abc = useAbcAdapter();
  const zoom = useZoom();
  const [tempo, setTempo] = useState(100);
  const [score, setScore] = useState<Score>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const focusMode = useFocusMode();

  const writtenKey = useMemo(() => parseKey(variant.key), [variant.key]);
  const shownSemitones = writtenKey.ok ? semitones : 0;
  const source = useMemo(() => scoreAbc(variant.abc), [variant.abc]);
  const [title, ...alternateTitles] = variant.titles;
  const alternates = new Intl.ListFormat(i18n.resolvedLanguage, { type: 'unit' }).format(
    alternateTitles,
  );

  const player = usePlayer({
    adapter: abc.status === 'ready' ? abc.adapter : undefined,
    score,
    semitones: shownSemitones,
    tempo,
    resetKey: [tune.id, variant.variantId, shownSemitones].join('/'),
  });

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    moreButton.current?.focus();
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-3 px-2 pt-1 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6">
      {!focusMode.active && (
        <header className="flex min-w-0 items-center gap-1">
          <a
            href={homeHref}
            aria-label={t('tune.back')}
            onClick={(event) => {
              event.preventDefault();
              onBack();
            }}
            className={plainIconButtonClass}
          >
            <BackIcon />
          </a>
          <h1 className="min-w-0 truncate text-xl font-bold tracking-tight">{title}</h1>
        </header>
      )}

      <div className={focusMode.active ? focusModeClass : undefined}>
        <ScoreView
          abc={abc}
          source={source}
          title={title}
          semitones={shownSemitones}
          scale={zoom.scale}
          maximized={focusMode.active}
          onRender={setScore}
        />
        {focusMode.active && (
          <button
            type="button"
            aria-label={t('focus.exit')}
            onClick={focusMode.exit}
            className="fixed top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] inline-flex size-12 items-center justify-center rounded-full bg-stone-900/40 text-white opacity-70 focus:opacity-100 focus:ring-2 focus:ring-amber-600 focus:outline-none active:opacity-100"
          >
            <ExitFullScreenIcon />
          </button>
        )}
      </div>

      {!focusMode.active && (
        <div className="flex flex-col gap-4 px-2 pt-2">
          <div className="flex flex-col gap-1">
            {alternateTitles.length > 0 && (
              <p className="text-lg text-stone-700 dark:text-stone-300">
                {t('tune.alsoKnownAs', { titles: alternates })}
              </p>
            )}
            <TuneMeta variant={variant} />
          </div>
          <TuneDetails variant={variant} />
        </div>
      )}

      {!focusMode.active && (
        <BottomBar
          transposition={
            writtenKey.ok && (
              <KeyStepper
                writtenKey={writtenKey.value}
                semitones={shownSemitones}
                onChange={onSemitonesChange}
              />
            )
          }
          playerStatus={player.status}
          canPlay={player.canPlay}
          onPlay={player.play}
          onPause={player.pause}
          moreButton={moreButton}
          onMore={() => setSheetOpen(true)}
        />
      )}

      {sheetOpen && (
        <Sheet label={t('tune.more')} onClose={closeSheet}>
          {tune.variants.length > 1 && (
            <VariantSelect
              variants={tune.variants}
              value={variant.variantId}
              onChange={onVariantChange}
            />
          )}
          {writtenKey.ok && (
            <KeyPicker
              writtenKey={writtenKey.value}
              semitones={shownSemitones}
              onChange={onSemitonesChange}
            />
          )}
          <div className="flex flex-col gap-1">
            <span className={labelClass}>{t('zoom.label')}</span>
            <ZoomControls
              canZoomOut={zoom.canZoomOut}
              canZoomIn={zoom.canZoomIn}
              onZoomOut={zoom.zoomOut}
              onZoomIn={zoom.zoomIn}
            />
          </div>
          <TempoControls
            tempo={tempo}
            onTempoChange={(next) => {
              setTempo(next);
              player.setTempo(next);
            }}
            canRestart={player.canRestart}
            onRestart={player.restart}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSheetOpen(false);
                focusMode.enter();
              }}
              className={textButtonClass}
            >
              <FullScreenIcon />
              {t('focus.enter')}
            </button>
          </div>
        </Sheet>
      )}
    </main>
  );
}
