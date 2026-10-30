import type { WithoutSystemFields } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { ROUTING_SNAPSHOTS } from "../fixtures/operational-scenarios";
import { UNION_ORGANIZATION } from "../fixtures/organization";
import type { Doc } from "./_generated/dataModel";
import type { DatabaseWriter } from "./_generated/server";
import { validateJourney, validateRouteLeg } from "./journeyValidation";
import {
  validateRouteLegComment,
  validateRoutingSnapshot,
  validateWaitlistEntry,
} from "./routeDataValidation";
import schema from "./schema";

const timestamps = { createdAt: 1, updatedAt: 2 };
const modules = { "./_generated/server.js": () => import("./_generated/server.js") };
const createTest = () => convexTest(schema, modules);

async function createTenant(db: DatabaseWriter, slug: string) {
  const organizationId = await db.insert("organizations", {
    slug, active: true, details: UNION_ORGANIZATION.details, ...timestamps,
  });
  const userId = await db.insert("users", {
    organizationId, firstName: "Test", lastName: "Rider", role: "rider",
    phoneNumber: null, profileImageUrl: null, ...timestamps,
  });
  const shuttleFields = {
    organizationId, name: "Shuttle", activeDriverId: null,
    activeTrackingProvider: null, tracking: null, ...timestamps,
  };
  const shuttleId = await db.insert("shuttles", shuttleFields);
  const locationFields = { organizationId, address: "Test address", latitude: 39, longitude: -76 };
  const departureId = await db.insert("locations", { ...locationFields, name: "Church" });
  const arrivalId = await db.insert("locations", { ...locationFields, name: "School" });
  return { organizationId, userId, shuttleId, shuttleFields, departureId, arrivalId };
}

async function createGraph(db: DatabaseWriter, slug = "union-church") {
  const tenant = await createTenant(db, slug);
  const journeyId = await db.insert("journeys", {
    organizationId: tenant.organizationId, shuttleId: tenant.shuttleId,
    name: "Sunday Service", description: null, active: true,
    routeLegIds: [], activeRouteLegId: null, ...timestamps,
  });
  const legFields = {
    journeyId, sequence: 1, name: "To School", status: "IN_TRANSIT" as const,
    departureLocationId: tenant.departureId, arrivalLocationId: tenant.arrivalId,
    scheduledDepartureAt: 100, scheduledArrivalAt: 200,
    departureGeofenceRadius: 160, arrivalGeofenceRadius: 160,
    currentCycle: 1, ...timestamps,
  };
  const outboundId = await db.insert("routeLegs", legFields);
  const returnId = await db.insert("routeLegs", {
    ...legFields, sequence: 2, name: "To Church", status: "NOT_STARTED",
    departureLocationId: tenant.arrivalId, arrivalLocationId: tenant.departureId,
  });
  await db.patch("journeys", journeyId, {
    routeLegIds: [outboundId, returnId], activeRouteLegId: outboundId,
  });
  const entry = { routeLegId: outboundId, userId: tenant.userId, cycle: 1, requestedAt: 10 };
  const comment = {
    routeLegId: outboundId, authorUserId: tenant.userId, cycle: 1,
    message: "On my way", createdAt: 10,
  };
  const snapshot = { ...ROUTING_SNAPSHOTS[0], routeLegId: outboundId, shuttleId: tenant.shuttleId };
  return { ...tenant, journeyId, outboundId, returnId, legFields, entry, comment, snapshot };
}

