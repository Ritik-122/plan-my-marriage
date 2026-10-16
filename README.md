# Plan My Marriage

Next.js App Router modular monolith with a public landing page, email/password accounts, and a protected welcome screen. Landing-page workspaces, invitations, galleries, and vendor listings remain illustrative. Sign In and Start Planning open real account flows; other product actions show a “Coming soon” dialog.

Landing sections live in `src/components/landing`; shared interactions provide responsive navigation and an accessible native dialog. Images and fonts are served locally from `public/landing`, so builds require no external asset requests or provider credentials.

## Local development

Use Node **24.21.0** (`.nvmrc`; supported major `24.x`) and npm. Install that runtime with your preferred Node version manager before running:

```sh
npm install
npm run dev
```

Open http://localhost:3000. No environment file or provider credentials are needed for the shell, liveness endpoint, tests, or production build. Copy `.env.example` to `.env.local` only when configuring a capability. Never commit secrets.

For repeatable installs after checkout, use `npm ci`. Dependencies are pinned in `package.json` and `package-lock.json`.

TypeScript stays on the compatible 6.x release because the lint parser does not yet support TypeScript 7. Vite is an explicit development dependency required by Vitest; Next.js remains the application bundler.

ESLint 10 uses the official `@eslint/compat` wrapper for the older rule-context APIs used by Next's React plugin. Remove that wrapper when the upstream plugin supports ESLint 10 directly.

## Account setup

Keep credentials in the ignored `.env.local` file, never `.env.example`. If you do not already have `.env.local`, create it using `.env.example` as a template. Set:

- `MONGODB_URI`: your MongoDB connection string.
- `MONGODB_DB_NAME`: the database you intend to use.
- `SESSION_SECRET`: a random private secret of at least 32 characters. Use a different secret in production.
- `APP_BASE_URL`: the exact browser origin, normally `http://localhost:3000` locally and your HTTPS URL in production. Requests from other origins are rejected.

Generate a session secret with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. Restart the server after changing environment variables.

Run `npm run db:auth-indexes` once against each configured database before using a production build. This explicitly creates the unique email index and rate-limit TTL index. It does not remove existing data or indexes. Registration refuses to proceed without a full unique email index. Development also uses the scaffold's automatic index creation.

The homepage, signed-out account forms, liveness endpoint, unit tests, and build work without MongoDB credentials. Account submissions return a safe 503 when configuration/storage is unavailable.

## Checks

```sh
npm run lint
npm run format:check
npm run typecheck
npm run test:run
npm run build
```

`npm run format` formats scaffold files, excluding existing `docs/`. `npm test` starts Vitest watch mode. Typecheck generates Next route types first, so it works on a fresh checkout. GitHub Actions runs the checks above using Node from `.nvmrc` and `npm ci`.

Optional browser smoke test:

```sh
npx playwright install chromium
npm run test:e2e
```

The landing-page browser checks build and start a production server on port 3100. To exercise accounts and the landing page against a disposable real MongoDB instance, run `npm run test:auth` after installing Playwright Chromium. This builds the app and starts an isolated server on port 3111; it never uses your configured MongoDB URI. The first run/install downloads a local MongoDB binary. The fixture stops the server and database after testing. Browser suites are opt-in and are not in the foundation CI workflow.

## Account behavior

