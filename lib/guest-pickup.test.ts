import { describe, expect, it } from "vitest";
import { FIXTURE_IDS, SUNDAY_SERVICE_FIXTURE, UNION_ORGANIZATION } from "../fixtures";
import type { JourneyId, OrganizationId, RouteLegId, RouteStatus, UserId, WaitlistEntryId } from "@/types/domain";
import { guestIdentityToUser, parseGuestIdentity } from "./guest-identity";
import { applyGuestPickup, type GuestPickupContext, type GuestPickupSnapshot } from "./guest-pickup";

const guest = guestIdentityToUser(parseGuestIdentity({ version: 1,
  userId: "guest_12345678-1234-4123-8123-123456789abc", createdAt: 1,
  firstName: "Alex", lastName: "Rivera", phoneNumber: "+12025550123",
})!);
const join = { type: "join" as const, guest, entryId: "waitlist-new" as WaitlistEntryId, requestedAt: 2 };
const context: GuestPickupContext = { organization: UNION_ORGANIZATION,
  journey: SUNDAY_SERVICE_FIXTURE.journey, routeLegId: FIXTURE_IDS.routeLegs.return };
function snapshot(status: RouteStatus = "NOT_STARTED"): GuestPickupSnapshot {
  return { users: SUNDAY_SERVICE_FIXTURE.users, routeLegs: SUNDAY_SERVICE_FIXTURE.routeLegs.map(leg =>
    leg.id === context.routeLegId ? { ...leg, status } : leg) };
}

describe("guest pickup operations", () => {
  it.each(["NOT_STARTED", "DEPARTING"] as const)("joins and leaves %s without mutating input", status => {
    const before = snapshot(status); const copy = structuredClone(before);
    const added = applyGuestPickup(before, context, join);
    expect(added.ok).toBe(true); if (!added.ok) return;
    expect(before).toEqual(copy);
    expect(added.snapshot.users).toEqual([...before.users, guest]);
    expect(added.snapshot.routeLegs[0]).toBe(before.routeLegs[0]);
    expect(added.snapshot.routeLegs[1].waitlist).toEqual([...before.routeLegs[1].waitlist,
      { id: join.entryId, userId: guest.id, routeLegId: context.routeLegId, requestedAt: 2 }]);
    expect(applyGuestPickup(added.snapshot, context, join)).toEqual({ ok: true, snapshot: added.snapshot });
    const removed = applyGuestPickup(added.snapshot, context, { type: "leave", guestId: guest.id });
    expect(removed.ok).toBe(true); if (!removed.ok) return;
    expect(removed.snapshot.routeLegs).toEqual(before.routeLegs);
    expect(removed.snapshot.users).toBe(added.snapshot.users);
    const repeated = applyGuestPickup(removed.snapshot, context, { type: "leave", guestId: guest.id });
    expect(repeated.ok && repeated.snapshot === removed.snapshot).toBe(true);
  });

  it("rechecks status after a guest joins", () => {
    const added = applyGuestPickup(snapshot(), context, join);
    expect(added.ok).toBe(true); if (!added.ok) return;
    const locked = { ...added.snapshot, routeLegs: added.snapshot.routeLegs.map(leg => ({ ...leg, status: "IN_TRANSIT" as const })) };
    expect(applyGuestPickup(locked, context, join)).toEqual({ ok: false, error: "pickup-closed" });
    expect(applyGuestPickup(locked, context, { type: "leave", guestId: guest.id })).toEqual({ ok: false, error: "pickup-closed" });
  });

  it.each([
    { ...context, organization: { ...context.organization, active: false } },
    { ...context, journey: { ...context.journey, active: false } },
    { ...context, journey: { ...context.journey, organizationId: "foreign" as OrganizationId } },
    { ...context, journey: { ...context.journey, routeLegIds: [] } },
    { ...context, routeLegId: "unknown" as RouteLegId },
    { ...context, journey: { ...context.journey, id: "foreign" as JourneyId } },
  ])("rejects unavailable route context", selected => {
    expect(applyGuestPickup(snapshot(), selected, join)).toEqual({ ok: false, error: "route-unavailable" });
  });

  it.each([
    { ...guest, role: "rider" as const }, { ...guest, organizationId: UNION_ORGANIZATION.id },
    { ...guest, phoneNumber: null }, { ...guest, firstName: "" }, { ...guest, id: "bad" as UserId },
  ])("rejects invalid guest", invalid => {
    expect(applyGuestPickup(snapshot(), context, { ...join, guest: invalid })).toEqual({ ok: false, error: "invalid-guest" });
  });

  it("rejects unknown leave and existing privileged ID collision", () => {
    expect(applyGuestPickup(snapshot(), context, { type: "leave", guestId: guest.id })).toEqual({ ok: false, error: "invalid-guest" });
    const state = { ...snapshot(), users: [{ ...guest, role: "admin" as const }] };
    expect(applyGuestPickup(state, context, join)).toEqual({ ok: false, error: "invalid-guest" });
  });

  it("reuses an existing guest without duplicating or overwriting their record", () => {
    const state = { ...snapshot(), users: [...snapshot().users, guest] };
    const result = applyGuestPickup(state, context, join);
    expect(result.ok && result.snapshot.users === state.users).toBe(true);
  });

  it.each([-1, NaN, Infinity, 1.5])("rejects invalid request time %s", requestedAt => {
    expect(applyGuestPickup(snapshot(), context, { ...join, requestedAt })).toEqual({ ok: false, error: "invalid-request" });
  });

  it.each(["", FIXTURE_IDS.waitlistEntries.outboundFaith])("rejects invalid or reused entry IDs", id => {
    expect(applyGuestPickup(snapshot(), context, { ...join, entryId: id as WaitlistEntryId })).toEqual({ ok: false, error: "invalid-request" });
  });
});