describe("journey storage relationships", () => {
  it("validates a complete two-leg graph and queries its ordered legs", async () => {
    const t = createTest();
    await t.run(async ({ db }) => {
      const graph = await createGraph(db);
      await validateJourney(db, graph.journeyId);
      const legs = await db.query("routeLegs")
        .withIndex("by_journey_sequence", (q) => q.eq("journeyId", graph.journeyId)).collect();
      expect(legs.map((leg) => leg._id)).toEqual([graph.outboundId, graph.returnId]);
      const journeys = await db.query("journeys").withIndex("by_organization_active", (q) =>
        q.eq("organizationId", graph.organizationId).eq("active", true)).collect();
      expect(journeys.map((journey) => journey._id)).toEqual([graph.journeyId]);
      await db.patch("journeys", graph.journeyId, { activeRouteLegId: null });
      await validateJourney(db, graph.journeyId);
    });
  });

  it.each(["empty", "duplicate", "reordered", "duplicate sequence"])(
    "rejects %s leg ordering and rolls back the invalid change", async (kind) => {
      const t = createTest();
      const graph = await t.run(({ db }) => createGraph(db));
      await expect(t.run(async ({ db }) => {
        if (kind === "duplicate sequence") {
          await db.patch("routeLegs", graph.returnId, { sequence: 1 });
        } else {
          const routeLegIds = kind === "empty" ? [] : kind === "duplicate"
            ? [graph.outboundId, graph.outboundId] : [graph.returnId, graph.outboundId];
          await db.patch("journeys", graph.journeyId, { routeLegIds });
        }
        await validateJourney(db, graph.journeyId);
      })).rejects.toMatchObject({ data: { code: "INVALID_LEG_ORDER" } });
      await t.run(({ db }) => validateJourney(db, graph.journeyId));
    },
  );

  it("rejects a stored leg omitted from the ordered list", async () => {
    const t = createTest();
    await expect(t.run(async ({ db }) => {
      const graph = await createGraph(db);
      await db.insert("routeLegs", { ...graph.legFields, sequence: 3 });
      await validateJourney(db, graph.journeyId);
    })).rejects.toMatchObject({ data: { code: "JOURNEY_LEGS_MISMATCH" } });
  });

  it.each(["missing journey", "missing leg", "foreign leg", "foreign active leg"])(
    "rejects %s references", async (kind) => {
      const t = createTest();
      const codes: Record<string, string> = {
        "missing journey": "JOURNEY_NOT_FOUND", "missing leg": "ROUTE_LEG_NOT_FOUND",
        "foreign leg": "ROUTE_LEG_JOURNEY_MISMATCH", "foreign active leg": "ACTIVE_LEG_NOT_IN_JOURNEY",
      };
      await expect(t.run(async ({ db }) => {
        const graph = await createGraph(db);
        const other = await createGraph(db, "other");
        if (kind === "missing journey") await db.delete("journeys", graph.journeyId);
        if (kind === "missing leg") await db.delete("routeLegs", graph.returnId);
        if (kind === "foreign leg") {
          await db.patch("journeys", graph.journeyId, {
            routeLegIds: [other.outboundId, graph.returnId], activeRouteLegId: null,
          });
        }
        if (kind === "foreign active leg") {
          await db.patch("journeys", graph.journeyId, { activeRouteLegId: other.outboundId });
        }
        await validateJourney(db, graph.journeyId);
      })).rejects.toMatchObject({ data: { code: codes[kind] } });
    },
  );

  it.each(["departureLocationId", "arrivalLocationId"] as const)(
    "rejects foreign or deleted %s endpoints", async (field) => {
      for (const missing of [false, true]) {
        const t = createTest();
        await expect(t.run(async ({ db }) => {
          const graph = await createGraph(db);
          const other = await createTenant(db, "other");
          await db.patch("routeLegs", graph.outboundId, { [field]: other.departureId });
          if (missing) await db.delete("locations", other.departureId);
          await validateRouteLeg(db, graph.outboundId);
        })).rejects.toMatchObject({ data: { code: missing
          ? "LOCATION_NOT_FOUND" : "LOCATION_ORGANIZATION_MISMATCH" } });
      }
    },
  );

  it.each([false, true])("rejects an invalid journey shuttle (missing: %s)", async (missing) => {
    const t = createTest();
    await expect(t.run(async ({ db }) => {
      const graph = await createGraph(db);
      const other = await createTenant(db, "other");
      await db.patch("journeys", graph.journeyId, { shuttleId: other.shuttleId });
      if (missing) await db.delete("shuttles", other.shuttleId);
      await validateJourney(db, graph.journeyId);
    })).rejects.toMatchObject({ data: { code: missing
      ? "SHUTTLE_NOT_FOUND" : "SHUTTLE_ORGANIZATION_MISMATCH" } });
  });

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid cycle/sequence %s", async (value) => {
      for (const field of ["currentCycle", "sequence"] as const) {
        const t = createTest();
        await expect(t.run(async ({ db }) => {
          const graph = await createGraph(db);
          await db.patch("routeLegs", graph.outboundId, { [field]: value });
          await validateRouteLeg(db, graph.outboundId);
        })).rejects.toMatchObject({ data: { code: "INVALID_FIELD", field } });
      }
    },
  );

  it.each([0, -1, Infinity])("rejects nonpositive or nonfinite geofence radius %s", async (radius) => {
    for (const field of ["departureGeofenceRadius", "arrivalGeofenceRadius"] as const) {
      const t = createTest();
      await expect(t.run(async ({ db }) => {
        const graph = await createGraph(db);
        await db.patch("routeLegs", graph.outboundId, { [field]: radius });
        await validateRouteLeg(db, graph.outboundId);
      })).rejects.toMatchObject({ data: { code: "INVALID_FIELD", field } });
    }
  });

  it.each(["scheduledDepartureAt", "scheduledArrivalAt"] as const)(
    "rejects a nonfinite %s", async (field) => {
      const t = createTest();
      await expect(t.run(async ({ db }) => {
        const graph = await createGraph(db);
        await db.patch("routeLegs", graph.outboundId, { [field]: NaN });
        await validateRouteLeg(db, graph.outboundId);
      })).rejects.toMatchObject({ data: { code: "INVALID_FIELD", field } });
    },
  );
});

