# Feature: Convex foundation and seed

**From build-plan:** feature 7a (Live journey data)
**Status:** complete; approved and archived, pending merge

## Goal

Establish validated, tenant-aware Convex storage for the existing Sunday Service
domain and a repeatable development seed. This gives Features 7b through 7d a
consistent backend without changing the current working demo.

## In scope

- Convex dependency, development configuration, generated bindings, and pnpm
  commands documented alongside the existing Next.js commands.
- Nine domain tables: organizations, users, locations, shuttles, journeys,
  routeLegs, waitlistEntries, routeLegComments, and routingSnapshots.
- Native document references, runtime shape validators, bounded numeric values,
  tenant relationship validation, and indexes for the planned scoped reads.
- Separate waitlist/comment documents associated with a route-leg cycle;
  preserve the framework-independent application-facing domain contracts.
- A small seed completion table and an internal development-only seed that
  imports existing fixtures atomically and does nothing after successful setup.
- Focused backend logic tests using the existing Vitest runner, plus verification
  against the selected Convex Cloud development backend.

## Out of scope

- React providers, subscriptions, public queries, loading/error UI, and live
  rider projections (7b). No fixture fallback for failed live reads.
- Real guest creation, local identity migration, credentials, private contact
  access, pickup mutations, and concurrent membership enforcement (7c).
- Live operational actions, arrival processing, comment APIs, cycle advancement,
  and archive-versus-delete policy (7d).
- Tracking ingestion/history/provider settings (8), AirTag (9), Google Maps (10),
  and automatic geofence lifecycle (11). Store current snapshots only here.
- Global modal ownership refactor, View 2 functionality, account authentication,
  notification delivery, retention cleanup, CI, and production deployment.
- Destructive seed reset or automatic repair of existing database contents.

## Build loop

Build one step at a time, with the existing app working after each step.

1. Explain the next step before code and implement only that step.
2. Show the focused diff, explain it, and demonstrate its done-when criteria.
3. Run the configured checks and include tests with every logic-bearing step.
4. Wait for review before proceeding. Checkpoint commits are optional and require
   approval; `/complete` handles the feature commit, archive, and merge.

## Build steps

- [x] **Step 1 - Connect Convex Cloud development.** Add Convex with pnpm,
  verify access to the supplied development deployment, configure generated
  bindings, and document separate backend sync and Next.js startup commands.
  Keep backend local state, environment values, and credentials out of git.
  Add `convex-test` as a test
  helper for the existing Vitest runner when needed by the next step.
  *Done when:* cloud development sync succeeds, generated types compile, the
  existing app builds without requiring a backend connection or public URL, and the
  reviewed diff contains no credentials or database files.
- [x] **Step 2 - Define organizations, people, places, and shuttles.** Add strict
  table validators and indexes for organization lookup/ownership. Match the
  existing nullable User fields and role rules; validate tracking snapshots and
  same-organization driver assignment with small reusable helpers.
  *Done when:* schema sync succeeds, valid fixture-derived records pass, and
  focused tests reject malformed values, guest/member organization mismatches,
  missing references, and a foreign or non-driver shuttle assignment.
- [x] **Step 3 - Define journey and active-cycle storage.** Add journeys, ordered
  legs, waitlist entries, comments, and latest routing snapshots. Define native
  references, the cycle number, current-leg/shuttle association, and the indexes
  below. Add semantic checks for ordering, ownership, and operational references.
  *Done when:* schema sync succeeds and tests cover a valid two-leg graph plus
  duplicate or foreign legs, missing/foreign endpoints, out-of-range progress,
  invalid cycles, and mismatched routing shuttle/leg ownership. The existing
  framework-independent domain fixtures still compile unchanged.
- [x] **Step 4 - Map and validate the reference seed dataset.** Build a typed
  seed input from `UNION_ORGANIZATION`, `SUNDAY_SERVICE_FIXTURE`, and
  `ROUTING_SNAPSHOTS`. Validate the full graph before writing, extract embedded
  waitlists/comments, and use stable fixture IDs as lookup keys for insertion.
  *Done when:* tests prove complete relationships, expected counts, original
  ordering/timestamps, and no mutation of fixtures; malformed graphs, duplicate
  membership, missing authors, and cross-tenant references are rejected.
