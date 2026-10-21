# Project Status

This is the ongoing progress record for Plan My Marriage. Add a milestone for each major new feature and update existing entries as their implementation advances. Preserve completed milestones so the project's progress remains visible.

This file tracks delivery; product requirements and architecture remain governed by the design documents and the approved clarifications in [README.md](../README.md).

## Current status

The engineering scaffold, public homepage, email/password authentication, wedding setup, event management, guest management with event assignments, personalized guest invitation links, and guest RSVP are implemented. Guests can respond to assigned events and organizers can review event-level attendance. Team access and Resend partner/Manager invitations are also implemented and user-verified. Individual guest email invitations are implemented with preview, send/resend and attempt history; homepage planning content remains illustrative. Wedding tasks and checklist are implemented with team assignment, event links, status tracking, filters and summary counts.

## Milestones

### 1. Project scaffold — Complete

Delivered:

- Next.js App Router foundation with strict TypeScript, Tailwind CSS, and Node 24 tooling.
- Credential-independent shell and `/api/v1/health` liveness endpoint.
- Server-only configuration validation, lazy MongoDB connection support, shared HTTP error/response handling, request IDs, and safe logging utilities.
- Linting, formatting, typechecking, unit tests, production build, CI checks, and Playwright browser-test setup.

Validation: Lint, format check, typecheck, unit tests, and production build passed during the review of the homepage milestone.

Limitations: Database tests use mocks. No authentication, domain models, wedding workflows, or live provider integrations are implemented. Deployment is not recorded as completed.

### 2. Public homepage — Complete (product preview)

Delivered:

- Public landing page based on the approved Stitch design, organized into reusable landing sections.
- Hero and sample workspace, ceremony previews, family collaboration, planning features, guest experience, invitation themes, photo memories, vendor previews, and calls to action.
- Responsive navigation, section links, and a shared native “Coming soon” dialog for product actions.
- Locally served images, logo, and fonts with included font licenses.
- Browser tests for navigation, dialog behavior, image loading, and viewport overflow at 320, 375, 768, and 1440 pixels.

Validation: Lint, format check, typecheck, all 13 foundation unit tests, and production build passed during the original review. The homepage browser regression checks subsequently passed as part of milestone 3's combined 10-test suite, including all four viewport sizes.

Limitations: Workspace, invitation, gallery, and vendor content is illustrative. Wedding creation, RSVP, uploads, and vendor contact remain deferred. Account calls to action now open the working flows delivered in milestone 3.

Implementation commit: `a4a26d5` — `feat: add public wedding planning landing page`.

### 3. Accounts and protected welcome — Complete

Delivered:

- Stitch-based responsive sign-in page and matching sign-up page using the original logo, shared typography, and arch motif.
- Homepage account links now lead to `/sign-in` and `/sign-up`.
- Registration, login, logout, and current-user APIs with normalized email, explicit user DTOs, validation, duplicate-email handling, and generic credential errors.
- Salted bcrypt password hashing, signed seven-day HttpOnly sessions, HTTPS Secure cookies, server-side user/session-version checks, and a protected `/app` welcome page.
- Same-origin mutation checks, bounded JSON request bodies, MongoDB-backed rate limits, and safe unavailable responses.
- User and rate-limit models, explicit production index setup, and ignored local configuration for MongoDB and the session secret. The tracked environment template contains no credentials.
- Unit tests and an isolated browser/API suite using disposable real MongoDB, without connecting to the configured application database.

Validation: Production build, lint, TypeScript, formatting, and all 28 unit tests passed. All 10 combined browser/API tests passed against disposable real MongoDB: registration, session persistence, sign-out/sign-in, protected redirects, safe user serialization, duplicate-registration races, invalid credentials, forged cookies, origin checks, invalid input, rate limiting, responsive account pages, and homepage regressions. The configured MongoDB connection was also verified and both authentication indexes were successfully applied; no test accounts were created in that database.

Limitations: End-to-end account journeys were verified against isolated local MongoDB, not the configured live cluster. Deployment remains unverified. Each additional database needs `npm run db:auth-indexes`. Google sign-in, password recovery, email verification, wedding creation, and team workflows remain deferred. Logout clears the current browser cookie; copied tokens remain valid until expiry or a user session-version change.

### 4. Wedding setup — Complete

Delivered:

