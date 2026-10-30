import type { PublicJourneySnapshot } from "../types/live-journey";
import { buildJourneyPresentation, type JourneyOverviewViewModel } from "./journey-overview";

const recordedTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York",
});

export function formatRecordedLocation(snapshot: PublicJourneySnapshot): string {
  const tracking = snapshot.shuttle.tracking;
  if (!tracking?.coordinates || tracking.recordedAt === null) return "Shuttle location unavailable";
  return `Shuttle location recorded ${recordedTimeFormatter.format(tracking.recordedAt)} (Eastern)`;
}

export function buildLiveJourneyOverview(snapshot: PublicJourneySnapshot): JourneyOverviewViewModel {
  const model = buildJourneyPresentation({
    ...snapshot,
    currentRiderId: null,
    users: snapshot.users.map(person => ({
      id: person.id,
      firstName: person.firstName,
      displayName: `${person.firstName} ${person.lastInitial}`.trim(),
      initials: `${Array.from(person.firstName)[0] ?? ""}${person.lastInitial}`.toUpperCase(),
      profileImageUrl: person.profileImageUrl,
    })),
  });
  return {
    ...model,
    routeCards: model.routeCards.map(route => {
      const routing = snapshot.routingSnapshots.find(item => item.routeLegId === route.id);
      return {
        ...route,
        tone: route.id === snapshot.journey.activeRouteLegId ? route.tone : "idle",
        timingMessage: routing
          ? `Recorded estimate: ${Math.max(1, Math.ceil(routing.estimatedDurationSeconds / 60))} mins`
          : "Timing unavailable",
      };
    }),
  };
}
