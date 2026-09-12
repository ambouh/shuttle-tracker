# Feature: Guest pickup flow

**From build-plan:** feature 5
**Status:** complete

## Goal

Let a rider identify themselves once by first name, last name, and phone number, then join or leave
an eligible Sunday Service Route Leg from View 1. Preserve guest recognition
across reloads while keeping the temporary waitlist implementation replaceable
by Feature 7's shared Convex data.

## Design reference

- `blueprint/reference/VIEW-1.png` and the current `/` interface define the
  existing card hierarchy and visual baseline.
- `app/globals.css` supplies the existing theme tokens.
- The guest-details form is a new functional surface, not a replica of an existing
  mockup. Use a shared root-portal modal, available to either view,
  with existing typography, spacing, buttons, and visible field labels.
- Preserve the static View 2 preview and its feature flag.

## In scope

- A versioned device-local guest identity containing an opaque generated ID,
  first and last name, phone number, and creation timestamp, mapped into the existing User
  contract with role `guest` and null organization ID.
- Restore identity after hydration without accessing storage during server
  rendering. Before restoration finishes, render a neutral rider greeting and
  disable pickup controls; never identify the visitor as fixture rider Josh.
- First pickup request opens a route-specific first-name, last-name, and phone-number form. Successful
  submission saves the identity and joins the originally selected eligible leg.
  Cancel creates neither an identity nor a waitlist entry.
- Returning guests join directly. The current guest sees an explicit waiting
  state and a remove action before transit. Both join and leave are unavailable
  during transit, enforced by the state operation as well as the UI.
- Immutable, in-memory waitlist operations seeded from the canonical fixture;
  unrelated riders and route legs are preserved. Store only guest identity in
  localStorage, never waitlists, route status, or operational snapshots.
- A visible short notice: "Demo pickup requests reset when this page reloads."
  This temporary notice belongs to the in-memory implementation and is removed
  when Feature 7 provides shared persistence.
- Clear field errors, storage failure recovery, repeated-click protection,
  keyboard behavior, and 320px/1440px responsive evidence.

## Out of scope

- Convex, server mutations, cross-device or cross-tab waitlist synchronization,
  authentication, authorization claims, and durable operational persistence.
- Guest profile editing, sign-out, identity merging, or account recovery.
- SMS delivery, phone ownership verification, notification consent capture,
  notification preferences, and message-provider integration. A supplied number
  is unverified and does not itself authorize sending messages.
- Route lifecycle simulation, timers, arrival events, and developer status
  controls, owned by Feature 6. Test existing status variants without adding a
  production status-switching UI.
- Comments, scheduled pickup, View 2 interaction, and navigation to View 2.
- New domain entities or an alternate GuestUser model.

## Build loop

Build one step at a time, never the whole feature at once.

1. Lay out the step before code.
2. Implement just that step.
3. Show the diff and explain its behavior with evidence.
4. The user approves before the step is checked off or a checkpoint is committed.
   Checkpoints are optional; `/complete` makes the feature-level commit.

## Build steps

- [x] **Step 1 - Define and validate local guest identity** - add the versioned
  payload, pure name/phone validation and stored-payload parser, and mapping to User.
  *Done when:* whitespace is trimmed; each name is required and limited to 80
  Unicode code points; international names, spaces, apostrophes, and hyphens are
  accepted without an ASCII-only rule; control characters are rejected; phone is required, accepts familiar US
  formatting, progressively displays exactly 10 digits as `###-###-####`, and
  normalizes the US number to E.164 using a maintained phone-number parser; the country defaults
  to US and is explicit in the form; invalid or impossible numbers are rejected;
  malformed JSON, unsupported versions, missing fields, invalid IDs, and invalid
  timestamps return a safe absent identity; mapped Users have guest role and
  null organization and image, plus normalized phoneNumber; focused tests cover each case. Parsers
  accept unknown input and do not generate IDs or read global storage/time.
- [x] **Step 2 - Add guest restoration and storage handling** - create a small
  client identity controller and integrate neutral/loaded rider context into
  View 1 while leaving pickup disabled. *Done when:* valid stored identity
  changes the greeting after hydration; absent/corrupt identity stays neutral;
  blocked reads do not crash rendering; storage writes report failure without
  claiming the identity was saved; no fixture identity is adopted; server and
  first-client output match; injected-storage tests cover read/write failures.
