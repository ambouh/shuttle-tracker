import { GUEST_IDENTITY_STORAGE_KEY, parseGuestIdentity } from "./guest-identity";
import type { StoredGuestIdentity } from "@/types/guest-identity";

export interface GuestIdentityStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type GuestIdentityState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "ready"; identity: StoredGuestIdentity }
  | { status: "storage-error"; operation: "read" | "write" };

// Resolve storage inside the guard: accessing window.localStorage can itself throw.
export function readGuestIdentity(getStorage: () => GuestIdentityStorage): GuestIdentityState {
  try {
    const identity = parseGuestIdentity(getStorage().getItem(GUEST_IDENTITY_STORAGE_KEY));
    return identity ? { status: "ready", identity } : { status: "anonymous" };
  } catch {
    return { status: "storage-error", operation: "read" };
  }
}

export function saveGuestIdentity(
  getStorage: () => GuestIdentityStorage,
  identity: StoredGuestIdentity,
): GuestIdentityState {
  try {
    getStorage().setItem(GUEST_IDENTITY_STORAGE_KEY, JSON.stringify(identity));
    return { status: "ready", identity };
  } catch {
    return { status: "storage-error", operation: "write" };
  }
}
