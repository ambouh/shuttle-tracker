# Union Shuttle Tracker - Project Overview

> A mobile-first, installable PWA that gives Union Dream Team riders a live view
> of Sunday shuttle status, ETA, progress, and waitlists and lets them request
> pickup before departure.

> **Generated file. Do not hand-edit.** Regenerate this overview with `/overview`
> or `$overview` whenever `project-plan.md` or `build-plan.md` changes.

## Problem

Union Dream Team riders lack a simple, reliable way to know where the shuttle is,
when it will depart or arrive, or whether the driver knows they are waiting. The
product replaces uncertainty and manual communication with a live,
location-driven rider experience that makes shuttle state and pickup eligibility
understandable within seconds.

## Users

- **Guest rider (Phase 1)** - enters a first and last name when first requesting
  pickup, receives an application-generated identity stored on the device, and
  views routes, ETA, progress, and waitlists without formal authentication.
- **Driver (future authenticated role)** - operates a shuttle and may provide
  phone GPS, receive waitlist information, and use recovery controls.
- **Administrator (future authenticated role)** - manages journeys, route legs,
  locations, ordering, geofences, and operational configuration.
- **Authenticated rider (future)** - may connect Slack or Google identity while
  retaining the application's internal user identity.

Shared journey, route, waitlist, location, and ETA state lives in Convex. Local
device storage recognizes the Phase 1 guest only; clearing browser or PWA data
may require the rider to enter their name again.

## Features

### MVP

1. **Domain contracts** - establish framework-independent TypeScript types and
   unions, including route-leg comments, before UI state or database schema work.
2. **Reference fixture data** - provide one internally consistent typed Sunday
   Service dataset with waitlists and comments for UI, state-engine, and later
   Convex seed use.
3. **Journey overview** - deliver the approved functional View 1 with two route
   cards, route state, timing, progress, waitlists, and pickup actions.
4. **Route detail preview** - deliver the approved nonfunctional View 2 behind a
   feature flag, visible for development and demonstrations but hidden by default
   in production.
5. **Guest pickup flow** - create and persist guest identity and allow an eligible
   rider to join or leave a route-leg waitlist.
6. **Mock journey state engine** - exercise `NOT_STARTED`, `DEPARTING`, and
   `IN_TRANSIT`, including arrival-driven waitlist and comment clearing, against
   typed mock data.
7. **Live journey data** - derive the Convex schema from domain contracts, seed
   development data from the fixtures, and synchronize operational state,
   waitlists, and separately stored route-cycle comments.
8. **Tracking foundation** - normalize shuttle location behind a provider-neutral
   interface that keeps the shuttle as the tracked entity, maintains its current
   snapshot, and bounds any retained update history.
9. **AirTag tracking provider** - connect best-effort AirTag updates without
   leaking provider-specific behavior into application state or UI.
10. **Google Maps routing** - supply route geometry, ETA, total and remaining
    distance, and location-based progress through a routing boundary.
11. **Automatic route lifecycle** - use configurable geofences to drive departure,
    transit, arrival, waitlist and comment clearing, leg reset, and next-leg
    activation.
12. **Rider departure alerts** - notify waitlisted riders when a leg becomes
    `DEPARTING` without making browser push permission a core dependency.
13. **PWA experience** - provide Union branding, installability, standalone mode,
    responsive layouts, and an appropriate cached application shell.
14. **Deployment readiness** - prepare Vercel, Convex, Google Maps, tracking
    configuration, production PWA behavior, and end-to-end smoke coverage.

### Next release

15. **Route detail functionality** - enable View 1 navigation to View 2 and connect
    its map, metrics, state, waitlist, pickup, comments, and driver surfaces to
    live data; comments remain available even when pickup is locked.
16. **Driver phone tracking** - allow an authorized driver's phone to become the
    active provider through the same tracking interface.
17. **Slack identity and alerts** - add Slack authentication and rider/driver
    messaging without replacing internal user IDs.
