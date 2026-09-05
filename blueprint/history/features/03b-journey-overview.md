# Feature: Journey overview

**From build-plan:** feature 3b
**Status:** complete

## Goal

Replace the starter screen with the approved mobile-first Sunday Service
journey overview at `/`. Render the Union organization identity and both route
cards from the tenant-aware typed fixtures so riders can immediately understand
direction, driver, status, timing, progress, waitlist, and pickup availability.

This feature presents one deterministic snapshot. It establishes the same
presentation boundary that later mock events and Convex subscriptions can feed,
but it does not simulate transitions or mutate waitlists yet.

## Design reference

- `prototypes/theme.css` - source of truth for colors, typography, spacing,
  radii, shadows, control sizes, and the active-state treatment.
- `prototypes/view-1.html` - source of truth for View 1 structure and content
  hierarchy.
- `blueprint/reference/VIEW-1.png` - supplied visual reference behind the
  prototype.

## In scope

- The journey overview at the root route, replacing the generated Next.js page.
- Porting View 1 tokens from `prototypes/theme.css` into Tailwind v4 CSS theme
  variables and global base styles.
- A centered responsive application canvas that is mobile-first and remains
  usable on desktop.
- A top bar with the Organization avatar and separate `Shuttle Tracker` label.
- Organization logo rendering when `logoUrl` exists, with the fixture's `U`
  fallback initials when it does not.
- The welcome panel, current rider fixture, `Your Journey` heading, and a
  single-option Sunday Service selector.
- The welcome-panel avatar represents the current User, supports a nullable
  profile image, and falls back to name initials (`JW` for Josh Williams).
- A pure typed presentation adapter that resolves the Organization, Journey,
  Locations, Shuttle, active Driver, Users, Route Legs, and Routing Snapshots
  into stable card-ready data.
- Two reusable route cards in Journey order, including route direction, driver,
  status pill, departure and arrival times, timing message, progress treatment,
  and waitlist preview.
- Status-aware copy for the canonical snapshot: outbound `IN_TRANSIT` riders
  are described as picked up; return `NOT_STARTED` riders are waiting.
- A pickup affordance only for eligible `NOT_STARTED` or `DEPARTING` legs. It is
  visibly nonfunctional and accessible in this feature because Feature 5 owns
  guest identity and waitlist mutation.
- A subtle green pulse on the active trip's progress marker or line that
  respects reduced-motion preferences.
- Safe presentation fallbacks for a missing active driver, missing routing
  snapshot, or empty waitlist, even though the canonical fixture is complete.
- Page metadata appropriate to Shuttle Tracker.
- `lucide-react` icons for route direction, Journey selection, progress, and
  pickup affordances where an icon communicates the action more clearly than a
  text glyph.
- Selective shadcn/ui primitives: `Card` for general surface structure,
  `Badge` for route status, `Button` for the pickup affordance, and `Progress`
  for trip completion. Their checked-in source is customized to the approved
  visual tokens.
- Explicit scheduled departure and arrival timestamps on Route Legs so the
  approved `09:00`, `09:45`, `10:15`, and `11:00` labels come from typed data
  rather than component constants.

## Out of scope

- Guest registration, local identity persistence, or using form input instead
  of the representative Josh fixture (Feature 5).
- Joining or leaving a waitlist, button state changes, optimistic updates, or
  backend mutations (Features 5 and 7).
- Interactive status simulation, timers that count down, arrival handling, or
  mock event playback (Feature 6).
- Convex data, loading subscriptions, server mutations, or tenant authorization
  enforcement (Feature 7).
- Route-card navigation or a functional detail view (Feature 15).
- View 2, maps, comments, notifications, PWA installation, or live provider
  data.
- Multiple Journey selection (Feature 18). The selector shows only Sunday
  Service and does not imply that switching is implemented.
- Organization-managed theme colors or typography. Only identity content is
  tenant-aware; the approved visual theme remains application-owned.
