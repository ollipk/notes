import { buildCatalog } from '../domain/catalog';
import { parseTuneVariant } from '../domain/parseTuneVariant';
import { formatValidationError, type Tune, type TuneVariant } from '../domain/tune';

/**
 * Parses tune files keyed by their path from the project root (`/tunes/...`) into a catalog.
 * Invalid files are logged and skipped; tests/tune-data.test.ts keeps them out of the repo.
 */
export function loadCatalog(files: Readonly<Record<string, string>>): Tune[] {
  const variants: TuneVariant[] = [];
  for (const [key, content] of Object.entries(files)) {
    const result = parseTuneVariant({ path: key.replace(/^\//, ''), content });
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

// Every tune is bundled eagerly. Revisit (see docs/adr/0007) if the catalog grows past about
// 1000 variants.
export const catalog = loadCatalog(
  import.meta.glob<string>('/tunes/**/*.abc', { query: '?raw', import: 'default', eager: true }),
);