18. **Multiple journeys** - expose journey selection and ordered multi-leg flows
    such as Student Night Pickup.
19. **Driver operations view** - provide authenticated route, waitlist, tracking
    health, and recovery controls for drivers.

### Later

20. **Admin journey management** - manage journeys, legs, locations, ordering,
    and geofences without code changes.
21. **Tracking reliability controls** - add provider health, stale-location
    handling, fallback selection, and operational diagnostics.

## Domain contracts and data model

Feature 1 defines these framework-independent contracts before Convex schema
work. Feature 7 maps them to stored Convex documents. Identifiers remain opaque
application IDs at the contract boundary so domain logic is not coupled to a
database or external authentication provider.

### Shared value types

- `EntityId` (`string`) - opaque application identity.
- `Timestamp` (`number`) - Unix time in milliseconds.
- `Coordinates` - `{ latitude: number; longitude: number }`.
- `RouteStatus` - `"NOT_STARTED" | "DEPARTING" | "IN_TRANSIT"`.
- `UserType` - `"guest" | "rider" | "driver" | "admin"`.
- `TrackingProvider` - initially `"AIRTAG" | "DRIVER_GPS"`.

### User

- `id` (`EntityId`)
- `firstName` (`string`)
- `lastName` (`string`)
- `userType` (`UserType`)

A user may own many `WaitlistEntry` and `RouteLegComment` records. Phase 1
primarily creates guests.

### GuestUser

Extends `User` and narrows `userType` to `"guest"`.

- `name` (`string`) - guest-facing display name.
- `phoneNumber` (`string | null`)

Feature 5 owns the device-local subset used to recognize a guest. Future
authentication features own provider-link contracts rather than changing this
Feature 1 identity shape silently.

### Shuttle

- `id` (`EntityId`)
- `name` (`string`)
- `activeTrackingProvider` (`TrackingProvider | null`)
- `tracking` (`ShuttleTrackingSnapshot | null`)
- `createdAt` (`Timestamp`)
- `updatedAt` (`Timestamp`)

A shuttle has provider configurations and receives normalized location updates.
The physical shuttle, not a driver or device, is the tracked entity.

### ShuttleTrackingSnapshot

- `status` (`"UNAVAILABLE" | "CURRENT" | "STALE"`)
- `coordinates` (`Coordinates | null`)
- `accuracyMeters` (`number | null`)
- `recordedAt` (`Timestamp | null`)
- `receivedAt` (`Timestamp | null`)

### Journey

- `id` (`EntityId`)
- `name` (`string`)
- `description` (`string | null`)
- `active` (`boolean`)
- `routeLegIds` (`RouteLeg.id[]`, ordered)
- `createdAt` (`Timestamp`)
- `updatedAt` (`Timestamp`)

A journey owns one or more ordered `RouteLeg` records. Phase 1 exposes only the
Sunday Service journey, while the model supports future journeys immediately.

### Location

- `id` (`EntityId`)
- `name` (`string`)
- `address` (`string`)
- `latitude` (`number`)
- `longitude` (`number`)

Initial records are Union Church at 7195 Oakland Mills Rd, Columbia, MD 21046,
and Guilford Elementary School at 7335 Oakland Mills Rd, Columbia, MD 21046.

### RouteLeg

- `id` (`EntityId`)
- `journeyId` (`Journey.id`)
- `sequence` (`number`)
- `name` (`string`)
- `departureLocationId` (`Location.id`)
- `arrivalLocationId` (`Location.id`)
- `status` (`RouteStatus`)
- `departureGeofenceRadius` (`number`, distance unit `> TODO`)
- `arrivalGeofenceRadius` (`number`, distance unit `> TODO`)
- `waitlist` (`WaitlistEntry[]`, application-facing active list)
- `comments` (`RouteLegComment[]`, application-facing active list)
- `createdAt` (`Timestamp`)
- `updatedAt` (`Timestamp`)

Sunday Service has two legs: Union Church to Guilford Elementary, then Guilford
Elementary to Union Church. Arrival is an internal event, not a persistent route
status.

