# Plan My Marriage — API Design Document

**Version:** 1.0  
**Application:** Next.js modular monolith  
**Language:** TypeScript  
**API Style:** REST-style JSON APIs using Next.js Route Handlers  
**Database:** MongoDB Atlas + Mongoose  
**Validation:** Zod  
**Authentication:** Signed HttpOnly session cookie for Admin/Manager APIs  
**Guest Access:** High-entropy bearer capability tokens  
**Email:** Resend  
**Media Storage:** Cloudflare R2  
**Media Delivery:** Cloudflare CDN / custom media domain  
**Rate Limiting:** MongoDB-backed fixed-window limiter in V1

---

## 1. Purpose

This document defines the V1 HTTP API contract for **Plan My Marriage**.

It translates the approved PRD, System Design Architecture, and Database Design into concrete:

- API namespaces;
- authentication and authorization rules;
- request and response formats;
- resource endpoints;
- Zod validation boundaries;
- pagination/filter conventions;
- rate-limit policies;
- guest token behavior;
- invitation/email flows;
- R2 upload flows;
- public wedding website APIs;
- error semantics;
- idempotency rules;
- implementation conventions for Next.js Route Handlers.

The API is intentionally designed for a **modular monolith**. Route Handlers remain thin and delegate business rules to domain services.

---

# 2. API Design Principles

## 2.1 Version all client-facing APIs

All HTTP APIs use:

```text
/api/v1/*
```

V1 remains stable while implementation details behind the routes can evolve.

---

## 2.2 Wedding is the tenant boundary

For authenticated wedding-scoped APIs, the client normally supplies a `weddingId` in the route.

Example:

```text
/api/v1/weddings/:weddingId/tasks
```

The server must never trust that ID by itself.

Every request follows:

```text
Session
  -> authenticated userId
  -> WeddingMember lookup
  -> role authorization
  -> weddingId-scoped domain query
```

Database access must remain tenant-scoped:

```ts
Task.findOne({
  _id: taskId,
  weddingId
})
```

not:

```ts
Task.findById(taskId)
```

---

## 2.3 Guest scope comes from the token

Guest APIs must not trust browser-supplied:

- `guestId`;
- `weddingId`;
- `eventId` for RSVP ownership.

A validated guest access token determines:

```text
guestId
weddingId
```

A validated photo-upload token determines:

```text
weddingId
eventId
```

The client may reference an `eventId` when submitting an RSVP response, but the server verifies that the event is already assigned to the token's guest through `EventGuest`.

---

## 2.4 Server validation is authoritative

Every external request is validated with **Zod** before reaching domain logic.

Client-side validation may reuse the same schemas for UX, but it is never treated as security.

---

## 2.5 Route Handlers stay thin

A Route Handler should primarily do:

```text
parse request
-> authenticate / validate capability token
-> rate limit
-> Zod validation
-> call domain service
-> serialize response
```

Business rules belong in services, not Route Handlers.

---

## 2.6 Avoid provider-specific leakage

External systems are accessed through adapters:

```text
EmailService -> Resend adapter
MediaStorage -> Cloudflare R2 adapter
VendorProvider -> external business/places provider
```

API consumers should not depend on provider-specific response shapes.

---

# 3. Application Surfaces and API Trust Levels

Plan My Marriage has three user-facing surfaces and corresponding API trust levels.

## 3.1 Authenticated planning surface

Frontend:

```text
/app/*
```

API:

```text
/api/v1/auth/*
/api/v1/weddings/*
```

Used by:

- Admin;
- Manager.

Authentication:

```text
signed Secure HttpOnly session cookie
```

Authorization:

```text
WeddingMember
role = ADMIN | MANAGER
```

---

## 3.2 Public wedding surface

Frontend:

```text
/w/:slug
```

API:

```text
/api/v1/public/*
```

Authentication:

```text
none
```

Only explicitly publishable wedding data is returned.

Never expose:

- tasks;
- expenses;
- members;
- internal guest notes;
- private guest list;
- access tokens;
- invitation metadata;
- rate-limit state.

---

## 3.3 Token-protected guest surface

Example frontend routes:

```text
/guest/invite/:token
/guest/upload/:token
```

API namespaces:

```text
/api/v1/guest/*
```

Authentication:

```text
Bearer capability token
```

Two distinct capability types exist:

1. **Guest Access Token**
   - personalized invitation;
   - assigned events;
   - RSVP.

2. **Photo Upload Token**
   - one event only;
   - photo-upload context;
   - R2 upload authorization;
   - photo finalize.

These token types are not interchangeable.

---

# 4. Base URL and Content Type

Production API:

```text
https://planmymarriage.com/api/v1
```

All JSON requests use:

```http
Content-Type: application/json
Accept: application/json
```

Photo bytes do **not** pass through the JSON API. They upload directly to Cloudflare R2 using short-lived presigned URLs.

---

# 5. Authentication

## 5.1 Admin/Manager session

After successful login, the server sets a signed session cookie.

Recommended cookie attributes:

```text
HttpOnly
Secure
SameSite=Lax
Path=/
```

The session contains only compact identity/session metadata such as:

```text
userId
issuedAt
expiresAt
sessionVersion
```

The browser never stores the session token in `localStorage`.

---

## 5.2 Cookie-authenticated mutation protection

For state-changing authenticated routes:

```text
POST
PATCH
DELETE
```

the server should validate that the request originates from an allowed Plan My Marriage origin using `Origin` / `Referer` checks.

This supplements `SameSite=Lax` and reduces CSRF risk.

---

## 5.3 Guest capability authentication

Guest APIs receive the raw capability token in the HTTP authorization header:

```http
Authorization: Bearer <raw-token>
```

The API:

1. hashes the token with SHA-256;
2. finds the corresponding token record by `tokenHash`;
3. verifies expiry;
4. verifies `revokedAt` is empty;
5. derives trusted wedding/guest/event scope.

Raw capability tokens must never be written to application logs.

---

# 6. Common Response Format

## 6.1 Successful single-resource response

```json
{
  "data": {
    "id": "..."
  },
  "meta": {
    "requestId": "req_..."
  }
}
```

---

## 6.2 Successful list response

```json
{
  "data": [],
  "meta": {
    "requestId": "req_...",
    "nextCursor": null
  }
}
```

`nextCursor` is omitted or `null` when there is no next page.

---

