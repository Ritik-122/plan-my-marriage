# Plan My Marriage
## Product Requirements Document (PRD)

**Version:** 1.1  
**Product Type:** Web Application  
**Primary Market:** India  
**Initial Platform:** Responsive Web Application  
**Technology Direction:** MERN Stack  
**Initial Pricing:** Free  
**Primary Users:** Bride, Groom, Family Members, and Guests

---

# 1. Product Overview

Plan My Marriage is a collaborative wedding-planning web application designed specifically for Indian weddings.

Indian weddings usually involve multiple ceremonies, large guest lists, multiple venues, expenses, family members, vendors, invitations, tasks, and photographs happening across several days.

Most families currently manage these activities across WhatsApp groups, notebooks, spreadsheets, phone calls, payment screenshots, and separate invitation tools.

Plan My Marriage aims to bring these activities into one simple wedding workspace.

The bride and groom create the wedding workspace and act as Admins.

They can invite parents, siblings, cousins, or other trusted family members as Managers.

Admins and Managers collaboratively manage wedding events, guests, tasks, expenses, vendors, invitations, gallery, and wedding information.

Guests do not create accounts.

Guests interact with the wedding through shared links containing the digital invitation, event information, RSVP, venue details, gallery, livestream link, and event photo-upload functionality.

---

# 2. Product Vision

Create the simplest digital wedding-planning platform for Indian families.

Plan My Marriage should allow a family to manage an entire wedding without needing project-management software, spreadsheets, multiple apps, or complicated tools.

The product should feel simple enough for both younger users and parents to use comfortably.

---

# 3. Product Principle

**Simple > Complex**

Plan My Marriage should solve important wedding-management problems without turning wedding planning into enterprise project management.

The interface should remain understandable for users with different levels of technical comfort.

---

# 4. Target Users

## Admin

Admins are primarily:

- Bride
- Groom

Admins can:

- Create and edit the wedding
- Invite Managers
- Remove Managers
- Create/edit/delete events
- Manage tasks
- Manage expenses
- Manage guests
- Create Guest Groups
- Manage invitations
- View RSVP responses
- Manage wedding website
- Select wedding theme
- Manage gallery
- Manage guest photo uploads
- Add livestream links
- Browse vendors
- Manage venue information

---

## Manager

Managers can include:

- Parents
- Siblings
- Cousins
- Family members
- Trusted friends helping with wedding preparation

Managers can:

- Manage events
- Manage tasks
- Record expenses
- Manage guests
- Manage Guest Groups
- View RSVP information
- Update wedding website information
- Upload gallery images
- Manage guest-uploaded photos
- Add venue information
- Browse vendors

Managers cannot remove Admins.

Admins can remove Managers.

---

## Guest

Guests do not create accounts.

Guests can:

- View digital invitation
- View relevant wedding events
- View venue details
- Open directions
- Submit RSVP
- View photo gallery
- Watch livestream using an external link
- Upload photos through a public event photo link or QR code

---

# 5. Product Roles

The initial system contains:

1. Admin
2. Manager
3. Guest

There is no separate professional wedding-planner role.

There are no separate bride-side and groom-side permissions.

Admins and Managers have broad access to wedding-planning features.

---

# 6. Wedding Creation

Admin enters:

- Bride name
- Groom name
- Wedding date
- Primary city/location

Optional:

- Couple photo
- Cover image
- Short description
- Wedding website URL slug

Example:

`planmymarriage.com/ritik-priya`

---

# 7. Wedding Themes

Plan My Marriage initially provides three themes:

### Classic Indian

Traditional Indian wedding aesthetic.

### Modern Minimal

Clean and contemporary design.

### Royal Indian

Regal Indian wedding aesthetic.

Themes affect:

- Wedding website
- Digital invitation
- RSVP page
- Event pages
- Gallery
- Guest photo-upload pages

Themes do not significantly change the Admin/Manager dashboard.

Users can change themes later without affecting wedding data.

---

# 8. Wedding Dashboard

Dashboard displays:

