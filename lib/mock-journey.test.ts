import { describe, expect, it } from "vitest";

import {
  FIXTURE_IDS,
  NORMALIZED_LOCATION_UPDATES,
  ROUTING_SNAPSHOTS,
  SUNDAY_SERVICE_FIXTURE,
  UNION_ORGANIZATION,
} from "../fixtures";
import type {
  RouteLegId,
  RouteStatus,
  RoutingSnapshot,
  User,
  WaitlistEntryId,
} from "@/types/domain";
import type {
  MockArrivalAction,
  SetMockRouteStatusAction,
  MockJourneyContext,
  MockJourneyState,
} from "@/types/mock-journey";
import { applyMockJourneyAction, applyMockJourneyPickup, createMockJourneyState } from "./mock-journey";

const context: MockJourneyContext = {
  organization: UNION_ORGANIZATION,
  journey: SUNDAY_SERVICE_FIXTURE.journey,
  routePresets: SUNDAY_SERVICE_FIXTURE.journey.routeLegIds.map(
    (routeLegId, index) => ({
      routeLegId,
      routingSnapshot: ROUTING_SNAPSHOTS[index],
      locationUpdate: NORMALIZED_LOCATION_UPDATES[index],
    }),
  ),
};

function makeState(): MockJourneyState {
  return {
    activeRouteLegId: FIXTURE_IDS.routeLegs.outbound,
    users: SUNDAY_SERVICE_FIXTURE.users,
    routeLegs: SUNDAY_SERVICE_FIXTURE.routeLegs,
    shuttle: SUNDAY_SERVICE_FIXTURE.shuttle,
    routingSnapshots: ROUTING_SNAPSHOTS,
  };
}

function setStatus(routeLegId: RouteLegId, status: RouteStatus): SetMockRouteStatusAction {
  return {
    type: "SET_STATUS",
    expectedActiveRouteLegId: FIXTURE_IDS.routeLegs.outbound,
    routeLegId,
    status,
    occurredAt: 2_000_000_000_000,
  };
}