- Responsive Stitch-based three-step wizard: wedding details, three theme previews, and editable review before creation.
- Validated names, India-local calendar date, city, welcome note, and normalized unique website handle. Availability is checked on creation; duplicate handles return a recoverable field error.
- User-scoped browser drafts, Save & Exit, resume, and discard. Drafts are restored for seven days and cleared after successful creation.
- MongoDB wedding and first Admin membership created atomically; explicit unique indexes and authenticated, membership-authorized list/read/update APIs.
- Real wedding list, protected overview, and details/theme editing. Websites start unpublished; handles stay fixed after creation.

Validation: Production build, lint, formatting, TypeScript, and all 35 unit tests passed. The 10 existing account/homepage browser checks passed; both new wedding integration tests passed after correcting test locators/navigation waits. The new tests cover draft recovery, mobile/desktop layouts for all three steps, creation and edit persistence, membership isolation, duplicate-handle races, sparse updates, immutable fields, and real transaction rollback on membership failure. Screenshots were visually reviewed. Four wedding indexes were successfully applied to the configured database without creating test weddings.

Limitations: Browser/API write tests use a disposable MongoDB replica set, not the configured live cluster. Deployment remains unverified. Drafts are local to one browser, not synchronized across devices. Theme cards are previews; guest publishing, photos, invitations/team management, and ceremonies remain future increments. Each additional database needs `npm run db:wedding-indexes`; transactions require Atlas or another replica set.

### Local sign-up connectivity fix — Complete

The local preview had been launched in a network-restricted sandbox. MongoDB SRV DNS resolution timed out (`querySrv`, `ETIMEOUT`) after approximately 46 seconds, and the plain Node error incorrectly became HTTP 500. The same configured connection succeeded with network access. Restarted the preview with network access and normalized connection failures to a sanitized HTTP 503, preserving connection retry behavior.

Validation: Registration on the repaired local server against the configured database returned 201, the resulting session returned 200, and logout returned 204. The generated temporary verification account was removed immediately; existing accounts were untouched. Added a DNS-error regression test. All 36 unit tests, lint, formatting, TypeScript, and production build passed.

### 5. Ceremony and event management — Complete

Delivered:

- Schedule, Add/Edit Event, and event details based on the three new Stitch designs. Responsive sidebar/navigation, real summary counts, chronological event cards, empty state, form preview, validation, saving states, and explicit delete confirmation.
- Event name/type, description, optional dress code, India-local start/end times, optional venue/address/map link, and Public/Invite-only visibility (default Invite-only).
- Membership-authorized event APIs, tenant-scoped queries, explicit DTOs, ISO range filters, safe URL validation, sparse/nested PATCH handling, and mutation rate limits. Date-range validation also considers stored values on partial updates.
- Transactional deletion removes event assignments, revokes upload tokens, detaches preserved tasks/expenses, and deletes the event last. Photo-bearing events are blocked until storage cleanup is supported.
- Event index deployment script and isolated database/browser coverage. Wedding overview now links to Manage events.

Validation: Production build, TypeScript, lint, formatting, and all 40 unit tests passed. The 12 existing browser/API checks passed, and both new event checks passed after correcting the test to click the visible event-type label. Event API integration covers cross-wedding access rejection, Manager edits, invalid/partial times, sorting/filtering, nested venue merges, photo deletion blocking, and dependency cleanup. Browser testing covers create/reload/edit, schedule navigation, delete cancellation/confirmation, and all three screens at 320px/1440px without overflow. Captured mobile and desktop layouts were visually reviewed. All write tests used a disposable replica set.

Configured-database follow-up: After Atlas connectivity was restored, `npm run db:event-indexes` succeeded. The running local preview also completed its database-backed login rate-limit check and returned the expected 400 validation response for an empty request. No accounts, weddings, or events were created or changed during this verification.

Limitations: Guest counts, RSVP, tasks, expenses, photo uploads, publishing, calendar/PDF export, and invitation delivery depicted in Stitch remain future increments. No event-specific photo assets or sample guest statistics are presented as real data. Each additional database needs `npm run db:event-indexes`.

### 6. Guest management and event assignments — Complete

Delivered:

- Guest List, Add/Edit Guest, and Guest Details based on the new Stitch screens, with shared wedding navigation, responsive layouts, empty states, actual counts, search, event filtering, and cursor pagination.
- Required guest name; optional normalized email/phone and organizer-only notes. Names are not unique. Event checkboxes and selection preview; details show saved assignments without claiming invitations were sent.
- Membership-authorized guest CRUD and event-assignment APIs, explicit DTOs, tenant-scoped lookups, bounded validation, literal search, rate limits, and six explicit indexes. API group references are validated against the same wedding; group-management UI remains deferred.
- Transactional idempotent assignment preserving existing RSVP state. Parent writes serialize assignments with guest/event removal. Guest deletion removes assignments and revokes associated access tokens atomically.
- Recoverable partial form saves: guest details and assignments follow separate documented APIs; a failed assignment retains the saved guest ID, shows the error, and retries without duplicating the guest. Initial creation with an unknown outcome requires checking the directory before another attempt.

