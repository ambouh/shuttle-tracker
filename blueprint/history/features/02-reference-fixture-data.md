# Feature: Reference fixture data

**From build-plan:** feature 2
**Status:** complete

## Goal

Create one framework-independent, typed frontend data mock for Sunday Service
that later UI, mock state-engine, and Convex work can reuse without inventing or
duplicating records. Its application-facing shape must mirror the data the
frontend will eventually receive from live subscriptions and lifecycle events,
so later integrations replace the source rather than redesigning consumers.

## In scope

- Stable fixture IDs and a fixed reference clock so output is deterministic.
- Union Church and Guilford Elementary locations with real addresses and
  representative coordinates.
- One driver, representative guest riders, and one shuttle.
- The Sunday Service journey and its two ordered, reciprocal route legs.
- Independent waitlists and route-leg comments whose user and leg references
  resolve within the fixture.
- A canonical two-leg View 1 scenario matching the approved prototype: outbound
  `IN_TRANSIT`, return `NOT_STARTED`.
- Additional scenario data covering `DEPARTING` and alternate tracking health.
- Normalized location updates, routing snapshots, and an arrival transition
  example showing the completed leg cleared and reset while the next leg becomes
  `DEPARTING`.
- One stable public fixture export surface for later features.
- Application-facing snapshot and event-example shapes that frontend code can
  consume in the same way it will consume eventual live journey data.

## Out of scope

- React components, routes, styles, or porting prototype theme tokens (Features
  3 and 4).
- Mutable mock state transitions or pickup eligibility logic (Features 5 and 6).
- Convex schema, seed functions, queries, mutations, or subscriptions (Feature
  7).
- Tracking-provider adapters, external SDK payloads, Google Maps calls, route
  calculations, and geofence evaluation (Features 8 through 11).
- Runtime validation, a validation-library decision, or changes to the existing
  Vitest setup and dependencies.
- Changing the domain contracts established by Feature 1 unless implementation
  reveals a direct incompatibility, which must stop for review rather than be
  changed silently.

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

- [x] **Step 1 - Fixture foundations and shared entities** - create the fixture
  module's stable branded IDs, fixed Unix-millisecond clock values, both
  locations, representative users, and shuttle using only public domain types.
  *Done when:* every fixture value is deterministic and strictly typed; Union
  Church and Guilford Elementary have the planned names and addresses; the
  driver and guests have distinct typed IDs; the shuttle has a normalized
  current tracking snapshot; and the module has no React, Next.js, Convex,
  browser, provider-SDK, or current-time dependency.
- [x] **Step 2 - Canonical Sunday Service journey** - add the journey, two
  ordered reciprocal route legs, separate waitlists, and route-leg comments for
  the approved View 1 state, then assemble them into a named canonical fixture.
  *Done when:* `Journey.routeLegIds` matches route-leg sequence; every location,
  user, waitlist, and comment reference resolves to a fixture record; active
  `(userId, routeLegId)` waitlist pairs are unique; outbound is `IN_TRANSIT`,
  return is `NOT_STARTED`; each leg owns independent arrays; and the records
  provide the three-person previews and two-comment detail content needed by the
  prototypes without adding presentation-only fields to domain contracts.
- [x] **Step 3 - Route-state and provider examples** - add explicit scenario
  variants covering all three `RouteStatus` values, normalized location updates,
  routing snapshots for both directions, and current, stale, and unavailable
  shuttle tracking examples.
  *Done when:* consumers can select a named example for `NOT_STARTED`,
  `DEPARTING`, and `IN_TRANSIT`; each update and routing snapshot references the
  fixture shuttle and a valid leg; routing values use meters, seconds,
  Unix-millisecond timestamps, and progress ratios from 0 through 1; and missing
  or stale tracking is represented through existing domain contracts rather
  than magic UI values.
