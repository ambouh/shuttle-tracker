import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PublicJourneySnapshot } from "../types/live-journey";
import { api } from "./_generated/api";
import type { DatabaseWriter } from "./_generated/server";
import * as reader from "./journeyRead";
import { getOverview } from "./journeys";
import * as projection from "./publicJourney";
import schema from "./schema";
import { prepareSundayServiceSeed } from "./seedData";
import { importSeedData } from "./seedImport";

const modules = {
  "./_generated/server.js": () => import("./_generated/server.js"),
  "./journeys.ts": () => import("./journeys"),
};
const createTest = () => convexTest(schema, modules);
const selection = { organizationSlug: "union-church" };

async function seed(db: DatabaseWriter, slug = selection.organizationSlug) {
  const data = prepareSundayServiceSeed();
  data.organization.slug = slug;
  await importSeedData(db, data);
  const result = await reader.readJourneyGraph(db, { organizationSlug: slug });
  if (result.status !== "ready") throw new Error("Expected a valid test seed");
  return result.graph;
}

function expectFields(value: object, fields: readonly string[]) {
  expect(Object.keys(value).sort()).toEqual([...fields].sort());
}

function expectPublicFields(snapshot: PublicJourneySnapshot) {
  expectFields(snapshot, ["organization", "journey", "routeLegs", "locations", "users", "shuttle", "routingSnapshots"]);
  expectFields(snapshot.organization, ["id", "slug", "details"]);
  expectFields(snapshot.organization.details, ["displayName", "description", "logoUrl", "logoAltText", "fallbackInitials"]);
  expectFields(snapshot.journey, ["id", "organizationId", "name", "description", "routeLegIds", "activeRouteLegId"]);
  for (const leg of snapshot.routeLegs) {
    expectFields(leg, ["id", "journeyId", "sequence", "name", "departureLocationId", "arrivalLocationId",
      "scheduledDepartureAt", "scheduledArrivalAt", "status", "currentCycle", "waitlist", "comments"]);
    for (const entry of leg.waitlist) expectFields(entry, ["id", "userId", "routeLegId", "requestedAt"]);
    for (const comment of leg.comments) expectFields(comment, ["id", "routeLegId", "authorUserId", "message", "createdAt"]);
  }
  for (const location of snapshot.locations) expectFields(location, ["id", "name", "address", "latitude", "longitude"]);
  for (const person of snapshot.users) expectFields(person, ["id", "firstName", "lastInitial", "profileImageUrl"]);
  expectFields(snapshot.shuttle, ["id", "name", "activeDriverId", "activeTrackingProvider", "tracking"]);
  if (snapshot.shuttle.tracking) {
    expectFields(snapshot.shuttle.tracking, ["status", "coordinates", "accuracyMeters", "recordedAt", "receivedAt"]);
    if (snapshot.shuttle.tracking.coordinates) expectFields(snapshot.shuttle.tracking.coordinates, ["latitude", "longitude"]);
  }
  for (const routing of snapshot.routingSnapshots) {
    expectFields(routing, ["routeLegId", "shuttleId", "origin", "destination", "totalDistanceMeters",
      "remainingDistanceMeters", "estimatedDurationSeconds", "estimatedArrivalAt", "progressRatio",
      "encodedGeometry", "calculatedAt"]);
    expectFields(routing.origin, ["latitude", "longitude"]);
    expectFields(routing.destination, ["latitude", "longitude"]);
  }
}

afterEach(() => vi.restoreAllMocks());

