import type {
  LocationUpdate,
  RouteLeg,
  RouteStatus,
  RoutingSnapshot,
  Shuttle,
} from "@/types/domain";

import { FIXTURE_IDS } from "./ids";
import { REFERENCE_TIMESTAMPS } from "./reference-time";
import {
  OUTBOUND_ROUTE_LEG,
  RETURN_ROUTE_LEG,
} from "./sunday-service";
import {
  GUILFORD_ELEMENTARY,
  UNION_CHURCH,
  UNION_SHUTTLE,
} from "./shared-entities";

export interface SundayServiceOperationalScenario {
  routeLegs: [RouteLeg, RouteLeg];
  shuttle: Shuttle;
}

export const CURRENT_TRACKING_SHUTTLE = {
  ...UNION_SHUTTLE,
  tracking: {
    ...UNION_SHUTTLE.tracking!,
    coordinates: { ...UNION_SHUTTLE.tracking!.coordinates! },
  },
} satisfies Shuttle;

export const STALE_TRACKING_SHUTTLE = {
  ...UNION_SHUTTLE,
  tracking: {
    ...UNION_SHUTTLE.tracking!,
    status: "STALE",
    coordinates: { ...UNION_SHUTTLE.tracking!.coordinates! },
  },
} satisfies Shuttle;

export const UNAVAILABLE_TRACKING_SHUTTLE = {
  ...UNION_SHUTTLE,
  activeTrackingProvider: null,
  tracking: {
    status: "UNAVAILABLE",
    coordinates: null,
    accuracyMeters: null,
    recordedAt: null,
    receivedAt: null,
  },
} satisfies Shuttle;

export const NOT_STARTED_SCENARIO = {
  routeLegs: [
    {
      ...OUTBOUND_ROUTE_LEG,
      status: "NOT_STARTED",
      waitlist: [...OUTBOUND_ROUTE_LEG.waitlist],
      comments: [...OUTBOUND_ROUTE_LEG.comments],
    },
    {
      ...RETURN_ROUTE_LEG,
      waitlist: [...RETURN_ROUTE_LEG.waitlist],
      comments: [...RETURN_ROUTE_LEG.comments],
    },
  ],
  shuttle: UNAVAILABLE_TRACKING_SHUTTLE,
} satisfies SundayServiceOperationalScenario;

export const DEPARTING_SCENARIO = {
  routeLegs: [
    {
      ...OUTBOUND_ROUTE_LEG,
      status: "DEPARTING",
      waitlist: [...OUTBOUND_ROUTE_LEG.waitlist],
      comments: [...OUTBOUND_ROUTE_LEG.comments],
    },
    {
      ...RETURN_ROUTE_LEG,
      waitlist: [...RETURN_ROUTE_LEG.waitlist],
      comments: [...RETURN_ROUTE_LEG.comments],
    },
  ],
  shuttle: STALE_TRACKING_SHUTTLE,
} satisfies SundayServiceOperationalScenario;

export const IN_TRANSIT_SCENARIO = {
  routeLegs: [
    {
      ...OUTBOUND_ROUTE_LEG,
      waitlist: [...OUTBOUND_ROUTE_LEG.waitlist],
      comments: [...OUTBOUND_ROUTE_LEG.comments],
    },
    {
      ...RETURN_ROUTE_LEG,
      waitlist: [...RETURN_ROUTE_LEG.waitlist],
      comments: [...RETURN_ROUTE_LEG.comments],
    },
  ],
  shuttle: CURRENT_TRACKING_SHUTTLE,
} satisfies SundayServiceOperationalScenario;

export const ROUTE_STATUS_SCENARIOS = {
  NOT_STARTED: NOT_STARTED_SCENARIO,
  DEPARTING: DEPARTING_SCENARIO,
  IN_TRANSIT: IN_TRANSIT_SCENARIO,
} as const satisfies Record<RouteStatus, SundayServiceOperationalScenario>;

export const NORMALIZED_LOCATION_UPDATES = [
  {
    id: FIXTURE_IDS.locationUpdates.outboundCurrent,
    shuttleId: FIXTURE_IDS.shuttle,
    provider: "AIRTAG",
    coordinates: { ...CURRENT_TRACKING_SHUTTLE.tracking!.coordinates! },
    accuracyMeters: CURRENT_TRACKING_SHUTTLE.tracking!.accuracyMeters,
    recordedAt: REFERENCE_TIMESTAMPS.currentLocationRecordedAt,
    receivedAt: REFERENCE_TIMESTAMPS.currentLocationReceivedAt,
  },
  {
    id: FIXTURE_IDS.locationUpdates.returnCurrent,
    shuttleId: FIXTURE_IDS.shuttle,
    provider: "AIRTAG",
    coordinates: {
      latitude: 39.170487,
      longitude: -76.827978,
    },
    accuracyMeters: 18,
    recordedAt: REFERENCE_TIMESTAMPS.updatedAt,
    receivedAt: REFERENCE_TIMESTAMPS.updatedAt,
  },
] satisfies LocationUpdate[];

export const ROUTING_SNAPSHOTS = [
  {
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
    remainingDistanceMeters: 579.36384,
    estimatedDurationSeconds: 900,
    estimatedArrivalAt: REFERENCE_TIMESTAMPS.outboundEstimatedArrivalAt,
    progressRatio: 0.4,
    encodedGeometry: null,
    calculatedAt: REFERENCE_TIMESTAMPS.currentLocationReceivedAt,
  },
  {
    routeLegId: FIXTURE_IDS.routeLegs.return,
    shuttleId: FIXTURE_IDS.shuttle,
    origin: {
      latitude: GUILFORD_ELEMENTARY.latitude,
      longitude: GUILFORD_ELEMENTARY.longitude,
    },
    destination: {
      latitude: UNION_CHURCH.latitude,
      longitude: UNION_CHURCH.longitude,
    },
    totalDistanceMeters: 965.6064,
    remainingDistanceMeters: 965.6064,
    estimatedDurationSeconds: 1_200,
    estimatedArrivalAt: REFERENCE_TIMESTAMPS.returnEstimatedArrivalAt,
    progressRatio: 0,
    encodedGeometry: null,
    calculatedAt: REFERENCE_TIMESTAMPS.updatedAt,
  },
] satisfies RoutingSnapshot[];
