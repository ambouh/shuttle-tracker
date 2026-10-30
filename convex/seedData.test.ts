import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import { FIXTURE_IDS } from "../fixtures/ids";
import { ROUTING_SNAPSHOTS } from "../fixtures/operational-scenarios";
import { UNION_ORGANIZATION } from "../fixtures/organization";
import { SUNDAY_SERVICE_FIXTURE } from "../fixtures/sunday-service";
import type { JourneyId, LocationId, OrganizationId, RouteLegId, ShuttleId, UserId } from "@/types/domain";

import { prepareSeedData, prepareSundayServiceSeed, type SeedSource } from "./seedData";

function source(): SeedSource {
  return structuredClone({
    ...SUNDAY_SERVICE_FIXTURE,
    organization: UNION_ORGANIZATION,
    activeRouteLegId: FIXTURE_IDS.routeLegs.outbound,
    routingSnapshots: ROUTING_SNAPSHOTS,
  });
}

const FOREIGN_ORGANIZATION = "organization-other" as OrganizationId;

describe("Sunday Service seed mapping", () => {
  it("prepares the complete reference dataset with stable fixture lookup keys", () => {
    const seed = prepareSundayServiceSeed();
    expect({
      organizations: 1, users: seed.users.length, locations: seed.locations.length,
      shuttles: 1, journeys: 1, legs: seed.routeLegs.length,
      waitlistEntries: seed.waitlistEntries.length, comments: seed.routeLegComments.length,
      routingSnapshots: seed.routingSnapshots.length,
    }).toEqual({ organizations: 1, users: 8, locations: 2, shuttles: 1, journeys: 1,
      legs: 2, waitlistEntries: 6, comments: 2, routingSnapshots: 2 });
    expect(seed.organization).toEqual(UNION_ORGANIZATION);
    expect(seed.users).toEqual(SUNDAY_SERVICE_FIXTURE.users);
    expect(seed.locations).toEqual(SUNDAY_SERVICE_FIXTURE.locations);
    expect(seed.shuttle).toEqual(SUNDAY_SERVICE_FIXTURE.shuttle);
    expect(seed.journey).toEqual({ ...SUNDAY_SERVICE_FIXTURE.journey,
      shuttleId: FIXTURE_IDS.shuttle, activeRouteLegId: FIXTURE_IDS.routeLegs.outbound });
    expect(seed.routingSnapshots).toEqual(ROUTING_SNAPSHOTS);
  });

  it("extracts rider records at cycle one while preserving order, statuses and timestamps", () => {
    const seed = prepareSundayServiceSeed();
    expect(seed.routeLegs.map((leg) => leg.id)).toEqual(seed.journey.routeLegIds);
    for (const [index, leg] of seed.routeLegs.entries()) {
      const original = SUNDAY_SERVICE_FIXTURE.routeLegs[index];
      expect(leg).not.toHaveProperty("waitlist");
      expect(leg).not.toHaveProperty("comments");
      const waitlist = seed.waitlistEntries.filter((entry) => entry.routeLegId === leg.id);
      const comments = seed.routeLegComments.filter((comment) => comment.routeLegId === leg.id);
      expect(leg.currentCycle).toBe(1);
      expect(waitlist.every((entry) => entry.cycle === 1)).toBe(true);
      expect(comments.every((comment) => comment.cycle === 1)).toBe(true);
      const { currentCycle, ...originalLeg } = leg;
      expect(currentCycle).toBe(1);
      expect({ ...originalLeg,
        waitlist: waitlist.map(({ cycle, ...entry }) => { expect(cycle).toBe(1); return entry; }),
        comments: comments.map(({ cycle, ...comment }) => { expect(cycle).toBe(1); return comment; }),
      }).toEqual(original);
    }
  });

  it("returns detached records so preparation or later edits cannot mutate fixtures", () => {
    const input = source();
    const original = structuredClone(input);
    const seed = prepareSeedData(input);
    expect(input).toEqual(original);
    seed.organization.details.displayName = "Edited";
    seed.journey.routeLegIds.reverse();
    seed.users[0].firstName = "Edited";
    seed.locations[0].latitude = 0;
    seed.shuttle.tracking!.coordinates!.latitude = 0;
    seed.shuttle.tracking!.recordedAt = 0;
    seed.routeLegs[0].status = "DEPARTING";
    seed.waitlistEntries[0].requestedAt = 0;
    seed.routeLegComments[0].message = "Edited";
    seed.routingSnapshots[0].origin.latitude = 0;
    seed.routingSnapshots[0].destination.longitude = 0;
    expect(input).toEqual(original);
    expect(prepareSundayServiceSeed()).toEqual(prepareSundayServiceSeed());
  });

  it("preserves nullable driver, tracking, active leg, and phone values", () => {
    const input = source();
    input.shuttle.activeDriverId = null;
    input.shuttle.activeTrackingProvider = null;
    input.shuttle.tracking = null;
    input.activeRouteLegId = null;
    const seed = prepareSeedData(input);
    expect(seed.shuttle).toEqual(input.shuttle);
    expect(seed.journey.activeRouteLegId).toBeNull();
    expect(seed.users[0].phoneNumber).toBeNull();
  });

  it("accepts the same rider on different legs and repeated comments from one author", () => {
    const input = source();
    input.routeLegs[1].waitlist[0].userId = input.routeLegs[0].waitlist[0].userId;
    input.routeLegs[0].comments[1].authorUserId = input.routeLegs[0].comments[0].authorUserId;
    expect(prepareSeedData(input).waitlistEntries).toHaveLength(6);
  });

  it("preserves partially unavailable tracking without fabricating fresh readings", () => {
    const input = source();
    input.shuttle.tracking = {
      status: "UNAVAILABLE", coordinates: null, recordedAt: null, receivedAt: null, accuracyMeters: null,
    };
    expect(prepareSeedData(input).shuttle.tracking).toEqual(input.shuttle.tracking);
  });
});