describe("public journey query", () => {
  it("is a public query that returns the seeded graph through an exact display projection", async () => {
    const t = createTest();
    const graph = await t.run(({ db }) => seed(db));
    expect(getOverview.isPublic).toBe(true);
    expect(getOverview.isQuery).toBe(true);
    const result = await t.query(api.journeys.getOverview, selection);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("Expected a public snapshot");
    expectFields(result, ["status", "snapshot"]);
    const { snapshot } = result;
    expectPublicFields(snapshot);
    expect(snapshot.organization.id).toBe(graph.organization._id);
    expect(snapshot.journey.id).toBe(graph.journey._id);
    expect(snapshot.journey.activeRouteLegId).toBe(graph.journey.activeRouteLegId);
    expect(snapshot.routeLegs.map((leg) => leg.id)).toEqual(graph.journey.routeLegIds);
    expect(snapshot.shuttle.activeDriverId).toBe(graph.shuttle.activeDriverId);
    expect(snapshot.shuttle.tracking).toEqual(graph.shuttle.tracking);
    for (const [index, leg] of snapshot.routeLegs.entries()) {
      const stored = graph.legs[index];
      expect(leg.status).toBe(stored.leg.status);
      expect(leg.scheduledDepartureAt).toBe(stored.leg.scheduledDepartureAt);
      expect(leg.waitlist.map((entry) => entry.userId)).toEqual(stored.waitlist.map((entry) => entry.userId));
      expect(leg.comments.map((comment) => comment.authorUserId)).toEqual(stored.comments.map((comment) => comment.authorUserId));
      expect(snapshot.locations.some((location) => location.id === leg.departureLocationId)).toBe(true);
      expect(snapshot.locations.some((location) => location.id === leg.arrivalLocationId)).toBe(true);
      expect(snapshot.routingSnapshots[index].calculatedAt).toBe(stored.routing!.calculatedAt);
      expect(snapshot.routingSnapshots[index].progressRatio).toBe(stored.routing!.progressRatio);
    }
    const serialized = JSON.stringify(result);
    for (const key of ["phoneNumber", "lastName", "role", "_id", "_creationTime", "recognitionToken"]) {
      expect(serialized).not.toContain(`"${key}":`);
    }
  });

  it("returns empty for no active journeys and unavailable for an inactive selected journey", async () => {
    const t = createTest();
    const graph = await t.run(({ db }) => seed(db));
    await t.run(({ db }) => db.patch("journeys", graph.journey._id, { active: false }));
    await expect(t.query(api.journeys.getOverview, selection)).resolves.toEqual({ status: "empty" });
    await expect(t.query(api.journeys.getOverview, { ...selection, journeyId: graph.journey._id }))
      .resolves.toEqual({ status: "unavailable" });
  });

  it.each(["unknown", " "])("returns unavailable for organization '%s'", async (organizationSlug) => {
    const t = createTest();
    await t.run(({ db }) => seed(db));
    await expect(t.query(api.journeys.getOverview, { organizationSlug })).resolves.toEqual({ status: "unavailable" });
  });

  it("keeps two organizations separate and rejects foreign, malformed, and missing journey IDs", async () => {
    const t = createTest();
    const first = await t.run(({ db }) => seed(db));
    const second = await t.run(({ db }) => seed(db, "other"));
    for (const graph of [first, second]) {
      const result = await t.query(api.journeys.getOverview, { organizationSlug: graph.organization.slug });
      expect(result.status).toBe("ready");
      if (result.status !== "ready") throw new Error("Expected a tenant's own snapshot");
      expect(result.snapshot.journey.id).toBe(graph.journey._id);
      expect(result.snapshot.users.map((person) => person.id)).toEqual(graph.users.map((person) => person._id));
    }
    for (const journeyId of [second.journey._id, first.shuttle._id, "invalid-journey-id"]) {
      await expect(t.query(api.journeys.getOverview, { ...selection, journeyId }))
        .resolves.toEqual({ status: "unavailable" });
    }
    await t.run(({ db }) => db.delete("journeys", first.journey._id));
    await expect(t.query(api.journeys.getOverview, { ...selection, journeyId: first.journey._id }))
      .resolves.toEqual({ status: "unavailable" });
  });

  it("returns only the current cycle while retaining membership on the other leg", async () => {
    const t = createTest();
    const graph = await t.run(({ db }) => seed(db));
    await t.run(({ db }) => db.patch("routeLegs", graph.legs[0].leg._id, { currentCycle: 2 }));
    const result = await t.query(api.journeys.getOverview, selection);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("Expected current-cycle data");
    expect(result.snapshot.routeLegs[0]).toMatchObject({ currentCycle: 2, waitlist: [], comments: [] });
    expect(result.snapshot.routeLegs[1].waitlist).toHaveLength(3);
  });

  it("preserves null optional data and omits missing routing", async () => {
    const t = createTest();
    const graph = await t.run(({ db }) => seed(db));
    await t.run(async ({ db }) => {
      await db.patch("journeys", graph.journey._id, { activeRouteLegId: null });
      await db.patch("shuttles", graph.shuttle._id, { activeDriverId: null, activeTrackingProvider: null, tracking: null });
      await db.delete("routingSnapshots", graph.legs[0].routing!._id);
    });
    const result = await t.query(api.journeys.getOverview, selection);
    expect(result).toMatchObject({ status: "ready", snapshot: {
      journey: { activeRouteLegId: null }, shuttle: { activeDriverId: null, activeTrackingProvider: null, tracking: null },
    } });
    if (result.status !== "ready") throw new Error("Expected optional data");
    expect(result.snapshot.routingSnapshots.map((routing) => routing.routeLegId)).toEqual([graph.legs[1].leg._id]);
  });

  it.each(["missing rider", "duplicate membership", "duplicate routing"])(
    "returns unavailable without a partial payload for %s", async (kind) => {
      const t = createTest();
      const graph = await t.run(({ db }) => seed(db));
      await t.run(async ({ db }) => {
        if (kind === "missing rider") {
          await db.delete("users", graph.legs[0].waitlist[0].userId);
        } else if (kind === "duplicate membership") {
          const { _id, _creationTime, ...fields } = graph.legs[0].waitlist[0];
          void _id; void _creationTime;
          await db.insert("waitlistEntries", fields);
        } else {
          const { _id, _creationTime, ...fields } = graph.legs[0].routing!;
          void _id; void _creationTime;
          await db.insert("routingSnapshots", fields);
        }
      });
      await expect(t.query(api.journeys.getOverview, selection)).resolves.toEqual({ status: "unavailable" });
    },
  );

  it.each([{}, { organizationSlug: 12 }, { ...selection, journeyId: null }, { ...selection, userId: "unexpected" }])(
    "rejects invalid argument shapes before reading records: %o", async (args) => {
      const t = createTest();
      const read = vi.spyOn(reader, "readJourneyGraph");
      await expect(t.query(api.journeys.getOverview, args as reader.JourneyReadSelection)).rejects.toThrow();
      expect(read).not.toHaveBeenCalled();
    },
  );

  it.each([new Error("synthetic-private-record"), new ConvexError({ privateValue: "synthetic-private-record" })])(
    "sanitizes unexpected reader failures", async (failure) => {
      const t = createTest();
      vi.spyOn(reader, "readJourneyGraph").mockRejectedValueOnce(failure);
      const result = await t.query(api.journeys.getOverview, selection).catch((error: unknown) => error);
      expect(result).toBeInstanceOf(ConvexError);
      expect(result).toMatchObject({ data: { code: "JOURNEY_READ_FAILED" } });
      expect(String(result)).not.toContain("synthetic-private-record");
    },
  );
});