Validation: Production build, TypeScript, lint, formatting, and all 45 unit tests passed. All 16 combined browser/API tests passed against a disposable replica set, covering responsive screens, validation, normalized contacts, partial-save recovery without duplicate guests, assignment edits, search/event filters, confirmed deletion, cross-wedding isolation, literal search, cursor pagination, assignment rollback, idempotent/concurrent assignment, RSVP preservation, Manager access, token revocation, and concurrent guest deletion without orphan assignments. Mobile and desktop screenshots were visually reviewed. The configured Atlas connection succeeded and all six guest/assignment indexes were applied without creating test guests.

Limitations: Family/group UI, invitations, delivery, RSVP submission, import/export, and bulk guest actions remain future increments. Guests can be saved without contact information or event assignments. Removing an assignment deletes its RSVP state and requires confirmation in the editor. Each additional database requires `npm run db:guest-indexes`.

### 7. Personalized guest invitation links — Complete

Delivered:

- Fetched the Stitch guest invitation, expired/revoked link, and updated Guest Details designs. Added a responsive private-link panel, organizer preview, and accountless guest invitation with the wedding's saved Classic Indian, Modern Minimal, or Royal Indian theme.
- Generate a private link with configurable expiration in IST, copy it once, open WhatsApp for manual sharing, inspect issued-link metadata, and confirm revocation. Multiple links can remain active; existing URLs cannot be recovered after leaving the page. Sharing does not claim delivery.
- Membership-authorized link APIs, 256-bit random capabilities, SHA-256-only persistence, explicit unique indexes, and transactional creation serialized with guest deletion. Guest-token access is independent of account sessions and only exposes that guest's assigned events, dates, dress codes, venues, map/livestream links, and safe wedding presentation fields.
- Generic invalid/expired/revoked state, separate retryable unavailable state, no-store responses, no-referrer/noindex guest pages, static application log routes, and suppressed development request logs for capability paths. Organizer preview creates no token. Guest deletion revokes issued capabilities.

Validation: Production build, TypeScript, lint, formatting, and all 48 unit tests passed. All 18 combined browser/API tests passed against disposable MongoDB, including hash-only storage, metadata allowlisting, contact/note privacy, accountless access, session/capability separation, origin protection, guest/wedding scope, multiple active links, assignment changes, expiration, revocation, guest deletion, preview without issuance, reload without raw-link recovery, confirmation cancellation, response privacy headers, and all three themes at 320px/1440px without overflow. Screenshots were visually reviewed. Both invitation indexes were successfully applied to the configured Atlas database without creating guests or invitation links.

Limitations: RSVP submission, email delivery, and public website publishing remain later increments. WhatsApp sharing requires the organizer to send the message. `APP_BASE_URL` must point to a publicly reachable deployment for guests on other devices; localhost links are local only. Expired metadata is retained. Revocation blocks future reads but cannot erase already-viewed content. Hosting/proxy/analytics capability-path redaction must be configured before deployment; deployment remains unverified. Each additional database requires `npm run db:invitation-indexes`.

### 8. Guest RSVP and organizer attendance — Complete

Delivered:

- Used the three new Stitch designs for invitation RSVP controls, response confirmation, and event guest attendance. Guests select Attending or Not attending for each assigned event, confirm, review their saved summary, and return to edit. Reopening a private link restores saved responses. All existing wedding themes remain supported.
- Added `PATCH /api/v1/guest/rsvps` with strict validation, bounded unique event batches, capability authorization independent of account sessions, origin checks, rate limits, sanitized errors, and no-store responses. Changes update existing event assignments atomically; invalid assignments roll back the batch. Unchanged retries preserve response timestamps. Guest/assignment deletion and token revocation serialize against response writes; expiration is checked before the final token write.
- Event Details links to Guests & RSVPs: actual total/Attending/Not attending/Pending counts, name/contact search, status filtering, cursor pagination, response timestamps, guest-detail links, and manual refresh. Summary counts are independent of filters. Guest Details also shows per-event RSVP badges.
- Failed saves preserve selections without claiming success. Removed assignments offer an explicit reload/discard action; invalid capabilities use the existing unavailable-link screen. Mobile rows stack guest details above status/actions, and the status selector has an explicit accessible label.

