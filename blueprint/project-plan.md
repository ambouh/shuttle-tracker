# Project Plan — Union Shuttle Tracker

## 1. Problem — What problem are we solving?

Union Dream Team members currently do not have a simple, reliable way to know where the shuttle is, when it is leaving, how long it will take to arrive, or whether the driver knows that they are waiting for pickup.

This creates unnecessary uncertainty and manual communication between riders and shuttle drivers.

The **Union Shuttle Tracker** will provide one mobile-first application where riders can quickly:

- See the shuttle's current route.
- See whether a route has not started, is departing, or is in transit.
- See an estimated arrival time.
- See approximate trip progress.
- Request pickup.
- See who else is waiting.
- Receive relevant shuttle notifications.

The application should automate the shuttle lifecycle based primarily on the physical location of the shuttle rather than requiring the driver to manually update statuses.

The initial product is intended to be extremely simple for riders: open the app, understand what the shuttle is doing, and request pickup.

---

# 2. Users — Who is this for?

## Phase 1 primary users

The primary users are **Union Dream Team members who need shuttle transportation**.

Riders should be able to open the application and understand the shuttle situation without training.

They will use the application to:

- View available shuttle directions.
- View current route status.
- View ETA.
- View trip progress.
- See the current waitlist.
- Join the waitlist.
- Remove themselves from the waitlist if needed.
- Receive applicable in-app/PWA notifications.

## Phase 1 identity

Phase 1 will **not require formal account authentication**.

When a user first attempts to request pickup, the application will ask for:

- First name
- Last name

The application will generate a guest identifier and store the guest identity on the user's device.

Conceptually:

```text
Guest enters name
        ↓
Application generates guest ID
        ↓
Guest identity saved locally
        ↓
Guest ID used when creating waitlist entries
```

The local device storage is only for recognizing the guest.

Shared application information such as:

- Waitlists
- Journeys
- Route status
- Shuttle location
- ETA

will live in Convex and will therefore be visible across devices.

If a user deletes their browser/PWA data, they may lose the local guest identity and need to enter their name again.

## Future authentication

A future phase can replace or supplement guest identities with:

- Union Slack authentication
- Google authentication, if desired later
- Driver authentication
- Admin authentication

The data model should therefore distinguish between an application's internal user ID and the authentication provider used to identify that person.

---

# 3. Features — What does the MVP need?

## Core domain model

The system will be organized around:

```text
Journey
   ↓
Route Legs
   ↓
Shuttle location + route state
   ↓
Waitlists + ETA + rider UI
```

### Journey

A **Journey** is the complete transportation workflow.

For Phase 1, the Journey is the Sunday shuttle loop.

Example:

```text
Sunday Shuttle

Leg 1:
Union Church → Guilford Elementary

Leg 2:
Guilford Elementary → Union Church
```

A Journey may contain any number of ordered Route Legs.

This is important because future Journeys may look like:

```text
Student Night Pickup

Church → Neighborhood A
Neighborhood A → Neighborhood B
Neighborhood B → Neighborhood C
Neighborhood C → Church
```

The architecture should support this model immediately.

However, **Phase 1 will only expose the initial two-leg Sunday Shuttle Journey**.

We are designing for multiple Journeys without building all of their UI and business logic into the first release.

---

## Initial locations

### Union Church — Columbia

7195 Oakland Mills Rd
Columbia, MD 21046

### Guilford Elementary School

7335 Oakland Mills Rd
Columbia, MD 21046

The locations are approximately 0.8 miles apart and normally only a few minutes apart by car.

Those values should **not** be hard-coded as the active ETA.

Google Maps routing information should be used to determine current route distance and estimated travel time.

---

# Phase 1 — View 1

The primary screen will display route cards based on the approved View 1 prototype.

For the first Journey there will be two cards:

```text
TO SCHOOL
Union Church → Guilford Elementary

TO CHURCH
Guilford Elementary → Union Church
```

Each route card should display:

- Direction / route name
- Departure location
- Arrival location
- Current route status
- Estimated remaining time
- Progress indicator
- Number of waitlisted riders
- Names of waitlisted riders
- Pick Up action

The app should immediately communicate:

