import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";

import type { DatabaseWriter } from "./_generated/server";
import { readJourneyGraph } from "./journeyRead";
import { prepareSundayServiceSeed } from "./seedData";
import { importSeedData } from "./seedImport";
import schema from "./schema";

const modules = { "./_generated/server.js": () => import("./_generated/server.js") };
const createTest = () => convexTest(schema, modules);
const selection = { organizationSlug: "union-church" };

async function seedGraph(db: DatabaseWriter, slug = selection.organizationSlug) {
  const seed = prepareSundayServiceSeed();
  seed.organization.slug = slug;
  await importSeedData(db, seed);
  const organization = (await db.query("organizations").withIndex("by_slug", (q) =>
    q.eq("slug", slug)).unique())!;
  const journey = (await db.query("journeys").withIndex("by_organization_active", (q) =>
    q.eq("organizationId", organization._id).eq("active", true)).unique())!;
  const legs = await db.query("routeLegs").withIndex("by_journey_sequence", (q) =>
    q.eq("journeyId", journey._id)).collect();
  const shuttle = (await db.get("shuttles", journey.shuttleId))!;
  const waitlist = await db.query("waitlistEntries").withIndex("by_leg_cycle_requested", (q) =>
    q.eq("routeLegId", legs[0]._id).eq("cycle", 1)).collect();
  const comment = (await db.query("routeLegComments").withIndex("by_leg_cycle_created", (q) =>
    q.eq("routeLegId", legs[0]._id).eq("cycle", 1)).first())!;
  const routing = (await db.query("routingSnapshots").withIndex("by_route_leg", (q) =>
    q.eq("routeLegId", legs[0]._id)).unique())!;
  return { organization, journey, legs, shuttle, waitlist, comment, routing };
}

type SeedGraph = Awaited<ReturnType<typeof seedGraph>>;

