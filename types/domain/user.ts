import type { OrganizationId, Timestamp, UserId } from "./primitives";

export type UserRole = "guest" | "rider" | "driver" | "admin";

export interface User {
  id: UserId;
  organizationId: OrganizationId | null;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