> Can I request this shuttle right now?

and:

> Approximately when will it arrive?

---

# Route statuses

The rider-facing application will use **only three persistent statuses**:

```text
NOT STARTED
DEPARTING
IN TRANSIT
```

There will **not** be a persistent `ARRIVED` or `COMPLETED` status in the rider UI.

Arrival is instead an **internal event** that causes the state machine to move to the next route leg.

---

## NOT STARTED

`NOT STARTED` means this route leg is not currently active.

For example:

```text
TO SCHOOL
NOT STARTED
```

Riders may still join this route's waitlist while the leg is `NOT STARTED`.

This lets someone request a future pickup before the shuttle reaches that departure location.

### Pickup

Enabled.

---

# DEPARTING

`DEPARTING` means the shuttle is currently at or near the departure location and is preparing to begin this route leg.

For example:

```text
TO CHURCH
DEPARTING
```

This is the final opportunity for riders to request pickup.

The application may notify riders already on the waitlist:

> Shuttle departing soon.

### Pickup

Enabled.

---

# IN TRANSIT

`IN TRANSIT` means the shuttle has left the departure location and is traveling toward the destination.

At this point the waitlist is locked.

### Pickup

Disabled.

Riders who are already on the waitlist remain visible, but new riders cannot join the trip.

---

# Arrival behavior

Arrival will exist as an **internal event rather than a visible status**.

For example:

```text
Union Church → Guilford Elementary
```

The shuttle travels toward Guilford Elementary.

When the shuttle enters the configured destination geofence:

```text
ARRIVAL EVENT
```

is triggered internally.

That event will cause several actions.

The current leg:

```text
Union Church → Guilford Elementary
```

will:

1. Be considered complete internally.
2. Clear its waitlist.
3. Reset to `NOT STARTED`.

The next leg:

```text
Guilford Elementary → Union Church
```

becomes the active leg.

Because the shuttle is now located at Guilford Elementary, which is that leg's departure point, it can transition to:

```text
DEPARTING
```

So the rider may effectively see:

```text
BEFORE ARRIVAL

TO SCHOOL
IN TRANSIT

TO CHURCH
NOT STARTED
```

followed shortly by:

```text
AFTER ARRIVAL

TO SCHOOL
NOT STARTED

TO CHURCH
DEPARTING
```

There is no need for the rider to see a separate:

```text
ARRIVED
```

screen.

---

# Geofencing

Route transitions will use configurable geofences around departure and arrival locations.

The initial working range will be approximately:

```text
0.1–0.2 miles
```

The final threshold should be determined through real-world testing.

The radius **must be configurable** rather than permanently hard-coded into the application's route logic.

Each Route Leg should be able to store its own geofence configuration if necessary.

---

# Waitlist

Each Route Leg has its own independent waitlist.

For example:

```text
TO SCHOOL
Waiting:
- John
- Mary
- Andrew

TO CHURCH
Waiting:
- Sarah
```

A rider may request pickup when the route is:

```text
NOT STARTED
DEPARTING
```

A rider may not request pickup when the route is:

```text
IN TRANSIT
```

When the rider taps **Pick Up**:

```text
Pick Up
   ↓
Identify guest
   ↓
Create waitlist entry in Convex
   ↓
Update all connected clients in real time
```

The rider should not be able to accidentally join the same Route Leg multiple times.

The UI should clearly show when the current guest is already on the waitlist.

The rider should also be able to remove themselves from the waitlist before the shuttle enters `IN TRANSIT`.

When a Route Leg reaches its destination, that leg's active waitlist is cleared.

---

# Route Leg comments

Each Route Leg exposes a comments list in the detailed View 2 experience.
Comments are independent from waitlist eligibility: a guest may add a comment
while the leg is `NOT STARTED`, `DEPARTING`, or `IN_TRANSIT`, including after the
waitlist has locked.

Each comment belongs to one Route Leg and one application user. Active comments
remain visible through that leg's current cycle. When the shuttle reaches the
destination, the internal arrival event clears the active comments before the
leg returns to `NOT STARTED`. The persistence layer may archive cleared comments
for history rather than physically delete them, but archived comments do not
appear on the reset leg.