- New dependencies other than `lucide-react` and those required by the selected
  shadcn/ui primitives, component-test libraries, or browser automation setup.
- A shadcn/ui `Select` for the single static Journey choice. The native select
  remains the smaller accessible option until multiple Journey selection is
  functional.

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

- [x] **Step 1 - Port the approved visual foundation** - move the reusable View
  1 tokens from `prototypes/theme.css` into `app/globals.css` using Tailwind v4
  CSS-first conventions, initialize shadcn/ui for the existing Next.js app with
  Lucide as its icon library, add only `Card`, `Badge`, and `Button`, set the
  dark page base and responsive canvas rules, use the approved sans-serif
  treatment through `next/font`, and update root metadata. *Done when:* `/` has
  the approved dark canvas, typography, color, spacing, radius, shadow,
  control, and reduced-motion foundations without copying View 2-only
  selectors; shadcn configuration preserves the prototype tokens instead of
  replacing the visual system; only the selected primitives and their required
  dependencies are added; the starter Geist/Next metadata is removed; global
  styles do not hard-code tenant identity; and the existing app still builds.
- [x] **Step 2 - Add the route schedule contract** - add required
  `scheduledDepartureAt` and `scheduledArrivalAt` timestamps to `RouteLeg`, add
  the four approved Sunday Service schedule timestamps to the deterministic
  reference fixture, migrate every canonical and derived route-leg fixture,
  and retain Journey order and all existing relationships. *Done when:* each
  route leg owns a typed schedule with arrival after departure; the canonical
  fixture formats to `09:00`, `09:45`, `10:15`, and `11:00` in
  `America/New_York`; operational and arrival scenarios still satisfy the
  contract through their canonical spreads; existing fixture behavior remains
  unchanged; and focused Vitest coverage, strict TypeScript, and lint pass.
- [x] **Step 3 - Create the fixture presentation adapter** - add a server-safe,
  pure adapter that resolves the canonical tenant-aware fixtures into one
  `JourneyOverviewViewModel`, including ordered route cards, resolved location
  and driver names, formatted fixed times, status labels, timing messages,
  progress ratios, waitlist initials/count copy, pickup eligibility, and safe
  fallback copy. *Done when:* UI components do not manually join IDs or format
  domain values; the canonical model produces the outbound `IN_TRANSIT` and
  return `NOT_STARTED` cards in Journey order; missing driver/routing and empty
  waitlist inputs yield explicit safe output; no current-time, browser, React,
  Next.js, mutation, or Convex dependency enters the adapter; and focused
  Vitest coverage proves the canonical and fallback cases.
- [x] **Step 4 - Build the organization and journey header** - replace the
  starter page with a semantic overview shell and focused components for the
  top brand, organization avatar, shadcn-based welcome Card, and Journey
  heading/native selector, all fed by the presentation model. *Done when:*
  the top-bar Organization avatar displays its image with alt text when supplied
  and otherwise uses its configured `U` fallback; the welcome panel displays
  the current rider image or `JW` fallback; `Shuttle Tracker` remains a separate
  label; the page says `Welcome, Josh` and asks where the rider is going; Sunday
  Service appears as the sole selector option; controls have accessible names;
  and mobile and desktop screenshots match the prototype's hierarchy and
  spacing.
- [x] **Step 5 - Build the reusable route cards** - render both ordered legs
  with one `RouteCard` component built on the shadcn Card primitive and small
  focused child components for driver, timing/progress, waitlist preview,
  shadcn Badge status, shadcn Progress completion, and shadcn Button pickup
  affordance. *Done when:*
  the outbound card shows Union Church to Guilford Elementary, John as Driver,
  `In transit`, active timing/progress, and three picked-up riders; the return
  card shows the reciprocal route, `Not started`, a gray Bus progress marker,
  three waiting riders, and a nonfunctional pickup affordance; no pickup
  affordance appears in transit;
  empty/fallback presentation values remain readable; and the card structure
  does not depend on exactly two route legs.