- Wedding countdown
- Upcoming events
- Task summary
- Expense total
- Guest count
- RSVP status
- Recent activity
- Upcoming important items

Example:

**42 days until wedding**

Tasks:
- 24 Total
- 14 Completed
- 6 Pending
- 4 Overdue

Guests:
- 430 invited
- 287 attending
- 42 not attending
- 101 pending

Expenses:

**₹8,45,000 total recorded expenses**

---

# 9. Event Management

Supported default event types include:

- Roka
- Engagement
- Haldi
- Mehendi
- Sangeet
- Wedding
- Reception

Users can also create custom events.

Each event may contain:

- Name
- Date
- Start time
- End time
- Venue
- Address
- Description
- Dress code
- Image
- Guests
- Tasks
- Expenses
- Livestream URL
- Gallery
- Guest photo-upload link
- Guest photo-upload QR code

---

# 10. Task Planner

Each task contains:

- Title
- Description — optional
- Assigned Admin/Manager
- Event — optional
- Due date
- Priority
- Status

Priority:

- Low
- Medium
- High

Status:

- To Do
- In Progress
- Completed

---

# 11. Expense Tracker

The expense tracker remains deliberately simple.

Plan My Marriage is not a wedding-budget planning application.

Expense fields:

- Expense name
- Category
- Amount
- Date
- Event — optional
- Vendor name — optional
- Paid by — optional
- Notes — optional

Categories may include:

- Venue
- Catering
- Decoration
- Photography
- Videography
- Clothing
- Jewellery
- Makeup
- Mehendi
- Entertainment
- Invitations
- Travel
- Accommodation
- Gifts
- Other

System calculates:

- Total expenses
- Expenses by category
- Expenses by event

The system does **not** contain:

- Total budget
- Planned amount
- Negotiated amount
- Remaining budget
- Budget forecasting

---

# 12. Guest Management

Each guest may contain:

- Name
- Phone — optional
- Email — optional
- Guest Group — optional
- Notes — optional

The product will not collect:

- Food preferences
- Guest messages to the couple

---

# 13. Guest Groups

Guest Groups are manually named by Admins or Managers.

Examples:

- Rajesh Uncle Family
- Mama Ji — Lucknow
- College Friends
- TCS Friends
- Delhi Neighbours
- Kanpur Relatives

The system does not automatically use surnames as group names.

A guest can also exist without belonging to a group.

---

# 14. Event-Level Guest Management

Guests can be invited to individual events.

Example:

| Guest | Haldi | Sangeet | Wedding | Reception |
|---|---|---|---|---|
| Rajesh Sharma | Yes | Yes | Yes | Yes |
| Rahul Verma | No | Yes | Yes | Yes |
| Amit Singh | No | No | Yes | Yes |

---

# 15. Digital Invitation

Invitation can include:

- Bride name
- Groom name
- Couple photo
- Wedding date
- Event information
- Venue
- Map link
- RSVP button

The invitation uses the selected theme.

---

# 16. Invitation Sharing

Supported sharing:

### WhatsApp

Users click the WhatsApp share icon.

WhatsApp opens with a pre-filled invitation message and URL.

### Copy Link

Users can copy the invitation URL.

No WhatsApp Business API or automated messaging is required.

---

# 17. RSVP

Guests RSVP without creating an account.

For each invited event:

- Attending
- Not Attending

Internal status may also be:

- Pending

The system will not request:

- Food preference
- Personal message
- Detailed questionnaire

RSVP results automatically update the wedding dashboard.

---

# 18. Wedding Website

Each wedding receives a guest-facing wedding website.

Possible sections:

- Hero
- Bride and Groom
- Wedding countdown
- Event schedule
- Venue
- Maps
- RSVP
- Gallery
- Photo upload
- Livestream

Website reflects the selected theme.

---

# 19. Vendor Discovery

Users can browse wedding vendors.

Categories may include:

- Venues
- Caterers
- Photographers
- Videographers
- Makeup artists
- Mehendi artists
- Decorators
- DJs
- Bands
- Choreographers
- Pandits
- Hotels
- Transport providers