## 6.3 Error response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the highlighted fields.",
    "fields": {
      "email": "Enter a valid email address."
    }
  },
  "meta": {
    "requestId": "req_..."
  }
}
```

Internal stack traces, provider secrets, MongoDB errors, and raw tokens must never be returned.

---

# 7. HTTP Status Codes

| Status | Meaning |
|---|---|
| `200` | Successful read/update/action |
| `201` | Resource created |
| `202` | Request accepted where external delivery/action has begun |
| `204` | Successful deletion with no body |
| `400` | Invalid request or Zod validation failure |
| `401` | Authentication required / invalid session |
| `403` | Authenticated but not authorized |
| `404` | Resource unavailable, inaccessible, unpublished, or intentionally hidden |
| `409` | Conflict, duplicate state, invalid state transition |
| `413` | Upload metadata indicates file too large |
| `429` | Rate limit exceeded |
| `502` | External provider failure when operation cannot complete |
| `500` | Unexpected server failure |

For cross-wedding resource access, prefer a generic `404` where revealing existence would create information leakage.

---

# 8. Standard Error Codes

Initial application error codes:

```text
VALIDATION_ERROR
AUTH_REQUIRED
INVALID_CREDENTIALS
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
INVALID_STATE
EMAIL_DELIVERY_FAILED
GUEST_LINK_INVALID
UPLOAD_LINK_INVALID
UPLOAD_NOT_FOUND
UPLOAD_INVALID
PROVIDER_UNAVAILABLE
INTERNAL_ERROR
```

For public capability URLs, avoid distinguishing:

```text
expired
revoked
non-existent
```

when that distinction would leak information.

Use:

```text
GUEST_LINK_INVALID
```

or:

```text
UPLOAD_LINK_INVALID
```

with a generic user-facing message.

---

# 9. Pagination

Large collections use cursor pagination.

Applies primarily to:

- tasks;
- expenses;
- guests;
- photos/gallery;
- event guest lists.

Query parameters:

```text
?limit=20&cursor=<opaque-cursor>
```

Defaults:

```text
default limit = 20
maximum limit = 100
```

The cursor is opaque to clients.

Recommended implementation:

```text
createdAt + _id
```

encoded server-side.

Clients must not construct cursors themselves.

---

# 10. Filtering and Sorting

Filtering uses query parameters.

Examples:

```text
/tasks?status=TODO&priority=HIGH
/tasks?eventId=...
/expenses?category=PHOTOGRAPHY
/guests?groupId=...
/photos?eventId=...
```

Unsupported filter combinations return `400`.

Sorting is intentionally limited to approved options rather than accepting arbitrary database field names.

---

# 11. Authentication APIs

## 11.1 Register

```http
POST /api/v1/auth/register
```

Authentication:

```text
none
```

Request:

```json
{
  "displayName": "Ritik Sharma",
  "email": "ritik@example.com",
  "password": "strong-password"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "68d0a0010000000000000001",
      "displayName": "Ritik Sharma",
      "email": "ritik@example.com"
    }
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

Behavior:

- normalize email;
- hash password using approved adaptive password hash;
- reject duplicate email with `409`;
- create authenticated session after successful registration.

Rate limit:

```text
per IP
```

---

