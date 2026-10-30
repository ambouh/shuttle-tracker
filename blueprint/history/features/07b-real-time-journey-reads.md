# Feature: Real-time journey reads

**From build-plan:** feature 7b (Live journey data)
**Status:** Completed on 2026-10-30 on `feature/realtime-journey-reads`. All six steps approved and verified; merge pending approval.

## Goal

Subscribe View 1 to the seeded Convex journey through a safe public response.
Make live reads an explicit opt-in while the existing demo remains functional.

## Design reference

- Preserve the current View 1 layout and `blueprint/reference/VIEW-1.png`.
- Reuse the existing header, route cards, status, timing, and avatar components.
  Add compact, accessible data-state messages using existing design tokens.

## In scope

- Framework-independent public journey and person contracts, explicit backend
  projections, and validated public query arguments/results.
- Active-organization and active-journey reads with same-tenant references,
  ordered legs, current-cycle waitlists/comments, assigned driver, latest
  tracking and routing snapshots, and the stored active-leg reference.
- A scoped Convex React provider and reactive query in an opt-in live View 1.
- Loading, empty, unavailable/error, disconnected, and reconnection behavior.
- Read-only route cards with clear pickup unavailability and no demo controls.
- Backend tests, mobile/browser verification, and documented startup/config.

## Out of scope

- Guest creation, recognition credentials, contact migration, join/leave writes,
  and current-rider personalization (7c).
- Operational mutations, status/arrival processing, comment creation, or cycle
  cleanup (7d). These reads do not advance the shuttle.
- GPS ingestion, Google Maps requests, tracking freshness automation, and live
  View 2 functionality. Preserve original snapshot timestamps.
- Global modal refactoring, authentication, CI, deployment to production, merge,
  push, or destructive seed operations.

## Build loop

The user approved completion of 7a and explicitly requested implementation of
the next task after discussing 7b's subscription scope. Proceed with the first
small step, then review each implementation diff before continuing or committing.

1. Explain and build one step.
2. Show its focused diff and observable verification results.
3. Run tests with every logic change, plus the documented build gate.
4. Check off approved steps only; commit checkpoints only when requested.

## Build steps

- [x] **Step 1 - Define the public response boundary.** Add independent types
  for the journey subscription response and a person projection selecting only
  ID, first name, surname initial, and profile image. Keep private User records
  separate from the public display contract.
  *Done when:* tests prove an exact field allowlist for guests and operators,
  no phone/full surname/role/ownership/credential/metadata leakage, correct
  initials and nullable images, and unchanged source records. Existing demo
  tests and build pass. This step introduces no public endpoint or subscription.
- [x] **Step 2 - Read the scoped journey graph.** Add internal query helpers
  that resolve the active organization/journey, validate ownership and ordering,
  and read only current-cycle waitlists/comments and referenced people.
  *Done when:* tests cover ordered legs, active-leg identity, two organizations,
  old cycles, empty lists, missing/foreign relationships, nullable driver and
  tracking, and omitted routing without reading a global list of guests.
- [x] **Step 3 - Publish a validated safe query.** Project that graph into the
  response contract, register the public read-only query, and generate bindings.
  *Done when:* query tests cover ready/empty/unavailable outcomes, malformed or
  foreign selections, duplicate relationships, exact nested response fields,
  and absence of private user data. Development sync and safe CLI reads succeed.
- [x] **Step 4 - Add explicit live mode and subscription.** Resolve demo/live
  configuration at the page boundary, instantiate a scoped Convex client, and
  subscribe to the public query. Reuse View 1 presentation through an adapter
  that accepts public people without manufacturing private User objects.
  *Done when:* opt-in live mode displays stored native-ID data, loads without
  fixture imports in its data path, and exposes no local pickup or lifecycle
  handlers. Default demo behavior and backend-independent builds still work.