- [x] **Step 5 - Import once, preserve activity on reruns.** Add a validated
  internal seed mutation with a default-off backend guard. In one transaction,
  create native-ID mappings, insert the graph, finish cyclic references, and
  record successful completion. A completed seed is a no-op; a nonempty database
  without its completion marker is a conflict and remains untouched.
  *Done when:* tests verify first run, repeated run, preserved native IDs,
  preserved edited status and removed waitlist/comments, concurrent invocation
  behavior, disabled seeding, and all-or-nothing rollback on failure. Results and
  logs contain only a status/seed key/counts, never guest contact data.
- [x] **Step 6 - Verify the real development workflow.** Run the seed on the
  selected empty cloud development backend twice, inspect relationships and
  unchanged IDs/counts, and verify persistence after restarting local tools.
  Document how to sync, seed, and inspect that backend, including expected
  conflict/no-op results. Record final checks
  and smoke-test the existing demo.
  *Done when:* actual CLI/backend evidence agrees with the tests, the seed has no
  public client entry point, the default demo still supports guest pickup and
  mock arrival, and typecheck, lint, tests, and build pass.

## Files / areas

- `package.json`, `pnpm-lock.yaml`, `.gitignore`, and Convex-generated project
  configuration; adjust TypeScript/test configuration only as required.
- `convex/schema.ts`, small backend validation/seed modules, adjacent tests, and
  generated `convex/_generated/` bindings. Do not edit generated files manually.
- Existing `types/domain/` and `fixtures/` are the source contracts and seed data,
  not new sources to duplicate or rewrite.
- `AGENTS.md` Commands and a concise development guide for actual verified
  startup, code generation, and seed commands.
- `app/`, UI components, and device-local guest storage should not need edits.

## Data / contracts

### Identity and storage boundary (load-bearing)

- Convex `_id` values and table-specific ID validators identify stored documents
  and relationships. Fixture IDs are development import keys, never fabricated
  Convex IDs or authorization credentials.
- Preserve explicit domain `createdAt`/`updatedAt` fields where present;
  `_creationTime` is database insertion metadata, not the fixture event time.
- Keep application `EntityId` brands independent of Convex. Feature 7b owns the
  document-to-public-response projection; do not cast raw documents to `User`
  or return full user records to clients to avoid writing a projection.
- Stable fixture IDs map to newly allocated native IDs within the seed
  transaction. Successful reruns leave those documents and references untouched.

### Stored records and indexes (load-bearing)

Fields below inherit the exact shape/nullability from current `types/domain/`
except for the explicitly listed persistence additions. Names are implementation
guidance; equivalent index names are acceptable.

| Table | Stored data and relationships | Required lookup indexes |
| --- | --- | --- |
| `organizations` | Organization fields excluding domain `id`; embedded details | `slug` |
| `users` | Organization reference or null, first/last name, nullable `phoneNumber` and `profileImageUrl`, role, timestamps | `organizationId` |
| `locations` | Organization reference, name, address, latitude/longitude | `organizationId` |
| `shuttles` | Organization reference, nullable driver reference, name, provider, nullable latest tracking snapshot, timestamps | `organizationId` |
| `journeys` | Journey fields with ordered native leg references; add `shuttleId` and nullable `activeRouteLegId` | `organizationId, active` |
| `routeLegs` | Journey reference, sequence, name, endpoint references, scheduled times, status, geofence radii, timestamps; add `currentCycle` | `journeyId, sequence` |
| `waitlistEntries` | Leg reference, user reference, `cycle`, requested timestamp | `routeLegId, cycle, requestedAt`; `routeLegId, cycle, userId` |
| `routeLegComments` | Leg reference, author reference, `cycle`, message, created timestamp | `routeLegId, cycle, createdAt` |
| `routingSnapshots` | Existing RoutingSnapshot fields with native leg/shuttle references; one latest snapshot per leg | `routeLegId` |
| `seedRuns` | `key: string`, `completedAt: number` | `key` |

