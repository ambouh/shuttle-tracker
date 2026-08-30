# Feature: Domain contracts

**From build-plan:** feature 1
**Status:** complete

## Goal

Create the framework-independent TypeScript vocabulary that every later feature
uses for riders, guests, journeys, route legs, waitlists, shuttles, tracking,
routing, and route lifecycle events. The result must lock load-bearing names,
units, unions, relationships, and provider boundaries before fixtures, UI state,
or the Convex schema are introduced.

## In scope

- Shared opaque entity IDs, Unix-millisecond timestamps, coordinates, meters,
  seconds, and progress-ratio value types.
- A base `User` contract and a `GuestUser` extension with a phone number.
- Journey, ordered route-leg, location, waitlist-entry, and route-leg comment
  contracts.
- Rider-facing route states and route-leg waitlist membership.
- Shuttle, its current tracking snapshot, normalized incoming location updates,
  tracking providers, and provider-configuration contracts.
- Routing snapshots and internal route lifecycle events.
- One stable public export surface for later features.
- Compile-time compatibility with strict TypeScript and project lint rules.

## Out of scope

- Convex schema, indexes, queries, mutations, subscriptions, or generated IDs
  (Feature 7).
- Reference values or seeded records for Sunday Service (Feature 2).
- Runtime validation or selection of a validation library.
- State transitions, pickup eligibility functions, progress calculations, or
  geofence evaluation (Features 5, 6, 10, and 11).
- AirTag ingestion details and provider-specific configuration fields (Feature
  9).
- Google Maps request/response types or SDK coupling (Feature 10).
- React components, routes, browser storage, UI view models, or prototype work.
- Tests setup, CI, or changes to package dependencies.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step
was too big, so split it.

## Build steps

- [x] **Step 1 - Shared primitives and identity contracts** - create the domain
  module, opaque typed entity IDs, time/distance/duration/progress primitives,
  coordinates, `UserType`, `User`, and `GuestUser`.
  *Done when:* the new identity contracts compile under strict TypeScript, IDs
  cannot be accidentally interchanged across entity kinds, timestamps are Unix
  milliseconds, geospatial distance is meters, duration is seconds, and no
  framework, database, browser, or authentication SDK is imported.
- [x] **Step 2 - Journey, waitlist, and comment contracts** - add `Location`,
  `Journey`, `RouteStatus`, `RouteLeg`, `WaitlistEntry`, and `RouteLegComment`,
  then export them through the domain module. *Done when:* a journey can
  reference ordered route legs and reusable locations using typed IDs; each
  route leg exposes its current waitlist and comments; route status is limited
  to `NOT_STARTED`, `DEPARTING`, and `IN_TRANSIT`; geofence radii are meters;
  waitlist entries have no separate waiting or picked-up status; and comments
  reference both their route leg and author.
- [x] **Step 3 - Shuttle and tracking contracts** - add `Shuttle`,
  `ShuttleTrackingSnapshot`, `ShuttleTrackingStatus`, `TrackingProvider`,
  `LocationUpdate`, and generic `TrackingProviderConfiguration`, then export
  them through the domain module.
  *Done when:* the shuttle remains the tracked entity, normalized updates record
  provider, coordinates, accuracy, recorded time, and received time; each
  shuttle owns one nullable current tracking snapshot; tracking health is
  limited to `UNAVAILABLE`, `CURRENT`, or `STALE`; and provider-specific settings
  remain `unknown` until their adapter features validate and refine them.
- [x] **Step 4 - Routing and lifecycle contracts** - add `RoutingSnapshot` and
  the discriminated `RouteLifecycleEvent` contract, complete the public barrel,
  and run final automated checks. *Done when:* routing output uses meters,
  seconds, Unix-millisecond ETA, a named progress-ratio type documented as 0
  through 1, and optional route geometry; the only initial lifecycle event is
  `ARRIVAL`; every domain contract is importable from one public module; lint,
  strict TypeScript checking, and the documented production build all pass
  without source changes outside this feature.

## Files / areas

- `types/domain/primitives.ts` - shared IDs and value types.
- `types/domain/user.ts` - user and local guest identity.
- `types/domain/journey.ts` - locations, journeys, route legs, and route status.
- `types/domain/waitlist.ts` - route-leg pickup requests.
- `types/domain/comment.ts` - user comments for a route leg's active cycle.
- `types/domain/tracking.ts` - shuttles, tracking health, providers,
  configurations, and normalized location updates.
- `types/domain/routing.ts` - provider-neutral routing snapshots.
- `types/domain/lifecycle.ts` - internal route lifecycle events.
- `types/domain/index.ts` - the stable public export surface.

No app routes, components, styles, prototypes, dependencies, schemas, user-owned
plans, or generated framework files should change during implementation. The
normal `current-feature.md` progress checkboxes are the only Blueprint context
edits expected while the steps are built.

## Data / contracts

These shapes are load-bearing for Features 2 through 21. Later persistence and
provider features may map or refine them, but must not silently rename fields,
change units, or add rider-facing route states.

### Shared decisions

- IDs are opaque branded strings parameterized by entity kind. They remain
  framework-independent and later map to Convex document IDs at the persistence
  boundary.
- `Timestamp` is a number containing Unix milliseconds.
- `DistanceMeters`, `DurationSeconds`, and `ProgressRatio` are named numeric
  aliases. Runtime range validation is deferred, but their names prevent unit
  ambiguity at call sites.
