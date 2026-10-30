import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { internal } from "./_generated/api";
import type { DatabaseReader } from "./_generated/server";
import { validateJourney } from "./journeyValidation";
import { validateRouteLegComment, validateRoutingSnapshot, validateWaitlistEntry } from "./routeDataValidation";
import schema from "./schema";
import { run, SEED_DEVELOPMENT_URL, SEED_KEY, SEED_TABLES } from "./seed";
import * as seedData from "./seedData";
import * as seedImport from "./seedImport";

const modules = {
  "./_generated/server.js": () => import("./_generated/server.js"),
  "./seed.ts": () => import("./seed"),
};
const createTest = () => convexTest(schema, modules);
const expectedCounts = {
  organizations: 1, users: 8, locations: 2, shuttles: 1, journeys: 1,
  routeLegs: 2, waitlistEntries: 6, routeLegComments: 2, routingSnapshots: 2,
};

async function readState(db: DatabaseReader) {
  const tables = [...SEED_TABLES, "seedRuns"] as const;
  return Promise.all(tables.map(async (table) => ({ table, records: await db.query(table).collect() })));
}

async function expectEmpty(t: ReturnType<typeof createTest>) {
  const state = await t.run(({ db }) => readState(db));
  expect(state.every(({ records }) => records.length === 0)).toBe(true);
}

