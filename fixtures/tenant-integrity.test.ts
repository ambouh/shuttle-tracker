import { describe, expect, it } from "vitest";

import {
  FIXTURE_IDS,
  SUNDAY_SERVICE_FIXTURE,
  UNION_ORGANIZATION,
} from "./index";
import type {
  Journey,
  Location,
  Organization,
  Shuttle,
  User,
  UserRole,
} from "@/types/domain";

describe("Sunday Service tenant integrity", () => {
  it("exposes tenant-aware records through the public barrels", () => {
    const organization: Organization = UNION_ORGANIZATION;
    const journey: Journey = SUNDAY_SERVICE_FIXTURE.journey;
    const shuttle: Shuttle = SUNDAY_SERVICE_FIXTURE.shuttle;
    const locations: Location[] = SUNDAY_SERVICE_FIXTURE.locations;
    const users: User[] = SUNDAY_SERVICE_FIXTURE.users;
    const driverRole: UserRole = "driver";

    expect(organization.id).toBe(FIXTURE_IDS.organization);
    expect(journey.organizationId).toBe(organization.id);
    expect(shuttle.organizationId).toBe(organization.id);
    expect(locations).toHaveLength(2);
    expect(users.some(({ role }) => role === driverRole)).toBe(true);
  });

  it("keeps guests outside the organization and registered roles inside it", () => {
    for (const user of SUNDAY_SERVICE_FIXTURE.users) {
      if (user.role === "guest") {
        expect(user.organizationId).toBeNull();
      } else {
        expect(user.organizationId).toBe(FIXTURE_IDS.organization);
      }
    }
  });

  it("resolves the active driver to a driver in the shuttle organization", () => {
    const { shuttle, users } = SUNDAY_SERVICE_FIXTURE;
    const activeDriver = users.find(({ id }) => id === shuttle.activeDriverId);

    expect(activeDriver).toBeDefined();
    expect(activeDriver?.role).toBe("driver");
    expect(activeDriver?.organizationId).toBe(shuttle.organizationId);
  });

  it("resolves route legs and their locations through one organization", () => {
    const { journey, locations, routeLegs } = SUNDAY_SERVICE_FIXTURE;
    const locationsById = new Map(
      locations.map((location) => [location.id, location]),
    );

    for (const routeLeg of routeLegs) {
      const departure = locationsById.get(routeLeg.departureLocationId);
      const arrival = locationsById.get(routeLeg.arrivalLocationId);

      expect(routeLeg.journeyId).toBe(journey.id);
      expect(departure?.organizationId).toBe(journey.organizationId);
      expect(arrival?.organizationId).toBe(journey.organizationId);
    }
  });
});
