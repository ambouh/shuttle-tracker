import { describe, expect, it } from "vitest";

import {
  FIXTURE_IDS,
  NORMALIZED_LOCATION_UPDATES,
  OUTBOUND_ARRIVAL_SCENARIO,
  SUNDAY_SERVICE_FIXTURE,
} from ".";

describe("outbound arrival fixture scenario", () => {
  it("references fixture records through a typed arrival event", () => {
    const { event } = OUTBOUND_ARRIVAL_SCENARIO;
    const routeLegIds = SUNDAY_SERVICE_FIXTURE.routeLegs.map(({ id }) => id);
    const locationUpdateIds = NORMALIZED_LOCATION_UPDATES.map(({ id }) => id);

    expect(event.type).toBe("ARRIVAL");
    expect(routeLegIds).toContain(event.routeLegId);
    expect(event.shuttleId).toBe(SUNDAY_SERVICE_FIXTURE.shuttle.id);
    expect(locationUpdateIds).toContain(event.sourceLocationUpdateId);
  });

  it("starts with active outbound riders and comments in transit", () => {
    const [outbound, returnLeg] = OUTBOUND_ARRIVAL_SCENARIO.before.routeLegs;

    expect(outbound.id).toBe(FIXTURE_IDS.routeLegs.outbound);
    expect(outbound.status).toBe("IN_TRANSIT");
    expect(outbound.waitlist.length).toBeGreaterThan(0);
    expect(outbound.comments.length).toBeGreaterThan(0);
    expect(returnLeg.status).toBe("NOT_STARTED");
  });

  it("clears and resets outbound while activating the return leg", () => {
    const { event, before, after } = OUTBOUND_ARRIVAL_SCENARIO;
    const [outboundAfter, returnAfter] = after.routeLegs;

    expect(outboundAfter).toMatchObject({
      id: event.routeLegId,
      status: "NOT_STARTED",
      waitlist: [],
      comments: [],
      updatedAt: event.occurredAt,
    });
    expect(returnAfter).toMatchObject({
      id: FIXTURE_IDS.routeLegs.return,
      status: "DEPARTING",
      updatedAt: event.occurredAt,
    });
    expect(returnAfter.waitlist).toEqual(before.routeLegs[1].waitlist);
    expect(returnAfter.waitlist).not.toBe(before.routeLegs[1].waitlist);
    expect(after.routeLegs).not.toBe(before.routeLegs);
  });
});