function addPrivateFields(value: unknown) {
  if (Array.isArray(value)) value.forEach(addPrivateFields);
  else if (value !== null && typeof value === "object") {
    Object.values(value).forEach(addPrivateFields);
    Object.assign(value, { privateField: "synthetic-secret" });
  }
}

describe("public journey projection", () => {
  it("omits unexpected fields throughout the stored graph and detaches nested records", async () => {
    const t = createTest();
    const graph = await t.run(({ db }) => seed(db));
    graph.users[0].phoneNumber = "+12025550147";
    graph.users[0].lastName = "ConfidentialSurname";
    addPrivateFields(graph);
    const original = structuredClone(graph);
    const snapshot = projection.projectPublicJourney(graph);
    expectPublicFields(snapshot);
    const serialized = JSON.stringify(snapshot);
    for (const secret of ["synthetic-secret", "+12025550147", "ConfidentialSurname"]) {
      expect(serialized).not.toContain(secret);
    }
    snapshot.organization.details.displayName = "Changed";
    snapshot.journey.routeLegIds.reverse();
    snapshot.routeLegs[0].waitlist[0].requestedAt = 0;
    snapshot.routeLegs[0].comments[0].message = "Changed";
    snapshot.locations[0].name = "Changed";
    snapshot.users[0].firstName = "Changed";
    snapshot.shuttle.tracking!.coordinates!.latitude = 0;
    snapshot.routingSnapshots[0].origin.latitude = 0;
    expect(graph).toEqual(original);
  });
});

const publicObjects: { name: string; select: (snapshot: PublicJourneySnapshot) => object }[] = [
  { name: "snapshot", select: (s) => s },
  { name: "organization", select: (s) => s.organization },
  { name: "organization details", select: (s) => s.organization.details },
  { name: "journey", select: (s) => s.journey },
  { name: "leg", select: (s) => s.routeLegs[0] },
  { name: "membership", select: (s) => s.routeLegs[0].waitlist[0] },
  { name: "comment", select: (s) => s.routeLegs[0].comments[0] },
  { name: "location", select: (s) => s.locations[0] },
  { name: "person", select: (s) => s.users[0] },
  { name: "shuttle", select: (s) => s.shuttle },
  { name: "tracking", select: (s) => s.shuttle.tracking! },
  { name: "tracking coordinates", select: (s) => s.shuttle.tracking!.coordinates! },
  { name: "routing", select: (s) => s.routingSnapshots[0] },
  { name: "routing origin", select: (s) => s.routingSnapshots[0].origin },
  { name: "routing destination", select: (s) => s.routingSnapshots[0].destination },
];

describe("registered query return validation", () => {
  it.each(publicObjects)("rejects an extra field on $name", async ({ select }) => {
    const t = createTest();
    const graph = await t.run(({ db }) => seed(db));
    const snapshot = projection.projectPublicJourney(graph);
    Object.assign(select(snapshot), { unexpectedField: "synthetic-value" });
    vi.spyOn(projection, "projectPublicJourney").mockReturnValueOnce(snapshot);
    await expect(t.query(api.journeys.getOverview, selection)).rejects.toThrow("Return value validation failed");
  });

  it("rejects an incorrect field type even when TypeScript is bypassed", async () => {
    const t = createTest();
    const graph = await t.run(({ db }) => seed(db));
    const snapshot = projection.projectPublicJourney(graph);
    Object.assign(snapshot.users[0], { firstName: 42 });
    vi.spyOn(projection, "projectPublicJourney").mockReturnValueOnce(snapshot);
    await expect(t.query(api.journeys.getOverview, selection)).rejects.toThrow("Return value validation failed");
  });
});