- `/sign-up`, `/sign-in`, and `/app` provide registration, login, and the protected welcome screen. Signed-in visitors to either account form go to `/app`; signed-out visitors to `/app` go to `/sign-in`.
- `/api/v1/auth/register`, `/login`, `/logout`, and `/me` under the same auth prefix follow the API design. Responses serialize only the user ID, display name, and normalized email. Registration returns 201; logout returns 204.
- Passwords use salted bcrypt at cost 12. Registration requires at least 12 characters; both forms reject input over bcrypt's 72-byte UTF-8 limit without truncation.
- HS256-signed sessions expire after seven days. Cookies are HttpOnly, SameSite=Lax, scoped to `/`, and Secure on HTTPS. Production authentication requires HTTPS except for local testing. Every protected read checks the user and `sessionVersion` in MongoDB. Logout clears this browser's cookie; it does not revoke a previously copied token. Incrementing `sessionVersion` invalidates all sessions for that user.
- State-changing account endpoints validate Origin/Referer against `APP_BASE_URL`. Requests are never authenticated using browser localStorage.
- Shared MongoDB rate limits allow 10 registration requests or 30 login requests per IP per 15-minute window, plus 8 login attempts per IP/email pair. Counters use HMAC fingerprints rather than raw identities. Vercel's overwritten forwarding header supplies IPs on Vercel; elsewhere a conservative shared bucket is used. Another hosting provider needs an explicitly trusted ingress adapter before deployment. See [Vercel's header contract](https://vercel.com/docs/headers/request-headers).
- Google sign-in, password recovery, email verification, and team invitations are later milestones. The workspace lists real weddings belonging to the signed-in user.

## Wedding setup

- `/app/weddings/new` follows the Stitch three-step flow: details, theme, review. Creation saves the wedding and its first Admin membership in one MongoDB transaction. Atlas or a replica set is required.
- Drafts are stored only in this browser, scoped to the signed-in user, and restored for seven days. Save & Exit does not create a database record. Final creation clears the draft.
- The three themes preview the future guest experience. They do not change the planning workspace. Dates use Asia/Kolkata; handles are normalized and unique, checked at creation, and immutable afterward.
- `/app` lists membership-scoped weddings. The protected overview and edit pages support persisted details and theme changes for Admins and Managers.
- `GET/POST /api/v1/weddings` and `GET/PATCH /api/v1/weddings/:weddingId` implement this increment. PATCH accepts core details and theme only; publishing settings, uploads, invitations, and ceremony planning remain deferred. Guest websites start unpublished.
- Run `npm run db:wedding-indexes` once per configured database before using creation. It explicitly applies unique slug and membership indexes plus date and membership-list indexes. Missing unique indexes prevent creation safely. Mutation limits are 10 creates and 60 updates per user per 15 minutes.
- `npm run test:auth` includes wedding integration checks using a disposable MongoDB replica set, including duplicate races, access isolation, and rollback on membership failure. It never uses the configured application database for test records.

## Ceremony and event management

The wedding overview links to `/app/weddings/:weddingId/events`: a chronological schedule, empty state, Add/Edit form, event details, and explicit deletion confirmation. The three Stitch event screens guide the layout. Desktop and mobile use the existing brand, colors, and fonts. Only implemented navigation and real saved data are shown.

- Authenticated Admins and Managers can list, create, read, edit, and delete their wedding's events. All event queries include the wedding ID after membership authorization. Mutations require the configured origin and share a 60-request/user/15-minute limit.
- Event types are `HALDI`, `MEHENDI`, `SANGEET`, `WEDDING`, `RECEPTION`, and `CUSTOM`. Forms interpret date/time inputs in Asia/Kolkata and store UTC. End time is optional and must be later than start time, including sparse PATCH updates. Nested venue PATCH fields merge; `endsAt: null` clears the end time.
- Visibility is `PUBLIC` or `INVITED_ONLY`, defaulting to `INVITED_ONLY`, per the approved product clarification. This saves intent; it does not publish the website or send invitations. Dress code is editable; the API also accepts an optional external livestream URL. Photo uploads, guest assignment, RSVP, tasks, budgets, calendar/PDF export, and publishing are deferred.
- GET list supports inclusive `from`/`to` ISO timestamp filters on start time. Run `npm run db:event-indexes` for each database to apply `{ weddingId: 1, startsAt: 1 }`.
- Updates and deletions use MongoDB transactions. Deletion removes event guest assignments, revokes photo upload tokens, detaches preserved tasks/expenses, and deletes the event last. Events with photo metadata return 409 until storage cleanup is implemented; this increment never deletes photo objects.
- `npm run test:auth` includes the event browser/API suite using a disposable replica set. No real wedding data is needed for these tests.

## Guests and event assignments

- `/app/weddings/:weddingId/guests` provides the Stitch-based guest directory, literal name/email/phone search, event filter, cursor pagination, Add/Edit Guest, details, and confirmed removal. Existing wedding navigation links to Guests.
- Guest names are required and are not unique. Email/phone/organizer-only notes are optional. Email is trimmed/lowercased; phone punctuation is removed and the remaining number must contain 7–15 digits with an optional leading `+`. No country code is guessed.
- Guest CRUD follows `/api/v1/weddings/:weddingId/guests[/:guestId]`. Listing defaults to 20 and caps at 100, sorts by name then ID, and returns `meta.nextCursor`. Supported filters are `q`, `groupId`, `eventId`, and event-scoped `rsvpStatus`. Group-management UI is deferred; API group references must already belong to the wedding.
- Event assignment GET/POST/DELETE follows `/api/v1/weddings/:weddingId/events/:eventId/guests`; POST/DELETE accepts up to 100 `guestIds`. GET `/api/v1/weddings/:weddingId/guests/:guestId/events` returns assigned events. Membership is required for every read/write; both linked records must belong to the same wedding. Mutations are limited to 120 per user per 15 minutes.
- Assignments use separate `eventGuests` records with a unique event/guest index. New RSVP state is PENDING; repeat assignment preserves existing responses. Transactions serialize assignments with parent deletion. Removing an assignment also removes that event's RSVP state. Removing a guest deletes assignments and revokes their guest-access tokens atomically.
- The form saves guest details then applies changed assignments through the existing event APIs. If an assignment fails, it keeps the saved guest ID and reports partial completion; Save retries the remaining changes without creating another guest. If initial creation cannot be confirmed, it directs the organizer to check the directory before attempting another creation.
- Run `npm run db:guest-indexes` per database before assignment use. Email delivery, RSVP submission, family/group management, import/export, and bulk guest actions remain separate milestones. The UI makes no claim that selecting an event sends an invitation.

## Personalized guest invitations

- Guest Details now provides an organizer preview, configurable expiration in IST, generate-once private links, copy/manual WhatsApp sharing, issued-link metadata, and confirmed revocation. Sharing opens WhatsApp; it does not send a message automatically or mark email delivery as successful.
- `GET/POST /api/v1/weddings/:weddingId/guests/:guestId/access-links` and `DELETE .../access-links/:accessTokenId` require Admin/Manager membership. Generation uses 32 random bytes; only the SHA-256 hash is stored. Raw URLs appear only in the creation response and current component memory. Creating another link leaves earlier links valid; list responses contain metadata only.
- `/guest/invite/:token` works without an account. It reads `GET /api/v1/guest/invitation` with a Bearer capability, independently of organizer cookies. Only the guest name, wedding presentation fields, and assigned events are returned, even for unpublished weddings. Contact details and organizer notes remain private. All three saved themes render responsive invitations with dates, venues, dress codes, and safe external map/livestream links.
- Unknown, expired, revoked, and deleted-guest links return the same `401 GUEST_LINK_INVALID` response. Provider/network failures show a retry state. Previewing as an organizer creates no token and does not update last-opened metadata. Revocation prevents subsequent reads; it cannot erase content a guest already viewed or saved.
- Responses use `no-store`; guest pages disable referrers and indexing. Application logs use static route templates, and development request logging skips capability paths. Before deployment, configure hosting/proxy/analytics logs to omit or redact `/guest/invite/:token` paths and authorization headers; do not attach third-party analytics to these pages.
- Run `npm run db:invitation-indexes` for each database. Expired metadata is retained for organizer history; expiry is enforced on reads rather than relying on TTL cleanup. Link creation serializes with guest deletion. Creation is limited to 60 per organizer per 15 minutes; guest reads to 300 per trusted client IP per 15 minutes (shared bucket on local/untrusted ingress).
- `APP_BASE_URL` must be the reachable application origin for shared links. Localhost links work only on the same computer. RSVP submission, email sending, and public wedding-site publishing remain later increments.

## Foundation boundaries

- `src/app`: public landing and account pages, the protected `/app` welcome page, thin authentication Route Handlers, and `/api/v1/health`.
- `src/modules/auth`: input schemas, explicit user DTOs, model/repository, bcrypt password handling, signed sessions, account services, request protection, and shared rate limits.
- `src/lib/config/env.server.ts`: server-only Zod validation. Application settings have development defaults. MongoDB and session settings are validated only when needed. Future provider placeholders are not consumed yet.
- `src/lib/db/mongoose.ts`: lazy connection reuse, concurrent-attempt sharing, retry after failure, bounded pool, and disabled production auto-indexing. Authentication owns its models; `scripts/auth-indexes.mjs` applies its production indexes explicitly.
- `src/lib/http`: public error types, API envelopes, and server-generated request IDs. Unknown errors produce a generic 500 without internal details. Responses default to `no-store`; explicit public caching can be designed later.
- `src/lib/logging`: Pino structured logs. Request completion uses an allowlist and a fixed event message; secret-key redaction is defense in depth, not permission to log arbitrary objects or free-form errors.
- `tests`: Node unit tests, landing browser checks, and isolated account browser/API integration tests. Mock-based unit tests and disposable local MongoDB tests do not claim Atlas integration coverage.

Health returns HTTP 200 with `data.status = "ok"` and `meta.requestId`, plus `X-Request-Id` and `Cache-Control: no-store`. It does not import/connect to MongoDB, call external providers, or reveal configuration. It is **liveness**, not readiness.

Server-only imports are mocked only in the Vitest setup because those tests already execute in Node. Next.js enforces server/client boundaries in the application build.

## Architecture and source of truth

Precedence: explicit conversation decisions, `docs/API-DESIGN.md` for HTTP contracts, `docs/DATABASE-DESIGN.md` for persistence, `docs/SYSTEM-DESIGN.md` for architecture, and `docs/PRD.md` for product requirements. The PRD remains authoritative for product behavior; old stack references are superseded.

Add domain modules only with their first implementation:

```text
src/modules/<domain>/
  <entity>.model.ts
  repository.ts
  service.ts
  schema.ts
  dto.ts
  service.test.ts
```

Future surfaces are `/app/*` (authenticated), `/w/:slug` (published public data), and token-protected guest invitation/upload pages. Business authorization must apply equally to Route Handlers and server-rendered reads. Future providers live behind adapters in `src/integrations/`; shared UI in `src/components/`; theme rendering in `src/themes/`.

Approved clarifications for later work:

- Roles live on `WeddingMember`: Admins have all Manager capabilities plus team-membership administration. No detailed permission matrix.
- Creator is the first Admin; a narrow Invite Partner / Co-Admin flow comes later.
- Events will be `PUBLIC` or `INVITED_ONLY`, defaulting to `INVITED_ONLY`. Public pages expose only public events; guest-token pages expose assigned events.
- Wedding guest count counts unique Guest records. RSVP counts are per-event EventGuest counts.
- Dashboard attention/recent items can derive from domain data. No notification, audit, or event infrastructure in this foundation.
- Resend initially handles transactional invitations only.
- Prefer `weddings/{weddingId}/photos/{uuid}.{ext}` for future media keys; `Photo.eventId` determines categorization.

R2, CDN, Resend, QR, wedding workflows, and vendor integrations remain deferred. Install feature packages only when implementing their approved capability.

## Deployment

Vercel is the initial target. Select this repository root, the Next.js preset, and Node 24.x. No deployment is created by this scaffold. Provider capabilities must run in the Node runtime. Configure secrets through the deployment environment when those capabilities are introduced.

Review stable patch/security releases before deployment. A lockfile makes builds reproducible; it does not replace dependency maintenance. Production database indexes must later be applied explicitly, not on application boot.
