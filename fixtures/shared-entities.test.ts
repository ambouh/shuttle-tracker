import { describe, expect, it } from "vitest";

import { FIXTURE_IDS } from "./ids";
import { REFERENCE_TIMESTAMPS } from "./reference-time";
import {
  GUEST_RIDERS,
  GUILFORD_ELEMENTARY,
  JOHN_SMITH,
  SUNDAY_SERVICE_LOCATIONS,
  SUNDAY_SERVICE_USERS,
  UNION_CHURCH,
  UNION_SHUTTLE,
} from "./shared-entities";

describe("Sunday Service fixture foundations", () => {
  it("uses stable IDs and fixed Unix-millisecond timestamps", () => {
    expect(FIXTURE_IDS.shuttle).toBe("shuttle-union-one");
    expect(REFERENCE_TIMESTAMPS.serviceStartsAt).toBe(1_788_699_600_000);
    expect(REFERENCE_TIMESTAMPS.updatedAt).toBeGreaterThan(
      REFERENCE_TIMESTAMPS.createdAt,
    );
  });

  it("defines the two planned Sunday Service locations", () => {
    expect(SUNDAY_SERVICE_LOCATIONS).toHaveLength(2);
    expect(UNION_CHURCH).toMatchObject({
      id: FIXTURE_IDS.locations.unionChurch,
      address: "7195 Oakland Mills Rd, Columbia, MD 21046",
    });
    expect(GUILFORD_ELEMENTARY).toMatchObject({
      id: FIXTURE_IDS.locations.guilfordElementary,
      address: "7335 Oakland Mills Rd, Columbia, MD 21046",
    });
  });

  it("keeps driver and guest identities distinct", () => {
    const userIds = SUNDAY_SERVICE_USERS.map(({ id }) => id);

    expect(JOHN_SMITH.userType).toBe("driver");
    expect(GUEST_RIDERS.every(({ userType }) => userType === "guest")).toBe(true);
    expect(new Set(userIds).size).toBe(userIds.length);
  });

  it("gives the shuttle a normalized current tracking snapshot", () => {
    expect(UNION_SHUTTLE).toMatchObject({
      id: FIXTURE_IDS.shuttle,
      activeTrackingProvider: "AIRTAG",
      tracking: {
        status: "CURRENT",
        accuracyMeters: 12,
        recordedAt: REFERENCE_TIMESTAMPS.currentLocationRecordedAt,
        receivedAt: REFERENCE_TIMESTAMPS.currentLocationReceivedAt,
      },
    });
    expect(UNION_SHUTTLE.tracking.coordinates).not.toBeNull();
  });
});
