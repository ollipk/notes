import { useTranslation } from 'react-i18next';
import type { ChartBar, ChordChart as Chart } from '@notes/domain';
import { MAX_WIDTH_AT_SCALE_1, paperCardClass, paperMaximizedClass } from './ScoreView';

interface ChordChartProps {
  chart: Chart;
  title: string;
  /** Turns a chord symbol as written into the one to show (transposed, capo shapes). */
  displayChord: (symbol: string) => string;
  scale: number;
  maximized?: boolean;
}

const REPEAT_START = '‖:';
const REPEAT_END = ':‖';

/** Chord size by how many chords share a bar: one fills it, more share it evenly. */
const chordClass = (count: number) =>
  [
    count <= 1 ? 'text-[2em]' : count === 2 ? 'text-[1.5em]' : 'text-[1.15em]',
    'truncate leading-none',
  ].join(' ');

/** Carried chords (no chord written in the bar) are muted. */
const chordsClass = (carried: boolean) =>
  [
    'flex min-w-0 flex-1 items-baseline justify-around gap-1 font-semibold',
    carried ? 'text-stone-400' : '',
  ].join(' ');

function Bar({ bar, displayChord }: { bar: ChartBar; displayChord: (symbol: string) => string }) {
  const { t } = useTranslation();
  return (
    <li className="relative flex min-h-[3.5em] items-center gap-1 border-l-2 border-stone-400 px-1.5 pt-3 pb-1 print:break-inside-avoid">
      {bar.ending !== undefined && (
        <span
          aria-label={t('chart.ending', { number: bar.ending })}
          className="absolute top-0 left-0 border-t-2 border-l-2 border-stone-700 pr-3 pl-0.5 text-[0.7em] leading-tight font-semibold"
        >
          {t('chart.endingMark', { number: bar.ending })}
        </span>
      )}
      {bar.repeatStart && (
        <span
          role="img"
          aria-label={t('chart.repeatStart')}
          className="text-[0.9em] font-bold text-stone-700"
        >
          {REPEAT_START}
        </span>
      )}
      <span className={chordsClass(bar.carried === true)}>
        {bar.chords.map((chord, index) => (
          <span key={index} className={chordClass(bar.chords.length)}>
            {displayChord(chord)}
          </span>
        ))}
      </span>
      {bar.repeatEnd && (
        <span
          role="img"
          aria-label={t('chart.repeatEnd')}
          className="text-[0.9em] font-bold text-stone-700"
        >
          {REPEAT_END}
        </span>
      )}
    </li>
  );
}

/**
 * The chords of a tune bar by bar, on the same paper card as the score: each part's label on its
 * own line, then its bars, 4 to a row on phones and 8 on wide screens and paper. Carried chords
 * (bars with no chord written) are muted.
 */
export function ChordChart({
  chart,
  title,
  displayChord,
  scale,
  maximized = false,
}: ChordChartProps) {
  const { t } = useTranslation();
  const fontSize = `${scale}rem`;
  return (
    <section
      aria-label={t('chart.label', { title })}
      style={maximized ? { fontSize } : { maxWidth: MAX_WIDTH_AT_SCALE_1 * scale, fontSize }}
      className={maximized ? paperMaximizedClass : paperCardClass}
    >
      <div className="flex flex-col gap-4 p-1 sm:p-2">
        {chart.parts.map((part, index) => (
          <div key={index} className="flex flex-col gap-1 print:break-inside-avoid">
            {part.label !== '' && <h2 className="text-[1.25em] font-bold">{part.label}</h2>}
            <ol className="grid grid-cols-4 border-r-2 border-stone-400 sm:grid-cols-8 print:grid-cols-8">
              {part.bars.map((bar, barIndex) => (
                <Bar key={barIndex} bar={bar} displayChord={displayChord} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
