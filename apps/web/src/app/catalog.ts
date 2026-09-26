import {
  buildCatalog,
  parseTuneVariant,
  formatValidationError,
  type Tune,
  type TuneVariant,
} from '@notes/domain';

/**
 * Parses tune files keyed by their glob path (`../../../../tunes/...`, or `/tunes/...` in tests)
 * into a catalog. Invalid files are logged and skipped; tests/tune-data.test.ts keeps them out of
 * the repo.
 */
/** The path from the repository root: `../../../../tunes/a/b.abc` or `/tunes/a/b.abc` → `tunes/a/b.abc`. */
function repoPath(globKey: string): string {
  return globKey.replace(/^(?:\/|(?:\.\.\/)+)/, '');
}

export function loadCatalog(files: Readonly<Record<string, string>>): Tune[] {
  const variants: TuneVariant[] = [];
  for (const [key, content] of Object.entries(files)) {
    const result = parseTuneVariant({ path: repoPath(key), content });
    if (result.ok) {
      variants.push(result.value);
    } else {
      console.error(
        `Skipping invalid tune file:\n${result.error.map(formatValidationError).join('\n')}`,
      );
    }
  }
  return buildCatalog(variants);
}

// tunes/ lives at the repository root, outside the Vite root (apps/web), so the glob is relative.
// Every tune is bundled eagerly. Revisit (see docs/adr/0007) if the catalog grows past about
// 1000 variants.
export const catalog = loadCatalog(
  import.meta.glob<string>('../../../../tunes/**/*.abc', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
);