Comment display and submission are part of the future functional View 2, not the
Phase 1 nonfunctional preview.

---

# Shuttle tracking

Tracking should be built as a **pluggable tracking provider system**.

The rest of the application should not know or care whether location information came from:

- AirTag
- Driver's phone
- Dedicated GPS tracker
- Another future provider

Conceptually:

```text
Tracking Provider
        ↓
Normalized Shuttle Location
        ↓
Tracking Service
        ↓
Route State
        ↓
Convex
        ↓
Rider Applications
```

A normalized location update might contain information such as:

```text
shuttleId
latitude
longitude
timestamp
accuracy
provider
```

This abstraction is a critical architectural requirement.

---

# AirTag tracking

The initial tracking experiment will use an **AirTag permanently located inside the shuttle**.

The major advantage is operational simplicity:

- No driver needs to pair their phone every week.
- The tracker stays with the shuttle.
- The shuttle remains the object being tracked rather than an individual driver.

However, the AirTag provider must remain isolated behind the common tracking interface.

The rest of the application must **not depend directly on AirTag-specific behavior**.

AirTag location should also be treated as best-effort rather than assuming it provides continuous high-frequency GPS updates.

---

# Driver phone GPS

The architecture should also support the driver's phone as a tracking source.

Conceptually:

```text
Shuttle
   ↓
Active tracking provider
   ↓
Driver Phone
```

The important distinction is:

> **The shuttle is the tracked entity. The phone is only the current source of location information.**

This allows one driver to finish a shift and another driver to become the active tracking provider without replacing the shuttle itself in the data model.

A future driver workflow could therefore allow:

```text
Driver authenticates
        ↓
Select shuttle
        ↓
Start sharing location
        ↓
Phone becomes active tracking provider
```

This is reserved for later phases but must be supported by the architecture.

---

# Google Maps integration

Google Maps and shuttle tracking serve two different purposes.

## Tracking provider

Answers:

> Where is the shuttle right now?

Example:

```text
AirTag → 39.xxxx, -76.xxxx
```

## Google Maps

Answers:

> Given that position and the destination, how far away is it and how long should the remaining trip take?

Conceptually:

```text
Shuttle coordinates
        ↓
Google Maps routing
        ↓
Remaining route distance
        ↓
Estimated remaining duration
        ↓
Progress + ETA displayed to rider
```

Google Maps Platform will be responsible for routing-related information such as:

- Departure coordinates
- Destination coordinates
- Route calculation
- Estimated driving duration
- Remaining distance
- ETA
- Route geometry where needed

The separation between **tracking provider** and **routing provider** should be maintained.

That means we could later replace either system independently.

For example:

```text
AirTag → Driver GPS
```

without replacing Google Maps.

Or:

```text
Google Maps → another routing provider
```

without replacing the shuttle tracking system.

---

# Progress calculation

Each route card should display a visual progress indicator.

Example:

```text
████████████░░░░░░
        2 min remaining
```

Whenever reliable route-location information is available, progress should be based on the shuttle's actual location relative to the route rather than only a timer.

Conceptually:

```text
distance traveled
────────────────────
total route distance
```

or its equivalent using route progress supplied by the routing system.

The progress indicator should therefore respond to location changes.

---

# Real-time behavior

Convex should be used to distribute relevant state changes to connected clients.

A rider should not need to refresh the page to see:

- Someone join the waitlist.
- Someone leave the waitlist.
- Waitlist count change.
- Route status change.
- ETA change.
- Shuttle position/progress change.

The goal should be a live application experience within the practical update frequency of the current tracking provider.

---

# Notifications

## Phase 1

The application should support in-app notification experiences.

The first important notification is:

> Shuttle departing soon.

This is associated with the route entering `DEPARTING`.

Waitlisted users for that Route Leg are the intended recipients.

PWA/browser push notification support can be introduced where platform support and permissions allow it.

The core application's functionality should **not depend on push notifications being enabled**.

A rider should still be able to use the application normally if they decline notifications.

---

# Future Slack integration

Slack is planned as the primary future Union authentication and communication system.

Future functionality may include:

```text
Slack login
```

and notifications such as:

