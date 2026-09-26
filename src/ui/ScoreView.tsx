import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AbcAdapterState } from './abc/useAbcAdapter';

/** Used until the container can be measured (and in jsdom, which has no layout). */
const FALLBACK_WIDTH = 360;
/** Re-render only when the width changes noticeably, e.g. on rotation. */
const MIN_WIDTH_CHANGE = 8;
const RESIZE_DELAY_MS = 150;
/**
 * Widest the score gets at scale 1. Phones are narrower, so the score fits their width; on wider
 * screens the zoom changes how wide the score is drawn.
 */
const MAX_WIDTH_AT_SCALE_1 = 560;
/**
 * Layout width for printing, about the printable width of A4 and Letter at 12 mm margins. The
 * printed score is scaled to the exact page width.
 */
const PRINT_WIDTH = 700;

interface ScoreViewProps {
  abc: AbcAdapterState;
  /** ABC text prepared for rendering (see `scoreAbc`). */
  source: string;
  title: string;
  semitones: number;
  scale: number;
  /** Focus mode: fill the available width and height, without the card's frame. */
  maximized?: boolean;
}

const cardClass =
  'score-card mx-auto w-full rounded-xl bg-white p-2 text-black shadow-sm ring-1 ring-stone-300 sm:p-4 dark:ring-stone-600';
const maximizedClass = 'min-h-full w-full bg-white p-2 text-black sm:p-4';

/** The sheet music, on a white "paper" card in light and dark mode so black notation stays readable. */
export function ScoreView({
  abc,
  source,
  title,
  semitones,
  scale,
  maximized = false,
}: ScoreViewProps) {
  const { t } = useTranslation();
  const container = useRef<HTMLDivElement>(null);
  const renderedWidth = useRef(0);
  const [width, setWidth] = useState(0);
  const adapter = abc.status === 'ready' ? abc.adapter : undefined;

  useEffect(() => {
    const element = container.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry?.contentRect.width ?? 0);
      if (next === 0 || Math.abs(next - renderedWidth.current) < MIN_WIDTH_CHANGE) return;
      clearTimeout(timer);
      timer = setTimeout(() => setWidth(next), RESIZE_DELAY_MS);
    });
    observer.observe(element);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!element || !adapter) return;
    const available = width || element.clientWidth || FALLBACK_WIDTH;
    renderedWidth.current = available;
    adapter.renderScore(element, source, { semitones, scale, width: available });

    // Print the same key and variant at the same size on every device: lay the score out for
    // the printed page, not for the phone it was opened on, and restore it afterwards.
    const renderForPrint = () => {
      adapter.renderScore(element, source, { semitones, scale: 1, width: PRINT_WIDTH });
    };
    const renderForScreen = () => {
      adapter.renderScore(element, source, { semitones, scale, width: available });
    };
    window.addEventListener('beforeprint', renderForPrint);
    window.addEventListener('afterprint', renderForScreen);
    return () => {
      window.removeEventListener('beforeprint', renderForPrint);
      window.removeEventListener('afterprint', renderForScreen);
    };
  }, [adapter, source, semitones, scale, width]);

  return (
    <div
      style={maximized ? undefined : { maxWidth: MAX_WIDTH_AT_SCALE_1 * scale }}
      className={maximized ? maximizedClass : cardClass}
    >
      {abc.status === 'loading' && <p className="p-4 text-stone-700">{t('score.loading')}</p>}
      {abc.status === 'error' && (
        <p role="alert" className="p-4 text-red-800">
          {t('score.error')}
        </p>
      )}
      <div ref={container} role="img" aria-label={t('score.label', { title })} />
    </div>
  );
}