describe("scoped journey graph reader", () => {
  it("reads the seeded journey with indexed lists, point-read people, and no writes", async () => {
    const t = createTest();
    const seed = await t.run(({ db }) => seedGraph(db));
    await t.run(({ db }) => seedGraph(db, "other"));
    await t.run(async ({ db }) => {
      const queries = vi.spyOn(db, "query");
      const gets = vi.spyOn(db, "get");
      const writes = [vi.spyOn(db, "insert"), vi.spyOn(db, "patch"),
        vi.spyOn(db, "replace"), vi.spyOn(db, "delete")];
      const result = await readJourneyGraph(db, selection);
      expect(result.status).toBe("ready");
      if (result.status !== "ready") throw new Error("Expected a readable journey");
      const { graph } = result;
      expect(graph.organization._id).toBe(seed.organization._id);
      expect(graph.journey).toEqual(seed.journey);
      expect(graph.legs.map(({ leg }) => leg._id)).toEqual(seed.journey.routeLegIds);
      expect(graph.legs.map(({ waitlist }) => waitlist.length)).toEqual([3, 3]);
      expect(graph.legs.flatMap(({ comments }) => comments)).toHaveLength(2);
      expect(graph.locations).toHaveLength(2);
      expect(graph.locations.every((location) => location.organizationId === seed.organization._id)).toBe(true);
      expect(graph.shuttle).toEqual(seed.shuttle);
      expect(graph.legs[0].routing).toEqual(seed.routing);
      const referenced = new Set([
        graph.shuttle.activeDriverId,
        ...graph.legs.flatMap(({ waitlist, comments }) => [
          ...waitlist.map((entry) => entry.userId), ...comments.map((comment) => comment.authorUserId),
        ]),
      ]);
      expect(new Set(graph.users.map((user) => user._id))).toEqual(referenced);
      expect(queries).not.toHaveBeenCalledWith("users");
      expect(gets.mock.calls.filter(([table]) => table === "users")).toHaveLength(referenced.size);
      for (const write of writes) expect(write).not.toHaveBeenCalled();
    });
  });

  it("preserves an explicitly selected second active leg instead of inferring it", async () => {
    const t = createTest();
    const seed = await t.run(({ db }) => seedGraph(db));
    await t.run(({ db }) => db.patch("journeys", seed.journey._id, {
      activeRouteLegId: seed.legs[1]._id,
    }));
    const result = await t.run(({ db }) => readJourneyGraph(db, {
      ...selection, journeyId: seed.journey._id,
    }));
    expect(result).toMatchObject({ status: "ready", graph: {
      journey: { activeRouteLegId: seed.legs[1]._id, routeLegIds: seed.journey.routeLegIds },
    } });
  });

  it("excludes past/future cycles and their dangling people while preserving the other leg", async () => {
    const t = createTest();
    const seed = await t.run(({ db }) => seedGraph(db));
    const current = await t.run(async ({ db }) => {
      await db.patch("routeLegs", seed.legs[0]._id, { currentCycle: 2 });
      await db.delete("users", seed.waitlist[0].userId);
      const returnEntry = (await db.query("waitlistEntries").withIndex("by_leg_cycle_requested", (q) =>
        q.eq("routeLegId", seed.legs[1]._id).eq("cycle", 1)).first())!;
      const entry = { routeLegId: seed.legs[0]._id, userId: returnEntry.userId, cycle: 2, requestedAt: 10 };
      const entryId = await db.insert("waitlistEntries", entry);
      const commentId = await db.insert("routeLegComments", {
        routeLegId: seed.legs[0]._id, authorUserId: returnEntry.userId,
        cycle: 2, message: "Current pickup", createdAt: 10,
      });
      await db.insert("waitlistEntries", { ...entry, cycle: 3, userId: seed.waitlist[0].userId });
      return { entryId, commentId };
    });
    const result = await t.run(({ db }) => readJourneyGraph(db, selection));
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("Expected current-cycle data");
    expect(result.graph.legs[0].waitlist.map((entry) => entry._id)).toEqual([current.entryId]);
    expect(result.graph.legs[0].comments.map((comment) => comment._id)).toEqual([current.commentId]);
    expect(result.graph.legs[1].waitlist).toHaveLength(3);
    expect(result.graph.users.some((user) => user._id === seed.waitlist[0].userId)).toBe(false);
  });

  it("orders memberships and comments by their event timestamps", async () => {
    const t = createTest();
    const seed = await t.run(({ db }) => seedGraph(db));
    await t.run(async ({ db }) => {
      for (const [index, entry] of seed.waitlist.entries()) {
        await db.patch("waitlistEntries", entry._id, { requestedAt: 30 - index * 10 });
      }
      await db.insert("routeLegComments", {
        routeLegId: seed.legs[0]._id, authorUserId: seed.waitlist[0].userId,
        cycle: 1, message: "Earlier", createdAt: 1,
      });
    });
    const result = await t.run(({ db }) => readJourneyGraph(db, selection));
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("Expected ordered lists");
    expect(result.graph.legs[0].waitlist.map((entry) => entry._id))
      .toEqual(seed.waitlist.map((entry) => entry._id).reverse());
    expect(result.graph.legs[0].comments[0].message).toBe("Earlier");
  });

  it.each(["guest", "rider"] as const)(
    "includes a %s referenced only as an author and rejects their later deletion", async (role) => {
      const t = createTest();
      const seed = await t.run(({ db }) => seedGraph(db));
      const authorId = await t.run(async ({ db }) => {
        const id = await db.insert("users", {
          role, organizationId: role === "guest" ? null : seed.organization._id,
          firstName: "Comment", lastName: "Author", phoneNumber: null,
          profileImageUrl: null, createdAt: 1, updatedAt: 1,
        });
        await db.patch("routeLegComments", seed.comment._id, { authorUserId: id });
        return id;
      });
      const result = await t.run(({ db }) => readJourneyGraph(db, selection));
      expect(result.status).toBe("ready");
      if (result.status !== "ready") throw new Error("Expected the referenced author");
      expect(result.graph.users.some((user) => user._id === authorId)).toBe(true);
      expect(result.graph.legs.flatMap(({ waitlist }) => waitlist)
        .some((entry) => entry.userId === authorId)).toBe(false);
      await t.run(({ db }) => db.delete("users", authorId));
      await expect(t.run(({ db }) => readJourneyGraph(db, selection)))
        .resolves.toEqual({ status: "unavailable" });
    },
  );

  it("accepts empty lists, null driver/tracking/active leg, and missing routing", async () => {
    const t = createTest();
    const seed = await t.run(({ db }) => seedGraph(db));
    await t.run(async ({ db }) => {
      await db.patch("shuttles", seed.shuttle._id, { activeDriverId: null, tracking: null });
      await db.patch("journeys", seed.journey._id, { activeRouteLegId: null });
      for (const table of ["waitlistEntries", "routeLegComments", "routingSnapshots"] as const) {
        for (const doc of await db.query(table).collect()) await db.delete(table, doc._id);
      }
    });
    const result = await t.run(({ db }) => readJourneyGraph(db, selection));
    expect(result).toMatchObject({ status: "ready", graph: {
      journey: { activeRouteLegId: null }, shuttle: { activeDriverId: null, tracking: null }, users: [],
    } });
    if (result.status !== "ready") throw new Error("Expected a journey without optional data");
    expect(result.graph.legs.every(({ waitlist, comments, routing }) =>
      waitlist.length === 0 && comments.length === 0 && routing === null)).toBe(true);
  });

  it("returns empty only for an active organization with no active journeys", async () => {
    const t = createTest();
    const seed = await t.run(({ db }) => seedGraph(db));
    await t.run(({ db }) => db.patch("journeys", seed.journey._id, { active: false }));
    await expect(t.run(({ db }) => readJourneyGraph(db, selection))).resolves.toEqual({ status: "empty" });
    await expect(t.run(({ db }) => readJourneyGraph(db, { ...selection, journeyId: seed.journey._id })))
      .resolves.toEqual({ status: "unavailable" });
  });

  it.each(["unknown slug", "blank slug", "malformed ID", "wrong-table ID", "foreign ID", "deleted ID"])(
    "returns a safe unavailable result for %s", async (kind) => {
      const t = createTest();
      const seed = await t.run(({ db }) => seedGraph(db));
      const other = await t.run(({ db }) => seedGraph(db, "other"));
      const input = { ...selection, journeyId: seed.journey._id as string };
      if (kind === "unknown slug") input.organizationSlug = "unknown";
      if (kind === "blank slug") input.organizationSlug = " ";
      if (kind === "malformed ID") input.journeyId = "not-a-database-id";
      if (kind === "wrong-table ID") input.journeyId = seed.shuttle._id;
      if (kind === "foreign ID") input.journeyId = other.journey._id;
      if (kind === "deleted ID") await t.run(({ db }) => db.delete("journeys", seed.journey._id));
      await expect(t.run(({ db }) => readJourneyGraph(db, input))).resolves.toEqual({ status: "unavailable" });
    },
  );

  it("rejects an inactive organization and ambiguous organization slugs", async () => {
    const t = createTest();
    const seed = await t.run(({ db }) => seedGraph(db));
    await t.run(({ db }) => db.patch("organizations", seed.organization._id, { active: false }));
    await expect(t.run(({ db }) => readJourneyGraph(db, selection))).resolves.toEqual({ status: "unavailable" });
    await t.run(async ({ db }) => {
      await db.patch("organizations", seed.organization._id, { active: true });
      const { _id, _creationTime, ...fields } = seed.organization;
      void _id; void _creationTime;
      await db.insert("organizations", fields);
    });
    await expect(t.run(({ db }) => readJourneyGraph(db, selection))).resolves.toEqual({ status: "unavailable" });
  });

  it("requires a selection when an organization has multiple active journeys", async () => {
    const t = createTest();
    const seed = await t.run(({ db }) => seedGraph(db));
    await t.run(async ({ db }) => {
      const { _id, _creationTime, ...fields } = seed.journey;
      void _id; void _creationTime;
      await db.insert("journeys", { ...fields, routeLegIds: [], activeRouteLegId: null });
    });
    await expect(t.run(({ db }) => readJourneyGraph(db, selection))).resolves.toEqual({ status: "unavailable" });
    await expect(t.run(({ db }) => readJourneyGraph(db, { ...selection, journeyId: seed.journey._id })))
      .resolves.toMatchObject({ status: "ready" });
  });

  it("propagates unexpected storage failures instead of disguising them as empty data", async () => {
    const t = createTest();
    await t.run(async ({ db }) => {
      vi.spyOn(db, "query").mockImplementation(() => { throw new Error("Storage unavailable"); });
      await expect(readJourneyGraph(db, selection)).rejects.toThrow("Storage unavailable");
    });
  });
});