## 11.2 Login

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "ritik@example.com",
  "password": "strong-password"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "68d0a0010000000000000001",
      "displayName": "Ritik Sharma",
      "email": "ritik@example.com"
    }
  },
  "meta": {
    "requestId": "req_124"
  }
}
```

Failures use generic:

```text
INVALID_CREDENTIALS
```

Do not disclose whether the email exists.

---

## 11.3 Logout

```http
POST /api/v1/auth/logout
```

Clears the session cookie.

Response:

```text
204 No Content
```

---

## 11.4 Current authenticated user

```http
GET /api/v1/auth/me
```

Response:

```json
{
  "data": {
    "user": {
      "id": "...",
      "displayName": "Ritik Sharma",
      "email": "ritik@example.com"
    }
  },
  "meta": {
    "requestId": "req_125"
  }
}
```

Password/security fields are never serialized.

---

# 12. Wedding APIs

## 12.1 List weddings available to current user

```http
GET /api/v1/weddings
```

Authentication:

```text
required
```

Response:

```json
{
  "data": [
    {
      "id": "68d0b0010000000000000001",
      "brideName": "Priya",
      "groomName": "Ritik",
      "weddingDate": "2027-02-14T12:00:00.000Z",
      "city": "Delhi",
      "slug": "ritik-weds-priya",
      "theme": "CLASSIC_INDIAN",
      "role": "ADMIN"
    }
  ],
  "meta": {
    "requestId": "req_126"
  }
}
```

The `role` is derived from `WeddingMember`, not from `User`.

---

## 12.2 Create wedding

```http
POST /api/v1/weddings
```

Request:

```json
{
  "brideName": "Priya",
  "groomName": "Ritik",
  "weddingDate": "2027-02-14T12:00:00.000Z",
  "city": "Delhi",
  "slug": "ritik-weds-priya",
  "theme": "CLASSIC_INDIAN",
  "description": "Join us as we celebrate our wedding."
}
```

Response:

```text
201 Created
```

Behavior uses one MongoDB transaction:

```text
create Wedding
+
create WeddingMember(role=ADMIN)
```

Slug conflict:

```text
409 CONFLICT
```

---

## 12.3 Get wedding for planning surface

```http
GET /api/v1/weddings/:weddingId
```

Requires membership.

Returns internal planning-safe wedding fields and current user's role.

---

## 12.4 Update wedding

```http
PATCH /api/v1/weddings/:weddingId
```

Admin/Manager may update normal wedding data.

Fields may include:

```json
{
  "brideName": "Priya",
  "groomName": "Ritik",
  "weddingDate": "2027-02-14T12:00:00.000Z",
  "city": "Delhi",
  "description": "Join us.",
  "theme": "ROYAL_INDIAN",
  "website": {
    "isPublished": true,
    "showGallery": true,
    "showLivestream": true
  }
}
```

Ownership-sensitive settings may be restricted to Admin in the domain service.

Full wedding deletion is intentionally not part of the normal V1 public API because it requires broad relational and media cleanup.

---

# 13. Dashboard API

## 13.1 Wedding dashboard summary

```http
GET /api/v1/weddings/:weddingId/dashboard
```

Authentication:

```text
ADMIN or MANAGER membership
```

Returns aggregated planning information.

Example:

```json
{
  "data": {
    "countdown": {
      "weddingDate": "2027-02-14T12:00:00.000Z",
      "daysRemaining": 146
    },
    "tasks": {
      "total": 24,
      "todo": 6,
      "inProgress": 4,
      "completed": 14,
      "overdue": 3
    },
    "expenses": {
      "totalAmountPaise": 84500000,
      "currency": "INR"
    },
    "guests": {
      "total": 430,
      "attending": 287,
      "notAttending": 42,
      "pending": 101
    },
    "upcomingEvents": [],
    "recentActivity": []
  },
  "meta": {
    "requestId": "req_127"
  }
}
```

`recentActivity` may be omitted until/if an activity model is implemented.

---

# 14. Wedding Member and Manager Invitation APIs

## 14.1 List wedding members

```http
GET /api/v1/weddings/:weddingId/members
```

Returns Admins and Managers.

---

## 14.2 Invite Manager

```http
POST /api/v1/weddings/:weddingId/member-invitations
```

Authorization:

```text
ADMIN only
```

Request:

```json
{
  "email": "family@example.com"
}
```

Behavior:

1. normalize email;
2. confirm requester is Admin;
3. ensure the target user is not already a member;
4. prevent duplicate active invitation where appropriate;
5. generate high-entropy raw token;
6. store only SHA-256 token hash;
7. call Resend;
8. set `sentAt` and `providerMessageId` after provider success.

Response:

```text
201 Created
```

If Resend fails immediately:

```text
502 EMAIL_DELIVERY_FAILED
```

The invitation must not be marked successfully sent.

---

## 14.3 List pending Manager invitations

```http
GET /api/v1/weddings/:weddingId/member-invitations
```

Authorization:

```text
ADMIN only
```

Returns metadata only:

- invitation ID;
- email;
- createdAt;
- sentAt;
- expiresAt;
- acceptedAt;
- revokedAt.

Never returns raw token.

---

## 14.4 Resend Manager invitation

```http
POST /api/v1/weddings/:weddingId/member-invitations/:invitationId/resend
```

Authorization:

```text
ADMIN only
```

Because raw tokens are not stored, resend should generate a **new invitation token** and revoke/replace the prior pending capability according to service rules.

---

## 14.5 Revoke Manager invitation

```http
DELETE /api/v1/weddings/:weddingId/member-invitations/:invitationId
```

Authorization:

```text
ADMIN only
```

Marks/revokes the pending invitation.

Response:

```text
204 No Content
```

---

## 14.6 Accept Manager invitation

```http
POST /api/v1/member-invitations/accept
```

Authentication:

```text
signed-in user required
```

Request:

```json
{
  "token": "<raw-invitation-token>"
}
```

Behavior:

- hash token;
- find valid invitation;
- verify signed-in normalized email matches invited email;
- transaction:
  - create `WeddingMember` if absent;
  - mark invitation `acceptedAt`.

Response:

```json
{
  "data": {
    "weddingId": "68d0b0010000000000000001",
    "role": "MANAGER"
  },
  "meta": {
    "requestId": "req_128"
  }
}
```

---

## 14.7 Remove Manager

```http
DELETE /api/v1/weddings/:weddingId/members/:memberId
```

Authorization:

```text
ADMIN only
```

Rules:

- Admin cannot use this endpoint to remove another Admin in V1;
- removing a Manager deletes the membership;
- historical task/photo creator IDs may remain for audit/display.

Response:

```text
204 No Content
```

---

# 15. Event APIs

## 15.1 List events

```http
GET /api/v1/weddings/:weddingId/events
```

Optional:

```text
?from=<ISO-date>&to=<ISO-date>
```

Typical event counts are small, so V1 does not require pagination.

---

## 15.2 Create event

```http
POST /api/v1/weddings/:weddingId/events
```

Request:

```json
{
  "name": "Sangeet",
  "type": "SANGEET",
  "startsAt": "2027-02-13T13:30:00.000Z",
  "endsAt": "2027-02-13T18:00:00.000Z",
  "description": "An evening of music and celebration.",
  "dressCode": "Indo-Western",
  "venue": {
    "name": "ABC Banquet",
    "address": "New Delhi, Delhi",
    "mapUrl": "https://maps.google.com/..."
  },
  "livestreamUrl": null
}
```

Validation:

```text
endsAt > startsAt
```

when `endsAt` is present.

---

## 15.3 Get event

```http
GET /api/v1/weddings/:weddingId/events/:eventId
```

---

## 15.4 Update event

```http
PATCH /api/v1/weddings/:weddingId/events/:eventId
```

Patch only submitted fields.

---

## 15.5 Delete event

```http
DELETE /api/v1/weddings/:weddingId/events/:eventId
```

This is a controlled operation.

Expected domain behavior:

- delete related `eventGuests`;
- revoke event `photoUploadTokens`;
- detach Tasks/Expenses from the event where they should be preserved;
- remove event-specific photo objects/metadata only with appropriate confirmation;
- delete Event last.

Because this operation can affect photos, UI should require explicit confirmation.

---

# 16. Task APIs

## 16.1 List tasks

```http
GET /api/v1/weddings/:weddingId/tasks
```

Supported filters:

```text
status
priority
eventId
assignedToUserId
dueBefore
dueAfter
cursor
limit
```

Example:

```text
/api/v1/weddings/abc/tasks?status=TODO&priority=HIGH&limit=20
```

---

## 16.2 Create task

```http
POST /api/v1/weddings/:weddingId/tasks
```

Request:

```json
{
  "title": "Confirm Sangeet DJ",
  "description": "Call and confirm timing.",
  "eventId": "68d0d0010000000000000001",
  "assignedToUserId": "68d0a0010000000000000009",
  "priority": "HIGH",
  "status": "TODO",
  "dueDate": "2027-02-01T12:00:00.000Z"
}
```

Service rules:

- event must belong to wedding;
- assigned user must be a current `WeddingMember`;
- no cross-wedding references.

---

## 16.3 Get task

```http
GET /api/v1/weddings/:weddingId/tasks/:taskId
```

---

## 16.4 Update task

```http
PATCH /api/v1/weddings/:weddingId/tasks/:taskId
```

When status changes to:

```text
COMPLETED
```

set `completedAt`.

When moving back from completed, clear/recompute `completedAt`.

---

## 16.5 Delete task

```http
DELETE /api/v1/weddings/:weddingId/tasks/:taskId
```

Response:

```text
204 No Content
```

---

# 17. Expense APIs

The API intentionally models **simple expense tracking**, not budgeting.

## 17.1 List expenses

```http
GET /api/v1/weddings/:weddingId/expenses
```

Filters:

```text
eventId
category
dateFrom
dateTo
cursor
limit
```

---

## 17.2 Create expense

```http
POST /api/v1/weddings/:weddingId/expenses
```

Request accepts rupee input at API/UI boundary:

```json
{
  "name": "Wedding Photographer",
  "category": "PHOTOGRAPHY",
  "amount": 80000,
  "date": "2027-02-10T12:00:00.000Z",
  "eventId": "68d0d0010000000000000001",
  "vendorName": "ABC Photography",
  "paidBy": "Ritik",
  "notes": "Full photography package"
}
```

The service converts to integer paise:

```text
₹80,000 -> 8,000,000 paise
```

Persistence:

```text
amountPaise
currency = INR
```

Do not expose or accept:

- planned amount;
- negotiated amount;
- remaining budget;
- total wedding budget.

---

## 17.3 Expense summary

```http
GET /api/v1/weddings/:weddingId/expenses/summary
```

Response:

```json
{
  "data": {
    "totalAmountPaise": 84500000,
    "currency": "INR",
    "byCategory": [
      {
        "category": "PHOTOGRAPHY",
        "amountPaise": 8000000
      }
    ],
    "byEvent": []
  },
  "meta": {
    "requestId": "req_129"
  }
}
```

---

## 17.4 Get expense

```http
GET /api/v1/weddings/:weddingId/expenses/:expenseId
```

---

## 17.5 Update expense

```http
PATCH /api/v1/weddings/:weddingId/expenses/:expenseId
```

---

## 17.6 Delete expense

```http
DELETE /api/v1/weddings/:weddingId/expenses/:expenseId
```

---

# 18. Guest Group APIs

## 18.1 List guest groups

```http
GET /api/v1/weddings/:weddingId/guest-groups
```

---

## 18.2 Create guest group

```http
POST /api/v1/weddings/:weddingId/guest-groups
```

Request:

```json
{
  "name": "Rajesh Uncle Family"
}
```

Group name is normalized for uniqueness **within the wedding**.

---

## 18.3 Update guest group

```http
PATCH /api/v1/weddings/:weddingId/guest-groups/:groupId
```

---

## 18.4 Delete guest group

```http
DELETE /api/v1/weddings/:weddingId/guest-groups/:groupId
```

Behavior:

```text
Guest.guestGroupId -> null
then delete GuestGroup
```

Guests are not deleted.

---

# 19. Guest APIs

## 19.1 List guests

```http
GET /api/v1/weddings/:weddingId/guests
```

Filters:

```text
q
groupId
eventId
rsvpStatus
cursor
limit
```

Example:

```text
/guests?q=raj&groupId=...
```

`q` may match normalized name/email/phone according to implementation.

---

## 19.2 Create guest

```http
POST /api/v1/weddings/:weddingId/guests
```

Request:

```json
{
  "name": "Rajesh Sharma",
  "phone": "+919876543210",
  "email": "rajesh@example.com",
  "guestGroupId": "68d0e0010000000000000001",
  "notes": "Organizer-only note"
}
```

The API does not collect:

- food preference;
- guest password;
- guest message to the couple.

Guest name is not unique.

---

## 19.3 Get guest

```http
GET /api/v1/weddings/:weddingId/guests/:guestId
```

May include event assignment summary for the planning UI.

---

## 19.4 Update guest

```http
PATCH /api/v1/weddings/:weddingId/guests/:guestId
```

---

## 19.5 Delete guest

```http
DELETE /api/v1/weddings/:weddingId/guests/:guestId
```

Recommended transaction:

```text
delete EventGuest records
revoke/delete GuestAccessTokens
delete Guest
```

---

# 20. Event Guest Assignment APIs

## 20.1 List guests assigned to event

```http
GET /api/v1/weddings/:weddingId/events/:eventId/guests
```

Filters:

```text
rsvpStatus
q
cursor
limit
```

---

## 20.2 Assign guests to event

```http
POST /api/v1/weddings/:weddingId/events/:eventId/guests
```

Request:

```json
{
  "guestIds": [
    "68d0e1000000000000000001",
    "68d0e1000000000000000002"
  ]
}
```

Behavior:

- verify all guests belong to wedding;
- create missing `EventGuest` records;
- initial RSVP = `PENDING`;
- existing assignments may be ignored idempotently.

Response may include:

```json
{
  "data": {
    "created": 2,
    "alreadyAssigned": 0
  },
  "meta": {
    "requestId": "req_130"
  }
}
```

---

## 20.3 Remove guests from event

```http
DELETE /api/v1/weddings/:weddingId/events/:eventId/guests
```

Request:

```json
{
  "guestIds": [
    "68d0e1000000000000000001"
  ]
}
```

Removing an event assignment also removes that event's RSVP state because RSVP lives on `EventGuest`.

---

## 20.4 Events assigned to one guest

```http
GET /api/v1/weddings/:weddingId/guests/:guestId/events
```

Used by planning UI to inspect or edit event-level invitation assignments.

---

# 21. Guest Invitation Link APIs

Guest invitations are represented by `GuestAccessToken`, not a standalone Invitation collection.

Raw tokens are **returned only at creation time** and are never stored.

Multiple still-valid guest links may exist for the same guest unless explicitly revoked.

This allows an emailed link to remain valid even if the organizer later creates another link for WhatsApp sharing.

---

## 21.1 Create shareable guest link

```http
POST /api/v1/weddings/:weddingId/guests/:guestId/access-links
```

Authentication:

```text
ADMIN or MANAGER
```

Request:

```json
{
  "expiresAt": "2027-02-21T23:59:59.000Z"
}
```

Response:

```json
{
  "data": {
    "accessTokenId": "68d0fa010000000000000001",
    "url": "https://planmymarriage.com/guest/invite/<raw-token>",
    "expiresAt": "2027-02-21T23:59:59.000Z"
  },
  "meta": {
    "requestId": "req_131"
  }
}
```

The raw token is shown once.

---

## 21.2 List issued guest links

```http
GET /api/v1/weddings/:weddingId/guests/:guestId/access-links
```

Returns metadata only:

- token record ID;
- createdAt;
- expiresAt;
- lastUsedAt;
- sentAt;
- revokedAt.

Does not return raw token or URL containing raw token.

---

## 21.3 Revoke guest link

```http
DELETE /api/v1/weddings/:weddingId/guests/:guestId/access-links/:accessTokenId
```

Sets `revokedAt`.

Response:

```text
204 No Content
```

---

# 22. Guest Invitation Email API

## 22.1 Email invitation to guest

```http
POST /api/v1/weddings/:weddingId/guests/:guestId/invitations/email
```

Requirements:

- guest must have an email;
- requester must be wedding member;
- send endpoint is rate limited.

Behavior:

1. generate new guest access token;
2. store hash only;
3. generate personalized invitation URL;
4. render transactional email;
5. send with Resend;
6. after provider success, record `sentAt` and `providerMessageId`.

Response:

```text
202 Accepted
```

Example:

```json
{
  "data": {
    "sent": true,
    "email": "rajesh@example.com"
  },
  "meta": {
    "requestId": "req_132"
  }
}
```

If provider fails synchronously:

```text
502 EMAIL_DELIVERY_FAILED
```

No marketing/campaign functionality is exposed.

---

# 23. Token-Protected Guest Invitation APIs

These routes use:

```http
Authorization: Bearer <guest-access-token>
```

The token identifies the guest and wedding.

---

## 23.1 Get guest invitation context

```http
GET /api/v1/guest/invitation
```

Response contains only guest-facing data.

Example:

```json
{
  "data": {
    "guest": {
      "name": "Rajesh Sharma"
    },
    "wedding": {
      "brideName": "Priya",
      "groomName": "Ritik",
      "weddingDate": "2027-02-14T12:00:00.000Z",
      "theme": "CLASSIC_INDIAN",
      "description": "Join us as we celebrate our wedding."
    },
    "events": [
      {
        "id": "68d0d0010000000000000001",
        "name": "Sangeet",
        "startsAt": "2027-02-13T13:30:00.000Z",
        "endsAt": "2027-02-13T18:00:00.000Z",
        "dressCode": "Indo-Western",
        "venue": {
          "name": "ABC Banquet",
          "address": "New Delhi, Delhi",
          "mapUrl": "https://maps.google.com/..."
        },
        "livestreamUrl": null,
        "rsvpStatus": "PENDING"
      }
    ]
  },
  "meta": {
    "requestId": "req_133"
  }
}
```

Only events assigned to this guest are returned.

---

## 23.2 Submit/update RSVP

```http
PATCH /api/v1/guest/rsvps
```

Request:

```json
{
  "responses": [
    {
      "eventId": "68d0d0010000000000000001",
      "status": "ATTENDING"
    },
    {
      "eventId": "68d0d0010000000000000002",
      "status": "NOT_ATTENDING"
    }
  ]
}
```

Allowed values:

```text
ATTENDING
NOT_ATTENDING
```

The browser does not submit `guestId` or `weddingId`.

Server validates that every submitted event already has an `EventGuest` relation for the token's guest.

Implementation may use `bulkWrite`.

The operation is idempotent.

Response:

```json
{
  "data": {
    "responses": [
      {
        "eventId": "...",
        "status": "ATTENDING",
        "respondedAt": "2027-01-01T10:00:00.000Z"
      }
    ]
  },
  "meta": {
    "requestId": "req_134"
  }
}
```

The API does not accept:

- food preference;
- guest messages;
- arbitrary guest count questionnaires.

---

# 24. Public Wedding Website APIs

Public APIs expose only published data.

---

## 24.1 Get public wedding

```http
GET /api/v1/public/weddings/:slug
```

Rules:

- wedding must exist;
- `website.isPublished` must be `true`;
- otherwise return generic `404`.

Response may include:

```json
{
  "data": {
    "id": "68d0b0010000000000000001",
    "slug": "ritik-weds-priya",
    "brideName": "Priya",
    "groomName": "Ritik",
    "weddingDate": "2027-02-14T12:00:00.000Z",
    "city": "Delhi",
    "theme": "CLASSIC_INDIAN",
    "description": "Join us as we celebrate our wedding.",
    "coverPhoto": {
      "url": "https://media.planmymarriage.com/..."
    },
    "couplePhoto": {
      "url": "https://media.planmymarriage.com/..."
    },
    "website": {
      "showGallery": true,
      "showLivestream": true
    },
    "events": []
  },
  "meta": {
    "requestId": "req_135"
  }
}
```

The serializer must use an explicit public DTO rather than serializing the entire Wedding document.

---

## 24.2 Public gallery

```http
GET /api/v1/public/weddings/:slug/gallery
```

Query:

```text
eventId
cursor
limit
```

Requirements:

```text
website.isPublished = true
website.showGallery = true
```

Response:

```json
{
  "data": [
    {
      "id": "...",
      "eventId": "...",
      "url": "https://media.planmymarriage.com/weddings/.../photo.webp",
      "mimeType": "image/webp",
      "createdAt": "2027-02-13T16:40:00.000Z"
    }
  ],
  "meta": {
    "requestId": "req_136",
    "nextCursor": "..."
  }
}
```

Do not expose:

- `objectKey` when not needed by the client;
- uploader user IDs;
- internal notes;
- storage credentials.

---

# 25. Gallery Management APIs

## 25.1 List wedding photos for Admin/Manager

```http
GET /api/v1/weddings/:weddingId/photos
```

Filters:

```text
eventId
purpose
uploadedByType
cursor
limit
```

---

## 25.2 Delete photo

```http
DELETE /api/v1/weddings/:weddingId/photos/:photoId
```

Recommended flow:

1. authorize membership;
2. fetch Photo by `_id + weddingId`;
3. delete R2 object;
4. delete Photo metadata.

If R2 deletion succeeds but MongoDB deletion temporarily fails, retry is safe by `objectKey`.

Response:

```text
204 No Content
```

---

# 26. Authenticated Media Upload APIs

These APIs are used by Admins/Managers for:

- couple photo;
- wedding cover;
- event cover;
- event gallery;
- wedding gallery.

Image bytes upload directly to R2.

---

## 26.1 Presign authenticated upload

```http
POST /api/v1/weddings/:weddingId/uploads/presign
```

Request:

```json
{
  "purpose": "EVENT_GALLERY",
  "eventId": "68d0d0010000000000000001",
  "fileName": "IMG_1234.webp",
  "mimeType": "image/webp",
  "sizeBytes": 2841934
}
```

Server validates:

- wedding membership;
- event belongs to wedding if event-scoped;
- allowed purpose;
- MIME allowlist;
- declared size;
- rate limit.

Response:

```json
{
  "data": {
    "objectKey": "weddings/68d0b001/events/68d0d001/gallery/4d8f1f51.webp",
    "uploadUrl": "https://<r2-s3-endpoint>/...?signature=...",
    "expiresInSeconds": 300,
    "requiredHeaders": {
      "Content-Type": "image/webp"
    }
  },
  "meta": {
    "requestId": "req_137"
  }
}
```

`uploadUrl` is short-lived and should not be logged by the browser.

---

## 26.2 Finalize authenticated upload

```http
POST /api/v1/weddings/:weddingId/uploads/finalize
```

Request:

```json
{
  "objectKey": "weddings/68d0b001/events/68d0d001/gallery/4d8f1f51.webp",
  "purpose": "EVENT_GALLERY",
  "eventId": "68d0d0010000000000000001",
  "originalFileName": "IMG_1234.webp"
}
```

Behavior:

1. authorize membership;
2. verify object key belongs to expected wedding prefix;
3. perform R2 `HEAD`;
4. verify object exists;
5. verify actual size/type;
6. create Photo metadata;
7. return CDN URL.

Response:

```text
201 Created
```

Example:

```json
{
  "data": {
    "photo": {
      "id": "...",
      "eventId": "...",
      "purpose": "EVENT_GALLERY",
      "url": "https://media.planmymarriage.com/weddings/.../4d8f1f51.webp",
      "mimeType": "image/webp",
      "sizeBytes": 2841934
    }
  },
  "meta": {
    "requestId": "req_138"
  }
}
```

`objectKey` uniqueness makes finalize idempotent.

---

# 27. Event Photo Upload Link / QR APIs

Photo upload links are event-scoped bearer capabilities.

The raw token is returned only once when created.

The UI should immediately:

- show QR;
- allow download of QR;
- allow copy link.

If that raw link is later unavailable, the organizer can create another active upload link. Existing issued links remain valid until expiry/revocation unless explicitly revoked.

---

## 27.1 Create event photo-upload link

```http
POST /api/v1/weddings/:weddingId/events/:eventId/photo-upload-links
```

Request:

```json
{
  "expiresAt": "2027-02-20T23:59:59.000Z"
}
```

Response:

```json
{
  "data": {
    "photoUploadTokenId": "...",
    "url": "https://planmymarriage.com/guest/upload/<raw-token>",
    "qrPayload": "https://planmymarriage.com/guest/upload/<raw-token>",
    "expiresAt": "2027-02-20T23:59:59.000Z"
  },
  "meta": {
    "requestId": "req_139"
  }
}
```

QR rendering itself should happen in the frontend using `qrPayload`.

---

## 27.2 List photo-upload capabilities for event

```http
GET /api/v1/weddings/:weddingId/events/:eventId/photo-upload-links
```

Returns metadata only.

---

## 27.3 Revoke photo-upload link

```http
DELETE /api/v1/weddings/:weddingId/events/:eventId/photo-upload-links/:tokenId
```

Sets `revokedAt`.

---

# 28. Token-Protected Guest Photo Upload APIs

These APIs use:

```http
Authorization: Bearer <photo-upload-token>
```

The token determines the trusted wedding and event.

---

## 28.1 Get event photo-upload context

```http
GET /api/v1/guest/photo-upload
```

Response:

```json
{
  "data": {
    "wedding": {
      "brideName": "Priya",
      "groomName": "Ritik",
      "theme": "CLASSIC_INDIAN"
    },
    "event": {
      "id": "...",
      "name": "Sangeet",
      "startsAt": "2027-02-13T13:30:00.000Z"
    }
  },
  "meta": {
    "requestId": "req_140"
  }
}
```

No guest identity is required.

---

## 28.2 Presign guest photo upload

```http
POST /api/v1/guest/photo-upload/presign
```

Request:

```json
{
  "fileName": "IMG_9876.webp",
  "mimeType": "image/webp",
  "sizeBytes": 2100345
}
```

Server derives:

```text
weddingId
eventId
```

from the photo-upload token.

Response contains short-lived R2 presigned PUT URL.

---

## 28.3 Finalize guest photo upload

```http
POST /api/v1/guest/photo-upload/finalize
```

Request:

```json
{
  "objectKey": "weddings/.../events/.../gallery/uuid.webp",
  "originalFileName": "IMG_9876.webp"
}
```

Behavior:

- revalidate token;
- verify object key scope;
- R2 `HEAD`;
- validate actual object;
- create Photo with:

```text
purpose = EVENT_GALLERY
uploadedByType = GUEST
uploadedByUserId = null
```

Response:

```text
201 Created
```

---

# 29. Vendor Discovery API

Vendor data is provider-backed and is **not persisted as a marketplace in V1**.

---

## 29.1 Search vendors

```http
GET /api/v1/weddings/:weddingId/vendors/search
```

Authentication:

```text
ADMIN or MANAGER
```

Query:

```text
city
category
cursor/providerPageToken
```

Example:

```text
/vendors/search?city=Delhi&category=PHOTOGRAPHER
```

Normalized response:

```json
{
  "data": [
    {
      "providerId": "external-id",
      "name": "ABC Photography",
      "category": "PHOTOGRAPHER",
      "rating": 4.7,
      "reviewCount": 235,
      "address": "New Delhi",
      "phone": "+91...",
      "website": "https://...",
      "mapUrl": "https://...",
      "photoUrl": "https://..."
    }
  ],
  "meta": {
    "requestId": "req_141",
    "nextCursor": null
  }
}
```

The adapter maps provider-specific fields into the Plan My Marriage DTO.

No API is provided for:

- shortlist;
- comparison;
- booking;
- quotations;
- vendor payment.

---

# 30. Theme and Website Settings

Theme and website settings are updated through the Wedding endpoint:

```http
PATCH /api/v1/weddings/:weddingId
```

Allowed theme values:

```text
CLASSIC_INDIAN
MODERN_MINIMAL
ROYAL_INDIAN
```

Website fields:

```text
website.isPublished
website.showGallery
website.showLivestream
```

Theme changes never mutate event, guest, RSVP, expense, or task data.

---

# 31. Email API Rules

Resend is used only for transactional email.

V1 email types:

```text
MANAGER_INVITATION
GUEST_INVITATION
```

Do not expose a generic:

```text
POST /send-email
```

to frontend clients.

Email sending must happen through domain-specific endpoints so authorization, token creation, rate limits, and template selection cannot be bypassed.

Email provider response IDs may be stored for diagnostics, but provider API keys never leave the server.

---

# 32. Rate Limiting

Rate limiting is route-sensitive.

V1 uses shared MongoDB fixed-window buckets.

Suggested starting policies are configuration values rather than hardcoded business logic.

| Operation | Suggested Initial Policy | Identity |
|---|---|---|
| Register | 5 / hour | IP |
| Login | 10 / 15 min | IP + normalized email |
| Manager invitation send | 20 / hour | user + wedding |
| Guest invitation email | 100 / hour | user + wedding |
| Vendor search | 30 / min | user + wedding |
| Guest invitation read | 120 / min | IP + token fingerprint |
| Guest RSVP mutation | 20 / min | IP + token fingerprint |
| Guest upload presign | 30 / min | IP + token fingerprint |
| Guest upload finalize | 60 / min | IP + token fingerprint |
| Public wedding reads | relaxed / CDN-assisted | IP |

When rate limited:

```http
429 Too Many Requests
```

Response headers should include where practical:

```text
Retry-After
X-RateLimit-Limit
X-RateLimit-Remaining
```

Never store the raw capability token in the rate-limit identity. Use a fingerprint/hash.

---

# 33. Zod Validation Strategy

Recommended schema organization:

```text
modules/
  weddings/
    schema.ts
  events/
    schema.ts
  tasks/
    schema.ts
  expenses/
    schema.ts
  guests/
    schema.ts
  media/
    schema.ts
