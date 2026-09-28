# Engineering rules

- Keep a Next.js App Router modular monolith with strict TypeScript and Node 24 LTS.
- Consult `docs/` before changing contracts. Explicit user decisions come first; API Design governs HTTP contracts, Database Design persistence, and System Design architecture. PRD governs product behavior; its older technology references do not override newer decisions.
- Keep Route Handlers thin. Put business logic and authorization in domain services; colocate Mongoose models and repositories with their domain modules.
- Validate external input with Zod. Return explicit DTOs, never raw Mongoose documents.
- Scope wedding queries by `weddingId`; never trust a supplied wedding ID without membership authorization. Roles belong to `WeddingMember`.
- Derive guest capability scope from validated tokens, independently of authenticated sessions.
- Keep server configuration and provider credentials server-only. Never log secrets, raw capability tokens, credential URLs, request bodies, or raw provider errors. Log static route templates, not token-bearing paths.
- Add modules and dependencies when they contain real functionality. Do not add infrastructure without a demonstrated requirement.
- Preserve capability-aware configuration: the shell, liveness, tests, and build need no production credentials. Never fake provider success.
- Before handoff run lint, format check, typecheck, unit tests, and production build. Keep existing design documents out of automatic formatting.
- Maintain `docs/PROJECT-STATUS.md` as the ongoing project progress record. Read it before major feature work; add or update an entry whenever a major feature is built or materially advanced, in the same change as the implementation. Record the status, delivered scope, validation, and remaining limitations. Preserve completed milestones and distinguish working features from illustrative previews; mark work complete only when its stated scope is delivered.

Approved product clarifications and deferred work are recorded in README.md. This scaffold does not authorize feature implementation.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
