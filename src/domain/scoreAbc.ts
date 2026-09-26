import { formatAbcKey, parseKey, relativeMajor } from './key';

/** Header fields the tune page shows itself, translated. The renderer would print them in English. */
const PAGE_FIELDS = /^[TCROSZN]:/;
const KEY_LINE = /^K:(.*)$/;
/** Trailing `name=value` modifiers of a K: value, e.g. ` clef=bass`. */
const KEY_MODIFIERS = /(?:\s+[A-Za-z-]+=\S+)*\s*$/;

/**
 * Prepares a variant's ABC for the score renderer:
 *
 * - Drops the header fields that the page already shows (title, composer, type, origin, source,
 *   transcriber, notes), so they are not rendered twice or in the wrong language.
 * - Writes a modal key (e.g. `Edor`) as the major key with the same signature (`D`). The notes and
 *   the signature are identical, and abcjs then spells transposed signatures the same way as
 *   `transposeKey` does. It spells modal keys by their tonic alone, which can add accidentals.
 */
export function scoreAbc(abc: string): string {
  const lines = abc.split(/\r?\n/);
  const keyIndex = lines.findIndex((line) => KEY_LINE.test(line));
  if (keyIndex === -1) return abc;

  const header = lines.slice(0, keyIndex).filter((line) => !PAGE_FIELDS.test(line));
  return [...header, scoreKeyLine(lines[keyIndex] ?? ''), ...lines.slice(keyIndex + 1)].join('\n');
}

function scoreKeyLine(line: string): string {
  const value = KEY_LINE.exec(line)?.[1] ?? '';
  const key = parseKey(value);
  if (!key.ok || key.value.mode === 'major' || key.value.mode === 'minor') return line;
  const major = relativeMajor(key.value);
  if (major === undefined) return line;
  const modifiers = KEY_MODIFIERS.exec(value)?.[0].trimEnd() ?? '';
  return `K:${formatAbcKey(major)}${modifiers}`;
}