- [x] **Step 5 - Handle data and connection states.** Add safe loading, empty,
  error, and disconnected messages plus recovery. Preserve only previously
  received live data during a disconnect and label it as potentially outdated.
  *Done when:* browser checks show each state, recovery without reload when the
  connection returns, no fixture substitution, no raw errors/contact details,
  and no pickup forms or enabled write controls in live mode.
- [x] **Step 6 - Verify subscriptions and document the workflow.** Prove that
  two browser clients observe the same development data and react to a controlled
  benign backend update; restore the original value afterward. Run the full
  checks and recheck the demo and feature-flagged View 2.
  *Done when:* two-client updates, reconnect behavior, mobile layouts at 375px,
  data-state evidence, payload privacy, and demo isolation are recorded. No
  public test/reset mutation is introduced and no seeded activity is deleted.

## Files / areas

- `types/live-journey.ts` for public contracts, independent of Convex/React.
- `convex/publicPeople.ts`, scoped read/projection/query modules and adjacent
  tests; generated API bindings via the CLI only.
- `app/page.tsx`, a small client provider/live overview, and a demo wrapper if
  necessary to keep fixture data out of the live rendering path.
- `lib/journey-overview.ts` or a focused public presentation adapter and tests.
- Existing View 1 presentation components only where public display or explicit
  data-state handling requires it; `convex/README.md` for configuration.

## Data / contracts

### Public response (load-bearing)

- `PublicJourneyResult` is `ready` with a `snapshot`, `empty`, or `unavailable`.
  Loading and connection failures are client states, not fabricated backend data.
- Snapshot: organization display details; journey identity, ordered leg IDs and
  explicit nullable active leg; ordered route legs with status, schedule and
  current cycle; endpoint locations; referenced public people; assigned shuttle
  and nullable tracking; available routing snapshots.
- Active waitlists/comments preserve their existing application list shapes.
  Current cycle is explicit per leg. Omit historical cycles and unrelated users.
- A public person contains only `id`, `firstName`, `lastInitial`, and nullable
  `profileImageUrl`. Select fields explicitly; never spread a User document,
  blank out its phone, or cast it to a public type as a privacy boundary.
- Keep domain branded IDs independent from Convex. A projection may convert a
  validated native ID into its corresponding domain ID at the boundary. IDs are
  references, not authentication credentials.
- No phone numbers, complete surnames, user roles, user organization links,
  user timestamps, credentials, or database metadata in the person projection.
  Comments remain user-authored text; omitting private profile fields does not
  claim to scrub contact information someone types into a comment.

### Scope and read behavior

- Query inputs: organization slug and optional journey ID. Default organization
  is `union-church`, configured separately from the reference fixtures.
- Slug/ID select a public journey; they never authorize private profile access.
  Require an active organization and an active journey owned by it. Unknown,
  inactive, malformed, or foreign targets return a safe unavailable result.
- An active organization with no active journeys returns empty. With no selected
  ID, use its sole active journey; ambiguous multiple active journeys return
  unavailable rather than choosing an arbitrary one. Journey selection UI is 18.
- Use the existing indexes. Validate the stored leg ordering, active-leg
  membership, endpoint/shuttle ownership, driver role/organization, and non-guest
  person ownership. Missing required records or duplicate membership/routing
  records produce unavailable rather than a partial or cross-tenant snapshot.
- Read memberships/comments using `(routeLegId, currentCycle)`; project only
  people referenced by those lists or by the assigned shuttle's driver.
- Nullable driver/tracking/active leg and missing routing are supported, with
  explicit unavailable presentation for missing metrics. Never infer the active
  leg from array position, refresh historical timestamps, or claim GPS is live
  just because the database subscription is connected.
- Runtime return validators enforce the public shape in addition to TypeScript
  and field-selection tests. Errors and diagnostic output must not dump records.

### Frontend boundary

- Proposed opt-in: `JOURNEY_DATA_MODE=live`; unset or `demo` preserves the demo.
  Use `NEXT_PUBLIC_CONVEX_URL` for the existing public development URL. Invalid
  live configuration produces an unavailable state, never a demo fallback.
