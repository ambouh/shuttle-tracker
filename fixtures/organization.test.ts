import { describe, expect, it } from "vitest";

import type { Organization, OrganizationId } from "@/types/domain";

import { FIXTURE_IDS, UNION_ORGANIZATION } from ".";

describe("Union organization fixture", () => {
  it("is available through the public domain and fixture boundaries", () => {
    const organizationId: OrganizationId = FIXTURE_IDS.organization;
    const organization: Organization = UNION_ORGANIZATION;

    expect(organization.id).toBe(organizationId);
    expect(organization.slug).toBe("union-church");
    expect(organization.active).toBe(true);
  });

  it("provides display details with an initials fallback", () => {
    expect(UNION_ORGANIZATION.details).toEqual({
      displayName: "Union Church",
      description: "Union Church shuttle service in Columbia, Maryland.",
      logoUrl: null,
      logoAltText: null,
      fallbackInitials: "U",
    });
  });
});
