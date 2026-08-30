import type {
  LocationUpdateId,
  RouteLegId,
  ShuttleId,
  Timestamp,
} from "./primitives";

export interface ArrivalRouteLifecycleEvent {
  type: "ARRIVAL";
  routeLegId: RouteLegId;
  shuttleId: ShuttleId;
  occurredAt: Timestamp;
  sourceLocationUpdateId: LocationUpdateId | null;
}

export type RouteLifecycleEvent = ArrivalRouteLifecycleEvent;
