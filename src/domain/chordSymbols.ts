import { parseChord } from './chord';
import type { Tune, TuneVariant } from './tune';

/** Header or body field lines such as `K:`, `P:` or `w:`; they never contain chord symbols. */
const FIELD_LINE = /^[A-Za-z+]:/;
const KEY_LINE = /^K:/;
/** A quoted string: a chord symbol, or an annotation when it starts with ^ _ < > or @. */
const QUOTED = /"([^"\n]*)"/g;
const ANNOTATION = /^[\^_<>@]/;

/** Splits a music line into the part before a `%` comment and the comment. */
function splitComment(line: string): [string, string] {
  const index = line.indexOf('%');
  return index === -1 ? [line, ''] : [line.slice(0, index), line.slice(index)];
}

/** Whether a line index is in the tune body (after the first `K:` line) and holds music. */
function bodyMusicLines(lines: readonly string[]): boolean[] {
  const keyIndex = lines.findIndex((line) => KEY_LINE.test(line));
  return lines.map((line, index) => keyIndex !== -1 && index > keyIndex && !FIELD_LINE.test(line));
}

/**
 * The chord symbols in a tune body, as written, in order. Annotations (`"^text"`), comments and
 * header fields are skipped.
 */
export function chordSymbols(abc: string): string[] {
  const lines = abc.split(/\r?\n/);
  const music = bodyMusicLines(lines);
  return lines.flatMap((line, index) => {
    if (!music[index]) return [];
    const [code] = splitComment(line);
    return [...code.matchAll(QUOTED)]
      .map((match) => match[1] ?? '')
      .filter((text) => !ANNOTATION.test(text));
  });
}

/** Whether a variant has at least one chord symbol that can be read as a chord. */
export function hasChords(variant: Pick<TuneVariant, 'abc'>): boolean {
  return chordSymbols(variant.abc).some((symbol) => parseChord(symbol).ok);
}

/** Whether any variant of a tune has chords. */
export function tuneHasChords(tune: Tune): boolean {
  return tune.variants.some(hasChords);
}

/**
 * The ABC without its chord symbols, for showing the melody alone. abcjs has no option to hide
 * them, and hiding the drawn text would leave its space above every staff. Annotations stay.
 */
export function withoutChordSymbols(abc: string): string {
  const lines = abc.split(/\r?\n/);
  const music = bodyMusicLines(lines);
  return lines
    .map((line, index) => {
      if (!music[index]) return line;
      const [code, comment] = splitComment(line);
      return (
        code.replace(QUOTED, (quoted: string, text: string) =>
          ANNOTATION.test(text) ? quoted : '',
        ) + comment
      );
    })
    .join('\n');
}
