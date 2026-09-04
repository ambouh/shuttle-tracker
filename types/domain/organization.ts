import type { OrganizationId, Timestamp } from "./primitives";

export interface OrganizationDetails {
  displayName: string;
  description: string | null;
  logoUrl: string | null;
  logoAltText: string | null;
  fallbackInitials: string;
}

export interface Organization {
  id: OrganizationId;
  slug: string;
  active: boolean;
  details: OrganizationDetails;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