Search primarily by:

- City
- Category

Vendor information may include:

- Name
- Category
- Public rating
- Number of reviews
- Address
- Phone
- Website
- Location
- Photos

The application does not initially support:

- Vendor shortlists
- Vendor comparison
- Quotations
- Vendor negotiation
- Vendor booking
- Vendor payment
- Vendor accounts

---

# 20. Venue Management

Each event can have its own venue.

Fields:

- Venue name
- Address
- Maps location/link

Guests should be able to open directions easily.

---

# 21. Livestream

Admin or Manager can add an external livestream URL.

Supported examples:

- YouTube Live
- Zoom
- Google Meet
- Other streaming platforms

Guests see:

**Watch Live**

Plan My Marriage does not host video streams itself.

---

# 22. Photo Gallery

Each wedding contains a gallery.

Photos can be organized by event:

- Haldi
- Mehendi
- Sangeet
- Wedding
- Reception
- Custom events

Admins and Managers can:

- Upload photos
- Associate photo with event
- View photos
- Delete photos
- Manage guest-uploaded photos

---

# 23. Guest Photo Upload

Guest photo upload is part of the initial product.

The purpose is to allow attendees to contribute photographs taken during wedding events without requiring an account.

## Guest Photo Upload Flow

Admin or Manager opens an event.

Example:

**Sangeet**

System provides:

- Public photo-upload link
- Event QR code

Example:

`planmymarriage.com/ritik-priya/sangeet/upload`

Admin/Manager can:

- Copy upload link
- Share upload link
- Download/show QR code

At the wedding venue, the QR code may be displayed on:

- Tables
- Event signage
- Digital screens
- Invitation pages

Guest scans QR code.

↓

Guest opens upload page.

↓

No login required.

↓

Guest sees:

**Share your Sangeet memories 📸**

↓

Guest selects one or more photos.

↓

Guest uploads photos.

↓

Photos are automatically associated with the Sangeet event.

↓

Photos become available to Admins/Managers.

## Photo Management

Admins and Managers can:

- View uploaded photos
- Delete inappropriate/unwanted photos
- Associate photos with the correct event if necessary

For V1, complicated moderation workflows are not required.

A simple delete/remove capability is sufficient.

## Guest Experience

Guests should not be required to enter:

- Name
- Email
- Phone
- Account information

Uploading should be as frictionless as possible.

---

# 24. Event QR Codes

Each event can generate a QR code associated with its photo-upload URL.

Example:

### Sangeet

**Share your photos with us 📸**

[QR CODE]

`Scan to upload`

Different events should have different upload destinations.

Therefore:

- Haldi QR → Haldi gallery
- Mehendi QR → Mehendi gallery
- Sangeet QR → Sangeet gallery
- Wedding QR → Wedding gallery
- Reception QR → Reception gallery

---

# 25. Notifications

Initial notifications remain lightweight.

Examples:

- Task assigned
- Task due
- Manager invited
- Event approaching

Automated WhatsApp notifications are not part of V1.

---

# 26. Core Admin Journey

1. Sign up.
2. Create wedding.
3. Enter wedding information.
4. Choose theme.
5. Invite Managers.
6. Create events.
7. Add guests.
8. Create Guest Groups when needed.
9. Assign guests to events.
10. Create tasks.
11. Record expenses.
12. Browse vendors.
13. Set venues.
14. Add livestream links.
15. Generate wedding website.
16. Share invitation.
17. Receive guest RSVPs.
18. Upload wedding photos.
19. Generate event photo-upload QR codes.
20. Manage photos uploaded by guests.

---

# 27. Core Guest Journey

Guest receives invitation.

↓

Opens wedding website.

↓

No login required.

↓

Views invitation.

↓

Views relevant events.

↓

Views venue.

↓

Submits RSVP.

↓

Views gallery.

↓

Can access livestream.

↓

At an event, scans photo-sharing QR.

↓

Uploads photographs.

↓

Photos become part of that event's wedding gallery.

