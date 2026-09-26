# 4. Tailwind CSS v4, CSS-first

Status: Accepted

## Context

The UI must be mobile-first, support light and dark mode, and be quick for volunteers to change.

## Decision

Use Tailwind CSS v4 through `@tailwindcss/vite` with CSS-first configuration:
`@import "tailwindcss";` in `src/app/index.css`, and `@theme` in CSS for customisation. No
`tailwind.config.js` and no PostCSS config. Dark mode follows `prefers-color-scheme` through the
default `dark:` variant. `prettier-plugin-tailwindcss` orders classes.

## Consequences

- One CSS entry file and no JavaScript config to maintain.
- Much online material and many AI suggestions still use v3 syntax (`@tailwind`, JS config);
  contributors and agents must not apply it.