- [x] **Step 6 - Prove responsive fidelity and finish** - compare `/` against
  the View 1 prototype at a narrow mobile viewport and a desktop viewport,
  refine only fidelity, accessibility, overflow, and motion issues, then run
  final verification. *Done when:* the page has no horizontal overflow; route
  text, timing columns, avatar stacks, and controls remain legible at 320px and
  at desktop width; the active green progress treatment pulses subtly but is
  static under `prefers-reduced-motion`; there are no browser console errors;
  the nonfunctional pickup control cannot submit or mutate anything; `pnpm
  test`, strict TypeScript, lint, and the production build pass; and screenshot
  evidence exists for both viewport classes.

## Files / areas

- `app/globals.css` - Tailwind v4 theme tokens, global base, responsive canvas,
  and reduced-motion animation treatment.
- `app/layout.tsx` - approved font wiring and Shuttle Tracker metadata.
- `components.json`, `components/ui/`, and `lib/utils.ts` - selective shadcn/ui
  configuration, checked-in primitives, and class merging helper.
- `package.json` and `pnpm-lock.yaml` - Lucide and selected shadcn/ui primitive
  dependencies.
- `app/page.tsx` - server-rendered root Journey Overview composition.
- `components/journey-overview/` - focused OrganizationAvatar, header, Journey
  selector, RouteCard, status, timing/progress, waitlist, and pickup display
  components.
- `lib/journey-overview.ts` - pure fixture-to-presentation adapter and formatting
  helpers.
- `lib/journey-overview.test.ts` - focused adapter and fallback unit tests.
- `types/domain/journey.ts` - required scheduled departure and arrival
  timestamps on Route Legs.
- `types/domain/user.ts` and user fixtures - nullable `profileImageUrl` for the
  current-rider avatar.
- `fixtures/reference-time.ts`, `fixtures/sunday-service.ts`, and affected
  fixture tests - deterministic Sunday Service schedule values.
- `fixtures/` and `types/domain/` - consumed through public barrels; change only
  if implementation exposes a reviewed incompatibility with the approved
  contracts.
- `prototypes/theme.css` and `prototypes/view-1.html` - read-only design sources
  during implementation, then discarded by `/complete` after the design is
  ported.

## Data / contracts

- `JourneyOverviewViewModel` contains organization identity, current rider
  first/display names, initials, nullable profile image URL, selected Journey
  ID/name, and an ordered array of route-card models.
- Organization identity contains `displayName`, `logoUrl`, `logoAltText`, and
  `fallbackInitials`. The logo data comes from `Organization.details`.
- Each route-card model contains stable Route Leg ID, route label, resolved
  driver display, status label/tone, departure and arrival display times,
  timing message, normalized progress percent, waitlist preview entries and
  copy, and pickup eligibility.
- The presentation adapter receives explicit fixture inputs, including routing
  snapshots. It does not import the current clock or own mutable application
  state.
- `RouteLeg.scheduledDepartureAt` and `RouteLeg.scheduledArrivalAt` are required
  `Timestamp` values. They represent the published schedule, separately from a
  routing snapshot's changing `estimatedArrivalAt`.
- Display times use the fixed Route Leg schedule and the project timezone
  (`America/New_York`) so server and client output cannot disagree by host
  timezone. Timezone-aware formatting remains pure and deterministic.
- Timing messages use `RoutingSnapshot.estimatedDurationSeconds`: `15 mins
  remaining` for `IN_TRANSIT` and `Starting in 20 mins` for `NOT_STARTED` in the
  canonical fixture. This feature does not run a countdown clock.
- Progress is clamped to 0 through 100 for display. Missing routing data produces
  an unavailable timing message and zero visual progress instead of throwing.
- A missing active driver produces `Driver unavailable`; an empty waitlist
  produces status-aware zero-person copy and no avatars.
- Pickup eligibility is presentation-only: true for `NOT_STARTED` and
  `DEPARTING`, false for `IN_TRANSIT`. Backend enforcement remains required in
  later features.