```text
You have been added to the shuttle waitlist.

The shuttle is departing soon.

3 riders are waiting at Guilford Elementary.
```

A future driver could also receive the waitlist through Slack.

Slack is **not required for the Phase 1 MVP**.

---

# View 2 preview and future route detail

Phase 1 will include the approved View 2 design as a nonfunctional visual preview
behind a feature flag. It may be visible during development and demonstrations,
but it must be hidden by default in production deployments until its behavior is
ready.

The preview establishes the intended detailed Route View without making route-card
navigation, live route data, map interaction, or rider actions part of the MVP.

A post-MVP feature will make the user able to tap a Route Card from View 1 and
open detailed information about that Route Leg.

The detailed screen may eventually contain:

- Larger route visualization
- More detailed ETA information
- Route map
- Shuttle position
- Rider waitlist
- Status information
- Additional route details

The approved View 2 prototype is the visual source of truth. Its functional
behavior will be specified separately before implementation.

---

# Phase 2 — Multiple Journeys

The underlying architecture must support multiple Journeys from the beginning.

However, the first additional use case will be deferred until Phase 2.

One planned example is the **Student Night Journey**.

Example:

```text
Student Night Pickup

Church
   ↓
Neighborhood A
   ↓
Neighborhood B
   ↓
Neighborhood C
   ↓
Church
```

Each movement is its own Route Leg and therefore receives:

- Its own status
- Its own waitlist
- Its own ETA
- Its own departure
- Its own destination

The same state machine used for the Sunday Shuttle should work for Student Night without creating an entirely separate tracking system.

This is one of the reasons Journey and Route Leg must remain separate concepts.

---

# 4. Data — What are we storing?

The application should use a data model capable of supporting multiple Journeys, multiple Route Legs, multiple tracking providers, and future authenticated users.

## User

Represents a rider, driver, administrator, or guest.

Possible fields:

```text
id
firstName
lastName
userType
```

Possible user types later:

```text
guest
rider
driver
admin
```

Phase 1 users will primarily be guests.

A Phase 1 guest extends the base User with a guest-facing name and optional
phone number:

```text
name
phoneNumber
```

Authentication-provider links and device-local storage payloads will be defined
when their owning features are specified rather than added to the base User now.

---

## Shuttle

Represents the physical vehicle.

Possible fields:

```text
id
name
activeTrackingProvider
tracking
createdAt
updatedAt
```

The **Shuttle**, not a person's phone, is the primary tracked entity.

The nullable current tracking snapshot contains:

```text
status
coordinates
accuracyMeters
recordedAt
receivedAt
```

Tracking status is one of `UNAVAILABLE`, `CURRENT`, or `STALE`.

---

## Journey

Represents a complete shuttle workflow.

Possible fields:

```text
id
name
description
active
routeLegIds
createdAt
updatedAt
```

Examples:

```text
Sunday Shuttle
Student Night Pickup
```

---

## Route Leg

Represents movement from one point to another.

Possible fields:

```text
id
journeyId
sequence
name
departureLocationId
arrivalLocationId
status
departureGeofenceRadius
arrivalGeofenceRadius
waitlist
comments
createdAt
updatedAt
```

Persistent statuses:

```text
NOT_STARTED
DEPARTING
IN_TRANSIT
```

Arrival/completion is handled as an event rather than a persistent rider-facing status.

---

## Location

Represents a reusable physical point.

Possible fields:

```text
id
name
address
latitude
longitude
```

Example:

```text
Union Church
7195 Oakland Mills Rd
Columbia, MD 21046
```

---

## Waitlist Entry

Represents a user's request to be picked up for a specific Route Leg.

Possible fields:

```text
id
userId
routeLegId
requestedAt
```

The active combination of:

```text
user + route leg
```

should be unique so a rider cannot join the same waitlist multiple times.

---

## Route Leg Comment

Represents a message left by a user for one Route Leg during its current cycle.

Possible fields:

```text
id
routeLegId
authorUserId
message
createdAt
```

Comments may be added in every rider-facing route status. The internal arrival
event clears the active comment list before the Route Leg resets to `NOT_STARTED`.

---

## Location Update

Represents normalized information received from a tracking provider.

Possible fields:

```text
id
shuttleId
provider
coordinates
accuracyMeters
recordedAt
receivedAt
```

Each update is one normalized incoming reading. Convex may retain updates as
separate, retention-limited records while clients primarily subscribe to the
shuttle's current tracking snapshot. The exact retention and cleanup policy is
deferred to the persistence and tracking features.

---

## Tracking Provider Configuration

Stores provider-specific configuration independently from the rest of the shuttle domain.

Possible providers:

```text
AIRTAG
DRIVER_GPS
```

Future providers may be added without modifying Route Legs or Journeys.

---

# 5. Tech — What stack are we using?

## Application

**Next.js**

Use the modern Next.js application architecture with TypeScript.

---

## Language

**TypeScript**

TypeScript should be used throughout the application so shared domain concepts such as:

```text
Journey
RouteLeg
RouteStatus
WaitlistEntry
TrackingProvider
```

can remain strongly typed.

---

## Styling

**Tailwind CSS**

Tailwind remains the styling/UI layer.

Convex replaces the originally discussed Postgres/Prisma backend; it does **not** replace Tailwind.

So the core application stack is:

```text
Next.js
TypeScript
Tailwind CSS
Convex
Google Maps Platform
PWA
```

---

## Backend / database

**Convex**

Convex will provide the application's backend and database.

It is particularly appropriate for the real-time nature of the application.

Convex will store and synchronize information such as:

- Journeys
- Route Legs
- Users
- Waitlists
- Shuttle state
- Location information
- ETA/state information

Connected applications should receive relevant data changes reactively.

No Postgres or Prisma implementation is required for the current architecture.

---

## Maps / routing

**Google Maps Platform**

Google Maps will provide routing and ETA information.

Google Maps is the **routing provider**, not the shuttle tracking provider.

---

## Tracking

Tracking will be implemented through an application-owned provider abstraction.

Initial providers:

```text
AirTag Provider
Driver GPS Provider
```

AirTag is the initial experimental/default provider.

Driver GPS is architecturally reserved as the alternative/higher-frequency provider.

---

# PWA architecture

The application will be built as a **Progressive Web App**.

There is still only **one Next.js application and one codebase**.

Users can access that same application in two primary ways.

## Browser experience

Someone can visit the application URL through:

- Safari
- Chrome
- Other compatible browsers

In this case the application behaves like a normal website and the browser interface remains visible.

---

## Installed PWA experience

A user can install/add the PWA to their phone's home screen.

When they launch it from the home screen, it should open in a standalone app-style experience without the normal browser controls.

The PWA can provide:

- Union-branded app icon
- Standalone display
- App-like launch experience
- Cached static assets
- Home-screen installation
- Notification capabilities where supported

Conceptually:

```text
                   ┌→ Normal browser
One Next.js app ───┤
                   └→ Installed PWA
```

We do **not** need separate implementations for:

```text
iOS
Android
Web
```

for Phase 1.

That significantly reduces development and maintenance overhead.

The application should remain responsive so the same UI also works on desktop browsers if needed.

---

# 6. Monetize — How will this make money?

There is **no monetization requirement for the MVP**.

The Shuttle Tracker is initially an internal operational tool for Union.

Phase 1 should optimize for:

- Reliability
- Ease of use
- Adoption
- Operational usefulness
- Maintainability
- Fast iteration

Monetization should not influence initial product decisions.

If the application eventually becomes useful outside Union, a separate commercial model can be explored later.

---

# 7. UI/UX — How should this look and feel?

The product should be:

### Mobile-first

The phone is the primary device.

The experience should be designed for the dimensions and interaction patterns of a mobile application first.

### Fast

The user should know the shuttle situation within seconds of opening the app.

### Calm

The visual hierarchy should make route state easy to understand without presenting unnecessary information.

### Familiar

The PWA should feel like a simple native mobile application rather than a complicated dashboard.

### Action-oriented

The primary rider action should be obvious:

> **Pick Up**

The user should not need multiple pages or forms to request the shuttle.

---

## Main screen

The main Journey view should show the Route Legs as cards.

Each card should emphasize, in roughly this priority:

```text
1. Direction
2. Current status
3. ETA
4. Trip progress
5. Waitlist
6. Pick Up action
```