const brokenReferences: {
  name: string;
  change: (db: DatabaseWriter, seed: SeedGraph, other: SeedGraph) => Promise<unknown>;
}[] = [
  { name: "missing leg", change: (db, s) => db.delete("routeLegs", s.legs[0]._id) },
  { name: "foreign leg", change: (db, s, o) => db.patch("journeys", s.journey._id,
    { routeLegIds: [o.legs[0]._id, s.legs[1]._id], activeRouteLegId: null }) },
  { name: "duplicate leg", change: (db, s) => db.patch("journeys", s.journey._id,
    { routeLegIds: [s.legs[0]._id, s.legs[0]._id] }) },
  { name: "omitted leg", change: (db, s) => db.patch("journeys", s.journey._id,
    { routeLegIds: [s.legs[0]._id] }) },
  { name: "empty legs", change: (db, s) => db.patch("journeys", s.journey._id,
    { routeLegIds: [], activeRouteLegId: null }) },
  { name: "reordered legs", change: (db, s) => db.patch("journeys", s.journey._id,
    { routeLegIds: [...s.journey.routeLegIds].reverse() }) },
  { name: "duplicate sequence", change: (db, s) => db.patch("routeLegs", s.legs[1]._id, { sequence: 1 }) },
  { name: "foreign active leg", change: (db, s, o) => db.patch("journeys", s.journey._id,
    { activeRouteLegId: o.legs[0]._id }) },
  { name: "foreign departure", change: (db, s, o) => db.patch("routeLegs", s.legs[0]._id,
    { departureLocationId: o.legs[0].departureLocationId }) },
  { name: "foreign arrival", change: (db, s, o) => db.patch("routeLegs", s.legs[0]._id,
    { arrivalLocationId: o.legs[0].arrivalLocationId }) },
  { name: "missing endpoint", change: (db, s) => db.delete("locations", s.legs[0].departureLocationId) },
  { name: "foreign shuttle", change: (db, s, o) => db.patch("journeys", s.journey._id, { shuttleId: o.shuttle._id }) },
  { name: "missing shuttle", change: (db, s) => db.delete("shuttles", s.shuttle._id) },
  { name: "foreign driver", change: (db, s, o) => db.patch("shuttles", s.shuttle._id,
    { activeDriverId: o.shuttle.activeDriverId }) },
  { name: "missing driver", change: (db, s) => db.delete("users", s.shuttle.activeDriverId!) },
  { name: "non-driver operator", change: (db, s) => db.patch("users", s.shuttle.activeDriverId!, { role: "rider" }) },
  { name: "missing rider", change: (db, s) => db.delete("users", s.waitlist[0].userId) },
  { name: "foreign rider", change: (db, s, o) => db.patch("users", s.waitlist[0].userId,
    { role: "rider", organizationId: o.organization._id }) },
  { name: "guest with organization", change: (db, s) => db.patch("users", s.waitlist[0].userId,
    { organizationId: s.organization._id }) },
  { name: "foreign author", change: (db, s, o) => db.patch("routeLegComments", s.comment._id,
    { authorUserId: o.shuttle.activeDriverId! }) },
  { name: "wrong routing shuttle", change: (db, s, o) => db.patch("routingSnapshots", s.routing._id,
    { shuttleId: o.shuttle._id }) },
  { name: "invalid cycle", change: (db, s) => db.patch("routeLegs", s.legs[0]._id, { currentCycle: 0 }) },
  { name: "invalid routing value", change: (db, s) => db.patch("routingSnapshots", s.routing._id, { progressRatio: 2 }) },
  { name: "invalid tracking coordinates", change: (db, s) => db.patch("shuttles", s.shuttle._id,
    { tracking: { status: "CURRENT", coordinates: { latitude: 91, longitude: 0 },
      accuracyMeters: null, recordedAt: 1, receivedAt: 1 } }) },
];

describe("unreadable stored relationships", () => {
  it.each(brokenReferences)("rejects $name without a partial graph", async ({ change }) => {
    const t = createTest();
    const seed = await t.run(({ db }) => seedGraph(db));
    const other = await t.run(({ db }) => seedGraph(db, "other"));
    await t.run(({ db }) => change(db, seed, other));
    await expect(t.run(({ db }) => readJourneyGraph(db, selection))).resolves.toEqual({ status: "unavailable" });
  });

  it.each(["membership", "routing"])("rejects duplicate %s records", async (kind) => {
    const t = createTest();
    const seed = await t.run(({ db }) => seedGraph(db));
    await t.run(async ({ db }) => {
      if (kind === "membership") {
        const { _id, _creationTime, ...fields } = seed.waitlist[0];
        void _id; void _creationTime;
        await db.insert("waitlistEntries", fields);
      } else {
        const { _id, _creationTime, ...fields } = seed.routing;
        void _id; void _creationTime;
        await db.insert("routingSnapshots", fields);
      }
    });
    await expect(t.run(({ db }) => readJourneyGraph(db, selection))).resolves.toEqual({ status: "unavailable" });
  });
});