describe("mock journey status presets", () => {
  it.each([
    [FIXTURE_IDS.routeLegs.outbound, "NOT_STARTED"],
    [FIXTURE_IDS.routeLegs.outbound, "DEPARTING"],
    [FIXTURE_IDS.routeLegs.outbound, "IN_TRANSIT"],
    [FIXTURE_IDS.routeLegs.return, "NOT_STARTED"],
    [FIXTURE_IDS.routeLegs.return, "DEPARTING"],
    [FIXTURE_IDS.routeLegs.return, "IN_TRANSIT"],
  ] as const)("sets %s to %s with bounded direction-aware presentation", (routeLegId, status) => {
    const before = makeState();
    const result = applyMockJourneyAction(before, context, setStatus(routeLegId, status));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const selected = result.state.routeLegs.find(leg => leg.id === routeLegId)!;
    const other = result.state.routeLegs.find(leg => leg.id !== routeLegId)!;
    const routing = result.state.routingSnapshots.find(
      snapshot => snapshot.routeLegId === routeLegId,
    )!;

    expect(result.state.activeRouteLegId).toBe(routeLegId);
    expect(selected.status).toBe(status);
    expect(other.status).toBe("NOT_STARTED");
    expect(result.state.shuttle.tracking?.status).toBe({
      NOT_STARTED: "UNAVAILABLE",
      DEPARTING: "STALE",
      IN_TRANSIT: "CURRENT",
    }[status]);
    expect(routing.progressRatio).toBe(status === "IN_TRANSIT" ? 0.4 : 0);
    expect(routing.remainingDistanceMeters).toBe(
      routing.totalDistanceMeters * (1 - routing.progressRatio),
    );
    expect(routing.progressRatio).toBeGreaterThanOrEqual(0);
    expect(routing.progressRatio).toBeLessThanOrEqual(1);
    expect(Number.isFinite(routing.estimatedArrivalAt)).toBe(true);
  });

  it("preserves domain records and does not mutate its input", () => {
    const before = makeState();
    const routeValues = structuredClone(before.routeLegs);
    const result = applyMockJourneyAction(
      before,
      context,
      setStatus(FIXTURE_IDS.routeLegs.return, "DEPARTING"),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(before.routeLegs).toEqual(routeValues);
    expect(result.state).not.toBe(before);
    expect(result.state.routeLegs).not.toBe(before.routeLegs);
    expect(result.state.users).toEqual(before.users);
    expect(result.state.routeLegs.map(leg => ({
      id: leg.id,
      name: leg.name,
      sequence: leg.sequence,
      scheduledDepartureAt: leg.scheduledDepartureAt,
      scheduledArrivalAt: leg.scheduledArrivalAt,
      waitlist: leg.waitlist,
      comments: leg.comments,
    }))).toEqual(before.routeLegs.map(leg => ({
      id: leg.id,
      name: leg.name,
      sequence: leg.sequence,
      scheduledDepartureAt: leg.scheduledDepartureAt,
      scheduledArrivalAt: leg.scheduledArrivalAt,
      waitlist: leg.waitlist,
      comments: leg.comments,
    })));
  });

  it.each([
    ["inactive organization", { ...context, organization: { ...context.organization, active: false } }, setStatus(FIXTURE_IDS.routeLegs.outbound, "DEPARTING"), "journey-unavailable"],
    ["foreign journey", { ...context, journey: { ...context.journey, organizationId: "other" as typeof context.journey.organizationId } }, setStatus(FIXTURE_IDS.routeLegs.outbound, "DEPARTING"), "journey-unavailable"],
    ["stale target", context, { ...setStatus(FIXTURE_IDS.routeLegs.outbound, "DEPARTING"), expectedActiveRouteLegId: FIXTURE_IDS.routeLegs.return }, "stale-target"],
    ["unknown route", context, setStatus("missing" as RouteLegId, "DEPARTING"), "route-unavailable"],
    ["unsafe time", context, { ...setStatus(FIXTURE_IDS.routeLegs.outbound, "DEPARTING"), occurredAt: -1 }, "invalid-action"],
    ["unknown status", context, { ...setStatus(FIXTURE_IDS.routeLegs.outbound, "DEPARTING"), status: "ARRIVED" as RouteStatus }, "invalid-action"],
  ] as const)("rejects %s without changing state", (_label, inputContext, action, error) => {
    const before = makeState();
    expect(applyMockJourneyAction(before, inputContext, action)).toEqual({
      ok: false,
      error,
    });
    expect(before).toEqual(makeState());
  });

  it("rejects a foreign preset or active state route", () => {
    const before = makeState();
    const foreignPreset = {
      ...context.routePresets[0],
      routeLegId: "foreign" as RouteLegId,
      routingSnapshot: {
        ...context.routePresets[0].routingSnapshot,
        routeLegId: "foreign" as RouteLegId,
      },
    };
    expect(applyMockJourneyAction(before, {
      ...context,
      routePresets: [...context.routePresets, foreignPreset],
    }, setStatus(FIXTURE_IDS.routeLegs.outbound, "DEPARTING"))).toEqual({
      ok: false,
      error: "journey-unavailable",
    });
    expect(applyMockJourneyAction({
      ...before,
      activeRouteLegId: "foreign" as RouteLegId,
    }, context, setStatus(FIXTURE_IDS.routeLegs.outbound, "DEPARTING"))).toEqual({
      ok: false,
      error: "journey-unavailable",
    });
  });

  it("rejects malformed preset numbers", () => {
    const badSnapshot = {
      ...ROUTING_SNAPSHOTS[0],
      progressRatio: Number.NaN,
    } as RoutingSnapshot;
    const before = makeState();
    const result = applyMockJourneyAction(before, {
      ...context,
      routePresets: [
        { ...context.routePresets[0], routingSnapshot: badSnapshot },
        context.routePresets[1],
      ],
    }, setStatus(FIXTURE_IDS.routeLegs.outbound, "IN_TRANSIT"));

    expect(result).toEqual({ ok: false, error: "journey-unavailable" });
    expect(before).toEqual(makeState());
  });
});

function arrival(state: MockJourneyState): MockArrivalAction {
  return {
    type: "ARRIVAL",
    expectedActiveRouteLegId: state.activeRouteLegId,
    routeLegId: state.activeRouteLegId,
    shuttleId: state.shuttle.id,
    occurredAt: 2_000_000_000_001,
    sourceLocationUpdateId: null,
  };
}

describe("mock journey arrival", () => {
  it.each([FIXTURE_IDS.routeLegs.outbound, FIXTURE_IDS.routeLegs.return])(
    "clears only %s and advances in journey order",
    routeLegId => {
      const transit = applyMockJourneyAction(makeState(), context, setStatus(routeLegId, "IN_TRANSIT"));
      if (!transit.ok) throw Error("Transit setup failed");
      const before = structuredClone(transit.state);
      const result = applyMockJourneyAction(transit.state, context, arrival(transit.state));
      if (!result.ok) throw Error(result.error);
      const completed = result.state.routeLegs.find(leg => leg.id === routeLegId)!;
      const next = result.state.routeLegs.find(leg => leg.id !== routeLegId)!;
      expect(completed).toMatchObject({
        status: "NOT_STARTED", waitlist: [], comments: [], updatedAt: 2_000_000_000_001,
      });
      expect(next.status).toBe("DEPARTING");
      expect(result.state.activeRouteLegId).toBe(next.id);
      expect(next.waitlist).toEqual(before.routeLegs.find(leg => leg.id === next.id)!.waitlist);
      expect(next.comments).toEqual(before.routeLegs.find(leg => leg.id === next.id)!.comments);
      expect(result.state.users).toEqual(before.users);
      expect(result.state.routingSnapshots.every(snapshot => snapshot.progressRatio === 0)).toBe(true);
      expect(result.state.shuttle.tracking?.status).toBe("STALE");
      expect(transit.state).toEqual(before);
      expect(applyMockJourneyAction(result.state, context, arrival(transit.state)))
        .toEqual({ ok: false, error: "stale-target" });
    },
  );

  it("accepts a known source update and empty completed lists", () => {
    const state = makeState();
    state.routeLegs = state.routeLegs.map(leg => ({ ...leg, waitlist: [], comments: [] }));
    const result = applyMockJourneyAction(state, context, {
      ...arrival(state),
      sourceLocationUpdateId: context.routePresets[0].locationUpdate.id,
    });
    expect(result.ok).toBe(true);
  });

  it.each([
    ["wrong shuttle", { shuttleId: "foreign" }, "invalid-event"],
    ["unknown source", { sourceLocationUpdateId: "missing" }, "invalid-event"],
    ["invalid time", { occurredAt: Number.NaN }, "invalid-event"],
    ["old event", { occurredAt: 0 }, "invalid-event"],
    ["wrong leg", { routeLegId: FIXTURE_IDS.routeLegs.return }, "stale-target"],
  ] as const)("rejects %s without mutation", (_label, change, error) => {
    const state = makeState();
    const before = structuredClone(state);
    const action = { ...arrival(state), ...change } as MockArrivalAction;
    expect(applyMockJourneyAction(state, context, action)).toEqual({ ok: false, error });
    expect(state).toEqual(before);
  });

  it.each(["NOT_STARTED", "DEPARTING"] as const)("refuses arrival during %s", status => {
    const result = applyMockJourneyAction(makeState(), context, setStatus(FIXTURE_IDS.routeLegs.outbound, status));
    if (!result.ok) throw Error("Status setup failed");
    expect(applyMockJourneyAction(result.state, context, arrival(result.state)))
      .toEqual({ ok: false, error: "arrival-unavailable" });
  });
});

describe("combined pickup and journey state", () => {
  it("retains guest data through transit and clears membership on arrival", () => {
    const guest: User = {
      id: "guest_12345678-1234-4123-8123-123456789abc" as User["id"],
      firstName: "Alex", lastName: "Rivera", phoneNumber: "+12025550123",
      role: "guest", organizationId: null, profileImageUrl: null,
      createdAt: 1234, updatedAt: 1234,
    };
    const departing = applyMockJourneyAction(makeState(), context, setStatus(FIXTURE_IDS.routeLegs.outbound, "DEPARTING"));
    if (!departing.ok) throw Error("Setup failed");
    const pickupContext = {
      organization: context.organization, journey: context.journey,
      routeLegId: FIXTURE_IDS.routeLegs.outbound,
    };
    const joined = applyMockJourneyPickup(departing.state, pickupContext, {
      type: "join", guest, entryId: "waitlist-new" as WaitlistEntryId, requestedAt: 2_000_000_000_000,
    });
    if (!joined.ok) throw Error(joined.error);
    expect(joined.state.shuttle).toBe(departing.state.shuttle);
    expect(joined.state.routingSnapshots).toBe(departing.state.routingSnapshots);
    expect(joined.state.activeRouteLegId).toBe(departing.state.activeRouteLegId);
    const transit = applyMockJourneyAction(joined.state, context, setStatus(FIXTURE_IDS.routeLegs.outbound, "IN_TRANSIT"));
    if (!transit.ok) throw Error(transit.error);
    expect(transit.state.routeLegs[0].waitlist.some(entry => entry.userId === guest.id)).toBe(true);
    expect(applyMockJourneyPickup(transit.state, pickupContext, { type: "leave", guestId: guest.id }))
      .toEqual({ ok: false, error: "pickup-closed" });
    const arrived = applyMockJourneyAction(transit.state, context, arrival(transit.state));
    if (!arrived.ok) throw Error(arrived.error);
    expect(arrived.state.routeLegs[0].waitlist).toEqual([]);
    expect(arrived.state.users.some(user => user.id === guest.id)).toBe(true);
    expect(arrived.state.routeLegs[1].waitlist).toEqual(makeState().routeLegs[1].waitlist);
    const nextJoin = applyMockJourneyPickup(arrived.state, {
      ...pickupContext, routeLegId: FIXTURE_IDS.routeLegs.return,
    }, { type: "join", guest, entryId: "waitlist-next" as WaitlistEntryId, requestedAt: 2_000_000_000_002 });
    expect(nextJoin.ok).toBe(true);
  });

  it("initializes an isolated copy and resets to the canonical fixture", () => {
    const initial = makeState();
    const copy = createMockJourneyState(initial);
    copy.routeLegs[0].waitlist.splice(0);
    expect(initial.routeLegs[0].waitlist.length).toBeGreaterThan(0);
    expect(createMockJourneyState(initial)).toEqual(initial);
  });
});
