import type { Organization } from "@/types/domain";

import { FIXTURE_IDS } from "./ids";
import { REFERENCE_TIMESTAMPS } from "./reference-time";

export const UNION_ORGANIZATION = {
  id: FIXTURE_IDS.organization,
  slug: "union-church",
  active: true,
  details: {
    displayName: "Union Church",
    description: "Union Church shuttle service in Columbia, Maryland.",
    logoUrl: null,
    logoAltText: null,
    fallbackInitials: "U",
  },
  createdAt: REFERENCE_TIMESTAMPS.createdAt,
  updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
} satisfies Organization;
