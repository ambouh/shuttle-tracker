import { describe, expect, it } from "vitest";

import {
  FIXTURE_IDS,
  JOSH_WILLIAMS,
  ROUTE_DETAIL_PREVIEW_SCENARIO,
  SUNDAY_SERVICE_FIXTURE,
  UNION_ORGANIZATION,
} from "../fixtures";
import type { RouteDetailPreviewScenario } from "../fixtures";
import type { OrganizationId } from "../types/domain";

import {
  buildRouteDetailPreviewViewModel,
  type RouteDetailPreviewInput,
} from "./route-detail-preview";

function makeInput(
  overrides: Partial<RouteDetailPreviewInput> = {},
): RouteDetailPreviewInput {
  return {
    organization: UNION_ORGANIZATION,
    journey: SUNDAY_SERVICE_FIXTURE.journey,
    routeLegs: SUNDAY_SERVICE_FIXTURE.routeLegs,
    locations: SUNDAY_SERVICE_FIXTURE.locations,
    users: SUNDAY_SERVICE_FIXTURE.users,
    shuttle: SUNDAY_SERVICE_FIXTURE.shuttle,
    currentRiderId: JOSH_WILLIAMS.id,
    scenario: ROUTE_DETAIL_PREVIEW_SCENARIO,
    ...overrides,
  };
}

describe("buildRouteDetailPreviewViewModel", () => {
  it("builds the approved canonical preview from related fixture data", () => {
    const model = buildRouteDetailPreviewViewModel(makeInput());

    expect(model).toMatchObject({
      routeLegId: FIXTURE_IDS.routeLegs.outbound,
      rider: {
        displayName: "Josh Williams",
        initials: "JW",
        subtitle: "Greeters Team",
      },
      route: {
        departureName: "Union Church",
        arrivalName: "Guilford Elementary School",
        statusLabel: "In transit",
        departureTime: "09:00",
        arrivalTime: "09:03",
        progressPercent: 80,
      },
      metrics: {
        eta: "2 min",
        distance: "0.6 miles",
        freshness: "Updated 15 mins ago",
      },
      waitlistCopy: "3 people picked up and riding",
      emptyCommentsCopy: "No comments yet",
      scheduledPickup: {
        scheduledTime: "10:40 am",
        bestPickupTime: "10:45 am",
        partyCopy: "You and 5 others are scheduled",
      },
      driver: {
        displayName: "John Smith",
        initials: "JS",
        phoneNumber: null,
      },
    });
    expect(model?.waitlist.map(({ initials }) => initials)).toEqual([
      "FA",
      "AM",
      "SR",
    ]);
    expect(model?.comments).toEqual([
      expect.objectContaining({
        displayName: "Josh Williams",
        message: "I'm coming...",
        isDriver: false,
      }),
      expect.objectContaining({
        displayName: "John Smith",
        message: "Okay, I'll wait for you",
        isDriver: true,
      }),
    ]);
  });

  it("uses explicit safe output when optional relationships are missing", () => {
    const invalidScenario = {
      ...ROUTE_DETAIL_PREVIEW_SCENARIO,
      riderSubtitle: "",
      mapPath: [{ x: -1, y: 2 }],
      routingSnapshot: {
        ...ROUTE_DETAIL_PREVIEW_SCENARIO.routingSnapshot,
        routeLegId: FIXTURE_IDS.routeLegs.return,
      },
    } satisfies RouteDetailPreviewScenario;
    const routeLeg = {
      ...SUNDAY_SERVICE_FIXTURE.routeLegs[0],
      waitlist: [],
      comments: [],
    };
    const model = buildRouteDetailPreviewViewModel(
      makeInput({
        routeLegs: [routeLeg],
        locations: [],
        users: [],
        shuttle: {
          ...SUNDAY_SERVICE_FIXTURE.shuttle,
          activeDriverId: null,
          tracking: null,
        },
        scenario: invalidScenario,
      }),
    );

    expect(model).toMatchObject({
      rider: {
        displayName: "Rider",
        initials: "R",
        profileImageUrl: null,
        subtitle: "Shuttle rider",
      },
      route: {
        departureName: "Location unavailable",
        arrivalName: "Location unavailable",
        arrivalTime: "Unavailable",
        progressPercent: 0,
      },
      metrics: {
        eta: "ETA unavailable",
        distance: "Distance unavailable",
        freshness: "Location unavailable",
      },
      waitlist: [],
      comments: [],
      driver: null,
    });
    expect(model?.map.path).toHaveLength(2);
  });

  it("falls back safely for unresolved people", () => {
    const routeLeg = SUNDAY_SERVICE_FIXTURE.routeLegs[0];
    const model = buildRouteDetailPreviewViewModel(
      makeInput({ users: [JOSH_WILLIAMS], routeLegs: [routeLeg] }),
    );

    expect(model?.waitlist).toEqual([]);
    expect(model?.comments).toEqual([
      expect.objectContaining({ displayName: "Josh Williams" }),
      expect.objectContaining({
        displayName: "Unknown rider",
        initials: "?",
        isDriver: false,
      }),
    ]);
    expect(model?.driver).toBeNull();
  });

  it("rejects route data outside the selected tenant and journey", () => {
    expect(
      buildRouteDetailPreviewViewModel(
        makeInput({
          shuttle: {
            ...SUNDAY_SERVICE_FIXTURE.shuttle,
            organizationId: "another-organization" as OrganizationId,
          },
        }),
      ),
    ).toBeNull();

    expect(
      buildRouteDetailPreviewViewModel(
        makeInput({ routeLegs: [SUNDAY_SERVICE_FIXTURE.routeLegs[1]] }),
      ),
    ).toBeNull();
  });
});