- This view model is the load-bearing UI boundary for Feature 6 mock snapshots
  and Feature 7 live snapshots. Those features may replace its input source,
  but should not force route-card components to understand persistence or event
  payloads.

## Testing

- `pnpm test` covers the pure presentation adapter: fixture relationship
  resolution, Journey ordering, deterministic time/status formatting, progress
  clamping, pickup eligibility, picked-up versus waiting copy, missing driver,
  missing routing snapshot, and empty waitlist.
- The existing fixture suite also proves schedule ordering, exact deterministic
  Sunday Service display times, and preservation across operational scenarios.
- `pnpm exec tsc --noEmit` proves strict component props and presentation
  contracts.
- `pnpm lint` checks the changed application and component files.
- `pnpm build` is the production gate. If Turbopack encounters only the known
  sandbox port restriction, record that exact failure and run `pnpm exec next
  build --webpack` as a diagnostic without changing the documented command.
- `/check` must run the app at `/`, capture narrow-mobile and desktop
  screenshots, compare them to `prototypes/view-1.html` and
  `blueprint/reference/VIEW-1.png`, confirm no horizontal overflow, verify the
  reduced-motion state, and inspect browser console output.
- UI components are verified through the rendered route and screenshots, not
  brittle component unit tests. No Playwright dependency is added implicitly.

## Notes for the AI

- Before writing Next.js code, read the relevant App Router, Server and Client
  Components, CSS, font, image, and metadata guides under
  `node_modules/next/dist/docs/` as required by `AGENTS.md`.
- Keep `app/page.tsx` and display components as Server Components. Do not add
  `"use client"` merely for the disabled pickup affordance, selector, or CSS
  animation.
- Consume fixtures and domain types through their public barrels. Do not clone
  tenant or Journey data inside components.
- Keep raw meters and Unix timestamps in domain data. Convert them only at the
  presentation boundary; do not change stored units for UI copy.
- Use semantic headings, articles, lists, buttons, labels, and accessible image
  alternatives. Do not rely on color alone to communicate status.
- Import named Lucide React icons directly so unused icons remain tree-shakable.
  Decorative icons use `aria-hidden="true"`; interactive controls keep explicit
  accessible names rather than relying on the SVG alone.
- Treat shadcn/ui as owned source code, not a separate visual system. Customize
  its Card, Badge, Button, and Progress primitives with the approved project
  tokens and compose them into product-specific components.
- Do not add shadcn/ui primitives speculatively. In particular, keep the static
  Journey selector native and keep organization, driver, and waitlist avatar
  rendering in focused project components.
- Use `next/image` only for a real organization logo URL. The fallback initial
  must not reserve a broken image or emit an empty image alternative.
- Use CSS classes and Tailwind utilities, not inline styles. When progress needs
  a data-dependent width, expose a small finite presentation variant or a CSS
  custom-property class strategy that complies with the no-inline-style rule.
- Keep motion decorative and restrained. Apply the opacity pulse directly to
  the active shadcn Progress indicator, and keep its circular Lucide Bus marker
  vertically centered while its inner circle scales subtly from 98% to 102%.
  Disable both animations for reduced motion.
- Use Lucide icons instead of Unicode arrow, chevron, play, or plus glyphs. Keep
  text labels for route direction and status so icons never carry essential
  meaning alone.
- The pickup affordance must be visibly present where eligible but inert. Use a
  Lucide `Plus` inside a non-submitting button with an accessible explanation;
  do not add local state that pretends the request succeeded.
- Do not implement route-card navigation. Use an `article`, not a misleading
  link, until Feature 15 owns navigation.
- Preserve the canonical fixture statuses, relationships, and organization
  ownership established by Features 2 and 3a.
- If fixture fields are insufficient for approved visible copy, stop and bring
  the exact contract gap back for review instead of adding ad hoc component
  constants.
- Do not edit View 2 prototype styles or build View 2 in this feature.
