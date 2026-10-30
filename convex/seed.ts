import { ConvexError, v, type Infer } from "convex/values";

import { internalMutation } from "./_generated/server";
import { prepareSundayServiceSeed } from "./seedData";
import { importSeedData } from "./seedImport";

export const SEED_KEY = "sunday-service-v1";
export const SEED_DEVELOPMENT_URL = "https://formal-giraffe-877.convex.cloud";
export const SEED_TABLES = [
  "organizations", "users", "locations", "shuttles", "journeys", "routeLegs",
  "waitlistEntries", "routeLegComments", "routingSnapshots",
] as const;

const resultValidator = v.union(
  v.object({
    status: v.literal("seeded"), seedKey: v.literal(SEED_KEY),
    counts: v.object({
      organizations: v.number(), users: v.number(), locations: v.number(),
      shuttles: v.number(), journeys: v.number(), routeLegs: v.number(),
      waitlistEntries: v.number(), routeLegComments: v.number(), routingSnapshots: v.number(),
    }),
  }),
  v.object({
    status: v.union(v.literal("disabled"), v.literal("already_seeded"), v.literal("conflict")),
    seedKey: v.literal(SEED_KEY),
  }),
);

export type SeedResult = Infer<typeof resultValidator>;

export const run = internalMutation({
  args: {},
  returns: resultValidator,
  handler: async ({ db }): Promise<SeedResult> => {
    if (process.env.ALLOW_DEVELOPMENT_SEED !== "true"
      || process.env.CONVEX_CLOUD_URL !== SEED_DEVELOPMENT_URL) {
      return { status: "disabled", seedKey: SEED_KEY };
    }
    const completed = await db.query("seedRuns")
      .withIndex("by_key", (q) => q.eq("key", SEED_KEY)).first();
    if (completed) return { status: "already_seeded", seedKey: SEED_KEY };
    for (const table of SEED_TABLES) {
      if (await db.query(table).first()) return { status: "conflict", seedKey: SEED_KEY };
    }
    try {
      const seed = prepareSundayServiceSeed();
      const counts = await importSeedData(db, seed);
      await db.insert("seedRuns", { key: SEED_KEY, completedAt: Date.now() });
      return { status: "seeded", seedKey: SEED_KEY, counts };
    } catch {
      // Throw so every write rolls back; never return or log raw records from a failed import.
      throw new ConvexError({ code: "SEED_IMPORT_FAILED" });
    }
  },
});