### WaitlistEntry

- `id` (`EntityId`)
- `userId` (`User.id`)
- `routeLegId` (`RouteLeg.id`)
- `requestedAt` (`Timestamp`)

Presence means the rider belongs to the active waitlist; no independent waitlist
status is stored. The active `(userId, routeLegId)` combination must be unique.
During `NOT_STARTED` and `DEPARTING`, members are presented as waiting. During
`IN_TRANSIT`, the same members are presented as picked up. Arrival clears the
active list. Convex may normalize entries for concurrent writes while preserving
`RouteLeg.waitlist` at the application boundary.

### RouteLegComment

- `id` (`EntityId`)
- `routeLegId` (`RouteLeg.id`)
- `authorUserId` (`User.id`)
- `message` (`string`)
- `createdAt` (`Timestamp`)

Comments may be added during every rider-facing route status, independently of
pickup eligibility. They remain active through transit. Arrival clears the
active list before the leg resets to `NOT_STARTED`; Convex may archive cleared
records while exposing only active comments through `RouteLeg.comments`.

### LocationUpdate

- `id` (`EntityId`)
- `shuttleId` (`Shuttle.id`)
- `provider` (`TrackingProvider`)
- `coordinates` (`Coordinates`)
- `accuracyMeters` (`number | null`)
- `recordedAt` (`Timestamp`)
- `receivedAt` (`Timestamp`)

Each document represents one normalized incoming reading. Convex may retain
these separately with bounded retention while clients subscribe primarily to
`Shuttle.tracking`. Consumers must tolerate stale, missing, low-accuracy, and
best-effort AirTag updates.

### TrackingProviderConfiguration

- `id` (`EntityId`)
- `shuttleId` (`Shuttle.id`)
- `provider` (`TrackingProvider`)
- `active` (`boolean`)
- `settings` (provider-specific validated object `> TODO`)
- `createdAt` (`Timestamp`)
- `updatedAt` (`Timestamp`)

### RoutingSnapshot

Replaceable routing output used by progress and ETA surfaces. Long-term
persistence is `> TODO`.

- `routeLegId` (`RouteLeg.id`)
- `shuttleId` (`Shuttle.id`)
- `origin` (`Coordinates`)
- `destination` (`Coordinates`)
- `totalDistanceMeters` (`number`)
- `remainingDistanceMeters` (`number`)
- `estimatedDurationSeconds` (`number`)
- `estimatedArrivalAt` (`Timestamp`)
- `progressRatio` (`number`, 0 through 1)
- `encodedGeometry` (`string | null`)
- `calculatedAt` (`Timestamp`)

Google Maps produces this contract but remains separate from shuttle tracking.

### RouteLifecycleEvent

- `type` - initially `"ARRIVAL"`.
- `routeLegId` (`RouteLeg.id`)
- `shuttleId` (`Shuttle.id`)
- `occurredAt` (`Timestamp`)
- `sourceLocationUpdateId` (`LocationUpdate.id | null`)

Arrival clears the completed leg's active waitlist and comments, resets that leg
to `NOT_STARTED`, and activates the next ordered leg as `DEPARTING`.

## Reference fixture

The shared typed development fixture contains the Sunday Service journey, both
locations and ordered legs, one shuttle and driver, representative guest riders,
independent waitlists and comments, every route status, normalized tracking
updates, routing snapshots, and an arrival-event clearing scenario. The UI and
mock state engine consume it directly; Feature 7 provides a repeatable path that
seeds the same relationships into Convex.

## State and provider boundaries

```text
Tracking provider
  -> normalized LocationUpdate
  -> shuttle tracking service
  -> Google Maps routing boundary
  -> RoutingSnapshot
  -> route lifecycle and application state
  -> Convex real-time subscriptions
  -> rider UI
```

- AirTag and driver GPS remain replaceable tracking providers.
- Google Maps is the routing provider, not the shuttle location source.
- Route state and waitlist rules belong to application logic, not provider
  adapters or UI components.