Validation: Production build, TypeScript, lint, formatting, and all 50 unit tests passed. The combined browser/API run passed 19 checks; the remaining RSVP browser journey passed on its targeted rerun after selector, accessibility-label, and mobile-layout fixes. Coverage includes atomic rollback, idempotent timestamps, response edits/reload, account-cookie rejection, capability expiry/revocation, origin protection, unassigned-event rejection, failed-save recovery, organizer filters, stale-assignment recovery, and 320px/1440px layouts. Screenshots were visually reviewed. All write tests used disposable MongoDB; no live guest responses were changed.

Limitations: Email delivery/reminders, exports, guest-count questionnaires, dietary questions, RSVP deadlines, organizer response overrides, and live polling remain deferred. Existing guest/assignment indexes support this feature; no additional database setup is required. Deployment remains unverified.

### 9. Team access and Resend invitations - Complete (user-verified)

Delivered:

- Fetched four Stitch designs for Team & Access, partner/Manager invitation forms, invitation acceptance, and removal/revocation confirmation. Added responsive real member/invitation lists, role summaries, empty states, explicit confirmations, and navigation from overview/sidebar. Managers see a read-only team directory.
- Admins invite equal co-admins or Managers; only Admins resend/revoke invitations or remove Managers. Admin removal/demotion is blocked. Membership removal preserves accounts and historical data. Roles are wedding-scoped; any account can create its own wedding. Wedding deletion is deferred.
- Server-only Resend adapter with escaped HTML/plain text, optional reply-to, ten-second timeout, idempotency keys and sanitized failures. Records distinguish sending, provider-accepted and failed; no inbox-delivery claim. Resending rotates capabilities and invalidates old links.
- Seven-day hash-only capabilities, same-email acceptance, inline sign-in/sign-up, mismatched-account switching, unavailable/expired/revoked states, and accepted retry. Fragment URLs keep capabilities out of HTTP paths. Removed Managers cannot replay accepted links; existing roles cannot be upgraded through acceptance.
- Transactional authorization and parent-wedding serialization, duplicate invitation prevention, member isolation, origin protection, explicit DTOs, rate limits, no-store responses, and unique/TTL indexes. Added deployment script and updated API/persistence documentation.

Validation: Production build, TypeScript, lint, formatting and 53 unit tests passed. The combined browser/API run passed 17 checks; five failed checks subsequently passed on a targeted rerun after fixing the new test session fixture (two team checks) and retrying three existing homepage lazy-image timeouts. Team coverage includes Admin/Manager authorization, cross-wedding rejection, duplicate races, provider failures, token rotation/hash-only storage, expiry/revocation, role-forgery rejection, acceptance retries and removed-member replay rejection. The final two team checks also passed after adding an accessible dialog name and exercising real inline sign-in without losing the invitation. Desktop/mobile screens at 320px and 1440px were captured and visually reviewed. All email sends were intercepted in the isolated test server; all write tests used disposable MongoDB. Three team indexes were successfully applied to the configured Atlas database without creating team records.

Email diagnosis update (2026-10-19): The earlier domains-list 401 was restricted_api_key because the key has sending-only access, not evidence of an invalid key. The original pmm.com sender was rejected as unverified. The current EMAIL_FROM uses the Resend test sender; a direct request with the complete configured payload to Resend's simulated delivered@resend.dev inbox returned 200. No email was sent to a person. The previously reported invitation failure cannot be assigned an exact cause from its generic 502 alone; recipient restrictions or the prior running configuration remain unconfirmed possibilities. Added fixed, sanitized messages distinguishing test-recipient restrictions, unverified domains, key permissions/authentication, quota/rate limits and invalid settings. Provider response text and account addresses are never returned or logged. Nine added regression cases pass (62 unit tests total). The user confirmed on 2026-10-19 that invitations are now working. The final build, TypeScript, lint, formatting and all 62 unit tests passed before this confirmation. APP_BASE_URL is local, so invitations for recipients on other devices need a publicly reachable deployment. Expired invitation metadata is TTL-cleaned; lists show the newest 200 records. Guest email delivery, delivery webhooks, automatic retries, Admin removal/demotion and wedding deletion remain deferred.

### 10. Individual guest email invitations - Complete

Delivered:

