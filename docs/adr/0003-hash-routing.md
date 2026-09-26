# 3. Hash routing

Status: Accepted

## Context

Musicians will share links to tunes and sets (for example `/#/set?...`). GitHub Pages cannot
rewrite unknown paths to `index.html`, so deep links with a browser-history router return 404.

## Decision

Use React Router with a hash router (`HashRouter`). Application state that should be shareable
goes into the hash route and its query string.

## Consequences

- Shared links work on GitHub Pages without server rewrites or a `404.html` hack.
- URLs contain `#`, which is slightly less tidy.
- Moving to a host with rewrites later would allow a browser router, with a redirect for old links.
