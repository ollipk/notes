import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseKey } from '../domain/key';
import { scoreAbc } from '../domain/scoreAbc';
import type { Tune, TuneVariant, VariantId } from '../domain/tune';
import type { Score } from './abc/types';
import { useAbcAdapter } from './abc/useAbcAdapter';
import { PlaybackControls } from './PlaybackControls';
import { ScoreView } from './ScoreView';
import { linkClass } from './styles';
import { TranspositionControls } from './TranspositionControls';
import { TuneDetails } from './TuneDetails';
import { TuneMeta } from './TuneMeta';
import { useZoom } from './useZoom';
import { VariantSelect } from './VariantSelect';
import { ZoomControls } from './ZoomControls';

interface TunePageProps {
  tune: Tune;
  variant: TuneVariant;
  /** Transposition from the URL. Ignored when the tune's key cannot be transposed. */
  semitones: number;
  homeHref: string;
  onVariantChange: (variantId: VariantId) => void;
  onSemitonesChange: (semitones: number) => void;
}

export function TunePage({
  tune,
  variant,
  semitones,
  homeHref,
  onVariantChange,
  onSemitonesChange,
}: TunePageProps) {
  const { t, i18n } = useTranslation();
  const abc = useAbcAdapter();
  const zoom = useZoom();
  const [tempo, setTempo] = useState(100);
  const [score, setScore] = useState<Score>();

  const writtenKey = useMemo(() => parseKey(variant.key), [variant.key]);
  const shownSemitones = writtenKey.ok ? semitones : 0;
  const source = useMemo(() => scoreAbc(variant.abc), [variant.abc]);
  const [title, ...alternateTitles] = variant.titles;
  const alternates = new Intl.ListFormat(i18n.resolvedLanguage, { type: 'unit' }).format(
    alternateTitles,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-4 sm:px-8 sm:py-8">
      <a href={homeHref} className={linkClass}>
        {t('tune.back')}
      </a>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {alternateTitles.length > 0 && (
          <p className="text-lg text-stone-700 dark:text-stone-300">
            {t('tune.alsoKnownAs', { titles: alternates })}
          </p>
        )}
        <TuneMeta variant={variant} />
      </header>

      {tune.variants.length > 1 && (
        <VariantSelect
          variants={tune.variants}
          value={variant.variantId}
          onChange={onVariantChange}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        {writtenKey.ok && (
          <TranspositionControls
            writtenKey={writtenKey.value}
            semitones={shownSemitones}
            onChange={onSemitonesChange}
          />
        )}
        <ZoomControls
          canZoomOut={zoom.canZoomOut}
          canZoomIn={zoom.canZoomIn}
          onZoomOut={zoom.zoomOut}
          onZoomIn={zoom.zoomIn}
        />
      </div>

      <PlaybackControls
        key={[tune.id, variant.variantId, shownSemitones].join('/')}
        adapter={abc.status === 'ready' ? abc.adapter : undefined}
        score={score}
        semitones={shownSemitones}
        tempo={tempo}
        onTempoChange={setTempo}
      />

      <ScoreView
        abc={abc}
        source={source}
        title={title}
        semitones={shownSemitones}
        scale={zoom.scale}
        onRender={setScore}
      />

      <TuneDetails variant={variant} />
    </main>
  );
}
