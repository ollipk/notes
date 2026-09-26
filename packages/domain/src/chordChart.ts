/**
 * A chord chart built from a neutral list of events, so the domain never sees the renderer's
 * types. The adapter turns a parsed tune into events; this module gives them structure.
 */

/**
 * One event in playing order:
 *
 * - `chord`: a chord symbol (`value`) in the current bar.
 * - `bar`: the current bar ends. Only bars with music end with this event, so a bar line at the
 *   start of a line or tune does not make an empty bar.
 * - `repeatEnd`: the current bar ends a repeat. It comes before its `bar` event.
 * - `repeatStart`, `ending`: the next bar starts a repeat, or a numbered ending (`value`, e.g. `1`
 *   or `2`). They come after the previous bar's `bar` event.
 * - `part`: a `P:` field; the next bar starts a part with this label (`value`).
 */
export interface ChordEvent {
  kind: 'bar' | 'chord' | 'part' | 'repeatStart' | 'repeatEnd' | 'ending';
  value?: string;
}

export interface ChartBar {
  /** Chord symbols as written, in order; one symbol fills the bar, more share it. */
  chords: string[];
  /** No chord was written in this bar: `chords` repeats the previous chord. */
  carried?: boolean;
  repeatStart?: boolean;
  repeatEnd?: boolean;
  /** The numbered ending this bar starts, e.g. `1` or `2`. */
  ending?: string;
}

export interface ChartPart {
  /** From a `P:` field, or inferred from repeats as A, B, C, … */
  label: string;
  bars: ChartBar[];
}

export interface ChordChart {
  parts: ChartPart[];
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const inferredLabel = (index: number) => LETTERS[index % LETTERS.length] ?? '';

interface PendingBar {
  chords: string[];
  repeatStart: boolean;
  repeatEnd: boolean;
  ending?: string;
  /** Label of a `P:` field just before this bar. */
  part?: string;
}

const emptyBar = (): PendingBar => ({ chords: [], repeatStart: false, repeatEnd: false });

/**
 * Groups events into parts and bars.
 *
 * - Parts come from `P:` fields in the tune body. Without them, a part starts at a repeat start,
 *   or at the first bar after a repeat end that is not a numbered ending: A, B, C, …
 * - A bar without a chord symbol repeats the previous chord, marked as carried.
 * - A bar without chords at the start of the tune or of a `P:` part is taken to be a pickup and
 *   dropped.
 */
export function buildChordChart(events: readonly ChordEvent[]): ChordChart {
  const labelled = events.some(({ kind }) => kind === 'part');
  const parts: ChartPart[] = [];
  let pending = emptyBar();
  let hasContent = false;
  let lastChord: string | undefined;
  let afterRepeatEnd = false;
  let barCount = 0;

  const close = () => {
    const bar = pending;
    pending = emptyBar();
    hasContent = false;
    barCount += 1;
    if (bar.chords.length === 0 && (barCount === 1 || bar.part !== undefined)) {
      // A pickup, before the tune or a P: part. Its markers belong to the first full bar.
      pending.repeatStart = bar.repeatStart;
      if (bar.part !== undefined) pending.part = bar.part;
      return;
    }

    const current = parts.at(-1);
    const startsPart = labelled
      ? bar.part !== undefined || current === undefined
      : current === undefined ||
        (current.bars.length > 0 &&
          (bar.repeatStart || (afterRepeatEnd && bar.ending === undefined)));
    if (startsPart) {
      parts.push({ label: labelled ? (bar.part ?? '') : inferredLabel(parts.length), bars: [] });
    }
    afterRepeatEnd = bar.repeatEnd;

    const chartBar: ChartBar = { chords: bar.chords };
    if (bar.chords.length === 0 && lastChord !== undefined) {
      chartBar.chords = [lastChord];
      chartBar.carried = true;
    }
    lastChord = chartBar.chords.at(-1) ?? lastChord;
    if (bar.repeatStart) chartBar.repeatStart = true;
    if (bar.repeatEnd) chartBar.repeatEnd = true;
    if (bar.ending !== undefined) chartBar.ending = bar.ending;
    parts.at(-1)?.bars.push(chartBar);
  };

  for (const { kind, value } of events) {
    switch (kind) {
      case 'chord':
        if (value !== undefined) pending.chords.push(value);
        hasContent = true;
        break;
      case 'bar':
        close();
        break;
      case 'repeatEnd':
        pending.repeatEnd = true;
        break;
      case 'repeatStart':
        pending.repeatStart = true;
        break;
      case 'ending':
        if (value !== undefined) pending.ending = value;
        break;
      case 'part':
        pending.part = value ?? '';
        break;
    }
  }
  if (hasContent) close();

  return { parts: parts.filter(({ bars }) => bars.length > 0) };
}

/** Whether a chart has any chord to show. */
export function chartHasChords(chart: ChordChart): boolean {
  return chart.parts.some(({ bars }) => bars.some(({ chords }) => chords.length > 0));
}
