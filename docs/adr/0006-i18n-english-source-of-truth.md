# 6. i18n with English as the source of truth

Status: Accepted

## Context

Folk musicians use the app internationally. Every UI language must stay complete as the app grows.

## Decision

- Use i18next, react-i18next and i18next-browser-languagedetector.
- `en` is the default, the fallback and the source of truth; `fi` is the first translation.
- The chosen language is stored in localStorage and `<html lang>` follows the active language.
- Components contain no user-visible string literals (enforced by ESLint).
- A test fails if any locale is missing a key from `en.json` or has extra keys, and translation
  keys are type-checked against `en.json`.
- The app's display name exists only as `app.name`.

## Consequences

- Every PR that adds text must update all locales, so contributors need a translation or ask for
  help in the PR.
- Renaming the app is a one-key change.
