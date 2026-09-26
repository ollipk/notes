import { err, ok, type Result } from './result';
import { parseTunePath, type Origin, type TuneVariant, type ValidationError } from './tune';
import { isTuneType, TUNE_TYPES } from './tuneType';

interface FieldSpec {
  rank: number;
  required: boolean;
  repeatable: boolean;
  description: string;
}

/** Header fields in their required order. See tunes/README.md. */
const FIELDS: Readonly<Record<string, FieldSpec>> = {
  X: { rank: 0, required: true, repeatable: false, description: 'reference number, always 1' },
  T: { rank: 1, required: true, repeatable: true, description: 'title' },
  C: { rank: 2, required: false, repeatable: false, description: 'composer' },
  R: { rank: 3, required: true, repeatable: false, description: 'tune type' },
  O: { rank: 4, required: true, repeatable: false, description: 'origin' },
  S: { rank: 5, required: true, repeatable: false, description: 'source of the transcription' },
  Z: { rank: 6, required: true, repeatable: false, description: 'transcriber' },
  N: { rank: 7, required: false, repeatable: true, description: 'notes' },
  M: { rank: 8, required: true, repeatable: false, description: 'meter' },
  L: { rank: 9, required: true, repeatable: false, description: 'unit note length' },
  Q: { rank: 10, required: false, repeatable: false, description: 'tempo' },
  K: { rank: 11, required: true, repeatable: false, description: 'key' },
};

const FIELD_ORDER = Object.keys(FIELDS).join(', ');
const FIELD_LINE = /^([A-Za-z]):(.*)$/;
const ORIGIN = /^([A-Z]{2})(?:,\s*(\S.*))?$/;
/** Fields that describe the whole file and must not appear after K:. */
const HEADER_ONLY_IN_BODY = /^([XCROSZ]):/;

interface FieldValue {
  value: string;
  line: number;
}

/**
 * Parses and validates one tune file. Collects every problem it finds instead of stopping at
 * the first one, and never throws.
 */