- Fetched and used Stitch's Guest Details & Email Invitation and Preview & Send Invitation Modal designs. Guest Details places email/celebrations alongside contact/private-link cards, with responsive preview, sending, provider-accepted, failure and retry states. No illustrative delivery badges or fake activity is shown.
- Admins and Managers can preview the saved recipient and assigned celebrations, send a personalized email, inspect the latest 20 attempts, and explicitly resend. Missing-email guests link to the editor. Preview creates no token and sends nothing; private notes and unassigned events are excluded.
- Shared Resend adapter with escaped HTML/plain text, sanitized provider failures and idempotency keys. Each explicit new send issues a fresh hash-only private guest capability; older shared links and RSVP responses remain intact. Failed or unconfirmed attempts revoke only their newly generated link. Sent means provider acceptance, not inbox delivery.
- Reviewed-content hash prevents sending stale guest/event details. Per-guest transactional serialization, request UUID deduplication, membership/origin checks, bounded validation, rate limits and no-store DTOs protect the API. Lost-response retry returns the existing outcome without another provider call. Guest deletion/contact changes during sending prevent finalization and invalidate the attempted link. Overdue in-progress attempts recover on a later send.
- Existing guest-token indexes suffice; no migration, new database collection, or live test records are required. Updated API and persistence contracts and README.

Validation: Production build, TypeScript, lint, formatting and all 65 unit tests passed. The full browser/API run passed 23 of 24 checks; the new UI check encountered an ambiguous alert locator, which was corrected. Both guest-email checks subsequently passed against the final layout, including lost-response recovery without duplicate sending, preview cancellation, explicit resend, failure recovery, stale-preview rejection, missing email, Manager access, outsider/origin/override rejection, provider failure/timeout, concurrent sends, hash-only storage, metadata privacy, guest deletion during send, link revocation and retention of existing links. Mobile/desktop screenshots at 320px and 1440px were captured and visually reviewed. All automated sends used the isolated Resend mock and disposable MongoDB; no real guest emails were sent.

Limitations: Bulk sending, reminders, email-copy editing and delivery/open tracking remain deferred. The configured Resend test sender is restricted; real guest distribution requires a verified sending domain and public APP_BASE_URL. Emails are snapshots; linked pages show current assigned events. Provider calls cannot be rolled back, so an email sent before a timeout or guest deletion can contain a revoked link. In-progress crash recovery runs on the next send after 60 seconds, not a background worker. Deployment remains unverified.

### 11. Wedding tasks and checklist - Complete

Delivered:

- Fetched Stitch Wedding Tasks, Add/Edit Task Modal, and Task Details designs. Added responsive task overview, real summary counts, title search, assignee/event/status/priority/overdue filters, cursor pagination, task editor and details. Navigation is available from the wedding overview and workspace sidebar.
- Admins and Managers create, edit, assign, complete/reopen and delete tasks with confirmation. Optional event, current team assignee, due time in IST, priority and plain-text description. Done maps to COMPLETED; completion retries preserve timestamps, reopening clears them.
- Thin authenticated APIs with explicit DTOs, strict bounded validation, origin checks, rate limits, no-store responses and wedding-scoped queries. Transactions serialize team membership changes and event assignment/deletion. Removed assignees remain historical; event deletion detaches preserved tasks. No simulated vendor/contact/notification data is displayed.
- Four task indexes and a repeatable deployment script. Applied to configured Atlas without creating tasks. Updated API/database docs and README.

Validation: Build, TypeScript, lint, formatting and all 68 unit tests passed. All 26 combined browser/API checks passed against disposable MongoDB, including task tenant isolation, origin checks, forged fields, cross-wedding references, sparse updates, completion timestamp idempotence, reopening, literal search, cursor pagination, Manager access/removal, historical assignment retention, event detachment, create/edit/delete UI and 320px/1440px overflow checks. Desktop/mobile screenshots were visually reviewed. An initial browser launch issue was resolved by selecting the existing .tools/browsers installation. No test tasks were created in the live database. Local preview returned health 200.

Limitations: Reminders, recurring tasks, notifications, exports, subscribers, vendor integration and live polling are deferred. Unknown creation outcomes require checking the refreshed task list before retry. Due-time labels use IST. Each new database needs npm run db:task-indexes. Deployment remains unverified.

## Maintaining this record

For each major feature, record its status, delivered scope, validation results, and remaining limitations. Update the entry when the scope or status changes, and add an implementation commit reference when available. Do not mark planned behavior or sample UI as working functionality.
