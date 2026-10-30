export const LIVE_ORGANIZATION_SLUG = "union-church";

export type JourneyDataMode =
  | { mode: "demo" }
  | { mode: "live"; convexUrl: string }
  | { mode: "unavailable" };

interface JourneyDataEnvironment {
  mode?: string;
  convexUrl?: string;
}

export function resolveJourneyDataMode({ mode, convexUrl }: JourneyDataEnvironment): JourneyDataMode {
  if (mode === undefined || mode === "demo") return { mode: "demo" };
  if (mode !== "live" || !convexUrl) return { mode: "unavailable" };
  try {
    const url = new URL(convexUrl);
    if (!["http:", "https:"].includes(url.protocol) ||
      url.username || url.password || url.search || url.hash ||
      url.pathname !== "/" || url.hostname.endsWith(".convex.site")) {
      return { mode: "unavailable" };
    }
    return { mode: "live", convexUrl: url.origin };
  } catch {
    return { mode: "unavailable" };
  }
}
