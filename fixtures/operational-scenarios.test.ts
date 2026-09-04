import { describe, expect, it } from "vitest";

import { FIXTURE_IDS } from "./ids";
import {
  CURRENT_TRACKING_SHUTTLE,
  NORMALIZED_LOCATION_UPDATES,
  ROUTE_STATUS_SCENARIOS,
  ROUTING_SNAPSHOTS,
  STALE_TRACKING_SHUTTLE,
  UNAVAILABLE_TRACKING_SHUTTLE,
} from "./operational-scenarios";

describe("Sunday Service operational scenarios", () => {
  it("provides a complete named scenario for every route status", () => {
    expect(Object.keys(ROUTE_STATUS_SCENARIOS)).toEqual([
      "NOT_STARTED",
      "DEPARTING",
      "IN_TRANSIT",
    ]);

    for (const [status, scenario] of Object.entries(ROUTE_STATUS_SCENARIOS)) {
      expect(scenario.routeLegs[0].status).toBe(status);
      expect(scenario.routeLegs).toHaveLength(2);
    }
  });

  it("keeps mutable arrays isolated between scenarios", () => {
    const scenarios = Object.values(ROUTE_STATUS_SCENARIOS);

    expect(new Set(scenarios.map(({ routeLegs }) => routeLegs)).size).toBe(3);
    expect(
      new Set(scenarios.map(({ routeLegs }) => routeLegs[0].waitlist)).size,
    ).toBe(3);
    expect(
      new Set(scenarios.map(({ routeLegs }) => routeLegs[0].comments)).size,
    ).toBe(3);
  });

  it("represents current, stale, and unavailable tracking safely", () => {
    expect(CURRENT_TRACKING_SHUTTLE.tracking?.status).toBe("CURRENT");
    expect(STALE_TRACKING_SHUTTLE.tracking?.status).toBe("STALE");
    expect(UNAVAILABLE_TRACKING_SHUTTLE.tracking).toMatchObject({
      status: "UNAVAILABLE",
      coordinates: null,
      accuracyMeters: null,
      recordedAt: null,
      receivedAt: null,
    });
  });

  it("normalizes location updates for the fixture shuttle", () => {
    expect(NORMALIZED_LOCATION_UPDATES).toHaveLength(2);

    for (const update of NORMALIZED_LOCATION_UPDATES) {
      expect(update.shuttleId).toBe(FIXTURE_IDS.shuttle);
      expect(update.provider).toBe("AIRTAG");
      expect(update.accuracyMeters).toBeGreaterThanOrEqual(0);
      expect(update.receivedAt).toBeGreaterThanOrEqual(update.recordedAt);
    }
  });

  it("provides bounded routing snapshots for both route directions", () => {
    expect(ROUTING_SNAPSHOTS.map(({ routeLegId }) => routeLegId)).toEqual([
      FIXTURE_IDS.routeLegs.outbound,
      FIXTURE_IDS.routeLegs.return,
    ]);

    for (const snapshot of ROUTING_SNAPSHOTS) {
      expect(snapshot.shuttleId).toBe(FIXTURE_IDS.shuttle);
      expect(snapshot.totalDistanceMeters).toBeGreaterThanOrEqual(0);
      expect(snapshot.remainingDistanceMeters).toBeGreaterThanOrEqual(0);
      expect(snapshot.remainingDistanceMeters).toBeLessThanOrEqual(
        snapshot.totalDistanceMeters,
      );
      expect(snapshot.estimatedDurationSeconds).toBeGreaterThanOrEqual(0);
      expect(snapshot.progressRatio).toBeGreaterThanOrEqual(0);
      expect(snapshot.progressRatio).toBeLessThanOrEqual(1);
    }
  });
});
