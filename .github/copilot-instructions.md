# Agent instructions

This file is the single source of truth for AI coding agents. `CLAUDE.md` only imports it.

## Purpose

Notes is a non-profit, open-source web app for folk musicians of any tradition. It stores folk
tunes in ABC notation, renders them as sheet music, and transposes them so a group can play
together in whatever key suits the players present.

Users are folk musicians internationally, often on a phone or tablet in the middle of a session.
Design mobile-first: large touch targets, readable text, no hover-only interactions.

It is a static site on GitHub Pages (https://ollipk.github.io/notes/) with **no backend**.

## Tech stack (fixed decisions)

- Node 24 LTS (`.nvmrc`), npm with a committed `package-lock.json`.
- Vite + React + TypeScript. `tsconfig` uses `strict`, `noUncheckedIndexedAccess`,
  `noImplicitOverride` and `exactOptionalPropertyTypes`. Do not loosen them.
- React Router with a **hash router** (`/#/set?...`) so shared links work on GitHub Pages
  without server rewrites. Vite `base` is `/notes/`.
- Tailwind CSS **v4** via `@tailwindcss/vite`, CSS-first: `@import "tailwindcss";` in
  `src/app/index.css`, customisation with `@theme` in CSS. There is **no** `tailwind.config.js`
  and **no** PostCSS config. Do not add them, and do not use v3 syntax (`@tailwind base;`,
  `theme.extend` in JS, `darkMode: 'class'`). Dark mode follows `prefers-color-scheme` via `dark:`.
- i18n: i18next + react-i18next + i18next-browser-languagedetector. Locales `en` (default,
  fallback, source of truth) and `fi`. The choice is stored in localStorage.
- Tests: Vitest + Testing Library (jsdom). ESLint (typescript-eslint, react-hooks, jsx-a11y),
  Prettier (with prettier-plugin-tailwindcss), dependency-cruiser.
- `typescript` is pinned to 6.0.x and `eslint` to 9.x for peer compatibility
  (typescript-eslint, eslint-plugin-jsx-a11y).

## Module boundaries (enforced by dependency-cruiser in CI)

| Folder         | May import                                        | Why                                                                      |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/domain/`  | only `src/domain/`                                | Pure music logic (transposition, tune model). Portable and fast to test. |
| `src/ui/`      | `src/domain/`, React, react-i18next, locale types | Presentational components; text via `t()`.                               |
| `src/app/`     | `src/domain/`, `src/ui/`                          | Entry point, router, i18n setup, composition.                            |
| `src/locales/` | —                                                 | `en.json` and other locale files.                                        |

- `src/domain/` must not import react, react-dom, react-router, i18next, `ui/`, `app/`, or use
  browser globals (`window`, `document`, `localStorage`, …; ESLint enforces this).
- `src/ui/` must not import `src/app/`.
- No circular dependencies.

## Internationalization

- No user-visible string literals in components (ESLint enforces this in `ui/` and `app/`).
  All text comes from `src/locales/*.json` via `t()`.
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

- ABC files live in `tunes/`, one tune per file, released under CC0 1.0.
- Only transcriptions made by the contributor, or material in the public domain both in its
  country of origin and in the contributor's country. Always record the source.
- **Never** copy from published tune books, websites or other copyrighted editions.

## Do not

- Hardcode UI strings.
- Use browser APIs or framework imports in `src/domain/`.
- Create, edit or delete any `LICENSE` file (root `LICENSE` is MIT, `tunes/LICENSE` is CC0).
- Add a Tailwind v3-style config (`tailwind.config.js`, `postcss.config.js`, `@tailwind`).
- Switch to a browser (history) router or add a backend.
- Add dependencies without a reason in the PR.
