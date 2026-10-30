import type { WithoutSystemFields } from "convex/server";
import { ConvexError } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { DatabaseReader } from "./_generated/server";
import { requireRouteContext } from "./journeyValidation";
import {
  requireFiniteNumber,
  requirePositiveInteger,
  requireText,
  validateCoordinates,
  validateUser,
} from "./validation";

async function validateCycleUser(
  db: DatabaseReader,
  routeLegId: Id<"routeLegs">,
  cycle: number,
  userId: Id<"users">,
) {
  requirePositiveInteger(cycle, "cycle");
  const { leg, journey } = await requireRouteContext(db, routeLegId);
  if (cycle !== leg.currentCycle) {
    throw new ConvexError({ code: "ROUTE_CYCLE_MISMATCH" });
  }
  const user = await db.get("users", userId);
  if (!user) throw new ConvexError({ code: "USER_NOT_FOUND" });
  await validateUser(db, user);
  if (user.role !== "guest" && user.organizationId !== journey.organizationId) {
    throw new ConvexError({ code: "USER_ORGANIZATION_MISMATCH" });
  }
}

export async function validateWaitlistEntry(
  db: DatabaseReader,
  entry: WithoutSystemFields<Doc<"waitlistEntries">>,
) {
  requireFiniteNumber(entry.requestedAt, "requestedAt");
  await validateCycleUser(db, entry.routeLegId, entry.cycle, entry.userId);
}

export async function validateRouteLegComment(
  db: DatabaseReader,
  comment: WithoutSystemFields<Doc<"routeLegComments">>,
) {
  requireText(comment.message, "message");
  requireFiniteNumber(comment.createdAt, "createdAt");
  await validateCycleUser(db, comment.routeLegId, comment.cycle, comment.authorUserId);
}

export function validateRoutingValues(
  snapshot: Omit<WithoutSystemFields<Doc<"routingSnapshots">>, "routeLegId" | "shuttleId">,
) {
  validateCoordinates(snapshot.origin);
  validateCoordinates(snapshot.destination);
  requireFiniteNumber(snapshot.totalDistanceMeters, "totalDistanceMeters", 0);
  requireFiniteNumber(snapshot.remainingDistanceMeters, "remainingDistanceMeters", 0);
  requireFiniteNumber(snapshot.estimatedDurationSeconds, "estimatedDurationSeconds", 0);
  requireFiniteNumber(snapshot.progressRatio, "progressRatio", 0, 1);
  requireFiniteNumber(snapshot.estimatedArrivalAt, "estimatedArrivalAt");
  requireFiniteNumber(snapshot.calculatedAt, "calculatedAt");
}

export async function validateRoutingSnapshot(
  db: DatabaseReader,
  snapshot: WithoutSystemFields<Doc<"routingSnapshots">>,
) {
  validateRoutingValues(snapshot);
  const { journey } = await requireRouteContext(db, snapshot.routeLegId);
  const shuttle = await db.get("shuttles", snapshot.shuttleId);
  if (!shuttle) throw new ConvexError({ code: "SHUTTLE_NOT_FOUND" });
  if (shuttle.organizationId !== journey.organizationId) {
    throw new ConvexError({ code: "SHUTTLE_ORGANIZATION_MISMATCH" });
  }
  if (snapshot.shuttleId !== journey.shuttleId) {
    throw new ConvexError({ code: "ROUTING_SHUTTLE_MISMATCH" });
  }
}
