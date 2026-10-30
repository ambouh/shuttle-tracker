import { ConvexError } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { DatabaseReader } from "./_generated/server";
import { validateRoutingValues } from "./routeDataValidation";
import { requireFiniteNumber, requireText, validateTimestamps } from "./validation";

export interface StoredLegActivity {
  leg: Doc<"routeLegs">;
  waitlist: Doc<"waitlistEntries">[];
  comments: Doc<"routeLegComments">[];
  routing: Doc<"routingSnapshots"> | null;
}

export function requireReadable(condition: unknown): asserts condition {
  if (!condition) throw new ConvexError({ code: "JOURNEY_UNAVAILABLE" });
}

export async function readLegActivity(
  db: DatabaseReader, leg: Doc<"routeLegs">, shuttleId: Id<"shuttles">,
): Promise<StoredLegActivity> {
  const [waitlist, comments, snapshots] = await Promise.all([
    db.query("waitlistEntries").withIndex("by_leg_cycle_requested", (q) =>
      q.eq("routeLegId", leg._id).eq("cycle", leg.currentCycle)).collect(),
    db.query("routeLegComments").withIndex("by_leg_cycle_created", (q) =>
      q.eq("routeLegId", leg._id).eq("cycle", leg.currentCycle)).collect(),
    db.query("routingSnapshots").withIndex("by_route_leg", (q) =>
      q.eq("routeLegId", leg._id)).take(2),
  ]);
  requireReadable(new Set(waitlist.map((entry) => entry.userId)).size === waitlist.length);
  for (const entry of waitlist) requireFiniteNumber(entry.requestedAt, "requestedAt");
  for (const comment of comments) {
    requireText(comment.message, "message");
    requireFiniteNumber(comment.createdAt, "createdAt");
  }
  requireReadable(snapshots.length <= 1);
  const routing = snapshots[0] ?? null;
  if (routing) {
    requireReadable(routing.shuttleId === shuttleId);
    validateRoutingValues(routing);
  }
  return { leg, waitlist, comments, routing };
}

export async function readReferencedPeople(
  db: DatabaseReader, shuttle: Doc<"shuttles">, legs: readonly StoredLegActivity[],
): Promise<Doc<"users">[]> {
  const ids = new Set<Id<"users">>();
  if (shuttle.activeDriverId !== null) ids.add(shuttle.activeDriverId);
  for (const { waitlist, comments } of legs) {
    for (const entry of waitlist) ids.add(entry.userId);
    for (const comment of comments) ids.add(comment.authorUserId);
  }
  return Promise.all([...ids].map(async (id) => {
    const user = await db.get("users", id);
    requireReadable(user);
    requireReadable(user.role === "guest"
      ? user.organizationId === null
      : user.organizationId === shuttle.organizationId);
    if (id === shuttle.activeDriverId) requireReadable(user.role === "driver");
    requireText(user.firstName, "firstName");
    requireText(user.lastName, "lastName");
    validateTimestamps(user);
    return user;
  }));
}