```

Examples:

```text
RegisterSchema
LoginSchema
CreateWeddingSchema
UpdateWeddingSchema
CreateEventSchema
UpdateEventSchema
CreateTaskSchema
UpdateTaskSchema
CreateExpenseSchema
CreateGuestSchema
AssignEventGuestsSchema
GuestRSVPSchema
PresignUploadSchema
FinalizeUploadSchema
VendorSearchSchema
```

Validation responsibilities:

### Zod

- input shape;
- string length;
- enums;
- email;
- URL;
- ISO dates;
- numeric ranges;
- allowed image MIME;
- declared image size.

### Domain service

- user belongs to wedding;
- referenced Event belongs to wedding;
- assigned User is wedding member;
- Guest belongs to wedding;
- RSVP event is assigned to token guest;
- token not expired/revoked;
- event photo token matches event;
- business-state conflicts.

### Mongoose

- persistence schema;
- required fields;
- enum backstop;
- indexes and uniqueness.

---

# 34. API DTO Conventions

Do not return raw Mongoose documents directly.

Every module should map persistence models into explicit DTOs.

Examples:

```text
WeddingPlanningDTO
PublicWeddingDTO
GuestInvitationDTO
TaskDTO
ExpenseDTO
GuestDTO
PhotoDTO
VendorDTO
```

Sensitive persistence fields are excluded by default:

```text
passwordHash
sessionVersion
tokenHash
providerMessageId where not needed
internal storage credentials
```

MongoDB field `_id` should normally be exposed as:

```text
id
```

in HTTP responses.

---

# 35. Date and Time Rules

API timestamps are ISO 8601 UTC strings.

Example:

```text
2027-02-13T13:30:00.000Z
```

The wedding stores its timezone, initially:

```text
Asia/Kolkata
```

Frontend is responsible for displaying local date/time appropriately.

Clients should never send formatted date strings such as:

```text
13/02/2027 7 PM
```

as authoritative API values.

---

# 36. Money Rules

The user-facing API may accept rupee decimals for convenience, but the service immediately converts them to integer paise.

Never persist floating-point money.

Example:

```json
{
  "amount": 80000.5
}
```

becomes:

```text
amountPaise = 8000050
currency = INR
```

Responses should preferably expose both a precise integer value and currency:

```json
{
  "amountPaise": 8000050,
  "currency": "INR"
}
```

Frontend formats the display.

---

# 37. Media Rules

Accepted V1 image types:

```text
image/jpeg
image/png
image/webp
```

The exact size limit remains configuration-driven.

Presign validation occurs before upload, but finalize always verifies the actual R2 object using `HEAD`.

A client-declared MIME type or size is never trusted without finalize verification.

---

# 38. Idempotency and Retry Behavior

## Naturally idempotent

### RSVP

Setting:

```text
ATTENDING
```

twice results in the same state.

### Photo finalize

`objectKey` is unique. Repeating finalize for an already-created Photo should return the existing Photo or a deterministic success/conflict rather than creating duplicates.

### Event guest assignment

Re-adding an already assigned `(eventId, guestId)` should not create duplicates.

---

## Invitation email

Email delivery is not assumed exactly-once.

Mitigation:

- frontend disables duplicate submission;
- rate-limit/cooldown;
- each send generates a new capability token;
- previous valid guest links can remain valid;
- provider failures are surfaced clearly.

A general `Idempotency-Key` mechanism is not required in V1.

---

# 39. Concurrency Model

V1 uses normal last-write-wins behavior for ordinary CRUD.

The API does not require ETags or optimistic locking headers initially.

MongoDB transactions are used only for small multi-document invariants such as:

- create Wedding + initial Admin membership;
- accept Manager invitation;
- delete Guest + EventGuest/access-token cleanup where atomicity is desired.

Do not wrap routine single-document updates in transactions.

---

# 40. Security Requirements Per API

## Authenticated APIs

Must enforce:

```text
valid session
origin check on mutation
WeddingMember lookup
role check where required
weddingId-scoped repository access
Zod validation
rate limiting where appropriate
```

---

## Public APIs

Must enforce:

```text
publishable DTO only
website.isPublished
feature visibility flags
rate limiting / caching where useful
no internal planning data
```

---

## Guest token APIs

Must enforce:

```text
token hash lookup
expiry
revocation
narrow capability scope
rate limiting
no cross-guest access
no cross-event upload access
no raw-token logging
```

---

# 41. Logging and Request IDs

Every API request should receive a request ID.

Example:

```text
req_01J...
```

Log:

- request ID;
- route template;
- method;
- status;
- duration;
- authenticated `userId` where appropriate;
- `weddingId` where appropriate;
- external provider name;
- provider success/failure classification.

Never log:

- passwords;
- session token;
- guest access token;
- photo upload token;
- presigned R2 URL query string;
- authorization header;
- Resend API key;
- MongoDB connection string.

Token URLs should be redacted before logging.

---

# 42. Caching

## Public wedding reads

Public wedding pages may use Next.js caching/revalidation where appropriate.

Cache must be invalidated/revalidated when:

- wedding settings change;
- event data changes;
- website is published/unpublished;
- theme changes.

---

## Gallery images

Image bytes are delivered through Cloudflare CDN.

MongoDB/API controls metadata; Cloudflare controls media caching.

---

## Authenticated planning APIs

Do not use shared public caching.

Client-side query caching with TanStack Query may be used.

---

# 43. CORS and R2 Upload Rules

Plan My Marriage APIs should normally be same-origin.

R2 bucket CORS should allow only approved application origins for browser PUT uploads.

Example allowed origins:

```text
https://planmymarriage.com
https://www.planmymarriage.com
```

Development origins should be explicitly configured outside production.

Presigned R2 write URLs are generated server-side.

Long-lived R2 credentials never reach the browser.

---

# 44. Next.js Route Handler Mapping

Suggested physical structure:

```text
app/
  api/
    v1/
      auth/
        register/route.ts
        login/route.ts
        logout/route.ts
        me/route.ts

      weddings/
        route.ts
        [weddingId]/
          route.ts
          dashboard/route.ts
          members/route.ts
          member-invitations/route.ts
          events/
          tasks/
          expenses/
          guest-groups/
          guests/
          photos/
          uploads/
          vendors/

      member-invitations/
        accept/route.ts

      public/
        weddings/
          [slug]/
            route.ts
            gallery/route.ts

      guest/
        invitation/route.ts
        rsvps/route.ts
        photo-upload/
          route.ts
          presign/route.ts
          finalize/route.ts