- RouteLeg documents do not embed `waitlist` or `comments`. Queries in 7b will
  reconstruct active lists using entries whose cycle equals `currentCycle`.
- `currentCycle` and entry/comment `cycle` are positive safe integers starting at
  1 in the seed. A later completed-leg reset advances that leg's cycle; it must
  not erase the next leg's future-pickup membership. Retaining versus deleting
  old records remains a 7d decision, not a promise to log all history.
- The seeded journey references the fixture shuttle and outbound active leg.
  Native IDs for circular Journey/RouteLeg references are finalized inside the
  same transaction before it commits.
- Indexes support lookups, not automatic uniqueness or foreign-key enforcement.
  The seed validates uniqueness; future mutations must enforce it transactionally.
  Required uniqueness is organization slug, leg sequence within journey, one
  `(routeLegId, cycle, userId)` membership, one snapshot per leg, and seed key.

### Validation and tenant rules

- Use Convex native validators for stored/API shapes and focused semantic helpers
  for cross-record rules; no `any`, unconstrained provider-settings blobs, or
  unrelated validation framework.
- Guests have `organizationId: null`; registered users reference an existing
  organization. Guest waitlist/comment access is scoped through the target leg
  and journey, not a global public list of guest records.
- Journey, assigned shuttle, and leg endpoints must share an organization. Driver
  references require role `driver` and that shuttle's organization. Non-guest
  waitlist members/comment authors must belong to the leg's organization.
- Ordered leg references must exist exactly once, agree with `journeyId` and
  sequence, and contain any non-null active leg. A routing snapshot must refer
  to that journey's assigned shuttle. Do not infer an active leg from array order
  or use a caller-supplied organization ID as proof of authorization.
- Validate finite timestamps, coordinates within latitude/longitude bounds,
  nonnegative accuracy/distances/durations, positive geofence radii, and progress
  within `[0, 1]`. Required labels/comment text must be nonempty. Preserve null
  tracking fields supported by the existing contract.
- Retain nullable fixture phones. Real guest input normalization and credential
  handling belong to 7c and must reuse Feature 5's approved phone rules.

### Seed behavior and development environment

- The user selected Convex Cloud development and supplied
  `https://formal-giraffe-877.convex.cloud`. Verify its deployment type and access
  using the existing CLI login before syncing. Connect that existing development
  deployment; do not create a replacement project or deploy to production.
  Next.js continues running locally. The user can complete browser login if
  existing credentials do not grant access; never request credentials in chat.
- Use an internal mutation with empty validated arguments and a validated safe
  result. Use a backend-only `ALLOW_DEVELOPMENT_SEED=true` opt-in, default off;
  internal visibility alone is not an environment guard. Never expose a public
  wrapper. Document the verified development target before enabling/running the seed.
  Also require the runtime `CONVEX_CLOUD_URL` to match the selected development
  deployment so enabling the flag on another deployment cannot seed it.
- Use the stable completion key `sunday-service-v1`. Check it first: an existing
  marker returns `already_seeded` without reapplying fixture data, even if users
  subsequently changed status or cleared memberships/comments.
- With no marker, require the nine domain tables to be empty. If any contains
  data, return a safe conflict without writes; never merge by name, phone, or
  slug, adopt ambiguous existing records, wipe tables, or bump the seed key to
  force a reset.
- Insert all fixture entities plus completion marker atomically. Empty-database
  checks and the marker read/write belong to that same mutation so simultaneous
  calls cannot both create a copy. Failure must leave no partially imported graph.
- Expected initial domain totals: 1 organization, 8 users, 2 locations, 1 shuttle,
  1 journey, 2 legs, 6 waitlist entries, 2 comments, and 2 routing snapshots.
  Derive data from fixtures rather than duplicating those records in the seed.
- Preserve original fixture status/timestamps. Seed data is a development
  scenario, not proof of current tracking or fresh ETA; do not redate it to now.
