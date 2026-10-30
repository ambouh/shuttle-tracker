import { ConvexError } from "convex/values";

import type { LocationId, RouteLegId, UserId } from "../types/domain";
import type { Id } from "./_generated/dataModel";
import type { DatabaseWriter } from "./_generated/server";
import { validateJourney } from "./journeyValidation";
import {
  validateRouteLegComment, validateRoutingSnapshot, validateWaitlistEntry,
} from "./routeDataValidation";
import type { SeedData } from "./seedData";
import { validateLocation, validateOrganization, validateShuttle, validateUser } from "./validation";

interface FoundationIds {
  organizationId: Id<"organizations">;
  users: Map<UserId, Id<"users">>;
  locations: Map<LocationId, Id<"locations">>;
  shuttleId: Id<"shuttles">;
}

function mappedId<K, V>(ids: ReadonlyMap<K, V>, key: K): V {
  const id = ids.get(key);
  if (id === undefined) throw new ConvexError({ code: "SEED_REFERENCE_NOT_FOUND" });
  return id;
}

function withoutFixtureId<T extends { id: string }>(record: T): Omit<T, "id"> {
  const { id, ...fields } = record;
  void id;
  return fields;
}

async function insertFoundation(db: DatabaseWriter, seed: SeedData): Promise<FoundationIds> {
  const organization = withoutFixtureId(seed.organization);
  validateOrganization(organization);
  const organizationId = await db.insert("organizations", organization);
  const users = new Map<UserId, Id<"users">>();
  for (const user of seed.users) {
    const record = { ...withoutFixtureId(user), organizationId:
      user.organizationId === null ? null : organizationId };
    await validateUser(db, record);
    users.set(user.id, await db.insert("users", record));
  }
  const locations = new Map<LocationId, Id<"locations">>();
  for (const location of seed.locations) {
    const record = { ...withoutFixtureId(location), organizationId };
    await validateLocation(db, record);
    locations.set(location.id, await db.insert("locations", record));
  }
  const shuttle = {
    ...withoutFixtureId(seed.shuttle), organizationId,
    activeDriverId: seed.shuttle.activeDriverId === null
      ? null : mappedId(users, seed.shuttle.activeDriverId),
  };
  await validateShuttle(db, shuttle);
  const shuttleId = await db.insert("shuttles", shuttle);
  return { organizationId, users, locations, shuttleId };
}

async function insertJourney(db: DatabaseWriter, seed: SeedData, ids: FoundationIds) {
  // Circular references are temporary within this transaction and validated after linking.
  const journeyId = await db.insert("journeys", {
    ...withoutFixtureId(seed.journey), organizationId: ids.organizationId,
    shuttleId: ids.shuttleId, routeLegIds: [], activeRouteLegId: null,
  });
  const legs = new Map<RouteLegId, Id<"routeLegs">>();
  for (const leg of seed.routeLegs) {
    const routeLegId = await db.insert("routeLegs", {
      ...withoutFixtureId(leg), journeyId,
      departureLocationId: mappedId(ids.locations, leg.departureLocationId),
      arrivalLocationId: mappedId(ids.locations, leg.arrivalLocationId),
    });
    legs.set(leg.id, routeLegId);
  }
  await db.patch("journeys", journeyId, {
    routeLegIds: seed.journey.routeLegIds.map((id) => mappedId(legs, id)),
    activeRouteLegId: seed.journey.activeRouteLegId === null
      ? null : mappedId(legs, seed.journey.activeRouteLegId),
  });
  await validateJourney(db, journeyId);
  return legs;
}

async function insertRouteData(
  db: DatabaseWriter, seed: SeedData, ids: FoundationIds,
  legs: ReadonlyMap<RouteLegId, Id<"routeLegs">>,
) {
  for (const entry of seed.waitlistEntries) {
    const record = {
      ...withoutFixtureId(entry), routeLegId: mappedId(legs, entry.routeLegId),
      userId: mappedId(ids.users, entry.userId),
    };
    await validateWaitlistEntry(db, record);
    await db.insert("waitlistEntries", record);
  }
  for (const comment of seed.routeLegComments) {
    const record = {
      ...withoutFixtureId(comment), routeLegId: mappedId(legs, comment.routeLegId),
      authorUserId: mappedId(ids.users, comment.authorUserId),
    };
    await validateRouteLegComment(db, record);
    await db.insert("routeLegComments", record);
  }
  for (const snapshot of seed.routingSnapshots) {
    const record = { ...snapshot, routeLegId: mappedId(legs, snapshot.routeLegId), shuttleId: ids.shuttleId };
    await validateRoutingSnapshot(db, record);
    await db.insert("routingSnapshots", record);
  }
}

// Call only after source validation and the seed's empty-database check, in one mutation.
export async function importSeedData(db: DatabaseWriter, seed: SeedData) {
  const ids = await insertFoundation(db, seed);
  const legs = await insertJourney(db, seed, ids);
  await insertRouteData(db, seed, ids, legs);
  return {
    organizations: 1, users: seed.users.length, locations: seed.locations.length,
    shuttles: 1, journeys: 1, routeLegs: seed.routeLegs.length,
    waitlistEntries: seed.waitlistEntries.length, routeLegComments: seed.routeLegComments.length,
    routingSnapshots: seed.routingSnapshots.length,
  };
}
