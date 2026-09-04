import type { RouteLifecycleEvent } from "@/types/domain";

import { FIXTURE_IDS } from "./ids";
import {
  CURRENT_TRACKING_SHUTTLE,
  IN_TRANSIT_SCENARIO,
} from "./operational-scenarios";
import type { SundayServiceOperationalScenario } from "./operational-scenarios";
import { REFERENCE_TIMESTAMPS } from "./reference-time";

export const ARRIVAL_EVENT = {
  type: "ARRIVAL",
  routeLegId: FIXTURE_IDS.routeLegs.outbound,
  shuttleId: FIXTURE_IDS.shuttle,
  occurredAt: REFERENCE_TIMESTAMPS.outboundEstimatedArrivalAt,
  sourceLocationUpdateId: FIXTURE_IDS.locationUpdates.outboundCurrent,
} satisfies RouteLifecycleEvent;

export const BEFORE_OUTBOUND_ARRIVAL = {
  routeLegs: [
    {
      ...IN_TRANSIT_SCENARIO.routeLegs[0],
      waitlist: [...IN_TRANSIT_SCENARIO.routeLegs[0].waitlist],
      comments: [...IN_TRANSIT_SCENARIO.routeLegs[0].comments],
    },
    {
      ...IN_TRANSIT_SCENARIO.routeLegs[1],
      waitlist: [...IN_TRANSIT_SCENARIO.routeLegs[1].waitlist],
      comments: [...IN_TRANSIT_SCENARIO.routeLegs[1].comments],
    },
  ],
  shuttle: {
    ...CURRENT_TRACKING_SHUTTLE,
    tracking: CURRENT_TRACKING_SHUTTLE.tracking
      ? {
          ...CURRENT_TRACKING_SHUTTLE.tracking,
          coordinates: CURRENT_TRACKING_SHUTTLE.tracking.coordinates
            ? { ...CURRENT_TRACKING_SHUTTLE.tracking.coordinates }
            : null,
        }
      : null,
  },
} satisfies SundayServiceOperationalScenario;

export const AFTER_OUTBOUND_ARRIVAL = {
  routeLegs: [
    {
      ...BEFORE_OUTBOUND_ARRIVAL.routeLegs[0],
      status: "NOT_STARTED",
      waitlist: [],
      comments: [],
      updatedAt: ARRIVAL_EVENT.occurredAt,
    },
    {
      ...BEFORE_OUTBOUND_ARRIVAL.routeLegs[1],
      status: "DEPARTING",
      waitlist: [...BEFORE_OUTBOUND_ARRIVAL.routeLegs[1].waitlist],
      comments: [...BEFORE_OUTBOUND_ARRIVAL.routeLegs[1].comments],
      updatedAt: ARRIVAL_EVENT.occurredAt,
    },
  ],
  shuttle: {
    ...BEFORE_OUTBOUND_ARRIVAL.shuttle,
    tracking: BEFORE_OUTBOUND_ARRIVAL.shuttle.tracking
      ? {
          ...BEFORE_OUTBOUND_ARRIVAL.shuttle.tracking,
          coordinates: BEFORE_OUTBOUND_ARRIVAL.shuttle.tracking.coordinates
            ? { ...BEFORE_OUTBOUND_ARRIVAL.shuttle.tracking.coordinates }
            : null,
        }
      : null,
  },
} satisfies SundayServiceOperationalScenario;

export const OUTBOUND_ARRIVAL_SCENARIO = {
  event: ARRIVAL_EVENT,
  before: BEFORE_OUTBOUND_ARRIVAL,
  after: AFTER_OUTBOUND_ARRIVAL,
} as const;
