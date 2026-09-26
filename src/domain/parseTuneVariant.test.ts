import { describe, expect, it } from 'vitest';
import { parseTuneVariant } from './parseTuneVariant';
import { formatValidationError, type ValidationError } from './tune';

const PATH = 'tunes/the-kesh/standard.abc';

const VALID = [
  'X:1',
  'T:The Kesh',
  'T:The Kesh Jig',
  'C:Trad.',
  'R:jig',
  'O:IE',
  'S:Learned at a session',
  'Z:A. Fiddler',
  'N:First note',
  'N:Second note',
  'M:6/8',
  'L:1/8',
  'Q:3/8=120',
  'K:G',
  '|:"G"GAG GAB|ABA ABd:|',
  'w:la la la',
].join('\n');

/** Replaces the first line starting with `prefix` (or removes it when `replacement` is null). */
function withLine(prefix: string, replacement: string | null, abc = VALID): string {
  const lines = abc.split('\n');
  const index = lines.findIndex((line) => line.startsWith(prefix));
  if (index < 0) throw new Error(`No line starting with ${prefix}`);
  lines.splice(index, 1, ...(replacement === null ? [] : [replacement]));
  return lines.join('\n');
}

function errorsFor(content: string, path = PATH): ValidationError[] {
  const result = parseTuneVariant({ path, content });
  if (result.ok) throw new Error('Expected validation errors');
  return result.error;
}

function messagesFor(content: string, path = PATH): string[] {
  return errorsFor(content, path).map(formatValidationError);
}