- [x] **Step 4 - Arrival-clearing scenario and public exports** - add a typed
  `ARRIVAL` event with explicit before/after fixture snapshots, export the
  complete fixture API from one barrel, and run final automated checks.
  *Done when:* the before snapshot has active waitlist entries and comments on
  the completed leg; the after snapshot clears both arrays, resets that leg to
  `NOT_STARTED`, and changes the next ordered leg to `DEPARTING`; source update
  references resolve; later features can import fixtures through one stable
  module; and lint, strict TypeScript checking, and the production build pass.

## Files / areas

- `fixtures/` - new framework-independent Sunday Service fixture modules,
  grouped only as needed to keep each file focused.
- `fixtures/index.ts` - stable public fixture export surface.
- `types/domain/` - import-only; no expected contract changes.

No app routes, components, styles, prototypes, dependencies, schemas,
user-owned plans, or generated framework files should change. The normal
`current-feature.md` progress checkboxes are the only other expected edits while
the steps are implemented.

## Data / contracts

- All records use the public contracts exported by `types/domain/index.ts`.
- IDs are readable, stable branded strings defined once and reused across
  relationships. Fixture code must not weaken them to plain `string` or `any`.
- All timestamps are fixed Unix milliseconds. No fixture value may depend on
  `Date.now()`, local timezone, random generation, or import order.
- Geofence radii and route distances use meters; durations use seconds;
  `progressRatio` stays within 0 through 1.
- The canonical fixture is load-bearing for Feature 3 and later Feature 7 live
  data work. It is a mock of the eventual application data boundary, not merely
  seed records and not a component-specific view model.
- Frontend consumers should receive the same domain-shaped journey snapshot
  whether its source is this fixture, the Feature 6 state engine, or Feature 7
  Convex subscriptions. Formatted times, initials, status copy, colors, and
  avatar styles remain derived presentation concerns.
- Scenario variants must not mutate shared fixture objects or share mutable
  waitlist/comment arrays in ways that let one scenario alter another.
- The arrival example mirrors an eventual lifecycle event and its observable
  frontend result using event plus before/after snapshot data. The reducer or
  backend mutation that produces the result belongs to Features 6 and 7.
- Driver display data is supplied by the fixture's `User` collection. No
  undefined driver-assignment field is added to `RouteLeg`; wiring assignment is
  deferred until the product contract defines it.

## Testing

- Vitest is configured and `pnpm test` is the unit-test gate. Colocate fixture
  tests with the fixture source and add focused assertions in the same step as
  each new group of data.
- Step 1 tests stable IDs, fixed timestamps, the two locations, distinct users,
  and the normalized current shuttle snapshot.
- Step 2 tests ordered route-leg IDs and sequences, reciprocal locations,
  resolvable references, unique waitlist memberships, independent arrays, and
  the canonical outbound/return statuses.
- Step 3 tests complete route-status coverage, valid tracking and routing
  references, tracking-health examples, nonnegative distances and durations,
  and progress ratios bounded from 0 through 1.
- Step 4 tests the arrival event's source references and exact before/after
  result: cleared waitlist and comments, completed-leg reset, and next-leg
  activation.
- After each step, run `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm lint`.
- In Step 4, also run `pnpm build` as the documented production gate.
- Browser and screenshot evidence are not required because this feature adds no
  rendered behavior. Features 3 and 4 own visual comparison with the approved
  prototypes.

## Notes for the AI

- Keep fixture modules server/client-neutral and side-effect free. Do not add
  `use client`, React, Next.js, Convex, browser, Node-only, Google Maps, or
  tracking-provider SDK imports.
- Prefer `satisfies` and explicit public domain types so fixtures retain useful
  literal information while contract drift fails compilation.
- Export named records and named assembled scenarios. Avoid a default export and
  avoid a single anonymous data blob that later consumers must dissect.
- Treat arrays and scenario state as reference data. Do not add setters,
  transitions, timers, randomness, or factories that conceal relationships.
- Keep comments and waitlists scoped to their own route leg and active cycle.
  Do not infer waitlist status fields: membership plus `RouteStatus` determines
  whether riders are waiting or picked up.
- Do not make `ARRIVAL` a rider-facing status. It remains a typed internal event.
- Do not invent provider settings, retention policies, external payload shapes,
  route geometry, UI formatting helpers, or a driver-assignment contract.
