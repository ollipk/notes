# Agent instructions

This file is the single source of truth for AI coding agents. `CLAUDE.md` only imports it.

## Purpose

Notes is a non-profit, open-source web app for folk musicians of any tradition. It stores folk
tunes in ABC notation, renders them as sheet music, and transposes them so a group can play
together in whatever key suits the players present.

Users are folk musicians internationally, often on a phone or tablet in the middle of a session.
Design mobile-first: large touch targets, readable text, no hover-only interactions.

**Guiding UX rule (ADR 9):** design for a player at a crowded, dim, noisy jam, holding a phone in
one hand. Fewest taps, largest targets, the score first, everything else secondary.

- Every touch target is at least **48×48 px** (`min-h-12`, `size-12`; see `apps/web/src/ui/styles.ts`).
  Every icon-only button has a translated `aria-label`.
- The tune page opens with the score directly below a one-line header, without scrolling.
  Frequent controls (transpose, play) live in the bottom bar; everything else goes in the "More"
  sheet. Do not add controls above the score.

It is a static site on GitHub Pages (https://ollipk.github.io/notes/) with **no backend**.

## Tech stack (fixed decisions)

- Node 24 LTS (`.nvmrc`), npm with a committed `package-lock.json`.
- Vite + React + TypeScript. `tsconfig` uses `strict`, `noUncheckedIndexedAccess`,
  `noImplicitOverride` and `exactOptionalPropertyTypes`. Do not loosen them.
- React Router with a **hash router** (`/#/set?...`) so shared links work on GitHub Pages
  without server rewrites. Vite `base` is `/notes/`.
- Tailwind CSS **v4** via `@tailwindcss/vite`, CSS-first: `@import "tailwindcss";` in
  `apps/web/src/app/index.css`, customisation with `@theme` in CSS. There is **no** `tailwind.config.js`
  and **no** PostCSS config. Do not add them, and do not use v3 syntax (`@tailwind base;`,
  `theme.extend` in JS, `darkMode: 'class'`). Dark mode follows `prefers-color-scheme` via `dark:`.
- i18n: i18next + react-i18next + i18next-browser-languagedetector. Locales `en` (default,
  fallback, source of truth) and `fi`. The choice is stored in localStorage.
- Tests: Vitest + Testing Library (jsdom). ESLint (typescript-eslint, react-hooks, jsx-a11y),
  Prettier (with prettier-plugin-tailwindcss), dependency-cruiser.
- `typescript` is pinned to 6.0.x and `eslint` to 9.x for peer compatibility
  (typescript-eslint, eslint-plugin-jsx-a11y).

## Repository layout (npm workspaces, ADR 11)

```
apps/web/          @notes/web: the static web app (Vite, React). dev, build, preview.
packages/domain/   @notes/domain: the shared tune domain, TypeScript source, no build step.
tunes/             tune data (CC0), shared, at the repository root.
docs/              ADRs and the backend roadmap.
```

- One root `package-lock.json`. Install and run everything from the root: `npm ci`,
  `npm run check`, `npm run dev`, `npm run build`. Per-workspace scripts: `npm run test -w @notes/domain`.
- Shared compiler options live in `tsconfig.base.json`; each workspace extends it. One root
  ESLint, Prettier and dependency-cruiser config covers every workspace.
- A new dependency goes in the workspace that uses it (`npm install <pkg> -w @notes/web`); shared
  tooling stays in the root `package.json`.

## Module boundaries (enforced by dependency-cruiser and ESLint in CI)

| Location                | May import                                          | Why                                                                      |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| `packages/domain/src/`  | only its own files (tests: also `vitest`)           | Pure music logic (transposition, tune model). Portable and fast to test. |
| `apps/web/src/ui/`      | `@notes/domain`, React, react-i18next, locale types | Presentational components; text via `t()`. abcjs only in `ui/abc/`.      |
| `apps/web/src/app/`     | `@notes/domain`, `ui/`                              | Entry point, router, i18n setup, composition.                            |
| `apps/web/src/locales/` | —                                                   | `en.json` and other locale files.                                        |

- `@notes/domain` has **no runtime dependencies**. It must not import react, react-dom,
  react-router, i18next, abcjs, Node built-ins or anything from `apps/`, and must not use browser
  or Node globals (`window`, `document`, `localStorage`, `process`, …). Its `tsconfig` has no DOM
  or Node types.
- Everything an app needs from the domain is exported from `packages/domain/src/index.ts`. Apps
  import it only as `'@notes/domain'`, never through a relative path into `packages/` or a deep
  path.
- Domain unit tests live next to the code in `packages/domain/src`.
- `apps/web/src/ui/` must not import `apps/web/src/app/`, and does not use the router: `app/`
  passes hrefs and callbacks as props.
- abcjs is imported only by the adapter `apps/web/src/ui/abc/abcjsAdapter.ts`, which is loaded
  lazily with `loadAbc()`. Nothing else may import abcjs or import the adapter statically.
- No circular dependencies.

## Backend work

The backend (private transcriptions, submissions, review, publication) is planned but not built.
Before any backend task, read [ADR 12](../docs/adr/0012-backend-architecture.md) (the agreed
architecture) and [the backend roadmap](../docs/roadmap/backend.md) (the step plan). Follow them
instead of restating or re-deciding them; a change to a decision needs a new ADR.

## Internationalization

- No user-visible string literals in components (ESLint enforces this in `ui/` and `app/`).
  All text comes from `apps/web/src/locales/*.json` via `t()`.
- Add every new key to `en.json` **and every other locale** in the same PR. A test fails if
  locales have missing or extra keys. Keys are type-checked against `en.json`.
- The display name lives only in `app.name`. Use it for headings and `document.title`.
- Language names live under `language.names.<code>` and are shown in their own language.

## Workflow

1. One issue = one small PR.
2. Write the scenario first (Given/When/Then) in the issue, then the test, then the code.
3. `npm run check` must pass. It runs format:check, lint, typecheck, test, depcheck and build,
   and is the single definition of done. CI runs the same command.
4. No new dependencies without a stated reason in the PR description.
5. Conventional Commits: `feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `test:`, `refactor:`.

## Tune data

- Layout `tunes/<tune-id>/<variant-id>.abc`: a folder per tune, a file per variant, released
  under CC0 1.0. The full format (required header fields and order, the `R:` tune type
  vocabulary in `packages/domain/src/tuneType.ts`) is specified in [`tunes/README.md`](../tunes/README.md).
- `apps/web/tests/tune-data.test.ts` validates every file. The app loads them with an eager
  `import.meta.glob` in `apps/web/src/app/catalog.ts` (ADR 0007), which reads `tunes/` from the
  repository root.
- A new tune type needs a `tuneType.<id>` label in every locale file.
- Only transcriptions made by the contributor, or material in the public domain both in its
  country of origin and in the contributor's country. Always record the source.
- **Never** copy from published tune books, websites or other copyrighted editions.

## Rendering and transposition

See ADR 0008.

- Components use the `AbcAdapter` interface (`apps/web/src/ui/abc/types.ts`), never abcjs directly.
  Component tests mock `ui/abc/loadAbc`, since jsdom cannot render abcjs.
- **Transposition state lives in the URL**: `/#/tune/<tune-id>?v=<variant-id>&st=<semitones>`
  (`st` from −12 to 12). Do not copy it into component state or localStorage; read it from the
  route and update it with `setSearchParams(…, { replace: true })`.
- Key logic (parsing `K:`, spelling, nearest offset) belongs in `packages/domain/src/key.ts`. The ABC
  given to abcjs goes through `scoreAbc()` first.
- Playback must pass `midiTranspose` as well as `visualTranspose`, or it plays the written key.
- Language is stored by i18next. **Every other per-device preference** (display mode, playback
  mode, capo shapes, zoom) lives in the settings module `apps/web/src/ui/settings.ts` and is read and changed
  only through `usePlayerSettings()`. Settings are **never** written to the URL: a shared link
  carries only the tune, variant and transposition (ADR 10).
- The home page search query is kept in the URL (`/#/?q=…`). Matching lives in
  `packages/domain/src/search.ts` (`searchTunes`); the UI passes translated tune type labels in.
- Chords (ADR 10): chord parsing, spelling, the chord chart (`buildChordChart` over neutral
  `ChordEvent`s from the adapter) and capo suggestions are pure domain code. "Notes" mode removes
  chord symbols with `withoutChordSymbols()`; playback modes use the abcjs synth options `chordsOff`
  and `voicesOff`. The player parses the ABC with its chords itself, so it works in every display
  mode.
- Focus mode, the screen wake lock and printing are described in ADR 0009. Printing uses the
  `@media print` rules in `apps/web/src/app/index.css` and `print:` utilities, not a separate page.

## Do not

- Hardcode UI strings.
- Use browser APIs or framework imports in `packages/domain/`, import it by relative path from an app,, or import abcjs outside the adapter.
- Create, edit or delete any `LICENSE` file (root `LICENSE` is MIT, `tunes/LICENSE` is CC0).
- Add a Tailwind v3-style config (`tailwind.config.js`, `postcss.config.js`, `@tailwind`).
- Switch to a browser (history) router, or add backend code that departs from ADR 12 and the
  backend roadmap.
- Add dependencies without a reason in the PR.
