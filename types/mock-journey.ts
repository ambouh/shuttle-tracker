import type {
  Journey,
  RouteLifecycleEvent,
  LocationUpdate,
  Organization,
  RouteLeg,
  RouteLegId,
  RouteStatus,
  RoutingSnapshot,
  Shuttle,
  User,
} from "@/types/domain";

export interface MockJourneyState {
  activeRouteLegId: RouteLegId;
  users: readonly User[];
  routeLegs: readonly RouteLeg[];
  shuttle: Shuttle;
  routingSnapshots: readonly RoutingSnapshot[];
}

export interface MockRoutePreset {
  routeLegId: RouteLegId;
  routingSnapshot: RoutingSnapshot;
  locationUpdate: LocationUpdate;
}

export interface MockJourneyContext {
  organization: Organization;
  journey: Journey;
  routePresets: readonly MockRoutePreset[];
}

export interface SetMockRouteStatusAction {
  type: "SET_STATUS";
  expectedActiveRouteLegId: RouteLegId;
  routeLegId: RouteLegId;
  status: RouteStatus;
  occurredAt: number;
}

export type MockArrivalAction = RouteLifecycleEvent & {
  expectedActiveRouteLegId: RouteLegId;
};

export type MockJourneyAction = SetMockRouteStatusAction | MockArrivalAction;

export type MockJourneyError =
  | "journey-unavailable"
  | "route-unavailable"
  | "stale-target"
  | "invalid-event"
  | "arrival-unavailable"
  | "invalid-action";

export type MockJourneyResult =
  | { ok: true; state: MockJourneyState }
  | { ok: false; error: MockJourneyError };