```

The physical route tree should not become the business-logic layer.

---

# 45. Domain Module Structure

Recommended module pattern:

```text
src/
  modules/
    guests/
      schema.ts
      service.ts
      repository.ts
      dto.ts
      types.ts
      errors.ts
      service.test.ts
```

Shared cross-cutting infrastructure:

```text
src/
  lib/
    auth/
    db/
    rate-limit/
    validation/
    logging/
    r2/
    resend/
    vendor-provider/
```

Avoid one global `services/` directory containing unrelated business logic.

---

# 46. Representative End-to-End Flows

## 46.1 Admin creates wedding

```text
POST /api/v1/weddings
  -> session
  -> Zod
  -> normalize slug
  -> MongoDB transaction
       create Wedding
       create WeddingMember ADMIN
  -> return Wedding DTO
```

---

## 46.2 Admin invites Manager

```text
POST /api/v1/weddings/:weddingId/member-invitations
  -> session
  -> ADMIN membership
  -> rate limit
  -> Zod email
  -> generate capability token
  -> store tokenHash
  -> Resend
  -> mark sentAt/providerMessageId
  -> response
```

---

## 46.3 Organizer emails wedding invitation

```text
POST /api/v1/weddings/:weddingId/guests/:guestId/invitations/email
  -> session
  -> membership
  -> guest belongs to wedding
  -> guest has email
  -> rate limit
  -> create GuestAccessToken
  -> Resend personalized URL
  -> record sent metadata