describe("active-cycle rider data", () => {
  it("keeps earlier cycles and other legs out of active index lookups", async () => {
    const t = createTest();
    await t.run(async ({ db }) => {
      const graph = await createGraph(db);
      await db.insert("waitlistEntries", graph.entry);
      await db.insert("routeLegComments", graph.comment);
      await db.patch("routeLegs", graph.outboundId, { currentCycle: 2 });
      const entry = { ...graph.entry, cycle: 2 };
      const comment = { ...graph.comment, cycle: 2 };
      await validateWaitlistEntry(db, entry);
      await validateRouteLegComment(db, comment);
      const entryId = await db.insert("waitlistEntries", entry);
      const commentId = await db.insert("routeLegComments", comment);
      await db.insert("waitlistEntries", { ...graph.entry, routeLegId: graph.returnId });
      const entries = await db.query("waitlistEntries").withIndex("by_leg_cycle_requested", (q) =>
        q.eq("routeLegId", graph.outboundId).eq("cycle", 2)).collect();
      const comments = await db.query("routeLegComments").withIndex("by_leg_cycle_created", (q) =>
        q.eq("routeLegId", graph.outboundId).eq("cycle", 2)).collect();
      const membership = await db.query("waitlistEntries").withIndex("by_leg_cycle_user", (q) =>
        q.eq("routeLegId", graph.outboundId).eq("cycle", 2).eq("userId", graph.userId)).unique();
      expect(entries.map((record) => record._id)).toEqual([entryId]);
      expect(comments.map((record) => record._id)).toEqual([commentId]);
      expect(membership?._id).toBe(entryId);
    });
  });

  it.each([0, -1, 1.5, Infinity, 2, 4])("rejects invalid or mismatched cycle %s", async (cycle) => {
    const t = createTest();
    const graph = await t.run(async ({ db }) => {
      const graph = await createGraph(db);
      await db.patch("routeLegs", graph.outboundId, { currentCycle: 3 });
      return graph;
    });
    const code = Number.isSafeInteger(cycle) && cycle > 0 ? "ROUTE_CYCLE_MISMATCH" : "INVALID_FIELD";
    await expect(t.run(({ db }) => validateWaitlistEntry(db, { ...graph.entry, cycle })))
      .rejects.toMatchObject({ data: { code } });
    await expect(t.run(({ db }) => validateRouteLegComment(db, { ...graph.comment, cycle })))
      .rejects.toMatchObject({ data: { code } });
  });

  it.each(["guest", "same organization", "foreign", "missing"])(
    "validates both waitlist member and comment author: %s", async (kind) => {
      const t = createTest();
      const graph = await t.run(async ({ db }) => {
        const graph = await createGraph(db);
        if (kind === "missing") await db.delete("users", graph.userId);
        if (kind === "guest") await db.patch("users", graph.userId, { role: "guest", organizationId: null });
        if (kind === "foreign") {
          const other = await createTenant(db, "other");
          await db.patch("users", graph.userId, { organizationId: other.organizationId });
        }
        return graph;
      });
      for (const validate of [
        () => t.run(({ db }) => validateWaitlistEntry(db, graph.entry)),
        () => t.run(({ db }) => validateRouteLegComment(db, graph.comment)),
      ]) {
        if (kind === "guest" || kind === "same organization") await validate();
        else await expect(validate()).rejects.toMatchObject({ data: { code: kind === "missing"
          ? "USER_NOT_FOUND" : "USER_ORGANIZATION_MISMATCH" } });
      }
    },
  );

  it.each(["NOT_STARTED", "DEPARTING", "IN_TRANSIT"] as const)(
    "allows a comment during %s", async (status) => {
      const t = createTest();
      await t.run(async ({ db }) => {
        const graph = await createGraph(db);
        await db.patch("routeLegs", graph.outboundId, { status });
        await validateRouteLegComment(db, graph.comment);
      });
    },
  );

  it("rejects blank comments and nonfinite rider timestamps", async () => {
    const t = createTest();
    const graph = await t.run(({ db }) => createGraph(db));
    await expect(t.run(({ db }) => validateRouteLegComment(db, { ...graph.comment, message: " " })))
      .rejects.toMatchObject({ data: { code: "INVALID_FIELD", field: "message" } });
    await expect(t.run(({ db }) => validateRouteLegComment(db, { ...graph.comment, createdAt: NaN })))
      .rejects.toMatchObject({ data: { code: "INVALID_FIELD", field: "createdAt" } });
    await expect(t.run(({ db }) => validateWaitlistEntry(db, { ...graph.entry, requestedAt: Infinity })))
      .rejects.toMatchObject({ data: { code: "INVALID_FIELD", field: "requestedAt" } });
  });
});

