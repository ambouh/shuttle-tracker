import type { WithoutSystemFields } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { UNION_ORGANIZATION } from "../fixtures/organization";
import {
  JOHN_SMITH,
  JOSH_WILLIAMS,
  UNION_CHURCH,
  UNION_SHUTTLE,
} from "../fixtures/shared-entities";
import type { Doc } from "./_generated/dataModel";
import type { DatabaseWriter } from "./_generated/server";
import schema from "./schema";
import {
  validateCoordinates,
  validateLocation,
  validateOrganization,
  validateShuttle,
  validateTrackingSnapshot,
  validateUser,
} from "./validation";

const { id: fixtureOrganizationId, ...organization } = UNION_ORGANIZATION;
const { id: fixtureDriverId, ...driver } = JOHN_SMITH;
const { id: fixtureGuestId, ...guest } = JOSH_WILLIAMS;
const { id: fixtureLocationId, ...location } = UNION_CHURCH;
const { id: fixtureShuttleId, ...shuttle } = UNION_SHUTTLE;
const modules = {
  "./_generated/server.js": () => import("./_generated/server.js"),
};

function createTest() {
  return convexTest(schema, modules);
}

async function createOrganizationAndDriver(db: DatabaseWriter) {
  const organizationId = await db.insert("organizations", organization);
  const user = { ...driver, organizationId };
  await validateUser(db, user);
  const driverId = await db.insert("users", user);
  return { organizationId, driverId };
}

