import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
  coordinatesValidator,
  timestampFields,
  trackingSnapshotValidator,
} from "./validators";

export default defineSchema({
  seedRuns: defineTable({
    key: v.string(),
    completedAt: v.number(),
  }).index("by_key", ["key"]),
  organizations: defineTable({
    slug: v.string(),
    active: v.boolean(),
    details: v.object({
      displayName: v.string(),
      description: v.union(v.string(), v.null()),
      logoUrl: v.union(v.string(), v.null()),
      logoAltText: v.union(v.string(), v.null()),
      fallbackInitials: v.string(),
    }),
    ...timestampFields,
  }).index("by_slug", ["slug"]),
  users: defineTable({
    organizationId: v.union(v.id("organizations"), v.null()),
    firstName: v.string(),
    lastName: v.string(),
    phoneNumber: v.union(v.string(), v.null()),
    profileImageUrl: v.union(v.string(), v.null()),
    role: v.union(
      v.literal("guest"),
      v.literal("rider"),
      v.literal("driver"),
      v.literal("admin"),
    ),
    ...timestampFields,
  }).index("by_organization", ["organizationId"]),
  locations: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
  }).index("by_organization", ["organizationId"]),
  shuttles: defineTable({
    organizationId: v.id("organizations"),
    activeDriverId: v.union(v.id("users"), v.null()),
    name: v.string(),
    activeTrackingProvider: v.union(
      v.literal("AIRTAG"),
      v.literal("DRIVER_GPS"),
      v.null(),
    ),
    tracking: v.union(trackingSnapshotValidator, v.null()),
    ...timestampFields,
  }).index("by_organization", ["organizationId"]),
  journeys: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.union(v.string(), v.null()),
    active: v.boolean(),
    routeLegIds: v.array(v.id("routeLegs")),
    shuttleId: v.id("shuttles"),
    activeRouteLegId: v.union(v.id("routeLegs"), v.null()),
    ...timestampFields,
  }).index("by_organization_active", ["organizationId", "active"]),
  routeLegs: defineTable({
    journeyId: v.id("journeys"),
    sequence: v.number(),
    name: v.string(),
    departureLocationId: v.id("locations"),
    arrivalLocationId: v.id("locations"),
    scheduledDepartureAt: v.number(),
    scheduledArrivalAt: v.number(),
    status: v.union(
      v.literal("NOT_STARTED"),
      v.literal("DEPARTING"),
      v.literal("IN_TRANSIT"),
    ),
    departureGeofenceRadius: v.number(),
    arrivalGeofenceRadius: v.number(),
    currentCycle: v.number(),
    ...timestampFields,
  }).index("by_journey_sequence", ["journeyId", "sequence"]),
  waitlistEntries: defineTable({
    routeLegId: v.id("routeLegs"),
    userId: v.id("users"),
    cycle: v.number(),
    requestedAt: v.number(),
  })
    .index("by_leg_cycle_requested", ["routeLegId", "cycle", "requestedAt"])
    .index("by_leg_cycle_user", ["routeLegId", "cycle", "userId"]),
  routeLegComments: defineTable({
    routeLegId: v.id("routeLegs"),
    authorUserId: v.id("users"),
    cycle: v.number(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_leg_cycle_created", ["routeLegId", "cycle", "createdAt"]),
  routingSnapshots: defineTable({
    routeLegId: v.id("routeLegs"),
    shuttleId: v.id("shuttles"),
    origin: coordinatesValidator,
    destination: coordinatesValidator,
    totalDistanceMeters: v.number(),
    remainingDistanceMeters: v.number(),
    estimatedDurationSeconds: v.number(),
    estimatedArrivalAt: v.number(),
    progressRatio: v.number(),
    encodedGeometry: v.union(v.string(), v.null()),
    calculatedAt: v.number(),
  }).index("by_route_leg", ["routeLegId"]),
});
