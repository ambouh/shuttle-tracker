# Feature: Route detail preview

**From build-plan:** feature 4
**Status:** complete

## Goal

Build the approved View 2 route-detail screen as a polished, nonfunctional
preview. It gives development and demonstration environments a realistic view
of rider context, route progress, map treatment, waitlist, comments, scheduled
pickup, and driver information without introducing navigation, mutations, live
maps, or backend state ahead of their planned features.

## Design reference

- `blueprint/reference/VIEW-2.png` - approved visual source for route-detail
  hierarchy, proportions, map treatment, bottom-sheet composition, and content.
- The existing View 1 theme in `app/globals.css` is the source of truth for
  application colors, typography, spacing, radii, and motion conventions.
- `blueprint/evidence/feature-3b/journey-overview-mobile-320.png` and
  `blueprint/evidence/feature-3b/journey-overview-desktop-1440.png` - current
  application shell and responsive baseline.

## In scope

- A dynamic preview route at `/routes/[routeLegId]` that resolves a known
  organization-scoped Sunday Service Route Leg and returns the normal not-found
  response for an unknown or cross-journey ID.
- A server-evaluated `ROUTE_DETAIL_PREVIEW_ENABLED` feature flag. The route is
  visible by default in development, hidden by default in production, and may
  be explicitly enabled with the value `true` for demonstrations or disabled
  with `false` in any environment. Unrecognized values fail closed.
- The current rider profile card using Josh Williams and the existing nullable
  profile image with initials fallback.
- A dark-tinted, provider-free map illustration with location labels, route
  line, shuttle marker, route-state label, and a compact ETA/distance callout.
- A route-detail sheet with back affordance, direction, fixed departure and
  arrival times, progress, waitlist summary, pickup affordance, comments,
  scheduled-pickup preview, and operating-driver card.
- A pure presentation adapter that joins the selected Route Leg to its Journey,
  Organization, Locations, Shuttle, Driver, Users, waitlist, comments, and
  Routing Snapshot without placing joins or formatters in React components.
- A small typed, presentation-only preview scenario for visual data not yet
  represented by the domain contracts, specifically the stylized map path and
  scheduled-pickup example. It must be clearly separate from canonical domain
  data and replaceable by Features 7, 10, and 15.
- Existing shadcn/ui primitives and Lucide icons where they fit the approved
  design. New shadcn primitives may be added only when they materially reduce
  custom component code.
- Responsive behavior for a 320px mobile viewport and desktop, accessible
  labels and landmarks, safe text wrapping, and reduced-motion behavior.

## Out of scope

- Linking View 1 route cards to this screen or treating the back affordance as
  functional navigation (Feature 15).
- Adding, removing, or editing waitlist entries, comments, or scheduled pickup
  requests (Features 5, 7, and 15).
- Interactive expand/collapse controls, forms, drawers, tabs, timers, or route
  state simulation (Features 6 and 15).
- Google Maps tiles, SDKs, API keys, geocoding, routing requests, or accurate
  geographic route geometry (Feature 10).
- Live tracking, Convex, subscriptions, server actions, authentication, or
  organization authorization enforcement (Features 7 through 11 and 15).
- Changing the domain model to persist scheduled pickups. The scheduled pickup
  shown here is presentation-only until its functional contract is planned.
- New journey selection behavior or route-detail support for arbitrary fixture
  shapes beyond a safe not-found result.
- Production exposure by default. This preview remains gated until Feature 15.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Lock the preview route and feature flag** - add one server-safe
  flag helper and the `/routes/[routeLegId]` route boundary, using the installed
  Next.js 16 conventions and a minimal placeholder that resolves the selected
  canonical Route Leg. *Done when:* the canonical Sunday Service leg renders in
  development; an unknown leg uses `notFound()`; production without the flag
  does not expose the preview; `ROUTE_DETAIL_PREVIEW_ENABLED=true` enables it;
  explicit `false` disables it in development; an unrecognized value does not
  expose it; flag evaluation is unit tested without mutating global environment
  state; and the existing `/` journey overview is unchanged.
- [x] **Step 2 - Create the route-detail presentation model** - add a pure
  adapter and typed preview scenario that resolve rider, organization, selected
  leg, locations, shuttle, active driver, users, routing metrics, waitlist,
  comments, map illustration points, and the scheduled-pickup example into a
  component-ready model. *Done when:* components need no ID joins, date/distance
  arithmetic, or status-copy rules; canonical output includes `2 min`, `0.6
  miles`, the fixed route times, freshness text, three picked-up riders, two
  comments, and John Smith as driver; distance is displayed in US customary
  units while domain values remain meters; missing routing, driver, waitlist,
  comments, profile images, and malformed preview points yield explicit safe
  fallbacks; and focused Vitest tests cover canonical and fallback output.
- [x] **Step 3 - Build the profile and map preview** - render the upper View 2
  composition from the model with the current-rider profile surface and a
  provider-free SVG map illustration containing route line, endpoint labels,
  shuttle marker, status, ETA, distance, and location freshness. *Done when:*
  the composition follows `VIEW-2.png`; map content has an accessible text
  alternative; the rider image falls back to `JW`; no map/provider dependency,
  network request, iframe, client component, or misleading interactive control
  is introduced; and `/` remains visually unchanged.
- [x] **Step 4 - Build the route summary and waitlist sheet** - add focused
  direction, fixed timing, progress, and waitlist sections using existing
  shadcn and Lucide patterns. *Done when:* route direction, departure, arrival,
  active progress, waitlist avatars/copy, and pickup affordance match the
  approved hierarchy; the back and pickup affordances are visibly disabled or
  presentational with accessible labels; reduced motion removes progress
  animation; and no form, handler, state, link, navigation, or mutation exists.
