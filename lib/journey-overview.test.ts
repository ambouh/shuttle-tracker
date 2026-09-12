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
      waitlistCopy: "Faith and 2 others picked up",
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
      waitlistCopy: "Maya and 2 others are waiting for pickup",
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
      waitlistCopy: "No riders picked up",
    });
    expect(viewModel.routeCards[1].waitlistCopy).toBe(
      "No one waiting for pickup",
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

it("uses a neutral rider when no guest has been restored", () => {
  const model = buildJourneyOverviewViewModel({ ...getInput(), currentRiderId: null });
  expect(model.currentRider.firstName).toBe("Rider");
  expect(model.currentRider.profileImageUrl).toBeNull();
});

it("recognizes current-rider membership beyond the three-avatar preview", () => {
  const input = getInput();
  const selected = input.routeLegs[1];
  const model = buildJourneyOverviewViewModel({ ...input, routeLegs: [input.routeLegs[0], {
    ...selected, waitlist: [...selected.waitlist, {
      id: "waitlist-current" as typeof selected.waitlist[number]["id"],
      userId: JOSH_WILLIAMS.id, routeLegId: selected.id, requestedAt: 1,
    }],
  }] });
  expect(model.routeCards[1].currentRiderWaiting).toBe(true);
  expect(model.routeCards[1].waitlistCopy).toBe("You and 3 others are waiting for pickup");
  expect(model.routeCards[0].currentRiderWaiting).toBe(false);
});

it("keeps membership visible while transit locks pickup changes", () => {
  const input = getInput();
  const model = buildJourneyOverviewViewModel({ ...input, currentRiderId: input.routeLegs[0].waitlist[0].userId });
  expect(model.routeCards[0]).toMatchObject({ currentRiderWaiting: true, pickupEligible: false });
});

it.each([
  [0, false, "No one waiting for pickup"],
  [1, false, "Maya is waiting for pickup"],
  [2, false, "Maya and 1 other are waiting for pickup"],
  [3, false, "Maya and 2 others are waiting for pickup"],
  [1, true, "You are waiting for pickup"],
  [2, true, "You and 1 other are waiting for pickup"],
  [3, true, "You and 2 others are waiting for pickup"],
])("personalizes waitlist copy for %s riders, current guest included: %s", (count, includesYou, copy) => {
  const input = getInput();
  const leg = input.routeLegs[1];
  const model = buildJourneyOverviewViewModel({ ...input,
    currentRiderId: includesYou ? leg.waitlist[0].userId : null,
    routeLegs: [input.routeLegs[0], { ...leg, waitlist: leg.waitlist.slice(0, count) }],
  });
  expect(model.routeCards[1].waitlistCopy).toBe(copy);
});

it("counts missing rider records and uses a readable name fallback", () => {
  const input = getInput();
  const model = buildJourneyOverviewViewModel({ ...input, users: [], currentRiderId: null });
  expect(model.routeCards[1].waitlistCopy).toBe("A rider and 2 others are waiting for pickup");
});
