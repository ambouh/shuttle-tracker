import { describe, expect, it } from "vitest";
import { GUEST_IDENTITY_STORAGE_KEY, parseGuestIdentity } from "./guest-identity";
import { readGuestIdentity, saveGuestIdentity, type GuestIdentityStorage } from "./guest-identity-storage";

const identity = parseGuestIdentity({ version: 1,
  userId: "guest_12345678-1234-4123-8123-123456789abc", createdAt: 1234,
  firstName: "Alex", lastName: "Rivera", phoneNumber: "+12025550123",
})!;

function memoryStorage(): GuestIdentityStorage {
  const values = new Map<string, string>();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } };
}

describe("guest identity storage", () => {
  it("persists and restores only the current guest at the versioned key", () => {
    const storage = memoryStorage();
    expect(readGuestIdentity(() => storage)).toEqual({ status: "anonymous" });
    expect(saveGuestIdentity(() => storage, identity)).toEqual({ status: "ready", identity });
    expect(storage.getItem(GUEST_IDENTITY_STORAGE_KEY)).toBe(JSON.stringify(identity));
    expect(readGuestIdentity(() => storage)).toEqual({ status: "ready", identity });
  });

  it.each(["{", "null", JSON.stringify({ ...identity, version: 2 })])("treats malformed saved data as anonymous without overwriting it", value => {
    const storage = memoryStorage(); storage.setItem(GUEST_IDENTITY_STORAGE_KEY, value);
    expect(readGuestIdentity(() => storage)).toEqual({ status: "anonymous" });
    expect(storage.getItem(GUEST_IDENTITY_STORAGE_KEY)).toBe(value);
  });

  it("guards access to the storage object itself", () => {
    const blocked = () => { throw new Error("Denied"); };
    expect(readGuestIdentity(blocked)).toEqual({ status: "storage-error", operation: "read" });
    expect(saveGuestIdentity(blocked, identity)).toEqual({ status: "storage-error", operation: "write" });
  });

  it("reports read failure and succeeds after retry", () => {
    let blocked = true;
    const storage = { getItem: () => { if (blocked) throw new Error("Denied"); return JSON.stringify(identity); }, setItem: () => {} };
    expect(readGuestIdentity(() => storage)).toEqual({ status: "storage-error", operation: "read" });
    blocked = false;
    expect(readGuestIdentity(() => storage)).toEqual({ status: "ready", identity });
  });

  it("does not report success when writing fails", () => {
    const storage = { getItem: () => null, setItem: () => { throw new Error("Quota exceeded"); } };
    expect(saveGuestIdentity(() => storage, identity)).toEqual({ status: "storage-error", operation: "write" });
  });
});
