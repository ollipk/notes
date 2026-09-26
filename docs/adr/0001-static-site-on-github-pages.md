# 1. Static site on GitHub Pages

Status: Accepted

## Context

The project is non-profit and run by volunteers. It must be free to host, easy to maintain and
usable at sessions on phones and tablets.

## Decision

Build a client-side single-page app with Vite and deploy it as a static site to GitHub Pages
(https://ollipk.github.io/notes/) from `main` with GitHub Actions. There is no backend.

## Consequences

- No hosting cost, no servers, no user data to protect.
- All logic runs in the browser. User state lives in the URL or browser storage.
- Features that need a server (accounts, sync) are out of scope unless this decision is revisited.
- Assets are served under `/notes/`, so Vite `base` is `/notes/`.
