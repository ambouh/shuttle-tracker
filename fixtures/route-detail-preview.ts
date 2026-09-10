import type { RoutingSnapshot, Timestamp } from "@/types/domain";

import { FIXTURE_IDS } from "./ids";
import { REFERENCE_TIMESTAMPS } from "./reference-time";
import { GUILFORD_ELEMENTARY, UNION_CHURCH } from "./shared-entities";

export interface NormalizedMapPoint {
  x: number;
  y: number;
}

export interface RouteDetailPreviewScenario {
  routeLegId: typeof FIXTURE_IDS.routeLegs.outbound;
  referenceAt: Timestamp;
  riderSubtitle: string;
  mapPath: readonly NormalizedMapPoint[];
  routingSnapshot: RoutingSnapshot;
  scheduledPickup: {
    scheduledAt: Timestamp;
    bestPickupAt: Timestamp;
    partySize: number;
  };
}

export const ROUTE_DETAIL_PREVIEW_SCENARIO = {
  routeLegId: FIXTURE_IDS.routeLegs.outbound,
  referenceAt: REFERENCE_TIMESTAMPS.updatedAt,
  riderSubtitle: "Greeters Team",
  mapPath: [
    { x: 0.73, y: 0.12 },
    { x: 0.56, y: 0.28 },
    { x: 0.63, y: 0.46 },
    { x: 0.38, y: 0.57 },
    { x: 0.2, y: 0.78 },
    { x: 0.28, y: 0.9 },
  ],
  routingSnapshot: {
    routeLegId: FIXTURE_IDS.routeLegs.outbound,
    shuttleId: FIXTURE_IDS.shuttle,
    origin: {
      latitude: UNION_CHURCH.latitude,
      longitude: UNION_CHURCH.longitude,
    },
    destination: {
      latitude: GUILFORD_ELEMENTARY.latitude,
      longitude: GUILFORD_ELEMENTARY.longitude,
    },
    totalDistanceMeters: 965.6064,
    remainingDistanceMeters: 193.12128,
    estimatedDurationSeconds: 120,
    estimatedArrivalAt: (REFERENCE_TIMESTAMPS.serviceStartsAt +
      180_000) as Timestamp,
    progressRatio: 0.8,
    encodedGeometry: null,
    calculatedAt: REFERENCE_TIMESTAMPS.currentLocationReceivedAt,
  },
  scheduledPickup: {
    scheduledAt: (REFERENCE_TIMESTAMPS.returnScheduledDepartureAt +
      1_500_000) as Timestamp,
    bestPickupAt: (REFERENCE_TIMESTAMPS.returnScheduledDepartureAt +
      1_800_000) as Timestamp,
    partySize: 6,
  },
} satisfies RouteDetailPreviewScenario;
