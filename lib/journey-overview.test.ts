import { describe, expect, it } from "vitest";

import {
  FIXTURE_IDS,
  JOSH_WILLIAMS,
  ROUTING_SNAPSHOTS,
  SUNDAY_SERVICE_FIXTURE,
  UNION_ORGANIZATION,
} from "../fixtures";
import {
  buildJourneyOverviewViewModel,
  type JourneyOverviewInput,
} from "./journey-overview";

function getInput(): JourneyOverviewInput {
  return {
    organization: UNION_ORGANIZATION,
    journey: SUNDAY_SERVICE_FIXTURE.journey,
    routeLegs: SUNDAY_SERVICE_FIXTURE.routeLegs,
    locations: SUNDAY_SERVICE_FIXTURE.locations,
    users: SUNDAY_SERVICE_FIXTURE.users,
    shuttle: SUNDAY_SERVICE_FIXTURE.shuttle,
    routingSnapshots: ROUTING_SNAPSHOTS,
    currentRiderId: JOSH_WILLIAMS.id,
  };
}

describe("Journey Overview presentation adapter", () => {
  it("resolves the canonical Journey into ordered route cards", () => {
    const viewModel = buildJourneyOverviewViewModel(getInput());

    expect(viewModel.organization.fallbackInitials).toBe("U");
    expect(viewModel.currentRider).toEqual({
      firstName: "Josh",
      displayName: "Josh Williams",
      initials: "JW",
      profileImageUrl: null,
    });
    expect(viewModel.routeCards.map(({ id }) => id)).toEqual(
      SUNDAY_SERVICE_FIXTURE.journey.routeLegIds,
    );
    expect(viewModel.routeCards[0]).toMatchObject({
      departureName: "Union Church",
      arrivalName: "Guilford Elementary School",
      driver: { displayName: "John", initials: "JS" },
      driverLabel: "Driver",
      statusLabel: "In transit",
      tone: "active",
      departureTime: "09:00",
      arrivalTime: "09:45",
      timingMessage: "15 mins remaining",
      progressPercent: 40,
      waitlistCopy: "3 people picked up",
      pickupEligible: false,
    });
    expect(viewModel.routeCards[1]).toMatchObject({
      departureName: "Guilford Elementary School",
      arrivalName: "Union Church",
      statusLabel: "Not started",
      tone: "idle",
      departureTime: "10:15",
      arrivalTime: "11:00",
      timingMessage: "Starting in 20 mins",
      progressPercent: 0,
      waitlistCopy: "3 people waiting to be picked up",
      pickupEligible: true,
    });
  });

  it("provides safe output for missing driver, routing, rider, and waitlist data", () => {
    const input = getInput();
    const viewModel = buildJourneyOverviewViewModel({
      ...input,
      currentRiderId: "user-missing" as typeof FIXTURE_IDS.users.joshWilliams,
      shuttle: { ...input.shuttle, activeDriverId: null },
      routingSnapshots: [],
      routeLegs: input.routeLegs.map((routeLeg) => ({
        ...routeLeg,
        waitlist: [],
      })),
    });

    expect(viewModel.currentRider).toEqual({
      firstName: "Rider",
      displayName: "Rider",
      initials: "R",
      profileImageUrl: null,
    });
    expect(viewModel.routeCards[0]).toMatchObject({
      driver: null,
      driverLabel: "Driver unavailable",
      timingMessage: "Timing unavailable",
      progressPercent: 0,
      waitlistAvatars: [],
      waitlistCopy: "0 people picked up",
    });
    expect(viewModel.routeCards[1].waitlistCopy).toBe(
      "0 people waiting to be picked up",
    );
  });

  it("clamps progress for display and exposes pickup during departing", () => {
    const input = getInput();
    const viewModel = buildJourneyOverviewViewModel({
      ...input,
      routeLegs: input.routeLegs.map((routeLeg, index) =>
        index === 0 ? { ...routeLeg, status: "DEPARTING" } : routeLeg,
      ),
      routingSnapshots: input.routingSnapshots.map((snapshot, index) =>
        index === 0 ? { ...snapshot, progressRatio: 2 } : snapshot,
      ),
    });

    expect(viewModel.routeCards[0]).toMatchObject({
      statusLabel: "Departing",
      timingMessage: "Departing now",
      progressPercent: 100,
      pickupEligible: true,
    });
  });
});
