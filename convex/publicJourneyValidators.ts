import { v } from "convex/values";

import { coordinatesValidator, trackingSnapshotValidator } from "./validators";

const nullableString = v.union(v.string(), v.null());

const publicPerson = v.object({
  id: v.string(), firstName: v.string(), lastInitial: v.string(), profileImageUrl: nullableString,
});

const publicLeg = v.object({
  id: v.string(), journeyId: v.string(), sequence: v.number(), name: v.string(),
  departureLocationId: v.string(), arrivalLocationId: v.string(),
  scheduledDepartureAt: v.number(), scheduledArrivalAt: v.number(),
  status: v.union(v.literal("NOT_STARTED"), v.literal("DEPARTING"), v.literal("IN_TRANSIT")),
  currentCycle: v.number(),
  waitlist: v.array(v.object({
    id: v.string(), userId: v.string(), routeLegId: v.string(), requestedAt: v.number(),
  })),
  comments: v.array(v.object({
    id: v.string(), routeLegId: v.string(), authorUserId: v.string(),
    message: v.string(), createdAt: v.number(),
  })),
});

const publicRouting = v.object({
  routeLegId: v.string(), shuttleId: v.string(),
  origin: coordinatesValidator, destination: coordinatesValidator,
  totalDistanceMeters: v.number(), remainingDistanceMeters: v.number(),
  estimatedDurationSeconds: v.number(), estimatedArrivalAt: v.number(),
  progressRatio: v.number(), encodedGeometry: nullableString, calculatedAt: v.number(),
});

export const publicJourneyResultValidator = v.union(
  v.object({
    status: v.literal("ready"),
    snapshot: v.object({
      organization: v.object({
        id: v.string(), slug: v.string(),
        details: v.object({
          displayName: v.string(), description: nullableString,
          logoUrl: nullableString, logoAltText: nullableString, fallbackInitials: v.string(),
        }),
      }),
      journey: v.object({
        id: v.string(), organizationId: v.string(), name: v.string(), description: nullableString,
        routeLegIds: v.array(v.string()), activeRouteLegId: nullableString,
      }),
      routeLegs: v.array(publicLeg),
      locations: v.array(v.object({
        id: v.string(), name: v.string(), address: v.string(), latitude: v.number(), longitude: v.number(),
      })),
      users: v.array(publicPerson),
      shuttle: v.object({
        id: v.string(), name: v.string(), activeDriverId: nullableString,
        activeTrackingProvider: v.union(v.literal("AIRTAG"), v.literal("DRIVER_GPS"), v.null()),
        tracking: v.union(trackingSnapshotValidator, v.null()),
      }),
      routingSnapshots: v.array(publicRouting),
    }),
  }),
  v.object({ status: v.literal("empty") }),
  v.object({ status: v.literal("unavailable") }),
);
