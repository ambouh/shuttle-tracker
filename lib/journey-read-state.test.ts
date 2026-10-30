import { describe, expect, it } from "vitest";
import type { JourneyId, OrganizationId, ShuttleId } from "../types/domain";
import type { PublicJourneyResult, PublicJourneySnapshot } from "../types/live-journey";
import { getJourneyConnection, getJourneyReadState } from "./journey-read-state";

const snapshot: PublicJourneySnapshot = {
  organization: { id: "org" as OrganizationId, slug: "public-org", details: {
    displayName: "Public Organization", description: null, logoUrl: null, logoAltText: null, fallbackInitials: "P",
  } },
  journey: { id: "journey" as JourneyId, organizationId: "org" as OrganizationId,
    name: "Public Journey", description: null, routeLegIds: [], activeRouteLegId: null },
  routeLegs: [], locations: [], users: [], routingSnapshots: [],
  shuttle: { id: "shuttle" as ShuttleId, name: "Shuttle", activeDriverId: null, activeTrackingProvider: null,
    tracking: { status: "STALE", coordinates: null, accuracyMeters: null, recordedAt: 123, receivedAt: 456 } },
};
const ready: PublicJourneyResult = { status: "ready", snapshot };
const initialConnection = { online: true, isWebSocketConnected: false, hasEverConnected: false, connectionRetries: 0 };

describe("journey connection state", () => {
  it("distinguishes an initial connection from a failed attempt", () => {
    expect(getJourneyConnection(initialConnection)).toBe("connecting");
    expect(getJourneyConnection({ ...initialConnection, connectionRetries: 1 })).toBe("disconnected");
  });

  it("reports a lost backend connection even when the browser is online", () => {
    expect(getJourneyConnection({ ...initialConnection, hasEverConnected: true })).toBe("disconnected");
  });

  it("reports browser offline immediately even if the socket still appears connected", () => {
    expect(getJourneyConnection({ ...initialConnection, online: false, isWebSocketConnected: true })).toBe("disconnected");
  });

  it("recovers after earlier connection failures", () => {
    expect(getJourneyConnection({ ...initialConnection, isWebSocketConnected: true, hasEverConnected: true, connectionRetries: 2 })).toBe("connected");
  });
});

describe("journey read state", () => {
  it.each(["connecting", "connected"] as const)("loads without substitute data while %s", connection => {
    expect(getJourneyReadState(undefined, connection)).toEqual({ status: "loading" });
  });

  it.each(["empty", "unavailable"] as const)("preserves the backend's %s result", status => {
    expect(getJourneyReadState({ status }, "connected")).toEqual({ status });
  });

  it("returns connected data without altering shuttle tracking or timestamps", () => {
    expect(getJourneyReadState(ready, "connected")).toBe(ready);
    expect(snapshot.shuttle.tracking).toMatchObject({ status: "STALE", recordedAt: 123, receivedAt: 456 });
  });

  it.each(["disconnected", "connecting"] as const)("labels retained live data as outdated while %s", connection => {
    expect(getJourneyReadState(ready, connection)).toEqual({ status: "disconnected", snapshot });
    const state = getJourneyReadState(ready, connection);
    if (state.status === "disconnected") expect(state.snapshot).toBe(snapshot);
  });

  it.each([undefined, { status: "empty" }, { status: "unavailable" }, new Error("PrivateGuest +12025550147")
  ] satisfies (PublicJourneyResult | Error | undefined)[])("has no snapshot to display offline without a ready result: %s", result => {
    expect(getJourneyReadState(result, "disconnected")).toEqual({ status: "disconnected", snapshot: null });
  });

  it("removes error messages, stacks, and attached data from the view state", () => {
    const error = Object.assign(new Error("PrivateGuest +12025550147"), { data: { phoneNumber: "+12025550147" } });
    expect(getJourneyReadState(error, "connected")).toEqual({ status: "error" });
    expect(JSON.stringify(getJourneyReadState(error, "connected"))).not.toContain("PrivateGuest");
  });

  it("recovers on reconnect and drops old cards when the new result is empty or unavailable", () => {
    expect(getJourneyReadState(ready, "disconnected").status).toBe("disconnected");
    expect(getJourneyReadState(ready, "connected").status).toBe("ready");
    expect(getJourneyReadState({ status: "empty" }, "connected")).toEqual({ status: "empty" });
    expect(getJourneyReadState({ status: "unavailable" }, "connected")).toEqual({ status: "unavailable" });
    expect(getJourneyReadState(undefined, "disconnected")).toEqual({ status: "disconnected", snapshot: null });
  });

  it("discards a failed result when retrying and accepts the later response", () => {
    expect(getJourneyReadState(new Error("failed"), "connected")).toEqual({ status: "error" });
    expect(getJourneyReadState(undefined, "connected")).toEqual({ status: "loading" });
    expect(getJourneyReadState(ready, "connected")).toBe(ready);
  });
});
