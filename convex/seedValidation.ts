import { ConvexError } from "convex/values";

import type { Location, RouteLeg, User } from "@/types/domain";

import { validateRoutingValues } from "./routeDataValidation";
import type { SeedSource } from "./seedData";
import {
  requireFiniteNumber, requirePositiveInteger, requirePositiveNumber, requireText,
  validateCoordinates, validateOrganization, validateTimestamps, validateTrackingSnapshot,
} from "./validation";

function requireSeed(condition: boolean, reason: string): asserts condition {
  if (!condition) throw new ConvexError({ code: "INVALID_SEED_DATA", reason });
}

function indexById<T extends { id: string }>(records: T[], collection: string) {
  const index = new Map<string, T>();
  for (const record of records) {
    requireText(record.id, "fixtureId");
    requireSeed(!index.has(record.id), `DUPLICATE_${collection}_ID`);
    index.set(record.id, record);
  }
  return index;
}

function validatePeopleAndPlaces(source: SeedSource) {
  const organizationId = source.organization.id;
  for (const user of source.users) {
    requireText(user.firstName, "firstName");
    requireText(user.lastName, "lastName");
    validateTimestamps(user);
    requireSeed(["guest", "rider", "driver", "admin"].includes(user.role), "INVALID_USER_ROLE");
    requireSeed(user.role === "guest" ? user.organizationId === null
      : user.organizationId === organizationId, "USER_ORGANIZATION_MISMATCH");
  }
  for (const location of source.locations) {
    requireText(location.name, "name");
    requireText(location.address, "address");
    validateCoordinates(location);
    requireSeed(location.organizationId === organizationId, "LOCATION_ORGANIZATION_MISMATCH");
  }
}

function validateShuttle(source: SeedSource, users: ReadonlyMap<string, User>) {
  const shuttle = source.shuttle;
  requireText(shuttle.id, "fixtureId");
  requireText(shuttle.name, "name");
  validateTimestamps(shuttle);
  validateTrackingSnapshot(shuttle.tracking);
  requireSeed(shuttle.organizationId === source.organization.id, "SHUTTLE_ORGANIZATION_MISMATCH");
  requireSeed(shuttle.activeTrackingProvider === null
    || ["AIRTAG", "DRIVER_GPS"].includes(shuttle.activeTrackingProvider), "INVALID_TRACKING_PROVIDER");
  requireSeed(shuttle.tracking === null
    || ["CURRENT", "STALE", "UNAVAILABLE"].includes(shuttle.tracking.status), "INVALID_TRACKING_STATUS");
  if (shuttle.activeDriverId === null) return;
  const driver = users.get(shuttle.activeDriverId);
  requireSeed(driver !== undefined, "DRIVER_NOT_FOUND");
  requireSeed(driver.role === "driver", "DRIVER_ROLE_REQUIRED");
  requireSeed(driver.organizationId === shuttle.organizationId, "DRIVER_ORGANIZATION_MISMATCH");
}

function validateLeg(leg: RouteLeg, source: SeedSource, locations: ReadonlyMap<string, Location>) {
  requireText(leg.name, "name");
  validateTimestamps(leg);
  requirePositiveInteger(leg.sequence, "sequence");
  requireFiniteNumber(leg.scheduledDepartureAt, "scheduledDepartureAt");
  requireFiniteNumber(leg.scheduledArrivalAt, "scheduledArrivalAt");
  requirePositiveNumber(leg.departureGeofenceRadius, "departureGeofenceRadius");
  requirePositiveNumber(leg.arrivalGeofenceRadius, "arrivalGeofenceRadius");
  requireSeed(["NOT_STARTED", "DEPARTING", "IN_TRANSIT"].includes(leg.status), "INVALID_ROUTE_STATUS");
  requireSeed(leg.journeyId === source.journey.id, "ROUTE_LEG_JOURNEY_MISMATCH");
  requireSeed(locations.has(leg.departureLocationId) && locations.has(leg.arrivalLocationId),
    "LOCATION_NOT_FOUND");
}

function validateJourney(source: SeedSource) {
  const { journey } = source;
  requireText(journey.id, "fixtureId");
  requireText(journey.name, "name");
  validateTimestamps(journey);
  requireSeed(journey.organizationId === source.organization.id, "JOURNEY_ORGANIZATION_MISMATCH");
  const legs = indexById(source.routeLegs, "LEG");
  const orderedIds = new Set(journey.routeLegIds);
  requireSeed(orderedIds.size > 0 && orderedIds.size === journey.routeLegIds.length
    && orderedIds.size === legs.size, "INVALID_LEG_ORDER");
  for (const [index, id] of journey.routeLegIds.entries()) {
    const leg = legs.get(id);
    requireSeed(leg !== undefined, "ROUTE_LEG_NOT_FOUND");
    requireSeed(leg.sequence === index + 1, "INVALID_LEG_ORDER");
  }
  requireSeed(source.activeRouteLegId === null || orderedIds.has(source.activeRouteLegId),
    "ACTIVE_LEG_NOT_IN_JOURNEY");
}

function validateRiderRecords(source: SeedSource, users: ReadonlyMap<string, User>) {
  indexById(source.routeLegs.flatMap((leg) => leg.waitlist), "WAITLIST");
  indexById(source.routeLegs.flatMap((leg) => leg.comments), "COMMENT");
  for (const leg of source.routeLegs) {
    const members = new Set<string>();
    for (const entry of leg.waitlist) {
      requireSeed(entry.routeLegId === leg.id, "WAITLIST_LEG_MISMATCH");
      requireSeed(users.has(entry.userId), "WAITLIST_USER_NOT_FOUND");
      requireSeed(!members.has(entry.userId), "DUPLICATE_MEMBERSHIP");
      requireFiniteNumber(entry.requestedAt, "requestedAt");
      members.add(entry.userId);
    }
    for (const comment of leg.comments) {
      requireSeed(comment.routeLegId === leg.id, "COMMENT_LEG_MISMATCH");
      requireSeed(users.has(comment.authorUserId), "COMMENT_AUTHOR_NOT_FOUND");
      requireText(comment.message, "message");
      requireFiniteNumber(comment.createdAt, "createdAt");
    }
  }
}

function validateRouting(source: SeedSource) {
  const seenLegs = new Set<string>();
  for (const snapshot of source.routingSnapshots) {
    validateRoutingValues(snapshot);
    requireSeed(source.journey.routeLegIds.includes(snapshot.routeLegId), "ROUTING_LEG_NOT_FOUND");
    requireSeed(snapshot.shuttleId === source.shuttle.id, "ROUTING_SHUTTLE_MISMATCH");
    requireSeed(!seenLegs.has(snapshot.routeLegId), "DUPLICATE_ROUTING_SNAPSHOT");
    seenLegs.add(snapshot.routeLegId);
  }
  requireSeed(seenLegs.size === source.routeLegs.length, "ROUTING_SNAPSHOT_MISSING");
}

export function validateSeedSource(source: SeedSource) {
  requireText(source.organization.id, "fixtureId");
  validateOrganization(source.organization);
  const users = indexById(source.users, "USER");
  const locations = indexById(source.locations, "LOCATION");
  validatePeopleAndPlaces(source);
  validateShuttle(source, users);
  validateJourney(source);
  for (const leg of source.routeLegs) validateLeg(leg, source, locations);
  validateRiderRecords(source, users);
  validateRouting(source);
}