describe("foundation records", () => {
  it("stores valid fixture-derived data with native references and indexes", async () => {
    const t = createTest();
    await t.run(async ({ db }) => {
      validateOrganization(organization);
      const { organizationId, driverId } = await createOrganizationAndDriver(db);
      await validateUser(db, guest);
      const guestId = await db.insert("users", guest);
      const place = { ...location, organizationId };
      await validateLocation(db, place);
      const locationId = await db.insert("locations", place);
      const vehicle = { ...shuttle, organizationId, activeDriverId: driverId };
      await validateShuttle(db, vehicle);
      const shuttleId = await db.insert("shuttles", vehicle);

      expect([organizationId, driverId, guestId, locationId, shuttleId]).not.toEqual([
        fixtureOrganizationId, fixtureDriverId, fixtureGuestId,
        fixtureLocationId, fixtureShuttleId,
      ]);
      expect(await db.get("users", guestId)).toMatchObject(guest);
      expect(await db.get("shuttles", shuttleId)).toMatchObject(vehicle);
      const tenant = await db.query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", organization.slug)).unique();
      expect(tenant?._id).toBe(organizationId);
      const members = await db.query("users")
        .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
        .collect();
      expect(members.map((user) => user._id)).toEqual([driverId]);
    });
  });

  it("keeps location and shuttle lookups within their organization", async () => {
    const t = createTest();
    await t.run(async ({ db }) => {
      const first = await createOrganizationAndDriver(db);
      const secondId = await db.insert("organizations", { ...organization, slug: "other" });
      for (const organizationId of [first.organizationId, secondId]) {
        await db.insert("locations", { ...location, organizationId });
        await db.insert("shuttles", { ...shuttle, organizationId, activeDriverId: null });
      }
      const places = await db.query("locations")
        .withIndex("by_organization", (q) => q.eq("organizationId", first.organizationId))
        .collect();
      const vehicles = await db.query("shuttles")
        .withIndex("by_organization", (q) => q.eq("organizationId", first.organizationId))
        .collect();
      expect(places).toHaveLength(1);
      expect(vehicles).toHaveLength(1);
      expect(places[0].organizationId).toBe(first.organizationId);
      expect(vehicles[0].organizationId).toBe(first.organizationId);
    });
  });

  it.each(["rider", "driver", "admin"] as const)("accepts a registered %s", async (role) => {
    const t = createTest();
    await t.run(async ({ db }) => {
      const organizationId = await db.insert("organizations", organization);
      await validateUser(db, { ...driver, role, organizationId });
    });
  });

  it("allows a guest with nullable contact and image fields", async () => {
    const t = createTest();
    await t.run(async ({ db }) => {
      const user = { ...guest, phoneNumber: null, profileImageUrl: null };
      await validateUser(db, user);
      await db.insert("users", user);
    });
  });

  it("rejects a guest with an organization without inserting them", async () => {
    const t = createTest();
    await expect(t.run(async ({ db }) => {
      const organizationId = await db.insert("organizations", organization);
      const user = { ...guest, organizationId };
      await validateUser(db, user);
      await db.insert("users", user);
    })).rejects.toMatchObject({ data: { code: "GUEST_ORGANIZATION_NOT_ALLOWED" } });
    expect(await t.run(({ db }) => db.query("users").collect())).toEqual([]);
  });

  it.each(["rider", "driver", "admin"] as const)("rejects an organization-less %s", async (role) => {
    const t = createTest();
    await expect(t.run(({ db }) => validateUser(db, {
      ...driver, role, organizationId: null,
    }))).rejects.toMatchObject({ data: { code: "MEMBER_ORGANIZATION_REQUIRED" } });
  });

  it("rejects deleted organization references for members, locations, and shuttles", async () => {
    const t = createTest();
    const organizationId = await t.run(async ({ db }) => {
      const id = await db.insert("organizations", organization);
      await db.delete("organizations", id);
      return id;
    });
    const validations = [
      () => t.run(({ db }) => validateUser(db, { ...driver, organizationId })),
      () => t.run(({ db }) => validateLocation(db, { ...location, organizationId })),
      () => t.run(({ db }) => validateShuttle(db, { ...shuttle, organizationId, activeDriverId: null })),
    ];
    for (const validation of validations) {
      await expect(validation()).rejects.toMatchObject({ data: { code: "ORGANIZATION_NOT_FOUND" } });
    }
  });

  it.each(["guest", "rider", "admin", "foreign", "missing"] as const)(
    "rejects a %s driver assignment without inserting a shuttle",
    async (assignment) => {
      const t = createTest();
      const { organizationId, driverId } = await t.run(({ db }) => createOrganizationAndDriver(db));
      await t.run(async ({ db }) => {
        if (assignment === "missing") {
          await db.delete("users", driverId);
        } else if (assignment === "foreign") {
          const foreignId = await db.insert("organizations", { ...organization, slug: "other" });
          await db.patch("users", driverId, { organizationId: foreignId });
        } else {
          await db.patch("users", driverId, {
            role: assignment, organizationId: assignment === "guest" ? null : organizationId,
          });
        }
      });
      const code = assignment === "missing" ? "DRIVER_NOT_FOUND"
        : assignment === "foreign" ? "DRIVER_ORGANIZATION_MISMATCH" : "DRIVER_ROLE_REQUIRED";
      await expect(t.run(async ({ db }) => {
        const vehicle = { ...shuttle, organizationId, activeDriverId: driverId };
        await validateShuttle(db, vehicle);
        await db.insert("shuttles", vehicle);
      })).rejects.toMatchObject({ data: { code } });
      expect(await t.run(({ db }) => db.query("shuttles").collect())).toEqual([]);
    },
  );

  it("allows an unassigned shuttle with unavailable tracking", async () => {
    const t = createTest();
    await t.run(async ({ db }) => {
      const organizationId = await db.insert("organizations", organization);
      const vehicle = {
        ...shuttle, organizationId, activeDriverId: null,
        activeTrackingProvider: null, tracking: null,
      };
      await validateShuttle(db, vehicle);
      await db.insert("shuttles", vehicle);
    });
  });
});

