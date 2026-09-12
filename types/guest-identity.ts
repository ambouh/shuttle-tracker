import type { UserId } from "@/types/domain";

export interface GuestDetails {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface StoredGuestIdentity extends GuestDetails {
  version: 1;
  userId: UserId;
  createdAt: number;
}

export type GuestDetailsResult =
  | { ok: true; value: GuestDetails }
  | { ok: false; errors: Partial<Record<keyof GuestDetails, string>> };