- Public reads must eventually project safe rider display fields only. Phone
  numbers, guest credentials, full user documents, and raw backend errors must
  not become subscription payloads or diagnostic output.

## Testing

- Use `pnpm test`. Add adjacent tests for semantic validation, fixture mapping,
  and the seed mutation as those steps land. `convex-test` may support database
  function tests in the existing Vitest runner; it is not a new test runner.
- Include a second organization in negative test data. Verify malformed, missing,
  foreign, duplicate, and invalid-cycle inputs fail without changes.
- Test reruns after changing status and deleting an entry/comment, not only two
  identical calls. Also test a nonempty unmarked database and failure during
  import. Do not add production-accessible reset or test mutation endpoints.
- Verify seed execution against the selected cloud development backend, including concurrent
  invocations if the test helper cannot model transaction contention accurately.
  Count/ID comparisons and relationship checks are sufficient evidence; no
  contact details need to be printed.
- Final gates: `pnpm exec tsc --noEmit`, the backend's generated TypeScript check,
  `pnpm lint`, `pnpm test`, and `pnpm build`. Document the exact supported backend
  check once configured. Keep existing tests intact.
- Smoke-test `/`: guest form opens, join/leave works on an eligible leg, mock
  transit locks pickup, and arrival advances the journey. The flagged View 2
  preview remains governed by its existing behavior.

## Notes for the AI

- Read relevant installed Next.js documentation before touching framework code.
  This feature should need no frontend integration or new public backend API.
- Keep helpers small and typed; do not introduce a generic repository framework.
- Feature 5's archive records the approved contact/guest architecture. The older
  name-only language in the project plan does not remove phone collection.
- Feature 7b is opt-in read-only until 7c supplies writes. Never connect the
  existing local pickup reducer to displayed live subscription data or silently
  substitute fixture data when the backend is unavailable.