describe("numeric and required-value validation", () => {
  it.each([
    { latitude: -90.01, longitude: 0 },
    { latitude: 90.01, longitude: 0 },
    { latitude: 0, longitude: -180.01 },
    { latitude: 0, longitude: 180.01 },
    { latitude: NaN, longitude: 0 },
    { latitude: 0, longitude: Infinity },
  ])("rejects invalid coordinates %o", (coordinates) => {
    expect(() => validateCoordinates(coordinates)).toThrow();
  });

  it.each([-1, NaN, Infinity])("rejects invalid accuracy %s", (accuracyMeters) => {
    expect(() => validateTrackingSnapshot({ ...shuttle.tracking, accuracyMeters })).toThrow();
  });

  it.each(["createdAt", "updatedAt"] as const)("rejects nonfinite %s", (field) => {
    expect(() => validateOrganization({ ...organization, [field]: NaN })).toThrow();
  });

  it.each(["recordedAt", "receivedAt"] as const)("rejects nonfinite %s", (field) => {
    expect(() => validateTrackingSnapshot({ ...shuttle.tracking, [field]: Infinity })).toThrow();
  });

  it("accepts boundary coordinates, zero accuracy, and nullable tracking fields", () => {
    expect(() => validateCoordinates({ latitude: -90, longitude: -180 })).not.toThrow();
    expect(() => validateCoordinates({ latitude: 90, longitude: 180 })).not.toThrow();
    expect(() => validateTrackingSnapshot({ ...shuttle.tracking, accuracyMeters: 0 })).not.toThrow();
    for (const status of ["UNAVAILABLE", "STALE", "CURRENT"] as const) {
      expect(() => validateTrackingSnapshot({
        status, coordinates: null, accuracyMeters: null, recordedAt: null, receivedAt: null,
      })).not.toThrow();
    }
  });

  it("rejects blank organization identity fields", () => {
    for (const input of [
      { ...organization, slug: " " },
      { ...organization, details: { ...organization.details, displayName: " " } },
      { ...organization, details: { ...organization.details, fallbackInitials: " " } },
    ]) expect(() => validateOrganization(input)).toThrow();
  });

  it("rejects blank names and addresses with safe field errors", async () => {
    const t = createTest();
    await expect(t.run(({ db }) => validateUser(db, { ...guest, firstName: " " })))
      .rejects.toMatchObject({ data: { code: "INVALID_FIELD", field: "firstName" } });
    await expect(t.run(({ db }) => validateUser(db, { ...guest, lastName: " " })))
      .rejects.toMatchObject({ data: { code: "INVALID_FIELD", field: "lastName" } });
    const organizationId = await t.run(({ db }) => db.insert("organizations", organization));
    await expect(t.run(({ db }) => validateLocation(db, { ...location, organizationId, address: " " })))
      .rejects.toMatchObject({ data: { code: "INVALID_FIELD", field: "address" } });
    await expect(t.run(({ db }) => validateShuttle(db, {
      ...shuttle, organizationId, activeDriverId: null, name: " ",
    }))).rejects.toMatchObject({ data: { code: "INVALID_FIELD", field: "name" } });
  });
});

describe("Convex schema validation", () => {
  it("rejects malformed fields and unknown user roles", async () => {
    const t = createTest();
    await expect(t.run(({ db }) => db.insert("users", {
      ...guest,
      // Exercise the runtime boundary with an intentionally invalid type.
      phoneNumber: 123,
    } as unknown as WithoutSystemFields<Doc<"users">>))).rejects.toThrow();
    await expect(t.run(({ db }) => db.insert("users", {
      ...guest, role: "owner",
    } as unknown as WithoutSystemFields<Doc<"users">>))).rejects.toThrow();
    expect(await t.run(({ db }) => db.query("users").collect())).toEqual([]);
  });

  it("rejects a reference from the wrong table", async () => {
    const t = createTest();
    const { driverId } = await t.run(({ db }) => createOrganizationAndDriver(db));
    await expect(t.run(({ db }) => db.insert("locations", {
      ...location, organizationId: driverId,
    } as unknown as WithoutSystemFields<Doc<"locations">>))).rejects.toThrow();
  });

  it.each([
    { activeTrackingProvider: "SATELLITE" },
    { tracking: { ...shuttle.tracking, status: "LOST" } },
    { tracking: { ...shuttle.tracking, coordinates: { latitude: "39", longitude: -76 } } },
    { tracking: { status: "UNAVAILABLE" } },
  ])("rejects malformed provider/tracking data %o", async (invalid) => {
    const t = createTest();
    const { organizationId } = await t.run(({ db }) => createOrganizationAndDriver(db));
    await expect(t.run(({ db }) => db.insert("shuttles", {
      ...shuttle, organizationId, activeDriverId: null, ...invalid,
    } as unknown as WithoutSystemFields<Doc<"shuttles">>))).rejects.toThrow();
    expect(await t.run(({ db }) => db.query("shuttles").collect())).toEqual([]);
  });
});