- [x] **Step 5 - Build comment and scheduled-pickup previews** - render the two
  canonical Route Leg comments and the typed scheduled-pickup example as static
  sheet sections. *Done when:* comments show author identity and distinguish the
  driver; empty comments have clear copy; scheduled time and status come only
  from the preview model; plus and disclosure affordances use honest disabled
  semantics; long names and messages wrap safely; and no interactive behavior
  or persistent scheduled-pickup contract is introduced.
- [x] **Step 6 - Build the operating-driver card** - render the active driver's
  image or initials, full name, `Shuttle Driver` label, and a disabled phone
  affordance as the sheet footer. *Done when:* John Smith is resolved through
  the Shuttle's organization-valid `activeDriverId`; missing driver and phone
  data remain readable and noninteractive; the control cannot initiate a call;
  and the component does not infer a driver from comments or waitlist data.
- [x] **Step 7 - Prove gated, responsive fidelity** - compare the enabled route
  against `VIEW-2.png` at exact 320px mobile and 1440px desktop viewports, verify
  the disabled production path, then run final checks. *Done when:* there is no
  horizontal overflow; profile, map, route sheet, comments, scheduled pickup,
  and driver surfaces remain legible; controls expose honest disabled semantics;
  reduced-motion removes animation; the enabled route has no browser console
  errors; production-default and explicit-flag behavior are proven; screenshot
  evidence exists for both viewports; and `pnpm test`, strict TypeScript, lint,
  and `pnpm build` pass.

## Files / areas

- `app/routes/[routeLegId]/page.tsx` - server route, feature gate, known-leg
  resolution, metadata, and not-found handling.
- `lib/route-detail-preview-flag.ts` and tests - deterministic environment flag
  evaluation.
- `lib/route-detail-preview.ts` and tests - pure fixture-to-view-model adapter,
  US-unit formatting, fixed-time formatting, and fallbacks.
- `fixtures/route-detail-preview.ts` - presentation-only map and scheduled-pickup
  scenario keyed to the canonical Route Leg.
- `components/route-detail-preview/` - focused profile, map, route sheet,
  waitlist, comments, scheduled pickup, and driver components.
- `app/globals.css` - only shared tokens or reduced-motion styles required by the
  approved View 2 treatment; preserve the existing View 1 output.
- `components/ui/` - reuse existing shadcn primitives; add only a reviewed
  primitive that directly supports this design.
- `blueprint/evidence/feature-4/` - exact mobile and desktop screenshot evidence.

## Data / contracts

- No persistent domain contract changes. Existing Organization, Journey,
  RouteLeg, Location, User, Shuttle, WaitlistEntry, RouteLegComment, and
  RoutingSnapshot contracts remain authoritative.
- `RouteDetailPreviewViewModel` is presentation-only and contains stable IDs,
  rider and driver displays, route direction and status, fixed times, formatted
  ETA/distance/freshness, progress, waitlist and comment displays, map points,
  and a scheduled-pickup preview.
- `RouteDetailPreviewScenario` is a typed local visual fixture containing the
  selected Route Leg ID, normalized SVG map points, and scheduled-pickup display
  values. It is not a stored pickup or routing contract.
- Routing distances remain meters at the domain boundary and are converted to
  miles only by the presentation adapter.
- The server feature gate receives an environment-shaped input for unit tests.
  Runtime code reads `ROUTE_DETAIL_PREVIEW_ENABLED`; it does not expose the flag
  to client JavaScript.
- The route parameter is an opaque Route Leg ID. It must resolve through the
  selected Organization and Journey fixture rather than indexing an unchecked
  record directly.

## Testing

- Vitest covers flag defaults and overrides, canonical joins and ordering,
  meter-to-mile and duration formatting, comment/driver attribution, and all
  documented adapter fallbacks.
- Browser verification captures the enabled canonical route at exact 320px and
  1440px viewports, checks document width against viewport width, records console
  errors, confirms disabled controls, and emulates `prefers-reduced-motion`.
- Route checks prove the canonical ID renders while an invalid ID and the
  production-default flag path do not expose preview content.
- Final gate: `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`.

## Notes for the AI

- Read the relevant installed Next.js 16 App Router, dynamic segment, metadata,
  environment, and `notFound()` documentation before implementation.
- Keep the page a Server Component. Static preview affordances do not justify
  `'use client'`.
- Reuse the View 1 theme and components without regressing `/`; do not recreate
  or restore the deleted throwaway prototypes.
- Treat `VIEW-2.png` as the visual source, but do not copy map tiles. Build a
  small original SVG/CSS abstraction using the fixture's named endpoints and
  presentation-only normalized path.
- Do not use Google Maps, image generation, web search, external images, remote
  fonts, or network data for the map preview.
- Do not make a disabled-looking control interactive. Use native disabled
  semantics where applicable and preserve the approved appearance explicitly.
- Keep domain values metric and convert only for US-facing display text.
- Resolve the driver only through `Shuttle.activeDriverId` and enforce existing
  organization relationships in the adapter.
- Keep the preview scenario obviously noncanonical so later live-data features
  can replace it without migrating domain contracts.

## Completion evidence

- Verification: `blueprint/evidence/feature-4/verification.md`.
- Passed: `pnpm test` (37 tests), `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`.
- Manual try: `pnpm dev`, then `/routes/route-leg-sunday-outbound`.
- Production preview requires `ROUTE_DETAIL_PREVIEW_ENABLED=true`.
- No findings recorded at completion.
