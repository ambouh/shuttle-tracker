import { ConvexError } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { DatabaseReader } from "./_generated/server";
import {
  requireFiniteNumber,
  requireOrganization,
  requirePositiveInteger,
  requirePositiveNumber,
  requireText,
  validateTimestamps,
} from "./validation";

export async function requireJourney(db: DatabaseReader, journeyId: Id<"journeys">) {
  const journey = await db.get("journeys", journeyId);
  if (!journey) throw new ConvexError({ code: "JOURNEY_NOT_FOUND" });
  await requireOrganization(db, journey.organizationId);
  return journey;
}

export async function requireRouteContext(db: DatabaseReader, routeLegId: Id<"routeLegs">) {
  const leg = await db.get("routeLegs", routeLegId);
  if (!leg) throw new ConvexError({ code: "ROUTE_LEG_NOT_FOUND" });
  const journey = await requireJourney(db, leg.journeyId);
  requirePositiveInteger(leg.sequence, "sequence");
  requirePositiveInteger(leg.currentCycle, "currentCycle");
  if (journey.routeLegIds[leg.sequence - 1] !== leg._id) {
    throw new ConvexError({ code: "INVALID_LEG_ORDER" });
  }
  return { leg, journey };
}

async function validateEndpoint(
  db: DatabaseReader,
  locationId: Id<"locations">,
  organizationId: Id<"organizations">,
) {
  const location = await db.get("locations", locationId);
  if (!location) throw new ConvexError({ code: "LOCATION_NOT_FOUND" });
  if (location.organizationId !== organizationId) {
    throw new ConvexError({ code: "LOCATION_ORGANIZATION_MISMATCH" });
  }
}

export async function validateRouteLeg(db: DatabaseReader, routeLegId: Id<"routeLegs">) {
  const { leg, journey } = await requireRouteContext(db, routeLegId);
  requireText(leg.name, "name");
  validateTimestamps(leg);
  requireFiniteNumber(leg.scheduledDepartureAt, "scheduledDepartureAt");
  requireFiniteNumber(leg.scheduledArrivalAt, "scheduledArrivalAt");
  requirePositiveNumber(leg.departureGeofenceRadius, "departureGeofenceRadius");
  requirePositiveNumber(leg.arrivalGeofenceRadius, "arrivalGeofenceRadius");
  await validateEndpoint(db, leg.departureLocationId, journey.organizationId);
  await validateEndpoint(db, leg.arrivalLocationId, journey.organizationId);
}

async function validateOrderedLegs(db: DatabaseReader, journey: Doc<"journeys">) {
  const uniqueIds = new Set(journey.routeLegIds);
  if (uniqueIds.size === 0 || uniqueIds.size !== journey.routeLegIds.length) {
    throw new ConvexError({ code: "INVALID_LEG_ORDER" });
  }
  if (journey.activeRouteLegId !== null && !uniqueIds.has(journey.activeRouteLegId)) {
    throw new ConvexError({ code: "ACTIVE_LEG_NOT_IN_JOURNEY" });
  }
  for (const [index, routeLegId] of journey.routeLegIds.entries()) {
    const leg = await db.get("routeLegs", routeLegId);
    if (!leg) throw new ConvexError({ code: "ROUTE_LEG_NOT_FOUND" });
    if (leg.journeyId !== journey._id) {
      throw new ConvexError({ code: "ROUTE_LEG_JOURNEY_MISMATCH" });
    }
    if (leg.sequence !== index + 1) {
      throw new ConvexError({ code: "INVALID_LEG_ORDER" });
    }
    await validateRouteLeg(db, routeLegId);
  }
  const storedLegs = await db.query("routeLegs")
    .withIndex("by_journey_sequence", (q) => q.eq("journeyId", journey._id)).collect();
  if (storedLegs.length !== journey.routeLegIds.length) {
    throw new ConvexError({ code: "JOURNEY_LEGS_MISMATCH" });
  }
}

// Validate the completed graph inside its write transaction, after circular IDs are linked.
export async function validateJourney(db: DatabaseReader, journeyId: Id<"journeys">) {
  const journey = await requireJourney(db, journeyId);
  requireText(journey.name, "name");
  validateTimestamps(journey);
  const shuttle = await db.get("shuttles", journey.shuttleId);
  if (!shuttle) throw new ConvexError({ code: "SHUTTLE_NOT_FOUND" });
  if (shuttle.organizationId !== journey.organizationId) {
    throw new ConvexError({ code: "SHUTTLE_ORGANIZATION_MISMATCH" });
  }
  await validateOrderedLegs(db, journey);
}
