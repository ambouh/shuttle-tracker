# Feature: Mock journey state engine

**From build-plan:** feature 6
**Status:** complete

## Goal

Make Sunday Service move through `NOT_STARTED`, `DEPARTING`, and `IN_TRANSIT`
without a backend. Keep route status, mock tracking, ETA/progress, guest pickup
state, and arrival cleanup in one typed engine that Convex and live geofencing
can later replace.

## Design reference

- The current `/` overview and `blueprint/reference/VIEW-1.png` define the
  visual baseline.
- Add a compact, labeled demo control panel using existing components and tokens.
  This extends the current screen rather than introducing a new visual design.

## In scope

- A pure immutable engine owning the selected active leg, users, ordered route
  legs, shuttle tracking, and routing snapshots.
- Actions that set the selected leg to any rider-facing status, with matching
  typed mock tracking and route metrics.
- A validated internal `ARRIVAL` action that clears the completed leg's active
  waitlist/comments, resets it, and advances the next ordered leg to `DEPARTING`.
- Sunday demo wraparound from the final leg to the first. This is simulator
  behavior, not a production lifecycle rule.
- One client state boundary shared with Feature 5 pickup actions, plus responsive
  keyboard-usable View 1 controls and an arrival announcement.

## Out of scope

- Convex, multi-client sync, server mutations, authentication, or authorization.
- Timers, automatic transitions, geofences, GPS/AirTag ingestion, Google Maps,
  or production lifecycle rules; Features 7-11 own those paths.
- View 2 interaction, comment entry, alerts, driver controls, or route navigation.
- Persisting simulator state, waitlists, comments, or statuses. Guest identity
  remains the only localStorage payload.
- An `ARRIVED` status; arrival remains an event.

## Build loop

Build one step at a time, never the whole feature at once.

1. Lay out the step before code.
2. Implement just that step.
3. Show the diff and explain its behavior with evidence.
4. The user approves before the step is checked off or committed.

## Build steps

- [x] **Step 1 - Define the mock engine and status presets** - add state, action,
  result, and failure contracts plus a pure reducer for selecting an ordered leg
  and applying each status. Build direction-aware mock routing/tracking values
  from existing typed fixtures. *Done when:* all three statuses work for either
  Sunday leg; the selected leg gets the requested status and matching
  unavailable/stale/current tracking plus zero/zero/in-progress presentation;
  the other leg is `NOT_STARTED`; users, lists, IDs, schedules, and inputs are
  preserved; unknown, foreign, inactive, malformed, and stale-target actions
  fail without mutation; numeric routing values remain finite and bounded; tests
  cover both directions.
- [x] **Step 2 - Apply validated arrival events** - extend the engine with the
  existing `RouteLifecycleEvent` and ordered advancement. *Done when:* arrival
  is accepted only for the selected `IN_TRANSIT` leg in the active tenant and
  journey with matching shuttle, safe timestamp, and null or known matching
  source update; the completed leg resets, clears only its waitlist/comments and
  receives `updatedAt`; the next ordered leg (wrapping in this mock) becomes
  selected and `DEPARTING` with reset mock presentation and `updatedAt`; its
  lists and all users remain intact; invalid, duplicate, wrong-target, and
  out-of-order events are typed no-ops; tests cover outbound, return wraparound,
  empty lists, and failures.
- [x] **Step 3 - Unify pickup and journey state in View 1** - replace the
  pickup-only snapshot with engine state and apply guest joins/leaves to its
  current route data. *Done when:* status changes immediately update cards,
  timing, progress, eligibility, and personalized copy; joins before departure
  survive later status changes; transit blocks changes in UI and domain logic;
  arrival removes completed-leg membership while preserving guest identity and
  next-leg data; reload restores identity but resets the demo; fixtures remain
  immutable and View 2 stays disabled.
- [x] **Step 4 - Add accessible demo controls** - render a compact panel showing
  the selected route with `Not started`, `Departing`, `In transit`, and
  `Arrive` controls. *Done when:* status buttons expose pressed state, Arrive
  is enabled only in transit, controls have accessible names and work by
  keyboard, arrival announces completed/newly active routes in a live region,
  reset copy covers status and pickup data, rapid/repeated activation cannot use
  a stale target, and the panel fits at 320px and 1440px.