- The root modal refactor was deferred explicitly. Keep it deferred here.
- Relevant primary references: [Convex development CLI](https://docs.convex.dev/cli/overview),
  [internal functions](https://docs.convex.dev/functions/internal-functions), and
  [convex-test](https://docs.convex.dev/testing/convex-test). Confirm current
  installed tooling behavior when implementing.

## Implementation evidence

### Step 1 (approved)

- Branch: `feature/convex-foundation-and-seed`; included in checkpoint `73d784e`.
- Installed Convex 1.46.0, generated bindings and backend TypeScript config,
  and synced the empty schema scaffold. Domain models remain in Steps 2 and 3.
- Existing CLI login authorized `formal-giraffe-877`; the CLI identified it as
  Development in `andres-mbouh/shuttle-tracker`. Read-only checks found no existing
  tables or functions before the initial sync.
- `.env.local` targets the supplied deployment and is ignored by git. No account
  credentials or deployment keys were added to tracked files.
- `pnpm convex:dev --once --tail-logs disable` succeeded against that development
  deployment. `pnpm exec tsc --noEmit`, `pnpm convex:typecheck`, `pnpm lint`,
  `pnpm test` (161 tests in 14 files), and `pnpm build` all passed.
- Setup and manual commands are documented in `convex/README.md` and `AGENTS.md`.
  No frontend integration or new public functions were introduced. `convex-test`
  is deferred until the logic-bearing validation step needs it.

### Step 2 (approved)

- Added organizations, users, locations, and shuttles with native references,
  nullable domain fields, role/provider/status validators, and slug/ownership
  indexes. Added shared timestamp and tracking shape validators.
- Added semantic helpers for required text, finite numeric values, coordinate
  bounds, nonnegative accuracy, existing organizations, guest/member ownership,
  and same-organization driver assignment. Future write handlers must call these
  helpers within their transaction; the schema alone does not enforce foreign
  references or numeric bounds.
- Added `convex-test` 0.0.61 to the existing Vitest runner. Thirty-nine tests cover
  valid fixture-derived documents, tenant-scoped indexes, missing and foreign
  references, invalid roles and tracking shapes, nullable values, boundaries,
  and rejection before insertion. Tests use an in-memory backend.
- Added the existing `@/` alias to the backend TypeScript configuration so shared
  fixture/domain imports resolve. Updated the backend development guide.
- Development sync succeeded and reported all four new indexes. A read-only
  `pnpm exec convex data` confirmed all four tables on `formal-giraffe-877`.
- `pnpm exec tsc --noEmit`, `pnpm convex:typecheck`, `pnpm lint`, `pnpm test`
  (200 tests in 15 files), `pnpm build`, and `git diff --check` passed.
- The user approved a checkpoint covering Steps 1 and 2 before Step 3,
  committed as `73d784e` (`feat: add Convex foundation schema and validation`).
  No fixture data or public mutation endpoints were added.

### Step 3 (approved)

- Added journeys, ordered route legs, cycle-scoped waitlist entries/comments,
  and routing snapshots with native references and six lookup indexes. Lists
  remain separate from route-leg documents; domain fixtures are unchanged.
- Added graph validation for complete ordered legs, active-leg membership,
  endpoint ownership, assigned shuttles, positive cycles/geofence radii, and
  finite timestamps. Entry/comment validation checks current cycles and user
  ownership; routing validation checks coordinates, progress, and shuttle
  assignment. These helpers enforce integrity, not caller authorization.
- Added 56 focused tests covering valid graphs, index scoping, malformed values,
  missing/foreign references, and transaction rollback for invalid graph edits.
  No public query or mutation endpoints were introduced.
- Convex rejected hyphenated module filenames during the first sync. Renamed
  the new modules to camelCase and recorded that backend naming requirement in
  the coding standards. The corrected development sync succeeded and reported
  all six new indexes on `formal-giraffe-877`.
- `pnpm exec tsc --noEmit`, `pnpm convex:typecheck`, `pnpm lint`, `pnpm test`
  (256 tests in 16 files), and `pnpm build` passed. Step 3 is included in
  checkpoint `28942d7` with Step 4.
- Manual inspection: open the selected Convex development dashboard's Data
  view to see all nine domain tables. They remain empty until the later seed
  steps; the frontend continues using its existing demo data.

### Step 4 (approved)

- Added typed, database-independent seed preparation from `UNION_ORGANIZATION`,
  `SUNDAY_SERVICE_FIXTURE`, and `ROUTING_SNAPSHOTS`. Fixture IDs remain lookup
  keys; native IDs will be allocated by the later import transaction. The
  outbound active leg is selected explicitly, and each leg starts at cycle 1.
- Extracted embedded waitlists/comments into separate records without changing
  source ordering, statuses, or timestamps. Prepared records are detached copies
  so subsequent edits cannot alter the reference fixtures.
- Validated the complete source graph before returning prepared data: unique
  IDs/memberships, ordered legs, existing users/authors/endpoints, organization
  ownership, driver assignment, and complete unique routing snapshots. Shared
  routing numeric validation now serves both seed and native-record checks.
  Validation errors include only fixed reasons or field labels.
- Added 56 tests proving expected counts, original data preservation, nullable
  values, independent membership per leg, invalid graph rejection, and unchanged
  inputs after rejection. Documented the local preparation test command in
  `convex/README.md`. No database import or public endpoint was added.
- `pnpm test` passed all 312 tests in 17 files. `pnpm exec tsc --noEmit`,
  `pnpm convex:typecheck`, `pnpm lint`, and `pnpm build` passed. CLI code
  generation (`pnpm exec convex codegen --typecheck enable`) regenerated the
  bindings and passed after retrying with network access outside the sandbox.
- The user approved Step 4 and a checkpoint covering Steps 3 and 4, committed
  as `28942d7` (`feat: add journey storage and validated seed preparation`).
  Step 5 will implement the guarded, atomic database import and completion marker.

### Step 5 (approved)

- Added the `seedRuns` completion table and internal `seed:run` mutation with
  empty validated arguments and validated status/key/count results. It requires
  both the explicit backend opt-in and the selected development deployment URL.
- The mutation reads its stable completion marker first after checking the
  environment guard. Completed runs return `already_seeded`; any occupied domain
  table without that marker returns `conflict`. Both leave every record untouched.
- Added native-ID mapping and insertion helpers for all nine tables, including
  linking circular Journey/RouteLeg references before validating the stored graph.
  The completion marker is inserted last in the same mutation. Failures throw
  `SEED_IMPORT_FAILED`, preserving rollback without returning raw contact data.
- Added 25 tests covering the environment/argument gates, complete native-ID
  relationships, original timestamps and routing values, unchanged reruns,
  edited status/cycles, deleted memberships/comments, all nine conflict cases,
  simultaneous callers, and rollback/retry after failures late in the import.
- The in-memory test helper serializes transactions. Its simultaneous-call test
  passed with one import and three no-ops; real Convex contention and retry
  behavior remain part of Step 6's cloud verification.
- `pnpm exec tsc --noEmit`, `pnpm convex:typecheck`, `pnpm lint`, `pnpm test`
  (337 tests in 18 files), `pnpm build`, and `git diff --check` passed.
  `pnpm convex:dev --once --tail-logs disable` successfully synced the schema and
  function to the selected Development deployment and regenerated bindings.
- Documented the explicitly scoped enable/run/disable commands and safe results
  in `convex/README.md`. The cloud seed has not been executed or enabled by this
  step; actual import, repeat/concurrent calls, and persistence checks are Step 6.
  The user approved Step 5 and its checkpoint commit before Step 6, committed
  as `e23ae21` (`feat: add guarded atomic development seed`).

### Step 6 (approved)

- Reconfirmed `formal-giraffe-877` as the selected Development deployment and
  synced the approved code. An inline read-only query found all nine domain
  tables and the completion-marker table empty before import.
- Verified the disabled seed response, temporarily enabled the backend flag,
  and launched two CLI invocations concurrently. Results were one `seeded` and
  one `already_seeded`; counts matched the expected 25 domain records plus one
  completion marker. A further enabled run returned `already_seeded` and left
  all native IDs, counts, checked state fields, and marker timestamp unchanged.
- Read-only backend queries confirmed organization/driver ownership, complete
  ordered legs and active leg, endpoint ownership, user/author references,
  current cycles, unique memberships, routing/shuttle ownership, and one routing
  snapshot per leg. Original historical timestamps and statuses were preserved.
- Removed `ALLOW_DEVELOPMENT_SEED` in a cleanup block and confirmed `disabled`.
  Restarted the local Next.js server and Convex CLI, then compared the backend
  again: all inspected IDs/counts/relationships/state/timestamps were unchanged.
- Deployment metadata exposes only the internal mutation `seed.js:run`, with
  empty validated arguments and validated status/key/count results.
- Browser checks used isolated headless Chrome via its debugging protocol at
  375px. Passed pickup modal, phone formatting, first join, leave/rejoin, joining
  both legs, transit lock, arrival clearing, return membership preservation,
  identity restoration after reload, and development View 2 availability.
  No horizontal overflow, console errors, or failed network requests were found.
  Comparing the cloud data afterward also confirmed demo interactions stayed local.
- Screenshots: `/private/tmp/shuttle-convex-step6-form.png` and
  `/private/tmp/shuttle-convex-step6-arrival.png`. Sanitized CLI/browser evidence:
  `/private/tmp/shuttle-convex-step6-cloud.json` and
  `/private/tmp/shuttle-convex-step6-browser.json`. No credentials or guest
  contact records were printed by cloud inspection.
- `pnpm exec tsc --noEmit`, `pnpm convex:typecheck`, `pnpm lint`, `pnpm test`
  (337 tests in 18 files), and `pnpm build` passed. Development sync succeeded
  both before import and after restarting tools. The findings ledger is empty.
- Updated `convex/README.md` with verified results, expected rerun/conflict
  behavior, and a read-only inspection command. The frontend remains the fixture
  demo until Feature 7b; the seed's enable flag is removed. The local dev server
  is running at `http://localhost:3000`. The user approved Step 6 and requested
  its commit and implementation of the next task. All six steps are complete;
  no merge or push was performed. Preserve this feature branch.