The approved prototypes in `prototypes/` should be used as the current visual
source of truth for View 1 and the View 2 preview.

---

## Status visibility

Statuses should be visually distinct.

Examples:

```text
NOT STARTED
DEPARTING
IN TRANSIT
```

The UI should not require riders to understand geofencing, GPS, AirTags, tracking providers, or route engines.

Those concepts are implementation details.

The rider should simply see what the shuttle is doing.

---

## Pickup button behavior

When pickup is allowed:

```text
[ Pick Up ]
```

should be visually prominent.

Once the guest has joined:

```text
You're on the waitlist
```

should be obvious.

When the shuttle is already `IN TRANSIT`, the control should communicate that pickup is closed rather than letting the user attempt an action that will fail.

---

# 8. Deployment — Where and how will this ship?

The application will ship as an installable Next.js PWA.

## Infrastructure

```text
Vercel
   ↓
Next.js application

Convex
   ↓
Backend + database + real-time state

Google Maps Platform
   ↓
Route + ETA calculations

Tracking Provider
   ↓
Shuttle coordinates
```

## Application deployment

The Next.js application will be deployed through Vercel.

The same production URL will serve:

- Desktop browsers
- Mobile browsers
- Installed PWAs

There is no separate native iOS or Android build required for Phase 1.

---

# Phase 1 Scope Summary

Phase 1 delivers the **Sunday Shuttle rider experience**.

It includes:

```text
One Journey

Union Church → Guilford Elementary
Guilford Elementary → Union Church

Three rider-facing states

NOT STARTED
DEPARTING
IN TRANSIT

Guest identification

Real-time waitlists

Pick Up / leave waitlist

Shuttle tracking abstraction

Initial AirTag tracking provider

Reserved driver-phone tracking provider

Google Maps ETA and routing

Automatic geofence-based route transitions

Automatic waitlist reset after arrival

Mobile-first route cards

Feature-flagged, nonfunctional View 2 visual preview

Next.js PWA

Convex backend

Vercel deployment
```

It does **not require** Slack authentication, a dedicated driver dashboard, the
Student Night Journey, or functional View 2 navigation, live data, map behavior,
or rider actions to ship the initial usable product.

Those will be handled as later implementation work.

---

# Core State Machine

The essential application behavior can be summarized as:

```text
              Rider may waitlist
                     │
                     ▼
               NOT STARTED
                     │
        Shuttle reaches/occupies
          departure geofence
                     │
                     ▼
                 DEPARTING
                     │
              Rider may still
                 waitlist
                     │
        Shuttle leaves departure
                 area
                     │
                     ▼
                 IN TRANSIT
                     │
              Waitlist locked
                     │
        Shuttle reaches arrival
                 geofence
                     │
                     ▼
              ARRIVAL EVENT
              (internal only)
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
Clear completed             Completed leg
leg waitlist and            → NOT STARTED
active comments
                                  │
                                  ▼
                         Next route leg
                          → DEPARTING
```

The key product decision is:

> **Arrival is an event, not a persistent rider-facing status.**

The rider interface therefore remains intentionally limited to:

```text
NOT STARTED
DEPARTING
IN TRANSIT
```

---

# Architecture Principle

The system should keep these three responsibilities separate:

```text
TRACKING
Where is the shuttle?
AirTag / Driver GPS

        ↓

ROUTING
How far away is the destination?
How long will it take?
Google Maps

        ↓

APPLICATION STATE
What should riders see?
Journey
Route Leg
Status
Waitlist
ETA
Convex
```

This separation is one of the most important technical requirements of the project.

It lets us change AirTag tracking, driver GPS, Google Maps, authentication, or notification systems later without rebuilding the core Journey and waitlist application.

---

## Final Phase 1 Product Statement

> **Build a mobile-first, installable Union Shuttle PWA that lets Dream Team members see the current Sunday shuttle direction, status, ETA, progress, and real-time waitlist; request pickup before departure; and automatically advances between the Church-to-School and School-to-Church route legs using shuttle location and geofence events.**

This is the version I would treat as the finalized **`project-plan.md` product specification** before turning it into the ordered AI Blueprint `build-plan.md`.
