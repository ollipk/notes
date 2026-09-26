# Backend roadmap

This is the step plan for the backend described in
[ADR 12](../adr/0012-backend-architecture.md), which builds on
[ADR 11](../adr/0011-monorepo-shared-domain.md).

Each step is one or more small PRs, and `npm run check` passes after each one.

## 1. Monorepo and shared domain

**Goal:** npm workspaces with `apps/web` and `packages/domain` (`@notes/domain`), and no behavior
change.

**Done when:**

- `npm ci && npm run check` passes at the root.
- The deployed site behaves as before.
- dependency-cruiser rejects relative imports into `packages/` and framework imports in the domain.

## 2. API skeleton and submission domain

**Goal:** `apps/api` (Hono) and `packages/contracts` (zod schemas, then OpenAPI, then a typed
client), with:

- the ports and their in-memory adapters;
- the submission lifecycle;
- rights declarations;
- the audit log.

**Done when:**

- Scenario tests run only against in-memory adapters and cover:
  - every allowed and every rejected lifecycle transition;
  - declaration versioning;
  - the audit entries.
- The OpenAPI document and the client are generated and checked in `npm run check`.

## 3. PostgreSQL, deployment and domains

**Goal:**

- PostgreSQL adapters and migrations.
- The API deployed to UpCloud behind Caddy.
- The web app at `notes.kuukkeli.ai`, with Vite `base` set to `/`.
- The API at `notesapi.kuukkeli.ai`.

**Done when:**

- The adapter integration tests pass against the CI PostgreSQL service.
- Images are published to GHCR, and migrations run on deploy.
- The web app works on the custom domain.
- Until step 4, the public API exposes only a health check and endpoints without personal data.

## 4. Accounts

**Goal:** admin invites, invite and reset links, password login and sessions, as specified in
ADR 12.

**Done when:**

- Tests cover:
  - a `GET` never consumes a link;
  - the wrong email address, expiry, reuse, and invalidation after 5 attempts;
  - a new link invalidates the old one;
  - a reset revokes the user's sessions;
  - rate limits and `Origin` checks;
  - the cookie flags;
  - the audit entries.
- An admin can invite a member end to end.

## 5. Private library and submission form

**Goal:** signed-in users keep private transcriptions and submit them. The form has ABC input, a
live preview and the draft rights declaration.

**Done when:**

- A contributor can create, edit and delete drafts, and sees validation errors from
  `@notes/domain`.
- The contributor chooses the `Z:` credit.
- On submission, the declaration is stored verbatim with its form version.
- All text is translated (en, fi).

## 6. Curator review view

**Goal:** curators review submitted tunes: approve, request changes or reject.

**Done when:**

- A curator can act on a submission, and the contributor sees the result.
- Every action is in the audit log.
- Contributors cannot review.

## 7. Publication and pilot

**Goal:** publication through the GitHub App, then the internal pilot with one session group.

**Done when:**

- Approving a submission opens a pull request from the GitHub App that adds the ABC file.
- CI validates it, and merging it marks the submission Published.
- About 10 members have been invited and are using it.