- [x] **Step 3 - Implement the temporary waitlist operations** - add a pure
  immutable state operation and typed results for join/leave, seeded from the
  fixture. *Done when:* only legs belonging to the selected active organization
  and journey are addressable; only NOT_STARTED and DEPARTING accept changes;
  duplicate join and repeated leave are idempotent; leave only removes the
  current guest; unknown/foreign legs, invalid users, and IN_TRANSIT return
  explicit failures without mutation; users and unrelated fixture data remain
  intact; IDs and time are supplied by the caller; tests cover the full matrix.
- [x] **Step 4 - Build first-request identity entry** - add a modal client
  form and connect it to the selected route and the identity/state operations.
  *Done when:* first request opens three labeled fields (first name, last name, phone number); Enter submits and Cancel
  closes without changes; invalid input focuses the first invalid field and
  exposes associated errors; successful submission generates one identity,
  persists it, and joins exactly once; write failure keeps input visible with
  retry and joins nobody; the route is rechecked at submission against current
  state; a now-ineligible route produces a readable error without joining;
  cancellation/success restores focus to the relevant route control; no shared
  PickupButton change enables any View 2 control.
- [x] **Step 5 - Connect returning-guest join and leave presentation** - derive
  eligible controls. *Done when:* a restored guest joins without re-entering
  names; counts and avatars update; personalized copy ("You and 2 others are waiting for pickup", or the first
  rider's name when the guest is absent) is shown even if
  the guest is outside the first three displayed avatars; remove restores the
  prior count; use Lucide CirclePlus/CircleMinus icon buttons with accessible
  join/remove labels instead of text pills; other route lists are unchanged; transit has no actionable join
  or leave and clearly says pickup is closed; repeated clicks cannot duplicate
  membership; reload restores identity but resets requests and the demo notice
  explains that behavior. Adapter changes ship focused tests.
- [x] **Step 5a - Share the pickup modal across views** - replace inline guest
  entry with a reusable `components/ui/modal.tsx` using the generated shadcn/ui
  Dialog (the project's base-nova style), React Hook Form, and a shared Zod
  schema. *Done when:* it portals to document body above either page, has a
  labeled title, backdrop, scroll containment, focus trap, Escape/backdrop/close
  dismissal, and return focus; pickup cancel/save/error behavior is preserved;
  320px and desktop layouts fit; View 2 remains noninteractive. No global form
  registry or future comment/signup forms are introduced.
- [x] **Step 6 - Prove the complete flow and regressions** - run `/check` and
  save evidence at 320px and 1440px. *Done when:* first visit, invalid names/phone,
  cancel, successful join, returning visit, remove, duplicate attempts,
  malformed storage, blocked storage/retry, and transit locking are proven;
  keyboard focus and field announcements are usable; no overflow or browser
  errors occur; `/routes/route-leg-sunday-outbound` stays a static gated preview;
  `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build` pass.

## Files / areas

- `types/guest-identity.ts` - browser payload and operation result contracts.
- `lib/guest-identity.ts` and adjacent tests - normalization, parsing, User mapping.
- `lib/guest-identity-storage.ts` and adjacent tests - guarded storage adapter.
- `lib/guest-pickup.ts` and adjacent tests - immutable join/leave rules.
- `components/guest-pickup/` - focused client controller and modal identity form.
- `app/page.tsx` - server entry passing serializable fixture data to the client
  experience; remove Josh as the hardcoded current visitor.
- `lib/journey-overview.ts` and tests - nullable current rider ID, membership and
  pickup-state presentation; existing route metrics stay unchanged.
- `components/journey-overview/` - guest greeting and actionable View 1 controls.
- `components/shuttle/PickupButton.tsx` - change only if an explicit optional
  callback/disabled contract is needed; static consumers remain disabled by default.
- `blueprint/evidence/feature-5/` - browser screenshots and verification report.

## Data / contracts

Load-bearing contracts for Features 6 and 7:

- Storage key: `union-shuttle.guest-identity.v1`.
- `StoredGuestIdentity`: `{ version: 1, userId: string, firstName: string,
  lastName: string, phoneNumber: string, createdAt: number }`. ID format is `guest_` followed by a
  UUID generated by `crypto.randomUUID()` at successful identity creation.
  The parser validates that format and finite, nonnegative integer timestamps.
  These IDs recognize a device; they are not authentication credentials.
- Guest User projection uses the saved ID, normalized names and createdAt;
  updatedAt initially equals createdAt, role is guest, organizationId and
  profileImageUrl are null; phoneNumber is the normalized E.164 value. Do not replace fixture users by name.
- Identity state distinguishes loading, anonymous, ready and storage error.
  A failed read or write is visible at the pickup form with a retry action;
  no silent temporary identity or fake successful pickup is permitted.
- Existing `WaitlistEntry` remains canonical. Join receives current state,
  selected organization/journey/leg, guest User, generated entry ID and time;
  leave receives the same context and guest ID. Operations return a new snapshot
  or a typed failure (`route-unavailable`, `pickup-closed`, `invalid-guest`, `invalid-request`).
  Repeated valid join/leave returns the unchanged snapshot as a successful no-op.
- Keep identity persistence separate from in-memory users/route lists. On reload,
  project the restored guest into a fresh fixture snapshot with no previous demo
  membership. Never mutate imported fixtures or infer membership from a name.
- Feature 6 will supply changing statuses to these operations; Feature 7 will
  replace local operations with backend-enforced eligibility and uniqueness.
  Do not introduce a generic repository framework for this temporary boundary.

## Persistence and future notifications

Approved architecture: everyone is a guest in the MVP. A guest database record
does not require an account or login; Slack authentication remains future work.

- Feature 5 temporarily stores the guest details only in this browser using the
  versioned localStorage payload. It persists across reloads and visits, until
  browser data is cleared; it is not shared across devices or guaranteed storage.
- Do not store an array of all guests in a visitor's browser. Only that visitor
  owns the local identity payload. Fixture users remain development data.
- Feature 7 will create guest User records centrally in Convex on the first
  pickup request, not on page visits, with waitlist entries referencing their IDs.
  Reuse the record for returning guests. Keep phone numbers out of public rider-list
  responses. Operational queries remain scoped to the selected organization.
- When the backend is introduced, migrate the full local payload to a server
  guest record at the first backend pickup request and retain an opaque browser
  recognition credential instead of the full local contact payload.
  Credential issuance, server-side access checks, migration/versioning,
  and recovery require explicit design in Feature 7; a client-supplied user ID
  alone must not authorize reading or changing a guest's private details.
- Inactive guest retention and cleanup remain an explicit future decision;
  no automatic deletion interval is introduced by this feature.
- Future messaging can join eligible waitlist entries to server guest contact
  details when route lifecycle events occur. Store notification consent and
  preferences separately before sending. Do not use phone number as a primary
  key or silently merge people who share one. Arrival clears active waitlists,
  so future notification work must preserve the intended recipients before
  clearing, with retry and duplicate-delivery handling.
- Near-stop and completed-stop messaging is a future roadmap candidate, beyond
  Feature 5 and the current in-app/PWA alert scope. No plan item is added here.

## Testing

Vitest is already configured. Logic-bearing steps add adjacent tests for name/phone
validation, stored payload parsing, storage exceptions, User mapping, immutable
join/leave eligibility and idempotency, and membership-aware presentation.
Inject IDs, timestamps, and storage interfaces instead of changing globals.

Browser verification uses existing tooling; do not install a runner. Use a
fresh browser context/storage for first visit, then reload for returning-guest
proof. Exercise NOT_STARTED and DEPARTING using existing fixture variants in a
local verification harness; prove IN_TRANSIT refusal through both UI evidence
and operation tests. Do not leave a test-only public route or simulator behind.
Record any behavior that could not be exercised rather than assuming a pass.

The normal automated gate is `pnpm test` plus `pnpm build`; the final gate also
includes `pnpm exec tsc --noEmit` and `pnpm lint`.

## Notes for the AI

- Read installed Next.js documentation for client boundaries and rendering before
  implementation. Keep `app/page.tsx` a Server Component and browser storage in
  the smallest useful client boundary.
- Follow existing Tailwind tokens, strict types, and accessible native form
  semantics. Use existing primitives; do not add a form or validation package
  without a concrete need. A maintained phone-number parsing library is
  justified for normalization and validation; inspect its current official docs
  before selecting it. Do not implement country numbering rules with a regex.
- Recheck eligibility in the state operation, not only in a disabled button.
- Do not claim the in-memory request reaches the driver or other devices.
- The overview has stale historical fields (including scheduled route times and
  the resolved preview route/flag). Use current domain types and Feature 4's
  archive for those established contracts; no plan rewrite is needed for this scope.
- Reviewed for gaps: explicitly defined hydration, storage failure, reload
  semantics, identity validation, pending-form eligibility, duplicate operations,
  current-guest visibility beyond the avatar limit, and View 2 isolation.

## Completion evidence

- Verification: `blueprint/evidence/feature-5/verification.md`.
- Passed: `pnpm test` (130 tests), `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`.
- Browser checks passed at 320px and 1440px with no runtime errors or overflow.
- Manual try: `pnpm dev`, then open `/` and use the return route's waitlist control.
- No findings recorded at completion.
