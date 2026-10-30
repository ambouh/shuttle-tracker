import { describe, expect, it } from "vitest";
import type { JourneyId, LocationId, OrganizationId, RouteLegId, ShuttleId, UserId, WaitlistEntryId } from "../types/domain";
import type { PublicJourneySnapshot } from "../types/live-journey";
import { buildLiveJourneyOverview, formatRecordedLocation } from "./live-journey-overview";

const organizationId = "org-public" as OrganizationId;
const journeyId = "journey-public" as JourneyId;
const outbound = "leg-outbound" as RouteLegId;
const inbound = "leg-inbound" as RouteLegId;
const church = "location-church" as LocationId;
const school = "location-school" as LocationId;
const riderId = "person-rider" as UserId;
const driverId = "person-driver" as UserId;
const shuttleId = "shuttle-public" as ShuttleId;
const recordedAt = Date.UTC(2026, 3, 12, 13);

function getSnapshot(): PublicJourneySnapshot {
  return {
    organization: { id: organizationId, slug: "union-church", details: {
      displayName: "Union Church", description: null, logoUrl: null, logoAltText: null, fallbackInitials: "U",
    } },
    journey: { id: journeyId, organizationId, name: "Sunday Service", description: null,
      routeLegIds: [outbound, inbound], activeRouteLegId: outbound },
    routeLegs: [outbound, inbound].map((id, index) => ({
      id, journeyId, sequence: index, name: `Leg ${index}`, currentCycle: 3,
      departureLocationId: index === 0 ? church : school,
      arrivalLocationId: index === 0 ? school : church,
      scheduledDepartureAt: recordedAt, scheduledArrivalAt: recordedAt + 600000,
      status: index === 0 ? "IN_TRANSIT" : "NOT_STARTED", comments: [],
      waitlist: [{ id: `entry-${index}` as WaitlistEntryId, userId: riderId, routeLegId: id, requestedAt: recordedAt }],
    })),
    locations: [church, school].map((id, index) => ({ id, name: index === 0 ? "Union Church" : "School",
      address: "Public address", latitude: 39, longitude: -76 })),
    users: [
      { id: riderId, firstName: "Maya", lastInitial: "R", profileImageUrl: null },
      { id: driverId, firstName: "John", lastInitial: "S", profileImageUrl: null },
    ],
    shuttle: { id: shuttleId, name: "Shuttle", activeDriverId: driverId, activeTrackingProvider: "AIRTAG",
      tracking: { status: "CURRENT", coordinates: { latitude: 39, longitude: -76 },
        accuracyMeters: null, recordedAt, receivedAt: recordedAt + 1000 } },
    routingSnapshots: [{ routeLegId: outbound, shuttleId, origin: { latitude: 39, longitude: -76 },
      destination: { latitude: 39.1, longitude: -76.1 }, totalDistanceMeters: 1000,
      remainingDistanceMeters: 600, estimatedDurationSeconds: 301, estimatedArrivalAt: recordedAt + 301000,
      progressRatio: 0.4, encodedGeometry: null, calculatedAt: recordedAt }],
  };
}

describe("public journey presentation", () => {
  it("renders public people and native IDs without constructing private users", () => {
    const model = buildLiveJourneyOverview(getSnapshot());
    expect(model.journeyId).toBe(journeyId);
    expect(model.routeCards.map(route => route.id)).toEqual([outbound, inbound]);
    expect(model.currentRider).toEqual({ firstName: "Rider", displayName: "Rider", initials: "R", profileImageUrl: null });
    expect(model.routeCards[0]).toMatchObject({
      driver: { displayName: "John", initials: "JS" }, departureName: "Union Church", arrivalName: "School",
      statusLabel: "In transit", tone: "active", departureTime: "09:00", arrivalTime: "09:10",
      waitlistAvatars: [{ userId: riderId, displayName: "Maya R", initials: "MR" }],
      waitlistCopy: "Maya was picked up", currentRiderWaiting: false, pickupEligible: false,
      timingMessage: "Recorded estimate: 6 mins", progressPercent: 40,
    });
    expect(model.routeCards[1]).toMatchObject({ waitlistCopy: "Maya is waiting for pickup", currentRiderWaiting: false });
  });

  it("preserves journey ordering when records arrive in a different order", () => {
    const snapshot = getSnapshot();
    snapshot.routeLegs.reverse();
    expect(buildLiveJourneyOverview(snapshot).routeCards.map(route => route.id)).toEqual([outbound, inbound]);
  });

  it("uses the stored active leg, including null, without choosing the first transit leg", () => {
    const snapshot = getSnapshot();
    snapshot.routeLegs[1].status = "IN_TRANSIT";
    snapshot.journey.activeRouteLegId = inbound;
    expect(buildLiveJourneyOverview(snapshot).routeCards.map(route => route.tone)).toEqual(["idle", "active"]);
    snapshot.journey.activeRouteLegId = null;
    expect(buildLiveJourneyOverview(snapshot).routeCards.map(route => route.tone)).toEqual(["idle", "idle"]);
  });

  it("handles absent driver, routing, tracking and memberships without substitute people", () => {
    const snapshot = getSnapshot();
    snapshot.shuttle.activeDriverId = null;
    snapshot.shuttle.tracking = null;
    snapshot.routingSnapshots = [];
    snapshot.users = [];
    snapshot.routeLegs.forEach(leg => { leg.waitlist = []; });
    const model = buildLiveJourneyOverview(snapshot);
    expect(model.routeCards[0]).toMatchObject({ driver: null, driverLabel: "Driver unavailable",
      timingMessage: "Timing unavailable", waitlistAvatars: [], waitlistCopy: "No riders picked up" });
    expect(model.routeCards[1].waitlistCopy).toBe("No one waiting for pickup");
    expect(formatRecordedLocation(snapshot)).toBe("Shuttle location unavailable");
  });

  it("keeps historical estimates and timestamps instead of treating the connection as fresh GPS", () => {
    const snapshot = getSnapshot();
    const before = structuredClone(snapshot);
    expect(formatRecordedLocation(snapshot)).toBe("Shuttle location recorded Apr 12, 2026, 9:00 AM (Eastern)");
    expect(buildLiveJourneyOverview(snapshot).routeCards[0].timingMessage).toBe("Recorded estimate: 6 mins");
    expect(snapshot).toEqual(before);
    snapshot.shuttle.tracking!.status = "STALE";
    expect(formatRecordedLocation(snapshot)).toContain("Apr 12, 2026");
  });

  it("handles partial tracking and a legitimate zero timestamp", () => {
    const snapshot = getSnapshot();
    snapshot.shuttle.tracking!.recordedAt = null;
    expect(formatRecordedLocation(snapshot)).toBe("Shuttle location unavailable");
    snapshot.shuttle.tracking!.recordedAt = 0;
    expect(formatRecordedLocation(snapshot)).toContain("Dec 31, 1969");
    snapshot.shuttle.tracking!.coordinates = null;
    expect(formatRecordedLocation(snapshot)).toBe("Shuttle location unavailable");
  });

  it("builds initials from Unicode code points and supports missing surname initials", () => {
    const snapshot = getSnapshot();
    snapshot.users[0] = { ...snapshot.users[0], firstName: "𠮷", lastInitial: "" };
    expect(buildLiveJourneyOverview(snapshot).routeCards[0].waitlistAvatars[0]).toMatchObject({ displayName: "𠮷", initials: "𠮷" });
  });
});
