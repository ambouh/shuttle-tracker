import { ConvexError } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { DatabaseReader } from "./_generated/server";
import {
  readLegActivity, readReferencedPeople, requireReadable, type StoredLegActivity,
} from "./journeyReadActivity";
import {
  requireFiniteNumber, requirePositiveInteger, requirePositiveNumber, requireText,
  validateCoordinates, validateOrganization, validateTimestamps, validateTrackingSnapshot,
} from "./validation";

export interface JourneyReadSelection {
  organizationSlug: string;
  journeyId?: string;
}

// Backend-only records: the public query must project these before returning them.
export interface StoredJourneyGraph {
  organization: Doc<"organizations">;
  journey: Doc<"journeys">;
  shuttle: Doc<"shuttles">;
  legs: StoredLegActivity[];
  locations: Doc<"locations">[];
  users: Doc<"users">[];
}

export type JourneyReadResult =
  | { status: "ready"; graph: StoredJourneyGraph }
  | { status: "empty" }
  | { status: "unavailable" };

async function selectJourney(
  db: DatabaseReader, organizationId: Id<"organizations">, selectedId?: string,
): Promise<Doc<"journeys"> | null> {
  if (selectedId !== undefined) {
    const id = db.normalizeId("journeys", selectedId);
    requireReadable(id);
    const journey = await db.get("journeys", id);
    requireReadable(journey?.active && journey.organizationId === organizationId);
    return journey;
  }
  const journeys = await db.query("journeys").withIndex("by_organization_active", (q) =>
    q.eq("organizationId", organizationId).eq("active", true)).take(2);
  requireReadable(journeys.length <= 1);
  return journeys[0] ?? null;
}

async function readOrderedLegs(db: DatabaseReader, journey: Doc<"journeys">) {
  const ids = new Set(journey.routeLegIds);
  requireReadable(ids.size > 0 && ids.size === journey.routeLegIds.length);
  requireReadable(journey.activeRouteLegId === null || ids.has(journey.activeRouteLegId));
  const legs = await db.query("routeLegs").withIndex("by_journey_sequence", (q) =>
    q.eq("journeyId", journey._id)).collect();
  requireReadable(legs.length === journey.routeLegIds.length);
  for (const [index, leg] of legs.entries()) {
    requireReadable(leg._id === journey.routeLegIds[index] && leg.sequence === index + 1);
    requirePositiveInteger(leg.currentCycle, "currentCycle");
    requireText(leg.name, "name");
    validateTimestamps(leg);
    requireFiniteNumber(leg.scheduledDepartureAt, "scheduledDepartureAt");
    requireFiniteNumber(leg.scheduledArrivalAt, "scheduledArrivalAt");
    requirePositiveNumber(leg.departureGeofenceRadius, "departureGeofenceRadius");
    requirePositiveNumber(leg.arrivalGeofenceRadius, "arrivalGeofenceRadius");
  }
  return legs;
}

async function readLocations(
  db: DatabaseReader, organizationId: Id<"organizations">, legs: readonly Doc<"routeLegs">[],
) {
  const ids = new Set(legs.flatMap((leg) => [leg.departureLocationId, leg.arrivalLocationId]));
  return Promise.all([...ids].map(async (id) => {
    const location = await db.get("locations", id);
    requireReadable(location && location.organizationId === organizationId);
    requireText(location.name, "name");
    requireText(location.address, "address");
    validateCoordinates(location);
    return location;
  }));
}

async function readGraph(
  db: DatabaseReader, organization: Doc<"organizations">, journey: Doc<"journeys">,
): Promise<StoredJourneyGraph> {
  requireText(journey.name, "name");
  validateTimestamps(journey);
  const shuttle = await db.get("shuttles", journey.shuttleId);
  requireReadable(shuttle && shuttle.organizationId === organization._id);
  requireText(shuttle.name, "name");
  validateTimestamps(shuttle);
  validateTrackingSnapshot(shuttle.tracking);
  const orderedLegs = await readOrderedLegs(db, journey);
  const [locations, legs] = await Promise.all([
    readLocations(db, organization._id, orderedLegs),
    Promise.all(orderedLegs.map((leg) => readLegActivity(db, leg, shuttle._id))),
  ]);
  const users = await readReferencedPeople(db, shuttle, legs);
  return { organization, journey, shuttle, legs, locations, users };
}

export async function readJourneyGraph(
  db: DatabaseReader, selection: JourneyReadSelection,
): Promise<JourneyReadResult> {
  try {
    requireText(selection.organizationSlug, "organizationSlug");
    const organizations = await db.query("organizations").withIndex("by_slug", (q) =>
      q.eq("slug", selection.organizationSlug)).take(2);
    requireReadable(organizations.length === 1 && organizations[0].active);
    const organization = organizations[0];
    validateOrganization(organization);
    const journey = await selectJourney(db, organization._id, selection.journeyId);
    if (!journey) return { status: "empty" };
    return { status: "ready", graph: await readGraph(db, organization, journey) };
  } catch (error) {
    if (error instanceof ConvexError) return { status: "unavailable" };
    throw error;
  }
}