- Keep client provider/subscription code below the server page boundary. The
  mock engine and browser-local guest store belong only to demo mode in 7b.
- Live View 1 is anonymous and read-only until 7c. A local guest fixture ID must
  never become proof of live identity or insert that guest into the live payload.
- Reuse route presentation, including first-name waitlist copy. Show a concise
  read-only explanation. Keep transit pickup-closed messaging; eligible live
  routes cannot open the guest form or change local memberships.
- Distinguish connection state from shuttle tracking status. Retained live data
  during disconnection is visibly outdated. Errors use fixed user-safe copy.
- Historical seed ETA/tracking stays historical. Do not substitute current
  timestamps or imply current shuttle readings during subscription verification.

## Testing

- Existing Vitest suite: person allowlist, scoped graph reads with a second
  organization, current-cycle lists, native-ID/public mapping, query results,
  malformed/foreign/missing/duplicate references, nullable data, configuration
  resolution, and the public-data presentation adapter.
- Exact nested-field assertions ensure new private storage fields cannot leak
  through spreads. Test errors without logging raw documents or credentials.
- Browser evidence for actual subscription, loading/error/empty/disconnect,
  reconnect and two-client update; live mode has no pickup/lifecycle actions,
  while the unchanged demo still supports guest join/leave and mock arrival.
- Commands: `pnpm exec tsc --noEmit`, `pnpm convex:typecheck`, `pnpm lint`,
  `pnpm test`, `pnpm build`; sync via `pnpm convex:dev --once --tail-logs disable`
  when registered backend functions change. Do not reseed or enable the seed.

## Notes for the AI

- Branch `feature/realtime-journey-reads` starts at the completed 7a commit.
  The user requested continuing; keep `feature/convex-foundation-and-seed` and
  leave main untouched until merge approval. This is a dependent branch.
- Critique tightened the plan around accidental full-User serialization,
  current-cycle scoping, anonymous live identity, missing routing, explicit
  active-leg selection, and stale data during reconnect. Query work is split
  into graph reading and public projection to keep diffs reviewable.
- Read the installed Next.js guides before framework changes and current
  official Convex references before wiring its React client.
- Keep backend filenames camelCase, helpers small, and generated files generated.
- Guest privacy and tenancy are backend responsibilities. Hiding a field or
  filtering a foreign record in React does not satisfy either boundary.

## Implementation evidence

### Step 1 (approved)

- Completed and archived 7a in `455f4a8` (`feat: complete Convex foundation and
  seed`). Its branch is preserved. Created `feature/realtime-journey-reads` from
  that commit; main was not changed, and no merge or push was performed.
- Added `types/live-journey.ts`: public people, active-cycle route legs, complete
  subscription snapshot, and ready/empty/unavailable result contracts. Domain
  types remain independent from Convex and React.
- Added `convex/publicPeople.ts`: explicit selection of native user ID, trimmed
  first name, uppercase surname initial, and nullable profile image. No spreads
  of user records, private fields, database reads, or registered public functions.
- Added 14 tests in `convex/publicPeople.test.ts` covering all roles, exact
  serialized fields, additional credentials, nullable phone/image fields,
  whitespace and Unicode initials, and unchanged input records.
- `pnpm test convex/publicPeople.test.ts` passed all 14 tests. Full `pnpm test`
  passed 351 tests in 19 files. `pnpm exec tsc --noEmit`,
  `pnpm convex:typecheck`, `pnpm lint`, and `pnpm build` all passed.
- Manual inspection: run the focused test command above or review the exported
  types and projector. There is no new browser behavior to check in this step.
  The frontend remains the working fixture demo, and cloud data was not changed.
- The user approved Step 1 and continued to Step 2 without requesting a
  checkpoint. Public query registration and the React subscription follow in
  later steps.

### Step 2 (approved)

- Added `convex/journeyRead.ts`: active organization and journey selection,
  ordered and complete legs, explicit active-leg validation, same-organization
  endpoint/shuttle reads, and safe ready/empty/unavailable results. Malformed,
  inactive, missing, foreign, or ambiguous selections return unavailable.