interface InvalidGraphCase {
  name: string;
  reason: string;
  change: (input: SeedSource) => void;
}

const invalidGraphs: InvalidGraphCase[] = [
  { name: "duplicate users", reason: "DUPLICATE_USER_ID", change: (s) => { s.users.push(s.users[0]); } },
  { name: "duplicate locations", reason: "DUPLICATE_LOCATION_ID", change: (s) => { s.locations.push(s.locations[0]); } },
  { name: "duplicate legs", reason: "DUPLICATE_LEG_ID", change: (s) => { s.routeLegs.push(s.routeLegs[0]); } },
  { name: "duplicate waitlist IDs", reason: "DUPLICATE_WAITLIST_ID", change: (s) => {
    s.routeLegs[1].waitlist[0].id = s.routeLegs[0].waitlist[0].id;
  } },
  { name: "duplicate comment IDs", reason: "DUPLICATE_COMMENT_ID", change: (s) => {
    s.routeLegs[0].comments[1].id = s.routeLegs[0].comments[0].id;
  } },
  { name: "duplicate members with distinct entry IDs", reason: "DUPLICATE_MEMBERSHIP", change: (s) => {
    s.routeLegs[0].waitlist[1].userId = s.routeLegs[0].waitlist[0].userId;
  } },
  { name: "missing waitlist users", reason: "WAITLIST_USER_NOT_FOUND", change: (s) => {
    s.users = s.users.filter((u) => u.id !== s.routeLegs[0].waitlist[0].userId);
  } },
  { name: "missing comment authors", reason: "COMMENT_AUTHOR_NOT_FOUND", change: (s) => {
    s.users = s.users.filter((u) => u.id !== s.routeLegs[0].comments[0].authorUserId);
  } },
  { name: "waitlists embedded on another leg", reason: "WAITLIST_LEG_MISMATCH", change: (s) => {
    s.routeLegs[0].waitlist[0].routeLegId = s.routeLegs[1].id;
  } },
  { name: "comments embedded on another leg", reason: "COMMENT_LEG_MISMATCH", change: (s) => {
    s.routeLegs[0].comments[0].routeLegId = s.routeLegs[1].id;
  } },
  { name: "guest organization assignment", reason: "USER_ORGANIZATION_MISMATCH", change: (s) => {
    s.users[1].organizationId = s.organization.id;
  } },
  { name: "missing member organization", reason: "USER_ORGANIZATION_MISMATCH", change: (s) => {
    s.users[0].organizationId = null;
  } },
  { name: "foreign rider", reason: "USER_ORGANIZATION_MISMATCH", change: (s) => {
    s.users[2].role = "rider"; s.users[2].organizationId = FOREIGN_ORGANIZATION;
  } },
  { name: "foreign author", reason: "USER_ORGANIZATION_MISMATCH", change: (s) => {
    s.users[1].role = "rider"; s.users[1].organizationId = FOREIGN_ORGANIZATION;
  } },
  { name: "foreign driver", reason: "USER_ORGANIZATION_MISMATCH", change: (s) => {
    s.users[0].organizationId = FOREIGN_ORGANIZATION;
  } },
  { name: "foreign shuttle", reason: "SHUTTLE_ORGANIZATION_MISMATCH", change: (s) => {
    s.shuttle.organizationId = FOREIGN_ORGANIZATION;
  } },
  { name: "foreign location", reason: "LOCATION_ORGANIZATION_MISMATCH", change: (s) => {
    s.locations[0].organizationId = FOREIGN_ORGANIZATION;
  } },
  { name: "foreign journey", reason: "JOURNEY_ORGANIZATION_MISMATCH", change: (s) => {
    s.journey.organizationId = FOREIGN_ORGANIZATION;
  } },
  { name: "missing driver", reason: "DRIVER_NOT_FOUND", change: (s) => {
    s.shuttle.activeDriverId = "missing-driver" as UserId;
  } },
  { name: "non-driver assignment", reason: "DRIVER_ROLE_REQUIRED", change: (s) => {
    s.shuttle.activeDriverId = s.users[1].id;
  } },
  { name: "empty journey", reason: "INVALID_LEG_ORDER", change: (s) => { s.journey.routeLegIds = []; } },
  { name: "duplicate ordered legs", reason: "INVALID_LEG_ORDER", change: (s) => {
    s.journey.routeLegIds[1] = s.journey.routeLegIds[0];
  } },
  { name: "reversed leg order", reason: "INVALID_LEG_ORDER", change: (s) => { s.journey.routeLegIds.reverse(); } },
  { name: "omitted leg", reason: "INVALID_LEG_ORDER", change: (s) => { s.journey.routeLegIds.pop(); } },
  { name: "missing leg", reason: "ROUTE_LEG_NOT_FOUND", change: (s) => {
    s.journey.routeLegIds[0] = "missing-leg" as RouteLegId;
  } },
  { name: "foreign leg parent", reason: "ROUTE_LEG_JOURNEY_MISMATCH", change: (s) => {
    s.routeLegs[0].journeyId = "foreign-journey" as JourneyId;
  } },
  { name: "foreign active leg", reason: "ACTIVE_LEG_NOT_IN_JOURNEY", change: (s) => {
    s.activeRouteLegId = "foreign-leg" as RouteLegId;
  } },
  { name: "missing departure endpoint", reason: "LOCATION_NOT_FOUND", change: (s) => {
    s.routeLegs[0].departureLocationId = "missing-location" as LocationId;
  } },
  { name: "missing arrival endpoint", reason: "LOCATION_NOT_FOUND", change: (s) => {
    s.routeLegs[0].arrivalLocationId = "missing-location" as LocationId;
  } },
  { name: "missing routing snapshot", reason: "ROUTING_SNAPSHOT_MISSING", change: (s) => { s.routingSnapshots.pop(); } },
  { name: "duplicate routing snapshot", reason: "DUPLICATE_ROUTING_SNAPSHOT", change: (s) => {
    s.routingSnapshots.push(s.routingSnapshots[0]);
  } },
  { name: "foreign routing leg", reason: "ROUTING_LEG_NOT_FOUND", change: (s) => {
    s.routingSnapshots[0].routeLegId = "foreign-leg" as RouteLegId;
  } },
  { name: "foreign routing shuttle", reason: "ROUTING_SHUTTLE_MISMATCH", change: (s) => {
    s.routingSnapshots[0].shuttleId = "foreign-shuttle" as ShuttleId;
  } },
];