```

---

## 46.4 Guest RSVPs

```text
PATCH /api/v1/guest/rsvps
  -> Bearer guest token
  -> hash token
  -> validate GuestAccessToken
  -> rate limit
  -> Zod responses
  -> verify EventGuest relations belong to guest
  -> bulkWrite RSVP status/respondedAt
  -> return updated responses
```

---

## 46.5 Guest uploads wedding photo

```text
GET /api/v1/guest/photo-upload
  -> validate PhotoUploadToken
  -> return wedding/event context

POST /api/v1/guest/photo-upload/presign
  -> validate token
  -> rate limit
  -> validate image metadata
  -> generate R2 object key
  -> generate presigned PUT URL

Browser
  -> PUT image directly to R2

POST /api/v1/guest/photo-upload/finalize
  -> validate token
  -> validate objectKey prefix
  -> R2 HEAD
  -> create Photo metadata
  -> return CDN URL
```

---

## 46.6 Public wedding website loads

```text
GET /api/v1/public/weddings/:slug
  -> normalize slug
  -> find published Wedding
  -> fetch publishable Events/cover data
  -> map to PublicWeddingDTO
  -> cache/revalidate
  -> response
```

---

# 47. API Endpoint Summary

## Authentication

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

## Weddings

```text
GET    /api/v1/weddings
POST   /api/v1/weddings
GET    /api/v1/weddings/:weddingId
PATCH  /api/v1/weddings/:weddingId
GET    /api/v1/weddings/:weddingId/dashboard
```

## Team

```text
GET    /api/v1/weddings/:weddingId/members
DELETE /api/v1/weddings/:weddingId/members/:memberId

