import type { PublicJourneyResult, PublicJourneySnapshot } from "../types/live-journey";

export type JourneyConnection = "connecting" | "connected" | "disconnected";

interface JourneyConnectionInput {
  online: boolean;
  isWebSocketConnected: boolean;
  hasEverConnected: boolean;
  connectionRetries: number;
}

export type JourneyReadState =
  | { status: "ready"; snapshot: PublicJourneySnapshot }
  | { status: "disconnected"; snapshot: PublicJourneySnapshot | null }
  | { status: "loading" }
  | { status: "empty" }
  | { status: "unavailable" }
  | { status: "error" };

export function getJourneyConnection(input: JourneyConnectionInput): JourneyConnection {
  if (!input.online) return "disconnected";
  if (input.isWebSocketConnected) return "connected";
  return input.hasEverConnected || input.connectionRetries > 0 ? "disconnected" : "connecting";
}

export function getJourneyReadState(
  result: PublicJourneyResult | Error | undefined,
  connection: JourneyConnection,
): JourneyReadState {
  const ready = result !== undefined && !(result instanceof Error) && result.status === "ready";
  if (connection === "disconnected" || (connection === "connecting" && ready)) {
    return { status: "disconnected", snapshot: ready ? result.snapshot : null };
  }
  if (result instanceof Error) return { status: "error" };
  if (result === undefined) return { status: "loading" };
  return result;
}
