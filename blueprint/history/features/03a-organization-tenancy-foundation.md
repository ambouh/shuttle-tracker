# Feature: Organization tenancy foundation

**From build-plan:** feature 3a
**Status:** complete

## Goal

Introduce Organization as the tenant boundary before building the rider UI or
Convex schema. Unify every person under one role-based User contract, scope
Journeys, Shuttles, and Locations to an Organization, connect each Shuttle to
its active driver, and migrate the Union fixtures without changing rider-facing
behavior.

## In scope

- Opaque `OrganizationId` and the framework-independent `Organization` and
  embedded `OrganizationDetails` contracts.
- One `UserRole` union: `"guest" | "rider" | "driver" | "admin"`.
- One `User` entity for every person, with nullable `organizationId`, role,
  identity fields, and timestamps.
- Removal of the separate `GuestUser` contract and the old `UserType` name.
- Required `organizationId` ownership on `Journey`, `Shuttle`, and
  `Location`.
- Nullable `activeDriverId` on `Shuttle`.
- A Union Church Organization fixture with display details, nullable logo data,
  and `"U"` fallback initials.
- Migration of all existing users, locations, shuttle, journey, operational
  scenarios, arrival scenarios, and tests to the new contracts.
- Explicit fixture integrity tests for tenant ownership, role rules, active
  driver validity, and inherited Route Leg boundaries.
- Stable public exports for the new contracts and fixture data.

## Out of scope

- The Journey Overview UI, organization avatar rendering, or prototype styling
  (Feature 3b).
- Convex schema, indexes, queries, mutations, subscriptions, or backend tenant
  enforcement (Feature 7).
- Organization creation, onboarding, switching, invitations, user-management
  UI, or organization selection.
- A user belonging to multiple organizations or holding multiple roles.
- Authentication-provider links, sessions, permissions middleware, or formal
  driver/admin authentication.
- Tenant-controlled colors, typography, domains, billing, plans, or white-label
  configuration.
- Driver schedules, assignment history, multiple simultaneous drivers, or
  authorization logic beyond the current active-driver relationship.
- Changes to route lifecycle, waitlist, comments, routing, tracking providers,
  visual prototypes, or package dependencies.

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

- [x] **Step 1 - Organization contracts and Union fixture** - add the
  `OrganizationId`, `OrganizationDetails`, and `Organization` contracts,
  export them through the public domain barrel, then add stable Union
  Organization fixture data and IDs through the public fixture barrel. *Done
  when:* the Organization is framework-independent and strictly typed; details
  contain display name, nullable description/logo URL/logo alt text, and
  fallback initials; the Union fixture uses stable IDs and timestamps; existing
  contracts and fixtures still compile unchanged; and focused tests prove the
  Union details and public exports.
- [x] **Step 2 - Unify the User contract and roles** - replace `UserType` with
  `UserRole`, add nullable `organizationId` and timestamps to the single
  `User` contract, remove `GuestUser`, and migrate all user fixtures and
  affected tests. *Done when:* every person is represented as a `User`; guests
  use role `guest` with null organization ownership and retain their
  registration phone numbers; Josh and representative guest riders remain
  guests; John is a driver belonging to Union; the shared User contract allows
  a nullable phone number; no `GuestUser`, `UserType`, `userType`, or
  guest-only `name` reference remains; and strict TypeScript, fixture tests,
  and lint pass.
- [x] **Step 3 - Scope operational entities and active driver** - add required
  `organizationId` to `Journey`, `Shuttle`, and `Location`, add nullable
  `activeDriverId` to `Shuttle`, and migrate canonical and operational
  fixtures without changing their existing statuses, waitlists, comments,
  routing, or arrival results. *Done when:* Union owns both locations, the
  shuttle, and Sunday Service; the shuttle points to John as active driver;
  Route Legs continue inheriting their organization through the Journey;
  tracking records continue inheriting through the Shuttle; every scenario
  remains independent; and the full existing suite plus strict TypeScript and
  lint pass.
- [x] **Step 4 - Prove tenant integrity and finalize exports** - add focused
  cross-record tests for the organization boundary and role rules, confirm all
  public imports, and run final automated verification. *Done when:* tests prove
  guests have null organization IDs, registered roles have an organization ID,
  the active driver has role `driver` and matches the Shuttle organization,
  Journey and referenced Locations match organizations, every Route Leg resolves
  through an organization-owned Journey, existing fixture behavior is
  unchanged, all domain and fixture APIs are available through their barrels,
  and tests, strict TypeScript, lint, and production build pass.