GET    /api/v1/weddings/:weddingId/member-invitations
POST   /api/v1/weddings/:weddingId/member-invitations
POST   /api/v1/weddings/:weddingId/member-invitations/:invitationId/resend
DELETE /api/v1/weddings/:weddingId/member-invitations/:invitationId

POST   /api/v1/member-invitations/accept
```

## Events

```text
GET    /api/v1/weddings/:weddingId/events
POST   /api/v1/weddings/:weddingId/events
GET    /api/v1/weddings/:weddingId/events/:eventId
PATCH  /api/v1/weddings/:weddingId/events/:eventId
DELETE /api/v1/weddings/:weddingId/events/:eventId
```

## Tasks

```text
GET    /api/v1/weddings/:weddingId/tasks
POST   /api/v1/weddings/:weddingId/tasks
GET    /api/v1/weddings/:weddingId/tasks/:taskId
PATCH  /api/v1/weddings/:weddingId/tasks/:taskId
DELETE /api/v1/weddings/:weddingId/tasks/:taskId
```

## Expenses

```text
GET    /api/v1/weddings/:weddingId/expenses
POST   /api/v1/weddings/:weddingId/expenses
GET    /api/v1/weddings/:weddingId/expenses/summary
GET    /api/v1/weddings/:weddingId/expenses/:expenseId
PATCH  /api/v1/weddings/:weddingId/expenses/:expenseId
DELETE /api/v1/weddings/:weddingId/expenses/:expenseId
```

## Guest Groups

```text
GET    /api/v1/weddings/:weddingId/guest-groups
POST   /api/v1/weddings/:weddingId/guest-groups
PATCH  /api/v1/weddings/:weddingId/guest-groups/:groupId
DELETE /api/v1/weddings/:weddingId/guest-groups/:groupId
```

## Guests

```text
GET    /api/v1/weddings/:weddingId/guests
POST   /api/v1/weddings/:weddingId/guests
GET    /api/v1/weddings/:weddingId/guests/:guestId
PATCH  /api/v1/weddings/:weddingId/guests/:guestId
DELETE /api/v1/weddings/:weddingId/guests/:guestId

GET    /api/v1/weddings/:weddingId/guests/:guestId/events

GET    /api/v1/weddings/:weddingId/events/:eventId/guests
POST   /api/v1/weddings/:weddingId/events/:eventId/guests
DELETE /api/v1/weddings/:weddingId/events/:eventId/guests
```

## Guest access links and invitation emails

```text
POST   /api/v1/weddings/:weddingId/guests/:guestId/access-links
GET    /api/v1/weddings/:weddingId/guests/:guestId/access-links
DELETE /api/v1/weddings/:weddingId/guests/:guestId/access-links/:accessTokenId

POST   /api/v1/weddings/:weddingId/guests/:guestId/invitations/email
```

## Guest token APIs

```text
GET    /api/v1/guest/invitation
PATCH  /api/v1/guest/rsvps
```

## Public wedding

```text
GET    /api/v1/public/weddings/:slug
GET    /api/v1/public/weddings/:slug/gallery
```

## Authenticated gallery/media

```text
GET    /api/v1/weddings/:weddingId/photos
DELETE /api/v1/weddings/:weddingId/photos/:photoId