- `Coordinates` contains `latitude` and `longitude` numbers.

### Identity

- `UserType`: `"guest" | "rider" | "driver" | "admin"`.
- `User`: typed `id`, `firstName`, `lastName`, and `userType`.
- `GuestUser extends User`: narrows `userType` to `"guest"` and adds `name` as
  the guest-facing display name plus nullable `phoneNumber`.
- `phoneNumber` remains a plain nullable string in this feature. Normalization,
  SMS behavior, consent flow, opt-out behavior, and validation are deferred to a
  future notification feature.
- Feature 5 may store the required subset of `GuestUser` on the device; Feature
  1 does not define a separate browser-storage model.

### Journey and waitlist

- `RouteStatus`: `"NOT_STARTED" | "DEPARTING" | "IN_TRANSIT"`.
- `Location`: typed ID, name, address, latitude, and longitude.
- `Journey`: typed ID, name, nullable description, active flag, and timestamps.
- `RouteLeg`: typed IDs for itself, journey, departure location, and arrival
  location; sequence; name; route status; departure and arrival geofence radii
  in meters; current `waitlist`; current `comments`; and timestamps.
- `WaitlistEntry`: typed ID, user ID, route-leg ID, and request timestamp. Its
  presence means the rider belongs to that leg's active waitlist; it has no
  independent status.
- `RouteLeg.waitlist`: `WaitlistEntry[]`. During `NOT_STARTED` and `DEPARTING`,
  members are presented as waiting. During `IN_TRANSIT`, the same members are
  presented as picked up. Leaving before transit removes the entry, and arrival
  clears the array. Feature 7 may normalize storage for safe concurrent Convex
  writes while preserving this domain-facing property.
- `RouteLegComment`: typed ID, route-leg ID, author user ID, message, and created
  timestamp. It has no route-status restriction.
- `RouteLeg.comments`: `RouteLegComment[]`. Comments remain active through
  `NOT_STARTED`, `DEPARTING`, and `IN_TRANSIT`. The internal arrival event clears
  the active array before the leg resets to `NOT_STARTED`; Feature 7 may archive
  cleared records outside the active domain-facing list.

### Shuttle and tracking

- `ShuttleTrackingStatus`: `"UNAVAILABLE" | "CURRENT" | "STALE"`.
- `TrackingProvider`: `"AIRTAG" | "DRIVER_GPS"`.
- `Shuttle`: typed ID, name, nullable active provider, nullable current tracking
  snapshot, and created/updated timestamps.
- `ShuttleTrackingSnapshot`: tracking health, nullable current coordinates,
  accuracy, recorded timestamp, and received timestamp.
- `LocationUpdate`: typed ID, shuttle ID, provider, coordinates, nullable
  accuracy in meters, recorded timestamp, and received timestamp. It represents
  one normalized incoming reading, not the shuttle's accumulated history.
- `TrackingProviderConfiguration<TSettings = unknown>`: typed ID, shuttle ID,
  provider, active flag, provider settings, and timestamps. Adapter features own
  runtime validation and concrete settings types.
- Feature 7 or 8 may persist location updates as separate, retention-limited
  records while clients subscribe primarily to the shuttle's current snapshot.
  Retention policy and Convex cleanup behavior are not part of Feature 1.

### Routing and lifecycle

- `RoutingSnapshot`: route-leg ID, shuttle ID, origin and destination,
  total/remaining meters, estimated duration seconds, ETA timestamp, progress
  ratio, nullable encoded geometry, and calculation timestamp.
- `RouteLifecycleEvent`: a discriminated union whose only initial member is
  `ARRIVAL`, with route-leg ID, shuttle ID, occurrence timestamp, and nullable
  source location-update ID. Handling that event later clears both the active
  waitlist and active comments before resetting the leg.

## Testing

- No unit test runner or `test` command is configured, so this feature does not
  add tests or dependencies.
- After each step, run `pnpm exec tsc --noEmit` and `pnpm lint` to prove the new
  contracts compile under strict TypeScript and satisfy lint rules.
- In Step 4, also run the documented `pnpm build` production gate. If Turbopack
  is blocked only by the execution environment, record that evidence and use a
  one-time `pnpm exec next build --webpack` diagnostic without changing the
  documented project command.
- No browser or screenshot verification is needed because this feature has no
  runtime or visual behavior.

## Notes for the AI

- This is a server/client-neutral TypeScript module. Do not add `use client`,
  React, Next.js, Convex, Google Maps, browser, or Node-specific imports.
- Prefer `type` for unions and branded primitives and `interface` for entity
  object shapes, consistent with the coding standards.
- Avoid TypeScript `enum`; use string-literal unions so fixtures, JSON, Convex,
  and provider boundaries remain straightforward.
- Do not add constructors, factories, validators, constants, state-machine
  logic, or sample values. Feature 2 owns fixtures, and later logic features own
  behavior.
- Do not make `ARRIVAL` a `RouteStatus`; it remains an internal lifecycle event.
- Do not store driver identity on a route leg merely because prototypes display
  a driver. The assignment relationship is not defined in the plans and remains
  deferred.
- Do not retain external provider SDK types in domain contracts. Translate them
  at adapter boundaries.
- Keep exports explicit and avoid circular imports between contract files.