- Added `convex/journeyReadActivity.ts`: indexed current-cycle memberships and
  comments, at most one routing snapshot per leg, and deduplicated point reads
  for the assigned driver and referenced members/authors. Duplicate membership,
  foreign people, dangling references, and invalid values reject the graph.
- Reused existing numeric, coordinate, timestamp, tracking, and routing
  validators. The read path does not scan the user table or repeat user reads
  when the same person is referenced multiple times. Old/future cycles are
  excluded without loading their people. Null driver/tracking/active leg and
  missing routing remain valid.
- Added 43 tests in `convex/journeyRead.test.ts`, using the actual schema and
  fixture importer in `convex-test`. Tests cover two organizations, indexed
  list ordering, current cycles, people referenced only by comments, malformed
  selections, missing/foreign/duplicate relationships, nullable data, safe
  failure results, unexpected storage errors, and absence of database writes.
- `pnpm test` passed 394 tests in 20 files. `pnpm exec tsc --noEmit`,
  `pnpm convex:typecheck`, `pnpm lint`, and `pnpm build` passed.
- Manual try path: `pnpm test convex/journeyRead.test.ts`. No UI, schema,
  registered function, generated binding, or cloud data changed. The raw graph
  is backend-only; Step 3 must project it through the public response contract
  before registering the client-facing query. No new backend sync was needed.
- The user approved Step 2, reviewed the Step 3 briefing, and resumed
  implementation. Steps 1 and 2 remain uncommitted; no checkpoint was requested.

### Step 3 (approved)

- Added `convex/publicJourney.ts`: explicit projection of every public field,
  including nested organization details, tracking coordinates, route activity,
  and routing data. Native IDs retain their string values under domain brands;
  nullable fields, list order, statuses, and historical timestamps are preserved.
- Added `convex/publicJourneyValidators.ts`: strict runtime shapes for all three
  result variants and nested records. Extra fields are rejected. Added
  `convex/journeys.ts` with the public read-only `getOverview` query, validated
  arguments, and a fixed `JOURNEY_READ_FAILED` error for unexpected failures.
- Added 33 tests in `convex/journeys.test.ts`, exercising the registered query
  with the actual schema/importer. Coverage includes exact public fields, native
  references, two tenants, current cycles, nullable data, malformed arguments,
  invalid/foreign selections, missing/duplicate relationships, sanitized failures,
  detached projections, and rejection of extra fields at every nested level.
- Regenerated `convex/_generated/api.d.ts` through `pnpm convex:codegen` after
  retrying outside the sandbox for network access. The typed client reference
  is `api.journeys.getOverview`; generated files were not edited manually.
- `pnpm exec tsc --noEmit`, `pnpm convex:typecheck`, `pnpm lint`, `pnpm test`
  (427 tests in 21 files), and `pnpm build` passed. The focused query suite also
  passed all 33 tests. `pnpm convex:dev --once --tail-logs disable` synced to
  the confirmed Development deployment `formal-giraffe-877` successfully.
- Real CLI reads returned ready data with 2 legs, 2 locations, 8 referenced
  people, 6 memberships, 2 comments, and 2 routing snapshots. Explicit journey
  selection matched the default result; malformed journey and unknown
  organization selections returned unavailable without a partial payload.
- An unauthenticated HTTP query returned the same snapshot. Recursive checks
  found no private profile fields or database metadata, and person keys matched
  the four-field allowlist. Function metadata confirmed a single public Query,
  `journeys.js:getOverview`, while `seed.js:run` remains internal.
- Safe evidence: `/private/tmp/shuttle-public-journey-check.json`; verification
  script: `/private/tmp/shuttle-public-journey-check.cjs`. Only summary counts,
  statuses, and validation results were printed. No cloud records were written,
  no seed was invoked, and no production deployment, commit, merge, or push occurred.