POST   /api/v1/weddings/:weddingId/uploads/presign
POST   /api/v1/weddings/:weddingId/uploads/finalize
```

## Guest event photo-upload links

```text
POST   /api/v1/weddings/:weddingId/events/:eventId/photo-upload-links
GET    /api/v1/weddings/:weddingId/events/:eventId/photo-upload-links
DELETE /api/v1/weddings/:weddingId/events/:eventId/photo-upload-links/:tokenId
```

## Guest photo upload

```text
GET    /api/v1/guest/photo-upload
POST   /api/v1/guest/photo-upload/presign
POST   /api/v1/guest/photo-upload/finalize
```

## Vendors

```text
GET    /api/v1/weddings/:weddingId/vendors/search
```

---

# 48. Explicitly Not Exposed in V1

The API does **not** provide endpoints for:

- professional wedding planner accounts;
- bride-side/groom-side permissions;
- complex custom roles;
- total wedding budget;
- planned expenses;
- negotiated expenses;
- remaining budget;
- vendor shortlist;
- vendor comparison;
- vendor booking;
- vendor payment;
- guest accounts;
- food preferences;
- guest messages;
- automated WhatsApp messaging;
- WhatsApp Business API;
- native livestream hosting;
- payment/subscription APIs;
- AI assistant;
- mobile-app-specific APIs;
- WebSockets;
- GraphQL.

---

# 49. Testing Requirements

Each API module should have service-level and Route Handler tests.

Minimum categories:

## Authentication

- register;
- duplicate email;
- login success/failure;
- invalid session;
- session version invalidation.

## Tenant isolation

For every wedding-scoped resource:

```text
member of Wedding A cannot read/update/delete resource in Wedding B
```

## Authorization

- Admin-only Manager removal;
- Manager blocked from Admin-only endpoint;
- removed Manager immediately loses access.

## Guest capability

- valid token;
- expired token;
- revoked token;
- invalid token;
- token cannot access another guest;
- guest cannot RSVP to unassigned event.

## Upload

- unsupported MIME;
- oversized file;
- wrong event object-key prefix;
- object missing in R2;
- repeated finalize;
- guest token cannot upload to another event.

## Public API

- unpublished wedding returns 404;
- private planning fields never appear;
- gallery hidden when `showGallery=false`.

## Email

- Resend success;
- Resend failure;
- rate-limit;
- no guest email;
- duplicate invitation actions.

---

# 50. API Stability Rules

Within `/api/v1`:

Safe changes:

- add optional response fields;
- add optional query parameters;
- add new endpoints;
- add new enum values only when clients can tolerate them.

Breaking changes require:

```text
/api/v2
```

Examples of breaking changes:

- rename response fields;
- remove fields;
- change authentication mechanism expected by clients;
- change route semantics;
- change a field from scalar to object;
- change status-code behavior in a client-breaking way.

---

# 51. Final API Design Summary

The V1 API is intentionally divided into four practical namespaces:

```text
/api/v1/auth/*
```

Account/session operations.

```text
/api/v1/weddings/*
```

Authenticated Admin/Manager wedding planning operations.

```text
/api/v1/public/*
```

Unauthenticated, explicitly publishable wedding website data.

```text
/api/v1/guest/*
```

Narrow capability-token guest operations for invitation, RSVP, and photo upload.

This preserves the architectural separation approved for Plan My Marriage:

```text
/app/*
    authenticated planning

/w/:slug
    public wedding website

token-protected guest experience
    invitation + RSVP + event photo upload
```

The API keeps wedding isolation explicit, guests accountless, tokens narrow, media off the application server, and business logic centralized in the modular monolith.

---

# 52. Implementation Order

Recommended API implementation sequence:

1. Common response/error helpers.
2. MongoDB connection and Mongoose models.
3. Zod validation helpers.
4. Session authentication.
5. `/auth/*`.
6. Wedding creation/list/update.
7. Wedding membership authorization helper.
8. Events.
9. Tasks.
10. Expenses.
11. Guest Groups.
12. Guests.
13. Event Guest assignments.
14. Dashboard aggregation.
15. Manager invitations + Resend.
16. Guest access-link generation.
17. Guest invitation email.
18. Guest invitation context.
19. Guest RSVP.
20. Cloudflare R2 presign/finalize for authenticated uploads.
21. Gallery reads/deletes.
22. Event photo-upload token APIs.
23. Guest photo upload.
24. Public wedding APIs.
25. Vendor provider adapter/search.
26. Rate-limit tuning, logging, integration/security tests.

This order establishes identity and tenant isolation before exposing public/token capabilities or media uploads.


## Implemented team invitation clarification (2026-10-17)

The approved product decision extends section 14 invitations to ADMIN or MANAGER (default MANAGER). Roles belong to a wedding; every account can create its own wedding. Only Admins manage invitations or remove Managers. No Admin removal/demotion or wedding deletion is included.

- GET /api/v1/weddings/:weddingId/members: every member; explicit id (membership id), displayName, email, role, joinedAt.
- POST /api/v1/weddings/:weddingId/member-invitations: Admin-only strict {email, role?}; normalized email; 201 provider acceptance, 409 existing member/active invitation, 502 unconfirmed send. No raw link or token returned.
- GET /api/v1/weddings/:weddingId/member-invitations: Admin-only newest 200 metadata records, including role and deliveryState SENDING/SENT/FAILED. Excludes tokenHash and providerMessageId. Expired records are eventually TTL-cleaned.
- POST /api/v1/weddings/:weddingId/member-invitations/:invitationId/resend: revokes the old pending record and creates a fresh token, record, and seven-day expiry; 201 metadata. Failed sends can be resent; accepted/revoked records cannot.
- DELETE /api/v1/weddings/:weddingId/member-invitations/:invitationId: revoke pending invitation, 204; accepted invitation 409.
- DELETE /api/v1/weddings/:weddingId/members/:memberId: remove Manager membership, 204; Admin removal 403. Preserve account and historical data.
- GET /api/v1/member-invitations/context: Bearer capability, optional session. Couple names, city, role, expiresAt, accepted, current user DTO and emailMatches. No recipient email exposed to anonymous viewers; no wedding id returned. Invalid/expired/revoked/unconfirmed-sent capability returns 410 INVALID_STATE.
- POST /api/v1/member-invitations/accept: strict {token}, authenticated matching-email account, same origin; transaction creates membership and records acceptance. Returns {weddingId, role}. Accepted retry is idempotent only while membership exists. No existing-role upgrade; no restoring removed Managers.

Mutation/read rate limits apply; all responses no-store. Email links use fragments to avoid raw tokens in HTTP paths. Sent means provider acceptance, not inbox delivery.


## Guest email implementation clarification (2026-10-19)

Section 22 is implemented for individual guests. Both Admins and Managers can preview and send.

- GET /api/v1/weddings/:weddingId/guests/:guestId/invitations/email returns preview (recipient, guestName, couple, subject, weddingDate, city, greeting, introduction, assigned-event summaries, expiresAt, previewHash), newest 20 attempt DTOs, and localOnly. Reading creates no capability and sends no mail. Guest notes/contact fields other than the recipient are excluded from the email.
- POST at the same path requires strict JSON {requestId: UUID, previewHash: SHA256}. The server validates the saved guest email and rechecks the current content against the reviewed preview. Changes return 409 CONFLICT requiring preview reload; callers cannot override the recipient or provide raw tokens. Success is 202 {sent:true,email,attempt}; sent means provider acceptance, not inbox delivery.
- Every explicit new send creates a fresh private guest link. Existing shared links stay active until expiry/revocation. Failure/timeout revokes only the new attempt's token, preserves failed metadata, and returns the shared sanitized 502 EMAIL_DELIVERY_FAILED message.
- A requestId identifies one send per guest. Repeating a completed request returns its saved result without contacting Resend again. Repeating an in-progress attempt returns 409 INVALID_STATE; failed attempts require a fresh preview/request. Per-guest transactions prevent overlapping sends. Unconfirmed attempts older than 60 seconds are failed/revoked when another send is attempted. There is no automatic background retry.
- Sending is limited to 20 attempts per organizer per 15 minutes. Origin checks, membership checks, explicit no-store DTOs and static log routes apply. No raw capability or provider id is returned in email metadata. Email links use the existing guest capability path, subject to existing deployment access-log redaction requirements.
- Default expiry is the later of wedding date plus seven days or the next UTC day boundary plus seven days. The preview shows the chosen expiry. Emails are snapshots; the linked guest page always uses current assigned events.

Bulk sends, reminders, delivery webhooks and customizable email copy are deferred.