beforeEach(() => {
  vi.stubEnv("ALLOW_DEVELOPMENT_SEED", "true");
  vi.stubEnv("CONVEX_CLOUD_URL", SEED_DEVELOPMENT_URL);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("guarded Sunday Service seed", () => {
  it.each([undefined, "", "false", "TRUE", "1"])("is disabled for opt-in value %s", async (value) => {
    vi.stubEnv("ALLOW_DEVELOPMENT_SEED", value);
    const t = createTest();
    await expect(t.mutation(internal.seed.run, {})).resolves
      .toEqual({ status: "disabled", seedKey: SEED_KEY });
    await expectEmpty(t);
  });

  it.each([undefined, "https://another-deployment.convex.cloud"])(
    "is disabled outside the selected development deployment: %s", async (url) => {
      vi.stubEnv("CONVEX_CLOUD_URL", url);
      const t = createTest();
      await expect(t.mutation(internal.seed.run, {})).resolves
        .toEqual({ status: "disabled", seedKey: SEED_KEY });
      await expectEmpty(t);
    },
  );

  it("is internal and rejects unexpected arguments before any writes", async () => {
    expect(run.isInternal).toBe(true);
    const t = createTest();
    const unexpectedArgs = { force: true } as unknown as Record<string, never>;
    await expect(t.mutation(internal.seed.run, unexpectedArgs)).rejects.toThrow();
    await expectEmpty(t);
  });

  it("imports the complete graph with native IDs, original timestamps, and a completion marker", async () => {
    const t = createTest();
    const startedAt = Date.now();
    await expect(t.mutation(internal.seed.run, {})).resolves
      .toEqual({ status: "seeded", seedKey: SEED_KEY, counts: expectedCounts });
    await t.run(async ({ db }) => {
      for (const table of SEED_TABLES) {
        const records = await db.query(table).collect();
        expect(records).toHaveLength(expectedCounts[table]);
        for (const record of records) {
          expect(db.normalizeId(table, record._id)).not.toBeNull();
          expect(record).not.toHaveProperty("id");
        }
      }
      const seed = seedData.prepareSundayServiceSeed();
      const journey = (await db.query("journeys").unique())!;
      const shuttle = (await db.query("shuttles").unique())!;
      const organization = (await db.query("organizations").unique())!;
      await validateJourney(db, journey._id);
      expect(journey.shuttleId).toBe(shuttle._id);
      expect(journey.organizationId).toBe(organization._id);
      expect(journey.activeRouteLegId).toBe(journey.routeLegIds[0]);
      expect(journey.createdAt).toBe(seed.journey.createdAt);
      expect(shuttle.tracking).toEqual(seed.shuttle.tracking);
      const driver = (await db.get("users", shuttle.activeDriverId!))!;
      expect(driver.role).toBe("driver");
      expect(driver.organizationId).toBe(organization._id);
      for (const entry of await db.query("waitlistEntries").collect()) await validateWaitlistEntry(db, entry);
      for (const comment of await db.query("routeLegComments").collect()) await validateRouteLegComment(db, comment);
      for (const snapshot of await db.query("routingSnapshots").collect()) await validateRoutingSnapshot(db, snapshot);
      const marker = (await db.query("seedRuns").withIndex("by_key", (q) => q.eq("key", SEED_KEY)).unique())!;
      expect(marker.completedAt).toBeGreaterThanOrEqual(startedAt);
      expect(marker.completedAt).toBeLessThanOrEqual(Date.now());
    });
  });

  it("keeps every native ID, timestamp and record unchanged on a repeat run", async () => {
    const t = createTest();
    await t.mutation(internal.seed.run, {});
    const before = await t.run(({ db }) => readState(db));
    const prepare = vi.spyOn(seedData, "prepareSundayServiceSeed");
    await expect(t.mutation(internal.seed.run, {})).resolves
      .toEqual({ status: "already_seeded", seedKey: SEED_KEY });
    expect(prepare).not.toHaveBeenCalled();
    expect(await t.run(({ db }) => readState(db))).toEqual(before);
  });

  it("links each rider, author, location and routing snapshot to the intended leg", async () => {
    const t = createTest();
    await t.mutation(internal.seed.run, {});
    const seed = seedData.prepareSundayServiceSeed();
    await t.run(async ({ db }) => {
      const journey = (await db.query("journeys").unique())!;
      for (const [index, routeLegId] of journey.routeLegIds.entries()) {
        const leg = (await db.get("routeLegs", routeLegId))!;
        const original = seed.routeLegs[index];
        expect(leg).toMatchObject({ sequence: original.sequence, status: original.status,
          currentCycle: 1, scheduledDepartureAt: original.scheduledDepartureAt,
          scheduledArrivalAt: original.scheduledArrivalAt, createdAt: original.createdAt,
          updatedAt: original.updatedAt });
        for (const field of ["departureLocationId", "arrivalLocationId"] as const) {
          const location = (await db.get("locations", leg[field]))!;
          const expected = seed.locations.find((item) => item.id === original[field])!;
          expect(location).toMatchObject({ name: expected.name, address: expected.address,
            latitude: expected.latitude, longitude: expected.longitude });
        }
        const entries = await db.query("waitlistEntries").withIndex("by_leg_cycle_requested", (q) =>
          q.eq("routeLegId", routeLegId).eq("cycle", 1)).collect();
        const expectedEntries = seed.waitlistEntries.filter((item) => item.routeLegId === original.id);
        expect(entries).toHaveLength(expectedEntries.length);
        for (const [entryIndex, entry] of entries.entries()) {
          const expected = expectedEntries[entryIndex];
          const user = seed.users.find((item) => item.id === expected.userId)!;
          expect(entry.requestedAt).toBe(expected.requestedAt);
          expect(await db.get("users", entry.userId)).toMatchObject({ firstName: user.firstName,
            lastName: user.lastName, phoneNumber: user.phoneNumber, role: user.role });
        }
        const comments = await db.query("routeLegComments").withIndex("by_leg_cycle_created", (q) =>
          q.eq("routeLegId", routeLegId).eq("cycle", 1)).collect();
        const expectedComments = seed.routeLegComments.filter((item) => item.routeLegId === original.id);
        expect(comments).toHaveLength(expectedComments.length);
        for (const [commentIndex, comment] of comments.entries()) {
          const expected = expectedComments[commentIndex];
          const author = seed.users.find((item) => item.id === expected.authorUserId)!;
          expect(comment).toMatchObject({ message: expected.message, createdAt: expected.createdAt });
          expect(await db.get("users", comment.authorUserId)).toMatchObject({ firstName: author.firstName });
        }
        const snapshot = (await db.query("routingSnapshots").withIndex("by_route_leg", (q) =>
          q.eq("routeLegId", routeLegId)).unique())!;
        const expected = seed.routingSnapshots.find((item) => item.routeLegId === original.id)!;
        expect(snapshot).toMatchObject({ origin: expected.origin, destination: expected.destination,
          progressRatio: expected.progressRatio, calculatedAt: expected.calculatedAt });
      }
    });
  });

  it("preserves changed status, cycle, and removed waitlist entries/comments", async () => {
    const t = createTest();
    await t.mutation(internal.seed.run, {});
    await t.run(async ({ db }) => {
      const journey = (await db.query("journeys").unique())!;
      const completedId = journey.activeRouteLegId!;
      await db.patch("routeLegs", completedId, { status: "NOT_STARTED", currentCycle: 2 });
      await db.patch("routeLegs", journey.routeLegIds[1], { status: "DEPARTING" });
      await db.patch("journeys", journey._id, { activeRouteLegId: journey.routeLegIds[1] });
      for (const table of ["waitlistEntries", "routeLegComments"] as const) {
        const records = await db.query(table).collect();
        for (const record of records) if (record.routeLegId === completedId) await db.delete(table, record._id);
      }
    });
    const before = await t.run(({ db }) => readState(db));
    await expect(t.mutation(internal.seed.run, {})).resolves
      .toEqual({ status: "already_seeded", seedKey: SEED_KEY });
    expect(await t.run(({ db }) => readState(db))).toEqual(before);
  });

  it("does not reconstruct deleted domain records when the completion marker remains", async () => {
    const t = createTest();
    await t.mutation(internal.seed.run, {});
    await t.run(async ({ db }) => {
      for (const table of SEED_TABLES) {
        for (const record of await db.query(table).collect()) await db.delete(table, record._id);
      }
    });
    const before = await t.run(({ db }) => readState(db));
    await expect(t.mutation(internal.seed.run, {})).resolves
      .toEqual({ status: "already_seeded", seedKey: SEED_KEY });
    expect(await t.run(({ db }) => readState(db))).toEqual(before);
  });

  it.each(SEED_TABLES)("refuses an unmarked database containing only %s", async (occupiedTable) => {
    const t = createTest();
    await t.mutation(internal.seed.run, {});
    await t.run(async ({ db }) => {
      for (const table of [...SEED_TABLES, "seedRuns"] as const) {
        if (table === occupiedTable) continue;
        for (const record of await db.query(table).collect()) await db.delete(table, record._id);
      }
    });
    const before = await t.run(({ db }) => readState(db));
    const prepare = vi.spyOn(seedData, "prepareSundayServiceSeed");
    await expect(t.mutation(internal.seed.run, {})).resolves
      .toEqual({ status: "conflict", seedKey: SEED_KEY });
    expect(prepare).not.toHaveBeenCalled();
    expect(await t.run(({ db }) => readState(db))).toEqual(before);
  });

  it("gives simultaneous callers one import and three no-op results", async () => {
    const t = createTest();
    const results = await Promise.all(Array.from({ length: 4 }, () => t.mutation(internal.seed.run, {})));
    expect(results.filter((result) => result.status === "seeded")).toHaveLength(1);
    expect(results.filter((result) => result.status === "already_seeded")).toHaveLength(3);
    const state = await t.run(({ db }) => readState(db));
    for (const { table, records } of state) {
      expect(records).toHaveLength(table === "seedRuns" ? 1 : expectedCounts[table]);
    }
  });

  it("rolls back partial imports when late routing validation fails", async () => {
    const t = createTest();
    const malformed = seedData.prepareSundayServiceSeed();
    malformed.routingSnapshots[1].progressRatio = 2;
    vi.spyOn(seedData, "prepareSundayServiceSeed").mockReturnValueOnce(malformed);
    await expect(t.mutation(internal.seed.run, {})).rejects
      .toMatchObject({ data: { code: "SEED_IMPORT_FAILED" } });
    await expectEmpty(t);
    await expect(t.mutation(internal.seed.run, {})).resolves
      .toEqual({ status: "seeded", seedKey: SEED_KEY, counts: expectedCounts });
  });

  it("rolls back a completed graph on import failure without exposing the original error", async () => {
    const t = createTest();
    const originalImport = seedImport.importSeedData;
    vi.spyOn(seedImport, "importSeedData").mockImplementationOnce(async (db, data) => {
      await originalImport(db, data);
      throw new Error("Private contact +1-410-555-9999");
    });
    try {
      await t.mutation(internal.seed.run, {});
      expect.fail("Expected import failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      expect((error as ConvexError<{ code: string }>).data).toEqual({ code: "SEED_IMPORT_FAILED" });
      expect(String(error)).not.toContain("Private contact");
      expect(String(error)).not.toContain("555-9999");
    }
    await expectEmpty(t);
  });
});