describe("routing snapshot storage", () => {
  it("stores a valid fixture-derived snapshot and accepts progress boundaries", async () => {
    const t = createTest();
    await t.run(async ({ db }) => {
      const graph = await createGraph(db);
      for (const progressRatio of [0, 0.4, 1]) {
        await validateRoutingSnapshot(db, { ...graph.snapshot, progressRatio });
      }
      await db.insert("routingSnapshots", graph.snapshot);
      const snapshot = await db.query("routingSnapshots").withIndex("by_route_leg", (q) =>
        q.eq("routeLegId", graph.outboundId)).unique();
      expect(snapshot).toMatchObject(graph.snapshot);
    });
  });

  it.each([
    { progressRatio: -0.1 }, { progressRatio: 1.1 }, { progressRatio: NaN },
    { totalDistanceMeters: -1 }, { remainingDistanceMeters: -1 },
    { estimatedDurationSeconds: -1 }, { calculatedAt: Infinity }, { estimatedArrivalAt: NaN },
    { origin: { latitude: 91, longitude: 0 } }, { destination: { latitude: 0, longitude: -181 } },
  ])("rejects invalid routing values %o", async (invalid) => {
    const t = createTest();
    await expect(t.run(async ({ db }) => {
      const graph = await createGraph(db);
      await validateRoutingSnapshot(db, { ...graph.snapshot, ...invalid });
    })).rejects.toMatchObject({ data: { code: "INVALID_FIELD" } });
  });

  it.each(["foreign", "unassigned", "missing", "missing leg"])(
    "rejects routing with %s references", async (kind) => {
      const t = createTest();
      const codes: Record<string, string> = {
        foreign: "SHUTTLE_ORGANIZATION_MISMATCH", unassigned: "ROUTING_SHUTTLE_MISMATCH",
        missing: "SHUTTLE_NOT_FOUND", "missing leg": "ROUTE_LEG_NOT_FOUND",
      };
      await expect(t.run(async ({ db }) => {
        const graph = await createGraph(db);
        let shuttleId = graph.shuttleId;
        if (kind === "foreign") shuttleId = (await createTenant(db, "other")).shuttleId;
        if (kind === "unassigned") shuttleId = await db.insert("shuttles", graph.shuttleFields);
        if (kind === "missing") await db.delete("shuttles", shuttleId);
        if (kind === "missing leg") await db.delete("routeLegs", graph.outboundId);
        await validateRoutingSnapshot(db, { ...graph.snapshot, shuttleId });
      })).rejects.toMatchObject({ data: { code: codes[kind] } });
    },
  );

  it("rejects a persistent ARRIVED status and embedded route lists", async () => {
    const t = createTest();
    const graph = await t.run(({ db }) => createGraph(db));
    for (const invalid of [{ status: "ARRIVED" }, { waitlist: [] }, { comments: [] }]) {
      await expect(t.run(({ db }) => db.insert("routeLegs", {
        ...graph.legFields, ...invalid,
      } as unknown as WithoutSystemFields<Doc<"routeLegs">>))).rejects.toThrow();
    }
  });
});