- [x] **Step 5 - Prove the cycle and regressions** - run `/check` and save
  mobile/desktop evidence. *Done when:* both directions visibly exercise all
  statuses and matching timing/progress; a guest joins before departure,
  remains through transit, cannot change pickup during transit, is cleared on
  arrival, and can join the newly departing leg; each arrival preserves the
  untouched leg until its turn; final-leg wraparound works; reload returns to
  the fixture while retaining identity; View 2 remains gated and static; no
  browser errors or overflow occur; `pnpm test`, `pnpm exec tsc --noEmit`,
  `pnpm lint`, and `pnpm build` pass.

## Files / areas

- `types/mock-journey.ts` - mock state, actions, results, and failure codes.
- `lib/mock-journey.ts` and adjacent tests - pure status/arrival transitions.
- `fixtures/operational-scenarios.ts` - minimally extend direction-aware mock
  routing/location inputs without making fixtures mutable.
- `components/guest-pickup/GuestJourneyOverview.tsx` - client state owner.
- `components/journey-overview/DemoJourneyControls.tsx` - control panel.
- `lib/journey-overview.ts` - change only if mock inputs expose a missing
  presentation boundary.
- `blueprint/evidence/feature-6/` - screenshots and verification notes.

## Data / contracts

- `MockJourneyState` contains `activeRouteLegId`, users, route legs, shuttle,
  and routing snapshots. It is serializable client memory only.
- `MockJourneyAction` discriminates `SET_STATUS` and `ARRIVAL`. Callers
  supply target and time; the engine reads no clocks, IDs, or browser globals.
- Failures distinguish unavailable journey/route, stale target, invalid event,
  and unavailable arrival. UI must not infer validity from disabled state alone.
- `Journey.routeLegIds` determines advancement; this mock wraps to index zero.
- `ARRIVAL` remains `RouteLifecycleEvent`. A source update, when supplied,
  must resolve to the selected shuttle.
- Presets use existing routing, shuttle-tracking, and location-update contracts:
  not-started is unavailable/zero, departing is stale/zero, and transit is
  current/bounded progress.
- Engine initialization clones mutable arrays and nested values. Feature 5's
  guest storage shape and opaque identity stay unchanged.

## Testing

Vitest covers validation, immutability, both directions, status-derived values,
arrival clearing, ordered advancement, wraparound, and failure no-ops. Existing
pickup tests remain authoritative and expand only for combined-state behavior.

Browser verification uses existing headless Chrome at 320px and 1440px without
installing a runner. Exercise click and keyboard paths, pressed/disabled/live
semantics, the complete cycle, document width, and console/runtime errors. Run
`pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`.

## Notes for the AI

- Keep `app/page.tsx` a Server Component and mock interaction in the existing
  client boundary. Keep transitions pure and outside React.
- Read installed Next.js 16 docs before changing server/client props.
- Never mutate fixtures or prior state; clone route lists, comments, waitlists,
  shuttle tracking, coordinates, and routing values on initialization.
- Preserve submission-time pickup eligibility checks; disabled UI is not the
  enforcement boundary.
- Direct status selection is a demo affordance. Feature 11 owns production
  geofence sequencing and may use different rules.
- Keep controls out of View 2 and never imply changes reach other devices.
- Root-layout modal hosting is deferred at the user's request; preserve the
  existing pickup modal during this feature.
- Red-team result: the draft was tightened around one state owner,
  direction-aware presets, event-source validation, stale/repeated actions,
  final-leg behavior, reset semantics, accessibility feedback, and the boundary
  with Feature 11.

## Completion evidence

- Verification: `blueprint/evidence/feature-6/verification.md`.
- Passed: `pnpm test` (161 tests), `pnpm exec tsc --noEmit`, `pnpm lint`,
  and `pnpm build`.
- Browser checks passed at 320px and 1440px with no runtime errors or overflow.
- No findings recorded at completion.