export function parseTuneVariant(input: {
  path: string;
  content: string;
}): Result<TuneVariant, ValidationError[]> {
  const { path, content } = input;
  const errors: ValidationError[] = [];
  const report = (message: string, line?: number, field?: string) => {
    errors.push({
      path,
      ...(line === undefined ? {} : { line }),
      ...(field === undefined ? {} : { field }),
      message,
    });
  };

  const ids = parseTunePath(path);
  if (!ids.ok) {
    errors.push(ids.error);
  }

  const lines = content.split(/\r?\n/);
  const fields = new Map<string, FieldValue[]>();
  let lastRank = -1;
  let keyIndex = -1;
  let reportedStrayLine = false;

  for (const [index, text] of lines.entries()) {
    const line = index + 1;
    if (text.startsWith('%')) continue;
    if (text.trim() === '') {
      if (fields.size > 0) {
        report('Blank lines are not allowed in the header. The header ends with K:.', line);
      }
      continue;
    }

    const match = FIELD_LINE.exec(text);
    const letter = match?.[1];
    if (letter === undefined) {
      if (!reportedStrayLine) {
        report(
          `Expected a header field before the music. Header fields, in order: ${FIELD_ORDER}.`,
          line,
        );
        reportedStrayLine = true;
      }
      continue;
    }
    const spec = FIELDS[letter];
    if (spec === undefined) {
      report(
        `is not allowed in the header. Allowed fields, in order: ${FIELD_ORDER}.`,
        line,
        letter,
      );
      continue;
    }
    if (fields.size === 0 && letter !== 'X') {
      report('The file must start with X:1.', line, 'X');
    }

    const existing = fields.get(letter);
    if (existing !== undefined && !spec.repeatable) {
      report('appears more than once. Only T: and N: may repeat.', line, letter);
    } else if (spec.rank < lastRank) {
      report(
        `is out of order. Header fields must appear in this order: ${FIELD_ORDER}.`,
        line,
        letter,
      );
    }
    fields.set(letter, [...(existing ?? []), { value: (match?.[2] ?? '').trim(), line }]);
    lastRank = Math.max(lastRank, spec.rank);

    if (letter === 'K') {
      keyIndex = index;
      break;
    }
  }

  for (const [letter, spec] of Object.entries(FIELDS)) {
    const values = fields.get(letter);
    if (values === undefined) {
      const misplaced =
        keyIndex >= 0
          ? lines.findIndex((text, i) => i > keyIndex && text.startsWith(`${letter}:`))
          : -1;
      if (misplaced >= 0) {
        // Header-only fields in the body are reported by checkBody.
        if (spec.required && !HEADER_ONLY_IN_BODY.test(`${letter}:`)) {
          report('must be in the header. K: must be the last header field.', misplaced + 1, letter);
        }
      } else if (spec.required) {
        const hint =
          letter === 'K' ? ' K: must be the last header line, directly before the music.' : '';
        report(
          `Missing required field ${letter}: (${spec.description}).${hint}`,
          undefined,
          letter,
        );
      }
      continue;
    }
    for (const { value, line } of values) {
      if (value === '') {
        report(`is empty. Add the ${spec.description}.`, line, letter);
      }
    }
  }

  const reference = fields.get('X')?.[0];
  if (reference !== undefined && reference.value !== '' && reference.value !== '1') {
    report(`must be 1, found "${reference.value}". Use one file per tune.`, reference.line, 'X');
  }

  const rhythm = fields.get('R')?.[0];
  if (rhythm !== undefined && rhythm.value !== '' && !isTuneType(rhythm.value)) {
    const lower = rhythm.value.toLowerCase();
    report(
      isTuneType(lower)
        ? `"${rhythm.value}" must be lowercase: "${lower}".`
        : `"${rhythm.value}" is not a known tune type. Allowed: ${TUNE_TYPES.join(', ')}. ` +
            'Use "other" if none fits, and propose a new type in a PR.',
      rhythm.line,
      'R',
    );
  }

  const origin = fields.get('O')?.[0];
  if (origin !== undefined && origin.value !== '' && !ORIGIN.test(origin.value)) {
    report(
      `"${origin.value}" is not a valid origin. Use a two-letter uppercase ISO 3166-1 country ` +
        'code, optionally followed by a comma and a region, e.g. "FI, Kaustinen" or "IE".',
      origin.line,
      'O',
    );
  }

  if (keyIndex >= 0) {
    checkBody(lines, keyIndex, report);
  }

  if (!ids.ok || errors.length > 0) {
    return err(errors);
  }

  const first = (letter: string) => fields.get(letter)?.[0]?.value;
  const all = (letter: string) => (fields.get(letter) ?? []).map(({ value }) => value);
  const [primaryTitle = '', ...alternateTitles] = all('T');
  const [, country = '', region] = ORIGIN.exec(first('O') ?? '') ?? [];
  const composer = first('C');
  const tempo = first('Q');
  const type = first('R') ?? '';

  return ok({
    ...ids.value,
    titles: [primaryTitle, ...alternateTitles],
    ...(composer === undefined ? {} : { composer }),
    type: isTuneType(type) ? type : 'other',
    origin: (region === undefined ? { country } : { country, region }) satisfies Origin,
    source: first('S') ?? '',
    transcriber: first('Z') ?? '',
    notes: all('N'),
    meter: first('M') ?? '',
    unitLength: first('L') ?? '',
    ...(tempo === undefined ? {} : { tempo }),
    key: first('K') ?? '',
    abc: content,
  });
}

function checkBody(
  lines: readonly string[],
  keyIndex: number,
  report: (message: string, line?: number, field?: string) => void,
) {
  const isContent = (text: string) => text.trim() !== '' && !text.startsWith('%');
  const body = lines.slice(keyIndex + 1);
  const lastContent = body.findLastIndex(isContent);

  if (lastContent < 0) {
    report('The tune has no music after K:.', keyIndex + 1, 'K');
    return;
  }

  let reportedBlank = false;
  for (const [offset, text] of body.entries()) {
    const line = keyIndex + 2 + offset;
    if (text.trim() === '' && offset < lastContent && !reportedBlank) {
      report(
        'Blank line inside the tune. In ABC a blank line ends the tune; remove it or use a % comment line.',
        line,
      );
      reportedBlank = true;
    }
    const letter = HEADER_ONLY_IN_BODY.exec(text)?.[1];
    if (letter === 'X') {
      report('Found a second X:. Put exactly one tune in each file.', line, 'X');
    } else if (letter !== undefined) {
      report('must be in the header, before K:.', line, letter);
    }
  }
}