---

# 28. Admin Navigation

Suggested navigation:

- Dashboard
- Events
- Tasks
- Expenses
- Guests
- Vendors
- Wedding Website
- Gallery
- Team
- Settings

Photo uploads can primarily be managed inside **Gallery** and individual **Events** rather than creating another major navigation item.

---

# 29. High-Level Product Workflow

```text
Bride / Groom
      ↓
Create Account
      ↓
Create Wedding
      ↓
Choose Theme
      ↓
Wedding Workspace
      ↓
Invite Managers
      ↓
─────────────────────────────
Events      Tasks     Expenses
Guests      Vendors   Gallery
─────────────────────────────
      ↓
Wedding Website
      ↓
Digital Invitation
      ↓
WhatsApp / Copy Link
      ↓
Guest
      ↓
No Login
      ↓
─────────────────────────────
Invitation
Events
Venue
RSVP
Gallery
Livestream
─────────────────────────────
      ↓
Attend Wedding Event
      ↓
Scan Event QR
      ↓
Upload Event Photos
      ↓
Event Gallery
      ↓
Admin / Manager Management
```

---

# 30. Core Product Relationships

## Wedding

Contains:

- Members
- Events
- Tasks
- Expenses
- Guests
- Guest Groups
- Website
- Theme
- Gallery

## Event

Contains:

- Guests
- Tasks
- Expenses
- Venue
- Livestream
- Photos
- Guest upload link
- Guest upload QR

## Guest

Can belong to:

- Guest Group
- Multiple Events

## Photo

Can belong to:

- Wedding
- Event

Photo may be uploaded by:

- Admin
- Manager
- Guest

---

# 31. Suggested MongoDB Collections

Potential collections:

- users
- weddings
- weddingMembers
- events
- tasks
- expenses
- guests
- guestGroups
- invitations
- rsvps
- galleries
- photos

Photo records should track basic metadata such as:

- Wedding
- Event
- File URL
- Uploaded source
- Upload timestamp

Possible source values:

- ADMIN
- MANAGER
- GUEST

---

# 32. Authentication

Authenticated:

- Admin
- Manager

Guests do not authenticate.

Initial authentication may use:

- Email/password
- JWT

Google sign-in may be added later.

---

# 33. Guest Public Access

Public guest links may include:

- Wedding website
- RSVP
- Event information
- Gallery
- Photo upload

Guest links must not grant access to Admin/Manager functionality.

---

# 34. Photo Upload Security

Because photo upload is publicly accessible through a link or QR code, the system should protect the endpoint.

Basic protections should include:

- Image-file validation
- File-size limits
- Supported file formats
- Rate limiting
- Wedding/event identifier validation
- Secure cloud upload
- Prevention of executable file uploads

Admin/Manager must be able to delete uploaded photos.

---

# 35. Responsive Design

Application must support:

- Desktop
- Tablet
- Mobile

Guest-facing pages and photo-upload pages should be mobile-first.

The QR upload workflow will primarily happen on smartphones.

---

# 36. UX Requirements

Use:

- Large buttons
- Simple labels
- Minimal forms
- Clear calls to action
- Plain language

Examples:

**Add Guest**

**Add Expense**

**Create Event**

**Share Invitation**

**Upload Photos**

**Share Photos via QR**

Avoid enterprise terminology.

---

# 37. Empty States

Example Gallery:

**No photos yet**

"Upload your first wedding memory or share the event QR with your guests."

[Upload Photos]

[Show Photo QR]

---

# 38. Error Handling

Examples include:

- Invalid wedding link
- Invalid event link
- Failed RSVP
- Failed image upload
- Unsupported image type
- File too large
- Network error
- Authentication expired

Errors should be understandable to non-technical users.

---

# 39. Performance

Important performance considerations:

- Optimize invitation pages.
- Compress/optimize gallery images.
- Lazy-load gallery.
- Use pagination or incremental loading.
- Support multiple photo uploads efficiently.
- Keep guest photo-upload page lightweight.

---

# 40. Security