- Departure and arrival geofences begin around 0.1 to 0.2 miles, with final
  values determined through real-world testing.

## Tech stack

- **Next.js 16 App Router and React 19** - one responsive browser and PWA app.
- **TypeScript** - domain contracts and typed UI, state, provider, and backend
  boundaries.
- **Tailwind CSS 4** - CSS-first styling and the approved Union visual system.
- **Convex** - backend, database, mutations, and real-time subscriptions.
- **Google Maps Platform** - replaceable routing, geometry, distance, duration,
  ETA, and progress calculations.
- **Tracking provider abstraction** - normalized AirTag updates initially and
  driver-phone GPS later.
- **pnpm 10.16.0** - package manager.
- **Node.js 20.9.0 or newer** - runtime required by Next.js 16.

There is no unit test runner, combined Verify command, or automatic GitHub check
configured yet.

## Monetization

There is no MVP monetization requirement. This is an internal Union operational
tool optimized for reliability, ease of use, adoption, maintainability, and fast
iteration. Any commercial model is a separate future decision.

## UI/UX

The experience is mobile-first, fast, calm, familiar, and action-oriented. A
rider should immediately understand direction, route state, ETA, progress,
waitlist, and pickup availability. Tracking, geofencing, and provider mechanics
stay out of rider-facing language.

- **View 1, journey overview (route path `> TODO`)** - the functional Sunday
  Service experience with welcome and journey selection, two state-colored route
  cards, driver identity, status pills, consolidated timing/progress, waitlist
  previews, and pickup controls.
- **View 2, route detail preview (route path `> TODO`)** - a feature-flagged,
  nonfunctional rendering of rider profile context, route metrics, map treatment,
  shuttle position, waitlist, and driver card. It is visible during development
  and demonstrations and hidden by default in production until Feature 15.

When View 2 becomes functional, its comment section accepts comments in every
route status, including `IN_TRANSIT` when pickup is locked. Comments are scoped
to the leg's current cycle and disappear from the active view after arrival.

Approved visual sources:

- `prototypes/theme.css` - durable theme tokens.
- `prototypes/view-1.html` - View 1 reference.
- `prototypes/view-2.html` - View 2 preview reference.
- `blueprint/reference/VIEW-1.png` and `blueprint/reference/VIEW-2.png` - supplied
  source images behind the prototypes.

View 1 allows pickup during `NOT_STARTED` and `DEPARTING`, clearly indicates when
the current guest is already waiting, and exposes no pickup action during
`IN_TRANSIT`.

## Deployment

- **Provider** - Vercel serves the Next.js application to desktop browsers,
  mobile browsers, and installed PWAs.
- **Backend** - Convex hosts shared data and real-time functions.
- **Build** - `pnpm build`.
- **Production start** - `pnpm start` when a standalone Node process is needed;
  Vercel otherwise manages the Next.js runtime.
- **Output** - Next.js-managed Vercel output; no native iOS or Android artifact.
- **View 2 feature flag** - enabled for development and demonstrations, hidden by
  default in production. Exact flag name and evaluation mechanism are `> TODO`.
- **Environment variables** - exact names for Convex, Google Maps, tracking, and
  the View 2 flag are `> TODO`.
- **Health check path** - `> TODO`.
- **Workers or cron jobs** - `> TODO`; tracking ingestion is not yet selected.
- **Domain** - `> TODO`.

## Open questions

- What mechanism supplies AirTag data to the tracking-provider adapter?
- Should Feature 7 physically delete cleared waitlist entries and comments or
  archive them outside the active route-leg lists?
- What distance unit should stored geofence radii use?
- What bounded retention periods should location updates and routing snapshots
  use?
- Which runtime validation library should enforce domain and provider boundaries?
- What route paths should View 1 and the View 2 preview use?
- What exact feature-flag and provider environment-variable names should be used?
- What production health endpoint, domain, and tracking ingestion process are
  required?