describe("seed graph rejection before import", () => {
  it.each(invalidGraphs)("rejects $name without changing the input", ({ change, reason }) => {
    const input = source();
    change(input);
    const before = structuredClone(input);
    try {
      prepareSeedData(input);
      expect.fail("Expected the invalid graph to be rejected");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      expect((error as ConvexError<{ code: string; reason: string }>).data)
        .toEqual({ code: "INVALID_SEED_DATA", reason });
    }
    expect(input).toEqual(before);
  });

  it.each<[string, (s: SeedSource) => void]>([
    ["blank fixture ID", (s) => { s.users[0].id = " " as UserId; }],
    ["blank label", (s) => { s.journey.name = " "; }],
    ["blank comment", (s) => { s.routeLegs[0].comments[0].message = " "; }],
    ["latitude", (s) => { s.locations[0].latitude = 91; }],
    ["longitude", (s) => { s.routingSnapshots[0].destination.longitude = -181; }],
    ["progress above one", (s) => { s.routingSnapshots[0].progressRatio = 1.01; }],
    ["negative progress", (s) => { s.routingSnapshots[0].progressRatio = -0.01; }],
    ["nonfinite progress", (s) => { s.routingSnapshots[0].progressRatio = NaN; }],
    ["negative distance", (s) => { s.routingSnapshots[0].remainingDistanceMeters = -1; }],
    ["nonfinite duration", (s) => { s.routingSnapshots[0].estimatedDurationSeconds = Infinity; }],
    ["negative accuracy", (s) => { s.shuttle.tracking!.accuracyMeters = -1; }],
    ["nonfinite timestamp", (s) => { s.users[0].createdAt = Infinity; }],
    ["nonfinite schedule", (s) => { s.routeLegs[0].scheduledDepartureAt = NaN; }],
    ["nonfinite request time", (s) => { s.routeLegs[0].waitlist[0].requestedAt = NaN; }],
    ["nonfinite comment time", (s) => { s.routeLegs[0].comments[0].createdAt = Infinity; }],
    ["zero geofence", (s) => { s.routeLegs[0].departureGeofenceRadius = 0; }],
  ])("rejects malformed %s without changing the input", (_name, change) => {
    const input = source();
    change(input);
    const before = structuredClone(input);
    expect(() => prepareSeedData(input)).toThrow(ConvexError);
    expect(input).toEqual(before);
  });

  it("does not include contact details or supplied values in validation errors", () => {
    const input = source();
    const contact = input.users[2].phoneNumber!;
    input.routeLegs[0].waitlist[1].userId = input.routeLegs[0].waitlist[0].userId;
    try {
      prepareSeedData(input);
      expect.fail("Expected duplicate membership rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      expect(String(error)).not.toContain(contact);
      expect(String(error)).not.toContain(input.users[2].firstName);
    }
  });
});