- Updated `convex/README.md` with the public query contract and actual CLI try
  command. The user reviewed the projector and requested a checkpoint commit
  before continuing to Step 4 with the native Convex React provider and hooks.

### Step 4 (approved)

- Committed approved Steps 1 through 3 in `59717d9` (`feat: add validated public
  journey query`) at the user's request. Step 4 remains uncommitted on
  `feature/realtime-journey-reads`; no merge or push occurred.
- `app/page.tsx` selects the mode at the server boundary. Added
  `lib/journey-data-mode.ts` with an explicit live opt-in, independent organization
  slug, URL validation, and unavailable handling for bad configuration. The
  default/demo branch dynamically loads `DemoJourneyOverview.tsx`, which holds
  the original fixture input and route presets. Production mode is selected at
  build time because the homepage is prerendered.
- Added `LiveJourneyProvider.tsx` for the native Convex React client and
  `LiveJourneyOverview.tsx` for the reactive public query. `JourneyReadMessage.tsx`
  provides initial loading, empty, and unavailable messages. Query errors and
  disconnection/recovery behavior remain Step 5.
- Narrowed the shared renderer's inputs in `lib/journey-overview.ts` to display
  fields, retaining the demo's full-domain input wrapper for its mock engine.
  Added `lib/live-journey-overview.ts` to adapt public people without fabricating
  private User records, preserve ordered native IDs, honor the stored active-leg
  reference, and label stored estimates/location timestamps as recorded data.
- The live component reuses `JourneyHeader` and `RouteCard`; it mounts no guest
  store, pickup form, join/leave handler, or mock lifecycle controls. Pickup
  remains unavailable, with transit `Pickup closed` wording preserved.
- Added 26 tests across `journey-data-mode.test.ts` and
  `live-journey-overview.test.ts`, covering explicit mode selection, malformed
  config, public names/IDs, ordering, null active leg, missing data, Unicode
  initials, immutable input, and historical timestamps. The existing demo
  adapter tests also passed.
- `pnpm test` passed 453 tests in 23 files; `pnpm lint`,
  `pnpm exec tsc --noEmit`, and `pnpm convex:typecheck` passed. The default
  Turbopack build encountered a local worker-port `Operation not permitted`
  error, including an escalated retry. The supported fallback
  `JOURNEY_DATA_MODE=live pnpm build --webpack` passed production compilation,
  TypeScript, prerendering, and build traces without querying the backend.
  The package build script was not changed.
- Used the check skill for real Chrome checks at 375px on 2026-10-17. A live
  production server on port 3001 received the real Convex WebSocket snapshot,
  rendered its native journey ID, and matched the anonymous public HTTP result.
  A saved browser guest was never read or rendered; no mutations, pickup forms,
  demo controls, private profile fields, console errors, failed requests, or
  horizontal overflow were observed. Recorded estimates and location time were
  visible. Only public journey reads were performed against development.
- The default demo on port 3000 passed pickup, phone formatting, leave/rejoin,
  arrival, and guest restoration after reload. It opened no Convex connection.
  Both screenshots were inspected. Evidence:
  `/private/tmp/shuttle-step4-live.json`, `/private/tmp/shuttle-step4-demo.json`,
  matching PNG files, and `/private/tmp/shuttle-live-step4-check.cjs`.
- Updated `convex/README.md` with mode switching, build-time configuration,
  architecture, current read-only behavior, verification, and remaining steps.
  Try live mode with `JOURNEY_DATA_MODE=live pnpm dev`; default `pnpm dev` keeps
  the demo. No `.env.local` edits, backend sync, reseed, database writes, dependency
  changes, or global modal refactoring were needed for this step.
- The user approved Step 4, requested a checkpoint commit, and authorized Step 5.

### Step 5 (approved)

- Committed approved Step 4 as `65ae01a` (`feat: add opt-in live journey
  subscription`). Step 5 remains uncommitted on `feature/realtime-journey-reads`.
