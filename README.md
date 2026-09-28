# Plan My Marriage

Next.js App Router modular monolith with a public landing page based on the approved Stitch design and a liveness endpoint. Landing-page workspaces, invitations, galleries, and vendor listings use illustrative data. Product actions show a “Coming soon” dialog; authentication and wedding features are not implemented yet.

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

Playwright builds and starts the production server on port 3100. It is not part of initial CI; meaningful product journeys will be added as features arrive.

## Foundation boundaries

- `src/app`: pages and thin API Route Handlers. Only `/` and `/api/v1/health` are implemented.
- `src/lib/config/env.server.ts`: server-only Zod validation. Application settings have development defaults. MongoDB settings are validated only when requested. Future provider placeholders are not consumed yet.
- `src/lib/db/mongoose.ts`: lazy connection reuse, concurrent-attempt sharing, retry after failure, bounded pool, and disabled production auto-indexing. No domain models or index application occurs yet.
- `src/lib/http`: public error types, API envelopes, and server-generated request IDs. Unknown errors produce a generic 500 without internal details. Responses default to `no-store`; explicit public caching can be designed later.
- `src/lib/logging`: Pino structured logs. Request completion uses an allowlist and a fixed event message; secret-key redaction is defense in depth, not permission to log arbitrary objects or free-form errors.
- `tests`: Node unit-test setup and an optional shell browser smoke test. Database unit tests use mocks; they do not claim Atlas integration coverage.

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

No session, password hashing, R2, CDN, Resend, QR, rate-limiter implementation, or vendor integration is included. Install feature packages only when implementing their approved capability.

## Deployment

Vercel is the initial target. Select this repository root, the Next.js preset, and Node 24.x. No deployment is created by this scaffold. Provider capabilities must run in the Node runtime. Configure secrets through the deployment environment when those capabilities are introduced.

Review stable patch/security releases before deployment. A lockfile makes builds reproducible; it does not replace dependency maintenance. Production database indexes must later be applied explicitly, not on application boot.
