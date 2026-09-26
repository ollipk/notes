# 7. Tune file format, validation and loading

Status: Accepted

Refines [ADR 2](0002-abc-notation-as-tune-format.md).

## Context

The app needs a catalog of tunes, where one tune can have several settings (keys, regional
versions, ornamentation). Contributors write ABC by hand, often with different habits, and there
is no backend to validate or index uploads. The data must stay easy to review in pull requests
and consistent enough to build a catalog and, later, search and filters.

## Decision

- **Folder per tune, file per variant:** `tunes/<tune-id>/<variant-id>.abc`. The folder name is the
  shared tune ID; IDs are lowercase ASCII kebab-case. Variants are ordered by ID.
- **Strict header.** Exactly one tune per file. Required fields: `X:1`, `T:` (first is primary),
  `R:`, `O:`, `S:`, `Z:`, `M:`, `L:`, `K:`; optional `C:`, `N:`, `Q:`; in a fixed order with
  `K:` last. Source (`S:`) and transcriber (`Z:`) are required because the data licence depends
  on knowing where each transcription comes from.
- **Controlled tune type vocabulary** for `R:`, defined in `src/domain/tuneType.ts`, with `other`
  as an escape hatch. New types are added by PR, together with their UI labels.
- **Origin** is an ISO 3166-1 alpha-2 country code with an optional free-text region. Only the
  format is validated.
- **Validation is a test.** `parseTuneVariant` in `src/domain` validates one file and returns all
  errors without throwing. `tests/tune-data.test.ts` runs it on every file on disk, checks the
  folder layout, duplicate primary titles and ABC syntax (abcjs `parseOnly`), and fails with the
  full list of problems. It runs in `npm run check`, so invalid data cannot be merged.
- **Eager glob loading.** The app bundles every file with
  `import.meta.glob('/tunes/**/*.abc', { query: '?raw', eager: true })`, parses them in the
  browser and builds the catalog. Files that fail to parse are logged and skipped.

## Consequences

- Adding a variant is adding one file; no index or manifest to keep in sync.
- Contributors get specific, actionable messages with file and line from `npm run check`.
- The header order is stricter than ABC itself requires. Existing ABC files may need their header
  reordered before they are accepted.
- All tune text is in the JavaScript bundle and parsed on start-up. This is simple and works
  offline once loaded, but grows with the catalog. **Revisit when the catalog grows past roughly
  1000 variants**, for example by generating a JSON index at build time and loading tune bodies
  on demand.
- abcjs is a dependency but, for now, only the data test uses it. `src/domain` must not import
  it (enforced by dependency-cruiser).
