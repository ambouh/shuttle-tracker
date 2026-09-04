import { describe, expect, it } from "vitest";

import { FIXTURE_IDS } from "./ids";
import {
  OUTBOUND_ROUTE_LEG,
  RETURN_ROUTE_LEG,
  SUNDAY_SERVICE_FIXTURE,
} from "./sunday-service";

describe("canonical Sunday Service fixture", () => {
  it("places the journey and its operational entities under Union", () => {
    const { journey, locations, shuttle } = SUNDAY_SERVICE_FIXTURE;

    expect(journey.organizationId).toBe(FIXTURE_IDS.organization);
    expect(shuttle.organizationId).toBe(FIXTURE_IDS.organization);
    expect(shuttle.activeDriverId).toBe(FIXTURE_IDS.users.johnSmith);
    expect(
      locations.every(
        ({ organizationId }) => organizationId === journey.organizationId,
      ),
    ).toBe(true);
  });

  it("orders reciprocal route legs consistently", () => {
    const { journey, routeLegs } = SUNDAY_SERVICE_FIXTURE;

    expect(routeLegs.map(({ id }) => id)).toEqual(journey.routeLegIds);
    expect(routeLegs.map(({ sequence }) => sequence)).toEqual([1, 2]);
    expect(OUTBOUND_ROUTE_LEG.departureLocationId).toBe(
      RETURN_ROUTE_LEG.arrivalLocationId,
    );
    expect(OUTBOUND_ROUTE_LEG.arrivalLocationId).toBe(
      RETURN_ROUTE_LEG.departureLocationId,
    );
  });

  it("resolves every referenced record within the fixture", () => {
    const { journey, locations, routeLegs, users } = SUNDAY_SERVICE_FIXTURE;
    const locationIds = new Set(locations.map(({ id }) => id));
    const routeLegIds = new Set(routeLegs.map(({ id }) => id));
    const userIds = new Set(users.map(({ id }) => id));

    for (const routeLeg of routeLegs) {
      expect(routeLeg.journeyId).toBe(journey.id);
      expect(locationIds.has(routeLeg.departureLocationId)).toBe(true);
      expect(locationIds.has(routeLeg.arrivalLocationId)).toBe(true);

      for (const entry of routeLeg.waitlist) {
        expect(routeLegIds.has(entry.routeLegId)).toBe(true);
        expect(entry.routeLegId).toBe(routeLeg.id);
        expect(userIds.has(entry.userId)).toBe(true);
      }

      for (const comment of routeLeg.comments) {
        expect(routeLegIds.has(comment.routeLegId)).toBe(true);
        expect(comment.routeLegId).toBe(routeLeg.id);
        expect(userIds.has(comment.authorUserId)).toBe(true);
      }
    }
  });

  it("keeps waitlist membership unique and leg arrays independent", () => {
    for (const routeLeg of SUNDAY_SERVICE_FIXTURE.routeLegs) {
      const memberships = routeLeg.waitlist.map(
        ({ userId, routeLegId }) => `${userId}:${routeLegId}`,
      );

      expect(new Set(memberships).size).toBe(memberships.length);
    }

    expect(OUTBOUND_ROUTE_LEG.waitlist).not.toBe(RETURN_ROUTE_LEG.waitlist);
    expect(OUTBOUND_ROUTE_LEG.comments).not.toBe(RETURN_ROUTE_LEG.comments);
  });

  it("matches the approved View 1 route state and preview counts", () => {
    expect(OUTBOUND_ROUTE_LEG).toMatchObject({
      id: FIXTURE_IDS.routeLegs.outbound,
      status: "IN_TRANSIT",
    });
    expect(RETURN_ROUTE_LEG).toMatchObject({
      id: FIXTURE_IDS.routeLegs.return,
      status: "NOT_STARTED",
    });
    expect(OUTBOUND_ROUTE_LEG.waitlist).toHaveLength(3);
    expect(RETURN_ROUTE_LEG.waitlist).toHaveLength(3);
    expect(OUTBOUND_ROUTE_LEG.comments).toHaveLength(2);
  });
});
