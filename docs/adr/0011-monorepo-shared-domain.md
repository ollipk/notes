# 11. Monorepo with a shared domain package

Status: Accepted

## Context

A backend is planned ([ADR 12](0012-backend-architecture.md)). Musicians will keep private
transcriptions and submit them for curated public release. The API must validate a submitted tune
exactly as the web app and the tune data test do: the same header rules, tune types, key parsing
and ABC handling. Two copies of that logic would drift, and a tune accepted by the API could then
fail CI when it is published.

The domain code (`src/domain` before this change) was already pure TypeScript with no framework or
browser dependencies, enforced by dependency-cruiser and ESLint.

## Decision

The repository is an npm workspaces monorepo with one root `package-lock.json`:

```
apps/web/          @notes/web: the static web app (Vite, React)
packages/domain/   @notes/domain: the shared tune domain
tunes/             tune data (CC0), shared by every workspace, at the repository root
```

Planned later: `apps/api` and `packages/contracts` (ADR 12).

**`@notes/domain` rules**

- Consumed as TypeScript source, with no build step: `"exports": { ".": "./src/index.ts" }`.
  Everything an app uses is exported from `src/index.ts`.
- No runtime dependencies. Its source imports only its own files. Its tests import only its own
  files and `vitest`.
- It must not import react, react-dom, react-router, i18next, abcjs, Node built-ins, or anything
  from `apps/`, and must not use browser or Node globals.
- Its unit tests live next to the code in `packages/domain/src`.

**App rules**

- Apps import the domain only as `@notes/domain`: never through a relative path into `packages/`,
  never a file other than its index.
- The layering inside `apps/web` is unchanged: `ui/` does not import `app/`, abcjs only in the
  lazily loaded adapter ([ADR 8](0008-rendering-transposition-playback.md)).
- The tune data validation test (layout, fields and an abcjs parse check) stays in
  `apps/web/tests`, because it needs abcjs.

**Tooling**

- `tsconfig.base.json` at the root holds the shared compiler options. Each workspace extends it.
  The domain's `lib` is `ES2023` with `types: []`, so DOM and Node APIs do not even typecheck there.
  No cross-workspace project references are used: `apps/web` typechecks the domain source it
  imports, and references would require `composite` builds with declaration output.
- One root ESLint config, one Prettier config and one dependency-cruiser config cover every
  workspace. Each workspace has `lint`, `typecheck` and `test` scripts; `apps/web` also has `dev`,
  `build` and `preview`.
- The root `npm run check` (format:check, lint, typecheck, test, depcheck, build) runs across all
  workspaces and remains the single definition of done. CI runs it at the root.
- `apps/web` loads `tunes/` with a relative `import.meta.glob`, and Vite's `server.fs.allow` is the
  workspace root. The deploy workflow uploads `apps/web/dist`.

## Consequences

- One domain and one validation serve the web app, the tune data test and, later, the API.
- A change to the domain is type-checked and tested against every consumer in the same PR.
- Source-only consumption keeps the setup simple, but every consumer needs a TypeScript-aware
  toolchain (Vite, Vitest, or `tsx` / a bundler for the API). If a consumer ever needs compiled
  JavaScript, the package gains a build step then.
- Paths in ADRs 1–10 (`src/domain`, `src/ui`, …) predate this change. They now live under
  `packages/domain/src` and `apps/web/src`.