describe('parseTuneVariant', () => {
  it('parses a valid file with every field', () => {
    const result = parseTuneVariant({ path: PATH, content: VALID });

    expect(result).toEqual({
      ok: true,
      value: {
        tuneId: 'the-kesh',
        variantId: 'standard',
        titles: ['The Kesh', 'The Kesh Jig'],
        composer: 'Trad.',
        type: 'jig',
        origin: { country: 'IE' },
        source: 'Learned at a session',
        transcriber: 'A. Fiddler',
        notes: ['First note', 'Second note'],
        meter: '6/8',
        unitLength: '1/8',
        tempo: '3/8=120',
        key: 'G',
        abc: VALID,
      },
    });
  });

  it('parses a file with only the required fields and no optional properties', () => {
    const minimal = [
      'X:1',
      'T:Polska',
      'R:polska',
      'O:SE',
      'S:Me',
      'Z:Me',
      'M:3/4',
      'L:1/8',
      'K:Am',
      'A2 B2 c2|',
    ].join('\n');
    const result = parseTuneVariant({ path: 'tunes/polska/a.abc', content: minimal });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.titles).toEqual(['Polska']);
    expect(result.value.notes).toEqual([]);
    expect('composer' in result.value).toBe(false);
    expect('tempo' in result.value).toBe(false);
  });

  it('keeps the first title as primary and the rest as alternate titles', () => {
    const content = withLine('T:The Kesh Jig', 'T:The Kesh Jig\nT:Kesh-jigi');
    const result = parseTuneVariant({ path: PATH, content });

    expect(result.ok && result.value.titles).toEqual(['The Kesh', 'The Kesh Jig', 'Kesh-jigi']);
  });

  it('parses an origin with a region', () => {
    const result = parseTuneVariant({ path: PATH, content: withLine('O:', 'O:FI, Kaustinen') });

    expect(result.ok && result.value.origin).toEqual({ country: 'FI', region: 'Kaustinen' });
  });

  it('parses an origin without a region', () => {
    const result = parseTuneVariant({ path: PATH, content: withLine('O:', 'O: SE ') });

    expect(result.ok && result.value.origin).toEqual({ country: 'SE' });
  });

  it('accepts Windows line endings and % comment lines', () => {
    const content = `% A comment\n${withLine('K:', 'K:G\n% comment in the body')}`.replaceAll(
      '\n',
      '\r\n',
    );

    expect(parseTuneVariant({ path: PATH, content }).ok).toBe(true);
  });

  describe('path', () => {
    it.each([
      ['a file outside a tune folder', 'tunes/the-kesh.abc'],
      ['a nested folder', 'tunes/the-kesh/extra/standard.abc'],
      ['a wrong extension', 'tunes/the-kesh/standard.txt'],
    ])('rejects %s', (_case, path) => {
      expect(messagesFor(VALID, path)).toEqual([
        `${path} Tune files must be at tunes/<tune-id>/<variant-id>.abc, one folder per tune and one file per variant.`,
      ]);
    });

    it('rejects a tune ID that is not lowercase kebab-case', () => {
      expect(messagesFor(VALID, 'tunes/The_Kesh/standard.abc')).toEqual([
        'tunes/The_Kesh/standard.abc The tune ID (folder name) "The_Kesh" must be lowercase ASCII kebab-case, e.g. "the-kesh".',
      ]);
    });

    it('rejects a variant ID that is not lowercase kebab-case', () => {
      expect(messagesFor(VALID, 'tunes/the-kesh/in-g-.abc')).toEqual([
        'tunes/the-kesh/in-g-.abc The variant ID (file name) "in-g-" must be lowercase ASCII kebab-case, e.g. "the-kesh".',
      ]);
    });
  });

  describe('X:', () => {
    it('must be 1', () => {
      expect(messagesFor(withLine('X:', 'X:2'))).toEqual([
        `${PATH}:1 X: must be 1, found "2". Use one file per tune.`,
      ]);
    });

    it('must be the first field', () => {
      const content = withLine('X:', null).replace('T:The Kesh\n', 'T:The Kesh\nX:1\n');

      expect(messagesFor(content)).toEqual([
        `${PATH}:1 X: The file must start with X:1.`,
        `${PATH}:2 X: is out of order. Header fields must appear in this order: X, T, C, R, O, S, Z, N, M, L, Q, K.`,
      ]);
    });

    it('is required', () => {
      expect(messagesFor(withLine('X:', null))).toEqual([
        `${PATH}:1 X: The file must start with X:1.`,
        `${PATH} X: Missing required field X: (reference number, always 1).`,
      ]);
    });

    it('may appear only once, so a file holds one tune', () => {
      const content = `${VALID}\nX:2\nT:Another tune\nK:D\nDEF|`;

      expect(messagesFor(content)).toContain(
        `${PATH}:17 X: Found a second X:. Put exactly one tune in each file.`,
      );
    });
  });

  describe('T:', () => {
    it('is required', () => {
      const content = withLine('T:', null, withLine('T:', null));

      expect(messagesFor(content)).toEqual([`${PATH} T: Missing required field T: (title).`]);
    });

    it('must not be empty', () => {
      expect(messagesFor(withLine('T:', 'T: '))).toEqual([`${PATH}:2 T: is empty. Add the title.`]);
    });
  });

  describe('R:', () => {
    it('is required', () => {
      expect(messagesFor(withLine('R:', null))).toEqual([
        `${PATH} R: Missing required field R: (tune type).`,
      ]);
    });

    it('must be a known tune type', () => {
      expect(messagesFor(withLine('R:', 'R:polkka'))).toEqual([
        `${PATH}:5 R: "polkka" is not a known tune type. Allowed: polska, waltz, schottische, mazurka, polka, hambo, march, minuet, quadrille, halling, springar, pols, reel, jig, slip-jig, hornpipe, air, song, other. Use "other" if none fits, and propose a new type in a PR.`,
      ]);
    });

    it('must be the lowercase ID', () => {
      expect(messagesFor(withLine('R:', 'R:Slip-Jig'))).toEqual([
        `${PATH}:5 R: "Slip-Jig" must be lowercase: "slip-jig".`,
      ]);
    });
  });

  describe('O:', () => {
    it('is required', () => {
      expect(messagesFor(withLine('O:', null))).toEqual([
        `${PATH} O: Missing required field O: (origin).`,
      ]);
    });

    it.each(['Ireland', 'ie', 'IRL', 'FI,', 'FI Kaustinen'])('rejects "%s"', (origin) => {
      expect(messagesFor(withLine('O:', `O:${origin}`))).toEqual([
        `${PATH}:6 O: "${origin}" is not a valid origin. Use a two-letter uppercase ISO 3166-1 country code, optionally followed by a comma and a region, e.g. "FI, Kaustinen" or "IE".`,
      ]);
    });
  });

  describe.each([
    ['S', 'source of the transcription', 7],
    ['Z', 'transcriber', 8],
    ['M', 'meter', 11],
    ['L', 'unit note length', 12],
  ])('%s:', (field, description, line) => {
    it('is required', () => {
      expect(messagesFor(withLine(`${field}:`, null))).toEqual([
        `${PATH} ${field}: Missing required field ${field}: (${description}).`,
      ]);
    });

    it('must not be empty', () => {
      expect(messagesFor(withLine(`${field}:`, `${field}:`))).toEqual([
        `${PATH}:${line} ${field}: is empty. Add the ${description}.`,
      ]);
    });
  });

  describe('K:', () => {
    it('is required', () => {
      expect(messagesFor(withLine('K:', null))).toEqual([
        `${PATH}:14 Expected a header field before the music. Header fields, in order: X, T, C, R, O, S, Z, N, M, L, Q, K.`,
        `${PATH}:15 w: is not allowed in the header. Allowed fields, in order: X, T, C, R, O, S, Z, N, M, L, Q, K.`,
        `${PATH} K: Missing required field K: (key). K: must be the last header line, directly before the music.`,
      ]);
    });

    it('must be the last header field', () => {
      const content = withLine('M:', null, withLine('K:', 'K:G\nM:6/8'));

      expect(messagesFor(content)).toEqual([
        `${PATH}:14 M: must be in the header. K: must be the last header field.`,
      ]);
    });

    it('must be followed by music', () => {
      const content = VALID.split('\n').slice(0, 14).join('\n');

      expect(messagesFor(content)).toEqual([`${PATH}:14 K: The tune has no music after K:.`]);
    });
  });

  describe('header', () => {
    it('keeps fields in the documented order', () => {
      const content = withLine('R:', null).replace('O:IE\n', 'O:IE\nR:jig\n');

      expect(messagesFor(content)).toEqual([
        `${PATH}:6 R: is out of order. Header fields must appear in this order: X, T, C, R, O, S, Z, N, M, L, Q, K.`,
      ]);
    });

    it('allows only T: and N: to repeat', () => {
      expect(messagesFor(withLine('M:', 'M:6/8\nM:6/8'))).toEqual([
        `${PATH}:12 M: appears more than once. Only T: and N: may repeat.`,
      ]);
    });

    it('rejects unknown header fields', () => {
      expect(messagesFor(withLine('Q:', 'P:AB'))).toEqual([
        `${PATH}:13 P: is not allowed in the header. Allowed fields, in order: X, T, C, R, O, S, Z, N, M, L, Q, K.`,
      ]);
    });

    it('rejects blank lines', () => {
      expect(messagesFor(withLine('M:', '\nM:6/8'))).toEqual([
        `${PATH}:11 Blank lines are not allowed in the header. The header ends with K:.`,
      ]);
    });
  });

  describe('body', () => {
    it('rejects header-only fields after K:', () => {
      const content = `${VALID}\nS:Another source`;

      expect(messagesFor(content)).toEqual([`${PATH}:17 S: must be in the header, before K:.`]);
    });

    it('rejects a blank line followed by more music', () => {
      const content = `${VALID}\n\n|:DEF DEF:|`;

      expect(messagesFor(content)).toEqual([
        `${PATH}:17 Blank line inside the tune. In ABC a blank line ends the tune; remove it or use a % comment line.`,
      ]);
    });

    it('allows trailing blank lines', () => {
      expect(parseTuneVariant({ path: PATH, content: `${VALID}\n\n\n` }).ok).toBe(true);
    });
  });

  it('reports every problem at once', () => {
    const content = withLine('R:', 'R:polkka', withLine('O:', 'O:Ireland', withLine('S:', null)));
    const fields = errorsFor(content, 'tunes/Bad/standard.abc').map((error) => error.field);

    expect(fields).toEqual([undefined, 'S', 'R', 'O']);
  });

  it.each([
    ['empty content', ''],
    ['random text', 'this is not ABC\n{}[]::\n\u0000'],
  ])('never throws for %s', (_case, content) => {
    expect(() => parseTuneVariant({ path: PATH, content })).not.toThrow();
    expect(parseTuneVariant({ path: PATH, content }).ok).toBe(false);
  });
});
