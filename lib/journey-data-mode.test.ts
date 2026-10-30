import { describe, expect, it } from "vitest";
import { resolveJourneyDataMode } from "./journey-data-mode";

const convexUrl = "https://formal-giraffe-877.convex.cloud";

describe("journey data mode", () => {
  it("defaults to the demo even with a configured backend", () => {
    expect(resolveJourneyDataMode({})).toEqual({ mode: "demo" });
    expect(resolveJourneyDataMode({ convexUrl })).toEqual({ mode: "demo" });
    expect(resolveJourneyDataMode({ mode: "demo", convexUrl: "broken" })).toEqual({ mode: "demo" });
  });

  it.each([convexUrl, `${convexUrl}/`, "http://127.0.0.1:3210"])("accepts explicit live mode with %s", url => {
    expect(resolveJourneyDataMode({ mode: "live", convexUrl: url })).toEqual({ mode: "live", convexUrl: new URL(url).origin });
  });

  it.each([undefined, "", "broken", "/api", "wss://example.com", "file:///tmp/db", "https://user:secret@example.com",
    `${convexUrl}/api`, `${convexUrl}?token=secret`, `${convexUrl}#fragment`, "https://formal-giraffe-877.convex.site",
  ])("never substitutes demo data for invalid live configuration: %s", url => {
    expect(resolveJourneyDataMode({ mode: "live", convexUrl: url })).toEqual({ mode: "unavailable" });
  });

  it.each(["", "LIVE", "preview", " live "])("rejects unknown mode %s", mode => {
    expect(resolveJourneyDataMode({ mode, convexUrl })).toEqual({ mode: "unavailable" });
  });
});
