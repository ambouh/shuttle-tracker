import { describe, expect, it } from "vitest";

import { formatGuestPhoneInput, guestIdentityToUser, parseGuestIdentity, validateGuestDetails } from "./guest-identity";

const details = { firstName: "  José  ", lastName: "O'Neill-Smith", phoneNumber: "(202) 555-0123" };
const saved = { version: 1, userId: "guest_12345678-1234-4123-8123-123456789abc", createdAt: 1234, ...details };

describe("guest details", () => {
  it("normalizes international names and US phone formatting", () => {
    expect(validateGuestDetails(details)).toEqual({ ok: true, value: {
      firstName: "José", lastName: "O'Neill-Smith", phoneNumber: "+12025550123",
    } });
  });

  it("accepts international names with a US phone number", () => {
    expect(validateGuestDetails({ firstName: "李", lastName: "de la Cruz", phoneNumber: "415-555-0132" }))
      .toEqual({ ok: true, value: { firstName: "李", lastName: "de la Cruz", phoneNumber: "+14155550132" } });
  });

  it.each([
    ["", ""], ["2", "2"], ["2025", "202-5"],
    ["2025550", "202-555-0"], ["(202) 555-0123", "202-555-0123"],
    ["+1 202 555 0123", "202-555-0123"], ["202555012399", "202-555-0123"],
  ])("formats phone input progressively: %j", (input, expected) => {
    expect(formatGuestPhoneInput(input)).toBe(expected);
  });

  it("counts Unicode code points rather than UTF-16 units", () => {
    expect(validateGuestDetails({ ...details, firstName: "𠮷".repeat(80) }).ok).toBe(true);
    expect(validateGuestDetails({ ...details, firstName: "𠮷".repeat(81) }).ok).toBe(false);
  });

  it.each(["", "   ", "A\nB", "\tAlice", "A\u0000B", "A\u0085B", null, 123])("rejects invalid names: %j", name => {
    const result = validateGuestDetails({ ...details, firstName: name, lastName: name });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["firstName", "lastName"]);
  });

  it.each(["", "123", "(123) 555-0123", "+44 20 7946 0018", "+999123456789", "Call me at 202-555-0123", "202-555-0123 ext 4", "202\n5550123", null, 2025550123])("rejects invalid or unsupported phones: %j", phoneNumber => {
    const result = validateGuestDetails({ ...details, phoneNumber });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["phoneNumber"]);
  });

  it.each([undefined, null, [], 5, "name"])("handles unknown input: %j", input => {
    expect(validateGuestDetails(input).ok).toBe(false);
  });
});

describe("stored guest identity", () => {
  it("parses JSON and projects only approved fields", () => {
    const identity = parseGuestIdentity(JSON.stringify({ ...saved, role: "admin", organizationId: "forged" }));
    expect(identity).toEqual({ ...saved, firstName: "José", phoneNumber: "+12025550123" });
    expect(guestIdentityToUser(identity!)).toEqual({
      id: saved.userId, firstName: "José", lastName: details.lastName,
      phoneNumber: "+12025550123", role: "guest", organizationId: null,
      profileImageUrl: null, createdAt: 1234, updatedAt: 1234,
    });
  });

  it.each([null, undefined, "{", "null", "[]", [], {}, { ...saved, version: 2 },
    { ...saved, userId: "fixture-josh" }, { ...saved, userId: "guest_12345678-1234-4123-0123-123456789abc" },
    { ...saved, createdAt: -1 }, { ...saved, createdAt: Infinity },
    { ...saved, createdAt: NaN }, { ...saved, createdAt: 1.5 },
    { ...saved, createdAt: Number.MAX_SAFE_INTEGER + 1 }, { ...saved, createdAt: "1234" },
    { ...saved, phoneNumber: undefined }, { ...saved, lastName: "" },
  ])("rejects malformed saved identity: %j", input => {
    expect(parseGuestIdentity(input)).toBeNull();
  });

  it("rejects every missing required field", () => {
    for (const key of Object.keys(saved)) {
      const input: Record<string, unknown> = { ...saved };
      delete input[key];
      expect(parseGuestIdentity(input)).toBeNull();
    }
  });
});