- Added `lib/journey-read-state.ts` to separate browser/backend connection
  health from the route/tracking state and map public query results to safe
  loading, ready, empty, unavailable, error, and disconnected display states.
  Error messages, attached data, and stacks are not forwarded. A disconnected
  ready result retains only that public snapshot; all other disconnected results
  have no journey to show. No persistent cache or fixture fallback was added.
- Added `useJourneyConnection.ts`, a React external-store subscription to
  Convex connection changes and browser online/offline events. The server
  snapshot stays connecting without creating a backend socket at build time.
  An online browser with a lost/failed backend connection is still disconnected.
- Added `useLiveJourney.ts`, using Convex's stable `useQueries` hook for reactive
  results and non-throwing query errors. It uses the generated query return type.
  Retry unsubscribes before resubscribing, and automatic connection recovery
  remains owned by the native Convex client.
- Updated `LiveJourneyOverview.tsx` with fixed safe error/retry messages and a
  prominent outdated-data notice above retained cards. `JourneyReadMessage.tsx`
  supports accessible status/alert roles and an optional retry button.
  `LiveJourneyProvider.tsx` disables raw browser client logging; server diagnostic
  behavior is unchanged. Live cards still have no pickup forms or write handlers.
- Added 18 tests in `journey-read-state.test.ts`: initial connect, failed
  attempts, socket loss while online, offline-browser precedence, recovery,
  retained public data, no fabricated cards, sanitized errors, removal of old
  data for later empty/unavailable results, and unchanged tracking timestamps.
- `pnpm test` passed 471 tests in 24 files. `pnpm lint`,
  `pnpm exec tsc --noEmit`, and `pnpm convex:typecheck` passed. Fixed an initial
  TypeScript inference issue for the temporarily empty query map. The final
  `JOURNEY_DATA_MODE=live pnpm build --webpack` passed compilation, typechecking,
  prerendering, and build traces. Used the already-verified Webpack fallback for
  this environment; Step 4 records the default Turbopack worker-port limitation.
- Used the check skill and inspected Chrome screenshots at 375px. Browser-only
  query-response interception exercised loading, empty, unavailable, and failure
  states; query failures deliberately contained fake private strings, which
  appeared in neither DOM nor console. Retry restored data without a reload.
  Real browser offline/online changes demonstrated retained cards with an
  outdated warning, offline-before-first-result with no cards, and automatic
  recovery in both cases without reloading. No fixture substitution, mutations,
  pickup forms, unexpected browser errors, failed requests, or overflow occurred.
- Evidence: `/private/tmp/shuttle-step5-states.json`, screenshots named
  `/private/tmp/shuttle-step5-{loading,empty,unavailable,error,disconnected,recovered,offline-first}.png`,
  and temporary scripts `/private/tmp/shuttle-step5-check.cjs` and
  `/private/tmp/shuttle-step5-socket.js`. These checks added no product test flags,
  registered endpoints, backend changes, seed calls, or cloud writes.
- Updated `convex/README.md` with connection/retry behavior, verification method,
  and manual offline/online instructions. No new dependencies. The findings
  ledger remains empty. Step 6 will verify real updates across two clients,
  including the three route statuses discussed with the user.
- The user requested a full check, then resumed implementation. The check
  reconfirmed all Step 5 browser states, privacy, recovery, demo behavior, and
  View 2 visibility. Continued to Step 6 without a checkpoint commit.

### Step 6 (approved)

- Resolved the repeated Turbopack build failure by moving only the existing
  `.next/cache/turbopack` build cache to
  `/private/tmp/shuttle-turbopack-cache-before-recheck-20261017`. The old cache
  remains available; the running development cache was untouched. A fresh
  `JOURNEY_DATA_MODE=live pnpm build` succeeded, followed by successful
  `pnpm build` and live-mode builds using the regenerated cache. No application,
  package, dependency, or Next.js configuration change was required. Earlier
  restricted runs failed to bind a worker port; preserving the old cache kept
  that failure reproducible even on retries outside the sandbox.
