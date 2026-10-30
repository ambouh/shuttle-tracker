import type { WithoutSystemFields } from "convex/server";
import { ConvexError } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { DatabaseReader } from "./_generated/server";

export function requireText(value: string, field: string) {
  if (value.trim().length === 0) {
    throw new ConvexError({ code: "INVALID_FIELD", field });
  }
}

export function requireFiniteNumber(
  value: number,
  field: string,
  minimum = -Infinity,
  maximum = Infinity,
) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new ConvexError({ code: "INVALID_FIELD", field });
  }
}

export function requirePositiveInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new ConvexError({ code: "INVALID_FIELD", field });
  }
}

export function requirePositiveNumber(value: number, field: string) {
  requireFiniteNumber(value, field, 0);
  if (value === 0) throw new ConvexError({ code: "INVALID_FIELD", field });
}

export function validateCoordinates(coordinates: {
  latitude: number;
  longitude: number;
}) {
  requireFiniteNumber(coordinates.latitude, "latitude", -90, 90);
  requireFiniteNumber(coordinates.longitude, "longitude", -180, 180);
}

export function validateTimestamps(record: {
  createdAt: number;
  updatedAt: number;
}) {
  requireFiniteNumber(record.createdAt, "createdAt");
  requireFiniteNumber(record.updatedAt, "updatedAt");
}

export async function requireOrganization(
  db: DatabaseReader,
  organizationId: Id<"organizations">,
) {
  if (!(await db.get("organizations", organizationId))) {
    throw new ConvexError({ code: "ORGANIZATION_NOT_FOUND" });
  }
}

export function validateOrganization(
  organization: WithoutSystemFields<Doc<"organizations">>,
) {
  requireText(organization.slug, "slug");
  requireText(organization.details.displayName, "displayName");
  requireText(organization.details.fallbackInitials, "fallbackInitials");
  validateTimestamps(organization);
}

export async function validateUser(
  db: DatabaseReader,
  user: WithoutSystemFields<Doc<"users">>,
) {
  requireText(user.firstName, "firstName");
  requireText(user.lastName, "lastName");
  validateTimestamps(user);
  if (user.role === "guest") {
    if (user.organizationId !== null) {
      throw new ConvexError({ code: "GUEST_ORGANIZATION_NOT_ALLOWED" });
    }
    return;
  }
  if (user.organizationId === null) {
    throw new ConvexError({ code: "MEMBER_ORGANIZATION_REQUIRED" });
  }
  await requireOrganization(db, user.organizationId);
}

export async function validateLocation(
  db: DatabaseReader,
  location: WithoutSystemFields<Doc<"locations">>,
) {
  requireText(location.name, "name");
  requireText(location.address, "address");
  validateCoordinates(location);
  await requireOrganization(db, location.organizationId);
}

export function validateTrackingSnapshot(tracking: Doc<"shuttles">["tracking"]) {
  if (tracking === null) return;
  if (tracking.coordinates !== null) validateCoordinates(tracking.coordinates);
  if (tracking.accuracyMeters !== null) {
    requireFiniteNumber(tracking.accuracyMeters, "accuracyMeters", 0);
  }
  if (tracking.recordedAt !== null) {
    requireFiniteNumber(tracking.recordedAt, "recordedAt");
  }
  if (tracking.receivedAt !== null) {
    requireFiniteNumber(tracking.receivedAt, "receivedAt");
  }
}

export async function validateShuttle(
  db: DatabaseReader,
  shuttle: WithoutSystemFields<Doc<"shuttles">>,
) {
  requireText(shuttle.name, "name");
  validateTimestamps(shuttle);
  validateTrackingSnapshot(shuttle.tracking);
  await requireOrganization(db, shuttle.organizationId);
  if (shuttle.activeDriverId === null) return;
  const driver = await db.get("users", shuttle.activeDriverId);
  if (!driver) throw new ConvexError({ code: "DRIVER_NOT_FOUND" });
  if (driver.role !== "driver") {
    throw new ConvexError({ code: "DRIVER_ROLE_REQUIRED" });
  }
  if (driver.organizationId !== shuttle.organizationId) {
    throw new ConvexError({ code: "DRIVER_ORGANIZATION_MISMATCH" });
  }
}
