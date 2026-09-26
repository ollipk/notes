# 12. Backend architecture

Status: Accepted (pilot). The legal items under [Open items](#open-items) are pending.

Builds on [ADR 11](0011-monorepo-shared-domain.md). The step plan is in
[docs/roadmap/backend.md](../roadmap/backend.md).

## Context

Musicians want to keep their own transcriptions privately and submit them for publication in the
public, CC0 tune collection. That needs users, private storage, review and a record of each
contributor's rights declaration. None of it fits a static site.

The first release is an **internal pilot for one session group of about 10 members**. Every
decision below is sized for that. [Before a public launch](#before-a-public-launch) lists what must
change.

## Decision

### Scope and source of truth

- **Git remains the single source of truth for published tunes** (`tunes/`, CC0). The web app
  keeps reading them at build time (ADR 7).
- The backend handles everything **before publication**: users, private transcriptions,
  submissions, review, and rights declarations. It never serves the public catalog.

### Structure

- Planned workspaces:
  - `apps/api`: Node 24, TypeScript, [Hono](https://hono.dev/).
  - `packages/contracts`: zod schemas for every request and response. OpenAPI is generated from
    them, and a typed client is generated for the web.
- Both use `@notes/domain` for tune parsing and validation, so the API accepts exactly what the
  tune data test accepts.
- **Hexagonal backend.** The submission and account logic is pure and talks to the outside world
  only through ports:

  | Port                   | Purpose                                                   |
  | ---------------------- | --------------------------------------------------------- |
  | `UserRepository`       | Users, roles, password hashes                             |
  | `InviteRepository`     | Invite and reset links (hashed tokens, attempts, expiry)  |
  | `SessionRepository`    | Login sessions                                            |
  | `SubmissionRepository` | Transcriptions, submissions and their rights declarations |
  | `AuditLog`             | Append-only audit entries                                 |
  | `PasswordHasher`       | argon2id in production                                    |
  | `PublicationGateway`   | Opens the publication pull request (GitHub App)           |
  | `Clock`                | Current time                                              |
  | `IdGenerator`          | Entity IDs                                                |
  | `TokenGenerator`       | Random link and session tokens                            |

- Every port has an **in-memory adapter**, and `PasswordHasher` has a fast fake. The domain
  scenario tests run only against in-memory adapters, so they are fast and deterministic. Every
  real adapter (PostgreSQL, argon2id, GitHub) has its own integration tests.
- Rights declarations are stored through `SubmissionRepository`, with the submission they belong
  to. There is no separate port for them.

### Infrastructure

- **Database:** UpCloud Managed PostgreSQL (Helsinki). Local development uses PostgreSQL in
  Docker Compose. CI runs the adapter integration tests against a PostgreSQL service container.
- **Hosting:** one UpCloud server (Helsinki) runs the API with Docker Compose behind Caddy
  (automatic TLS). Images are built in GitHub Actions and pushed to GHCR.
- **Domains:**
  - The web app moves to `notes.kuukkeli.ai`, a GitHub Pages custom domain, and Vite `base`
    becomes `/`.
  - The API is served at `notesapi.kuukkeli.ai`.
  - The two are same-site, so httpOnly session cookies work in every browser, Safari included.
- **No email service of any kind.** The system never sends messages. Every link is delivered by a
  person.

### Authentication (pilot)

- **Invite.**
  - An admin enters the new member's email address and display name in the admin view, and the
    system generates an invite link.
  - The admin copies the link and delivers it personally, for example over WhatsApp or Signal.
- **First login.**
  - Opening the link (`GET`) shows a form and **never consumes the token**, because messaging apps
    fetch URLs to build previews.
  - The user enters their email address and chooses a password.
  - The token is consumed only when that form is submitted (`POST`) **and** the email matches the
    invited address. The comparison is trimmed and case-insensitive.
  - A leaked or forwarded link is therefore useless without the email address.
- **Password reset.**
  - There is no self-service reset. An admin generates a new link for the user.
  - The user opens it, confirms their email address and sets a new password.
  - Completing a reset revokes all of that user's existing sessions.
- **Link tokens.**
  - Each is bound to one user, single-use, valid for 7 days, and stored only as a hash.
  - Generating a new link invalidates that user's previous unused link.
  - After 5 wrong email attempts the link is invalidated, and an admin must generate a new one.
- **Passwords.**
  - Hashed with argon2id.
  - At least 10 and at most 128 characters. There are no composition rules, and spaces are
    allowed.
- **Login.**
  - Email address and password.
  - Rate limited per IP and per account. In the single-server pilot this is in-process middleware,
    and the client IP comes from Caddy's forwarded header, trusted only from Caddy.
  - Error messages do not reveal whether an account exists.
- **Sessions.**
  - httpOnly, `Secure`, `SameSite=Lax` cookies with a rolling 90-day lifetime.
  - Users can log out, and admins can revoke all sessions of a user.
- **CSRF and CORS.**
  - `SameSite=Lax` does not separate two subdomains of the same site. Every state-changing request
    must therefore carry an `Origin` header equal to the web origin.
  - CORS allows only the web origin, with credentials.

### Roles and lifecycle

- **Roles:** contributor, curator, admin. In the pilot only admins invite users or generate links.
- **Submission lifecycle:**

  ```
  Draft (private) ──submit + rights declaration──▶ Submitted
  Submitted ──▶ ChangesRequested ──resubmit──▶ Submitted
  Submitted ──▶ Approved ──PR merged──▶ Published
  Submitted | ChangesRequested | Approved ──▶ Rejected   (curator)
  Submitted | ChangesRequested | Approved ──▶ Withdrawn  (contributor)
  ```

  - Rejected and Withdrawn are possible from every state before Published that a curator can see.
  - A Draft is private: no curator sees it, so its owner simply deletes it instead of withdrawing
    it.
  - Published, Rejected and Withdrawn are final.

- **Rights declarations** are immutable and versioned.
  - Each stores the declaration form version and the answers verbatim.
  - The current form is a **draft pending legal review**, and its version identifier says so
    (`draft-1`).
  - A resubmission after ChangesRequested stores a new declaration; earlier ones are kept.
- **Audit log.**
  - It is append-only. Each entry records the actor, the action, the target and a timestamp.
  - Entries are written for every submission state change, and for every invite, link generation,
    link use, failed link attempt, login, logout and session revocation.

### Publication

- A GitHub App (not a personal access token) opens a pull request that adds the ABC file under
  `tunes/`.
- CI validates it with the same tune data test as any other change, and a curator or admin merges
  it.
- The contributor chooses the credit shown in `Z:`: a real name or a pseudonym.
- The merged file is public and CC0. It stays in the repository and in git history even if the
  contributor later deletes their account, and the credit screen must say so before submission.

### Privacy (GDPR baseline)

- The personal data held is the email address, display name, password hash, session metadata (for
  example creation and last-use times) and audit log entries.
- Account deletion is supported.
  - On deletion, rights declarations and audit entries are pseudonymized, not deleted, because they
    are the record of what was declared and done.
  - Published tunes are not changed (see [Publication](#publication)).
  - The final policy is pending legal review.

## Before a public launch

- Self-service registration and password reset need a way to prove who controls an account without
  an admin: either an email service or passkeys. This is an open decision.
- Rate limiting, sessions and the audit log must be reviewed for more than one API instance.
  In-process rate limiting does not work across instances.
- The legal review below must be complete, and the declaration form must have a final (non-draft)
  version.
- Curators must be recruited beyond the pilot's admins.

## Open items

- Legal review of the rights declaration form and the GDPR policy.
- The curator group.
- The authentication model for a public launch (an email service or passkeys).

## Consequences

- Published data keeps a simple, auditable home in git, and the backend holds only
  pre-publication and personal data.
- The ports keep the domain logic testable without a database, a network or slow password
  hashing.
- An admin must deliver every invite and reset link personally. That is fine for about 10
  members, but it does not scale.