- Used two independent Chrome pages at 375px against the Turbopack production
  build and the existing `formal-giraffe-877` development deployment. An
  administrative WebSocket client temporarily patched only the active route
  leg's `status` through `NOT_STARTED`, `DEPARTING`, and `IN_TRANSIT`, using
  Convex's existing dashboard operation. Its ordinary CLI function endpoint
  did not expose that system operation. Existing login credentials stayed in
  memory and were never printed, persisted, or supplied to browser pages.
- Both real subscriptions and rendered cards received every status without
  page reloads. Waiting/picked-up copy and pickup-closed messaging followed the
  status, while the cards remained read-only. No app test flags, registered
  mutations, backend function changes, or development sync were needed.
- Disconnected the second client while the route was departing, then changed
  the backend to in transit. The first client updated; the disconnected client
  retained departing with the outdated notice. Reconnection brought it to the
  newer in-transit snapshot without reloading.
- Restored the original status and asserted that the entire public snapshot
  matched its original value exactly. Memberships, comments, people, cycle
  values, routing, and historical tracking timestamps were unchanged. No seed
  invocation, activity deletion, or frontend mutation occurred.
- Evidence: `/private/tmp/shuttle-step6-subscription.json`, status screenshots
  `/private/tmp/shuttle-step6-{not_started,departing,in_transit}-client{1,2}.png`,
  and `/private/tmp/shuttle-step6-offline-during-update.png`. The temporary
  verification script is `/private/tmp/shuttle-step6-subscription-check.cjs`;
  the original status is recorded in `/private/tmp/shuttle-step6-restore.json`.
- The full check also proved default-demo guest join/leave, formatted phone
  input, restored identity, mock arrival, no demo Convex subscription, and View 2
  enabled in development but hidden in production. No 375px overflow or
  unexpected browser errors occurred. Recorded evidence is in
  `/private/tmp/shuttle-step4-demo.json`, `/private/tmp/shuttle-feature7b-check.json`,
  and `/private/tmp/shuttle-check-view2.png`.
- Updated `convex/README.md` with final verification, cache recovery, and a
  repeatable two-client manual check. The user approved completion by invoking
  the complete skill after reviewing the verification results.
  No commit, merge, push, new dependency, or production deployment occurred.
- Final gates passed: `pnpm test` (471 tests in 24 files), `pnpm lint`,
  `pnpm exec tsc --noEmit`, `pnpm convex:typecheck`, `git diff --check`,
  `pnpm build`, and `JOURNEY_DATA_MODE=live pnpm build`. Repeated the Step 5
  browser states against the Turbopack build successfully, including retry,
  offline-before-data, retained data, and reconnect, with no unexpected console
  errors or failed requests. The findings ledger is empty.

## Completion record

- Completed Feature 7b on 2026-10-30. Marked all six build steps and build-plan
  item 7b complete. Parent item 7 remains open for 7c and 7d.
- Fresh final checks passed: `pnpm build` with Turbopack, including the Next.js
  TypeScript check; `pnpm test` with 471 tests in 24 files; `pnpm lint`;
  `pnpm convex:typecheck`; and `git diff --check`.
- Behavioral proof is the previously observed live subscription, privacy,
  data-state, two-client update, reconnect, demo, and mobile checks recorded
  above. Those temporary `/private/tmp` reports and screenshots have since been
  cleared; these recorded outcomes and the manual check instructions in
  `convex/README.md` remain the durable record. Completion did not repeat the
  temporary backend edits or change cloud data.
- No findings are recorded in the ledger. No workflow adapters or prototypes
  changed in this feature.
- Merge remains pending. This branch includes the completed 7a foundation,
  which is also not yet on main. Preserve both feature branches; land 7a and
  7b separately if the user approves that merge sequence. No push is authorized
  by this completion request.
- Manual try: run `JOURNEY_DATA_MODE=live pnpm dev` and open
  `http://localhost:3000` for the read-only subscription. Run `pnpm dev` without
  that mode for the interactive demo. See `convex/README.md` for recovery and
  two-client checks, or use `/try latest`.
