# Notes

A non-profit, open-source web app for folk musicians of any tradition. It stores folk tunes in
[ABC notation](https://abcnotation.com/), renders them as sheet music, and transposes them so a
group can play together in whatever key suits the players present.

It is built for phones and tablets at group sessions, and runs as a static site with no backend.

**Live:** https://ollipk.github.io/notes/

> Status: early. Search for a tune, then read its sheet music, transpose it to any key and play
> it back at a slower tempo from the bar at the bottom of the screen. The tune page keeps the
> screen on, has a full-screen mode for reading and prints cleanly on A4 or Letter.

## Quick start

Requires Node 24 (see `.nvmrc`; with nvm run `nvm use`).

```sh
npm ci          # install exact dependencies from package-lock.json
npm run dev     # start the dev server
npm run check   # format:check, lint, typecheck, test, depcheck, build
```

`npm run check` is the definition of done; CI runs the same command.

Other scripts: `build`, `preview`, `lint`, `format`, `format:check`, `typecheck`, `test`,
`depcheck`.

## Project structure

```
src/
  domain/    Pure TypeScript domain types and logic. No React, router, i18n or browser APIs.
  ui/        React components. May import domain/. All text via i18n.
  ui/abc/    The only code that uses abcjs (sheet music, playback), loaded lazily.
  app/       Entry point, router, i18n initialization, composition.
  locales/   en.json (source of truth), fi.json
tests/       Tests that check files outside src/ (tune data validation)
tunes/       ABC tunes: tunes/<tune-id>/<variant-id>.abc (CC0 1.0)
docs/adr/    Architecture Decision Records
```

Module boundaries are enforced by dependency-cruiser (`npm run depcheck`) and ESLint. See
[`.github/copilot-instructions.md`](.github/copilot-instructions.md) for the full conventions and
[`docs/adr/`](docs/adr/) for the reasoning behind them.

## Adding a UI language

1. Copy `src/locales/en.json` to `src/locales/<code>.json` (for example `sv.json`) and translate
   the values. Keep every key; do not add new ones.
2. Register it in `resources` in `src/app/i18n.ts`.
3. Add the language's own name under `language.names.<code>` in **every** locale file.
4. Run `npm run check`. The locale test fails if any key is missing or extra.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Tune contributions have strict copyright rules.

## Licenses

- Code: [MIT](LICENSE).
- Tune data in `tunes/`: [CC0 1.0](tunes/LICENSE), dedicated to the public domain.
