import { describe, expect, it } from "vitest";

describe("Vitest setup", () => {
  it("runs TypeScript unit tests", () => {
    expect(["NOT_STARTED", "DEPARTING", "IN_TRANSIT"]).toHaveLength(3);
  });
});
