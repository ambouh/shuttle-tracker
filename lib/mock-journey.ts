import type {
  LocationUpdate,
  RouteLeg,
  RouteStatus,
  RoutingSnapshot,
  Shuttle,
} from "@/types/domain";
import type {
  MockJourneyAction,
  MockArrivalAction,
  MockJourneyContext,
  MockJourneyResult,
  MockJourneyState,
  MockRoutePreset,
} from "@/types/mock-journey";
import { applyGuestPickup, type GuestPickupAction, type GuestPickupContext, type GuestPickupResult } from "./guest-pickup";

export function createMockJourneyState(initial: MockJourneyState): MockJourneyState {
  return structuredClone(initial);
}

export function applyMockJourneyPickup(
  state: MockJourneyState,
  context: GuestPickupContext,
  action: GuestPickupAction,
): { ok: true; state: MockJourneyState } | Extract<GuestPickupResult, { ok: false }> {
  const result = applyGuestPickup(state, context, action);
  if (!result.ok) return result;
  return { ok: true, state: { ...state, ...result.snapshot } };
}

const ROUTE_STATUSES = new Set<RouteStatus>([
  "NOT_STARTED",
  "DEPARTING",
  "IN_TRANSIT",
]);

function validTime(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function validPreset(preset: MockRoutePreset, shuttleId: Shuttle["id"]): boolean {
  const { routingSnapshot, locationUpdate, routeLegId } = preset;
  return routingSnapshot.routeLegId === routeLegId &&
    routingSnapshot.shuttleId === shuttleId &&
    locationUpdate.shuttleId === shuttleId &&
    Number.isFinite(routingSnapshot.origin.latitude) &&
    Number.isFinite(routingSnapshot.origin.longitude) &&
    Number.isFinite(routingSnapshot.destination.latitude) &&
    Number.isFinite(routingSnapshot.destination.longitude) &&
    Number.isFinite(routingSnapshot.totalDistanceMeters) &&
    routingSnapshot.totalDistanceMeters >= 0 &&
    Number.isFinite(routingSnapshot.remainingDistanceMeters) &&
    routingSnapshot.remainingDistanceMeters >= 0 &&
    routingSnapshot.remainingDistanceMeters <= routingSnapshot.totalDistanceMeters &&
    Number.isFinite(routingSnapshot.estimatedDurationSeconds) &&
    routingSnapshot.estimatedDurationSeconds >= 0 &&
    validTime(routingSnapshot.estimatedArrivalAt) &&
    Number.isFinite(routingSnapshot.progressRatio) &&
    routingSnapshot.progressRatio >= 0 &&
    routingSnapshot.progressRatio <= 1 &&
    validTime(routingSnapshot.calculatedAt) &&
    Number.isFinite(locationUpdate.coordinates.latitude) &&
    Number.isFinite(locationUpdate.coordinates.longitude) &&
    (locationUpdate.accuracyMeters === null ||
      (Number.isFinite(locationUpdate.accuracyMeters) &&
        locationUpdate.accuracyMeters >= 0)) &&
    validTime(locationUpdate.recordedAt) &&
    validTime(locationUpdate.receivedAt) &&
    locationUpdate.receivedAt >= locationUpdate.recordedAt;
}

function buildRoutingSnapshot(
  preset: MockRoutePreset,
  status: RouteStatus,
  occurredAt: number,
): RoutingSnapshot {
  const baseline = preset.routingSnapshot;
  const progressRatio = status === "IN_TRANSIT"
    ? Math.min(0.95, Math.max(0.4, baseline.progressRatio))
    : 0;
  const totalDistanceMeters = baseline.totalDistanceMeters;

  return {
    ...baseline,
    origin: { ...baseline.origin },
    destination: { ...baseline.destination },
    remainingDistanceMeters: totalDistanceMeters * (1 - progressRatio),
    estimatedArrivalAt: occurredAt + baseline.estimatedDurationSeconds * 1_000,
    progressRatio,
    calculatedAt: occurredAt,
  };
}

function buildShuttle(
  shuttle: Shuttle,
  update: LocationUpdate,
  status: RouteStatus,
): Shuttle {
  if (status === "NOT_STARTED") {
    return {
      ...shuttle,
      activeTrackingProvider: null,
      tracking: {
        status: "UNAVAILABLE",
        coordinates: null,
        accuracyMeters: null,
        recordedAt: null,
        receivedAt: null,
      },
    };
  }

  return {
    ...shuttle,
    activeTrackingProvider: update.provider,
    tracking: {
      status: status === "DEPARTING" ? "STALE" : "CURRENT",
      coordinates: { ...update.coordinates },
      accuracyMeters: update.accuracyMeters,
      recordedAt: update.recordedAt,
      receivedAt: update.receivedAt,
    },
  };
}

function cloneRouteLeg(routeLeg: RouteLeg, status: RouteStatus, occurredAt: number): RouteLeg {
  return {
    ...routeLeg,
    status,
    waitlist: [...routeLeg.waitlist],
    comments: [...routeLeg.comments],
    updatedAt: occurredAt,
  };
}

function contextIsAvailable(
  state: MockJourneyState,
  context: MockJourneyContext,
): boolean {
  const { organization, journey, routePresets } = context;
  if (!organization.active || !journey.active ||
    journey.organizationId !== organization.id ||
    state.shuttle.organizationId !== organization.id ||
    journey.routeLegIds.length === 0 ||
    journey.routeLegIds.length !== state.routeLegs.length ||
    new Set(journey.routeLegIds).size !== journey.routeLegIds.length ||
    !journey.routeLegIds.includes(state.activeRouteLegId)) return false;

  const legsById = new Map(state.routeLegs.map(leg => [leg.id, leg]));
  const presetsById = new Map(routePresets.map(preset => [preset.routeLegId, preset]));
  return presetsById.size === routePresets.length &&
    presetsById.size === journey.routeLegIds.length &&
    journey.routeLegIds.every(routeLegId => {
      const leg = legsById.get(routeLegId);
      const preset = presetsById.get(routeLegId);
      return Boolean(
        leg?.journeyId === journey.id &&
        preset &&
        validPreset(preset, state.shuttle.id),
      );
    });
}

export function applyMockJourneyAction(
  state: MockJourneyState,
  context: MockJourneyContext,
  action: MockJourneyAction,
): MockJourneyResult {
  if (!contextIsAvailable(state, context)) {
    return { ok: false, error: "journey-unavailable" };
  }
  if (action.type === "ARRIVAL") return applyArrival(state, context, action);
  if (action.type !== "SET_STATUS" ||
    !ROUTE_STATUSES.has(action.status) ||
    !validTime(action.occurredAt)) {
    return { ok: false, error: "invalid-action" };
  }
  if (action.expectedActiveRouteLegId !== state.activeRouteLegId) {
    return { ok: false, error: "stale-target" };
  }
  if (!context.journey.routeLegIds.includes(action.routeLegId)) {
    return { ok: false, error: "route-unavailable" };
  }

  const presetsById = new Map(
    context.routePresets.map(preset => [preset.routeLegId, preset]),
  );
  const activePreset = presetsById.get(action.routeLegId);
  if (!activePreset) return { ok: false, error: "route-unavailable" };

  const routeLegs = state.routeLegs.map(routeLeg =>
    cloneRouteLeg(
      routeLeg,
      routeLeg.id === action.routeLegId ? action.status : "NOT_STARTED",
      action.occurredAt,
    ),
  );
  const routingSnapshots = context.journey.routeLegIds.map(routeLegId =>
    buildRoutingSnapshot(
      presetsById.get(routeLegId)!,
      routeLegId === action.routeLegId ? action.status : "NOT_STARTED",
      action.occurredAt,
    ),
  );

  return {
    ok: true,
    state: {
      activeRouteLegId: action.routeLegId,
      users: [...state.users],
      routeLegs,
      shuttle: buildShuttle(state.shuttle, activePreset.locationUpdate, action.status),
      routingSnapshots,
    },
  };
}

function applyArrival(
  state: MockJourneyState,
  context: MockJourneyContext,
  action: MockArrivalAction,
): MockJourneyResult {
  if (action.expectedActiveRouteLegId !== state.activeRouteLegId ||
    action.routeLegId !== state.activeRouteLegId) {
    return { ok: false, error: "stale-target" };
  }
  const completed = state.routeLegs.find(leg => leg.id === action.routeLegId)!;
  const preset = context.routePresets.find(item => item.routeLegId === completed.id)!;
  if (!validTime(action.occurredAt) ||
    action.occurredAt < completed.updatedAt ||
    action.shuttleId !== state.shuttle.id ||
    (action.sourceLocationUpdateId !== null &&
      (action.sourceLocationUpdateId !== preset.locationUpdate.id ||
        action.occurredAt < preset.locationUpdate.receivedAt))) {
    return { ok: false, error: "invalid-event" };
  }
  if (completed.status !== "IN_TRANSIT" || context.journey.routeLegIds.length < 2) {
    return { ok: false, error: "arrival-unavailable" };
  }
  const index = context.journey.routeLegIds.indexOf(completed.id);
  const nextId = context.journey.routeLegIds[
    (index + 1) % context.journey.routeLegIds.length
  ];
  const advanced = applyMockJourneyAction(state, context, {
    type: "SET_STATUS",
    expectedActiveRouteLegId: state.activeRouteLegId,
    routeLegId: nextId,
    status: "DEPARTING",
    occurredAt: action.occurredAt,
  });
  if (!advanced.ok) return advanced;
  return {
    ok: true,
    state: {
      ...advanced.state,
      routeLegs: advanced.state.routeLegs.map(leg =>
        leg.id === completed.id ? { ...leg, waitlist: [], comments: [] } : leg,
      ),
    },
  };
}
