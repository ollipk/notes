/**
 * Validates every file in tunes/ as it is on disk. This test is what guarantees the tune data is
 * valid; the app only logs and skips files that fail to parse. See tunes/README.md.
 */
import abcjs from 'abcjs';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTuneVariant } from '../src/domain/parseTuneVariant';
import { formatValidationError, ID_PATTERN, type TuneVariant } from '../src/domain/tune';

// Vitest runs from the project root.
const TUNES_DIR = join(process.cwd(), 'tunes');
const NOT_TUNES = new Set(['README.md', 'LICENSE']);
const VARIANT_FILE = /^(.+)\.abc$/;

interface TuneFile {
  path: string;
  content: string;
}

const visible = (name: string) => !name.startsWith('.');

/** Checks the folder layout and returns the tune files found, with any layout errors. */
function readTuneFiles(): { files: TuneFile[]; errors: string[] } {
  const files: TuneFile[] = [];
  const errors: string[] = [];

  for (const entry of readdirSync(TUNES_DIR, { withFileTypes: true })) {
    if (!visible(entry.name)) continue;
    const folder = `tunes/${entry.name}`;
    if (!entry.isDirectory()) {
      if (!NOT_TUNES.has(entry.name)) {
        errors.push(
          `${folder} is not in a tune folder. Move it to tunes/<tune-id>/<variant-id>.abc.`,
        );
      }
      continue;
    }
    if (!ID_PATTERN.test(entry.name)) {
      errors.push(`${folder} The tune ID "${entry.name}" must be lowercase ASCII kebab-case.`);
    }

    const children = readdirSync(join(TUNES_DIR, entry.name), { withFileTypes: true });
    let variants = 0;
    for (const child of children.filter((c) => visible(c.name))) {
      const path = `${folder}/${child.name}`;
      const variantId = VARIANT_FILE.exec(child.name)?.[1];
      if (child.isDirectory() || variantId === undefined) {
        errors.push(`${path} does not belong in a tune folder. Only <variant-id>.abc files do.`);
        continue;
      }
      variants += 1;
      const content = readFileSync(join(TUNES_DIR, entry.name, child.name), 'utf8');
      files.push({ path, content });
    }
    if (variants === 0) {
      errors.push(`${folder} is an empty tune folder. Add at least one <variant-id>.abc file.`);
    }
  }

  return { files, errors };
}

/** Turns abcjs's HTML warning text into plain text. */
function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&');
}

function abcjsErrors({ path, content }: TuneFile): string[] {
  const tunes = abcjs.parseOnly(content);
  if (tunes.length !== 1) {
    return [`${path} abcjs: found ${tunes.length} tunes; put exactly one tune in each file.`];
  }
  return (tunes[0]?.warnings ?? []).map((warning) => `${path} abcjs: ${plainText(warning)}`);
}

function duplicateTitleErrors(variants: readonly TuneVariant[]): string[] {
  const byTitle = new Map<string, { title: string; tuneIds: Set<string> }>();
  for (const variant of variants) {
    const title = variant.titles[0].trim();
    const key = title.toLowerCase();
    const entry = byTitle.get(key) ?? { title, tuneIds: new Set<string>() };
    byTitle.set(key, { ...entry, tuneIds: entry.tuneIds.add(variant.tuneId) });
  }
  return [...byTitle.values()]
    .filter(({ tuneIds }) => tuneIds.size > 1)
    .map(
      ({ title, tuneIds }) =>
        `Duplicate primary title "${title}" in tunes/${[...tuneIds].sort().join(', tunes/')}. ` +
        'Merge them as variants of one tune, or make the titles distinct.',
    );
}

describe('tune data in tunes/', () => {
  it('is laid out, formatted and valid ABC', () => {
    const { files, errors } = readTuneFiles();
    const variants: TuneVariant[] = [];

    for (const file of files) {
      const result = parseTuneVariant(file);
      if (result.ok) {
        variants.push(result.value);
      } else {
        errors.push(...result.error.map(formatValidationError));
      }
      errors.push(...abcjsErrors(file));
    }
    errors.push(...duplicateTitleErrors(variants));

    expect(files.length).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
});
