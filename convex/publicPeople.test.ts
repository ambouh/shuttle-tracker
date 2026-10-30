import { describe, expect, it } from "vitest";

import type { Doc, Id } from "./_generated/dataModel";
import { projectPublicPerson } from "./publicPeople";

function person(overrides: Partial<Doc<"users">> = {}): Doc<"users"> {
  return {
    _id: "stored-user" as Id<"users">,
    _creationTime: 100,
    organizationId: null,
    firstName: "Jordan",
    lastName: "Rivera",
    phoneNumber: "+12025550147",
    profileImageUrl: null,
    role: "guest",
    createdAt: 50,
    updatedAt: 75,
    ...overrides,
  };
}

describe("public person projection", () => {
  it.each(["guest", "rider", "driver", "admin"] as const)(
    "allows only display fields for a %s", (role) => {
      const user = person({
        role,
        organizationId: role === "guest" ? null : "organization" as Id<"organizations">,
      });

      expect(projectPublicPerson(user)).toStrictEqual({
        id: user._id,
        firstName: "Jordan",
        lastInitial: "R",
        profileImageUrl: null,
      });
    },
  );

  it("does not serialize private fields or additional credentials", () => {
    const user = {
      ...person(),
      recognitionToken: "private-recognition-token",
      internalNotes: { phoneNumber: "+12025550148" },
    };
    const serialized = JSON.stringify(projectPublicPerson(user));

    expect(JSON.parse(serialized)).toStrictEqual({
      id: user._id,
      firstName: "Jordan",
      lastInitial: "R",
      profileImageUrl: null,
    });
    for (const privateValue of [user.phoneNumber, user.lastName, user.recognitionToken]) {
      expect(serialized).not.toContain(privateValue);
    }
  });

  it.each([
    { lastName: " rivera ", initial: "R" },
    { lastName: "éclair", initial: "É" },
    { lastName: "李", initial: "李" },
    { lastName: "𐐨name", initial: "𐐀" },
    { lastName: "", initial: "" },
    { lastName: "   ", initial: "" },
  ])("projects the surname initial for '$lastName'", ({ lastName, initial }) => {
    expect(projectPublicPerson(person({ lastName })).lastInitial).toBe(initial);
  });

  it("preserves a nullable phone without adding it to the public result", () => {
    expect(projectPublicPerson(person({ phoneNumber: null }))).toStrictEqual(
      projectPublicPerson(person()),
    );
  });

  it("preserves the selected profile image and normalizes display whitespace", () => {
    const user = person({ firstName: " Jordan ", profileImageUrl: "/avatars/jordan.png" });

    expect(projectPublicPerson(user)).toStrictEqual({
      id: user._id,
      firstName: "Jordan",
      lastInitial: "R",
      profileImageUrl: "/avatars/jordan.png",
    });
  });

  it("leaves the stored user unchanged and returns a detached projection", () => {
    const user = Object.freeze(person({ firstName: " Jordan ", lastName: " rivera " }));
    const before = structuredClone(user);
    const result = projectPublicPerson(user);
    result.firstName = "Changed";
    result.lastInitial = "C";
    result.profileImageUrl = "/changed.png";

    expect(user).toStrictEqual(before);
    expect(projectPublicPerson(user).id).toBe(user._id);
  });
});