## Files / areas

- `types/domain/primitives.ts` - `OrganizationId`.
- `types/domain/organization.ts` - Organization and embedded details.
- `types/domain/user.ts` - unified User and UserRole.
- `types/domain/journey.ts` - Organization ownership for Journeys and Locations.
- `types/domain/tracking.ts` - Organization ownership and active driver for
  Shuttles.
- `types/domain/index.ts` - stable public domain exports.
- `fixtures/ids.ts` - stable Union Organization ID.
- `fixtures/organization.ts` - Union Organization fixture.
- `fixtures/shared-entities.ts`, `fixtures/sunday-service.ts`, and
  `fixtures/operational-scenarios.ts` - contract migration.
- Existing colocated fixture tests plus a focused tenant-integrity test.
- `fixtures/index.ts` - stable public fixture exports.

No app routes, components, styles, prototypes, Convex files, provider adapters,
dependencies, or user-owned plans should change during implementation. The
normal active-spec progress checkboxes are the only other expected edits.

## Data / contracts

### Organization

- `OrganizationId` is an opaque branded string.
- `OrganizationDetails` contains `displayName`, nullable `description`,
  nullable `logoUrl`, nullable `logoAltText`, and `fallbackInitials`.
- `Organization` contains `id`, `slug`, `active`, `details`,
  `createdAt`, and `updatedAt`.
- Details are embedded because the relationship is one-to-one and small.
  Separate profile persistence is deferred.

### User

- `UserRole` is `"guest" | "rider" | "driver" | "admin"`.
- `User` contains `id`, `organizationId: OrganizationId | null`,
  `firstName`, `lastName`, nullable `phoneNumber`, `role`, `createdAt`, and
  `updatedAt`.
- A guest must have null `organizationId`. A rider, driver, or admin must have
  an Organization ID. The interface represents this invariant plainly; runtime
  enforcement belongs at later trust boundaries and fixtures prove their own
  compliance now.
- A User has one role and belongs to at most one Organization. A future
  many-organization relationship would be a separate planned migration.
- Local guest recognition in Feature 5 stores the required User subset rather
  than introducing another domain entity.

### Ownership

- `Journey.organizationId`, `Shuttle.organizationId`, and
  `Location.organizationId` are required.
- `Shuttle.activeDriverId` is `UserId | null`. A non-null driver must have
  role `driver` and the same `organizationId` as the Shuttle.
- `RouteLeg` inherits tenant ownership through `journeyId`.
- `WaitlistEntry` and `RouteLegComment` inherit it through `routeLegId`.
- `LocationUpdate`, `TrackingProviderConfiguration`, and
  `RoutingSnapshot` inherit it through `shuttleId`.
- Later Convex functions must resolve these parent records and enforce matching
  organization ownership rather than trusting client-supplied tenant context.

## Testing

- Vitest is configured and `pnpm test` is the unit-test gate.
- Steps 1 through 3 update focused contract/fixture assertions with each shape
  change so no step leaves the existing suite broken.
- Step 4 adds tenant-integrity coverage for null guest ownership, registered-role
  ownership, active-driver role and organization, Journey/Location consistency,
  inherited Route Leg ownership, and public barrel imports.
- After every step, run `pnpm test`, `pnpm exec tsc --noEmit`, and
  `pnpm lint`.
- In Step 4, also run `pnpm build`. If Turbopack hits only the known sandbox
  port restriction, record it and use `pnpm exec next build --webpack` as a
  diagnostic without changing the documented command.
- No browser or screenshot verification is needed because this feature has no
  rendered behavior.

## Notes for the AI

- Keep all contracts and fixtures server/client-neutral and side-effect free.
- Use `type` for string unions and `interface` for object shapes. Avoid
  TypeScript enums, `any`, SDK types, runtime frameworks, and raw unbranded
  IDs.
- This migration intentionally supersedes the Feature 1 `UserType` and
  `GuestUser` decisions. Do not preserve aliases that let new code keep using
  the obsolete model.
- Do not duplicate `organizationId` on nested records whose parent already
  establishes ownership.
- Preserve every existing route status, ordered relationship, waitlist,
  comment, routing value, normalized update, and arrival before/after result.
- Do not add runtime validators merely to enforce fixture invariants. Feature 7
  owns validation at the Convex boundary once its validation approach is chosen.
- Keep Organization details limited to identity display. Do not add theme tokens,
  contact data, domains, settings blobs, or billing fields.
- Do not build any UI in this feature. Feature 3b will consume the Organization
  and active-driver relationships directly.