Requirements include:

- Password hashing
- Secure JWT handling
- Backend authorization
- Input validation
- Rate limiting
- File validation
- Secure cloud storage
- Environment variables for secrets
- Protected Admin/Manager APIs
- Restricted public photo-upload endpoints

---

# 41. MERN Technology Direction

## Frontend

- React
- React Router
- TanStack Query
- React Hook Form
- Tailwind CSS or Material UI

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Mongoose

## Authentication

- JWT

## Photo Storage

Potentially:

- Cloudinary
- AWS S3

Cloud storage is strongly preferred instead of storing wedding images directly in MongoDB.

## Deployment

Potential options:

Frontend:
- Vercel

Backend:
- Render
- Railway
- AWS

Database:
- MongoDB Atlas

---

# 42. V1 Scope

V1 includes:

- Authentication
- Wedding creation
- Admin/Manager roles
- Manager invitations
- Three themes
- Dashboard
- Multiple events
- Task planner
- Simple expense tracking
- Guest management
- Guest Groups
- Event-level guests
- RSVP
- Digital invitations
- WhatsApp share
- Copy Link
- Wedding website
- Venue and Maps
- Basic gallery
- Admin/Manager photo upload
- **Guest photo upload**
- **Event-specific public photo links**
- **Event photo QR codes**
- Livestream URL
- Vendor discovery, subject to suitable external API availability

---

# 43. Explicitly Out of Scope

Do not initially build:

- Professional planner accounts
- Bride-side/groom-side permissions
- Complex permission systems
- Total wedding budget
- Planned expenses
- Negotiated expenses
- Remaining budget
- Vendor marketplace
- Vendor booking
- Vendor payments
- Vendor accounts
- Vendor shortlist
- Vendor comparison
- Guest accounts
- Food preference
- Guest messages
- WhatsApp Business API
- Automated WhatsApp reminders
- Native livestream infrastructure
- Mobile application
- Payment gateway
- Subscription system
- AI assistant
- Advanced photo editing
- AI face recognition
- Complex photo moderation workflow

---

# 44. Future Opportunities

Future additions may include:

- AI wedding planning assistant
- AI checklist creation
- Invitation text generation
- More themes
- Custom domain
- Premium storage
- Advanced gallery
- AI photo search
- Face-based photo discovery
- Premium plans
- Mobile application

---

# 45. Product Success Indicators

Useful early metrics:

### Activation

- Wedding created
- First event created
- First guest added

### Collaboration

- Manager invited

### Planning

- Tasks completed
- Expenses recorded

### Guest Engagement

- Invitation opens
- RSVP completion

### Gallery Engagement

- Photos uploaded
- Number of guest photo uploads
- Number of events receiving guest photos

### Wedding Website

- Website visits

---

# 46. MVP Success Definition

The MVP is successful when a couple can:

1. Create an account.
2. Create a wedding.
3. Choose a theme.
4. Invite family Managers.
5. Create ceremonies.
6. Create and assign tasks.
7. Record expenses.
8. Add guests.
9. Create optional Guest Groups.
10. Assign guests to events.
11. Generate the wedding website.
12. Share invitation through WhatsApp.
13. Allow guests to access invitation without login.
14. Collect RSVP.
15. View RSVP information.
16. Provide venue/map information.
17. Upload wedding photographs.
18. Create event-specific photo-upload links.
19. Generate QR codes for event photo uploads.
20. Allow guests to upload photos without login.
21. Display/manage uploaded photographs.
22. Provide livestream link when available.

---

# 47. Core Product Statement

**Plan My Marriage helps Indian couples and their families collaboratively plan and experience every part of their wedding from one simple place.**

The couple creates the wedding.

Family helps manage it.

Guests receive one simple experience.

Guests can also contribute their own memories.

---

# 48. Product Philosophy

Every future feature should answer:

**Does this make planning or experiencing the wedding easier?**

If the feature adds significant complexity without solving an important wedding problem, it should not be included.

Plan My Marriage should remain simple enough that the entire family can actually use it.