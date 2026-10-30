"use client";

import { JourneyHeader } from "@/components/journey-overview/JourneyHeader";
import { RouteCard } from "@/components/journey-overview/RouteCard";
import { buildLiveJourneyOverview, formatRecordedLocation } from "@/lib/live-journey-overview";
import { JourneyReadMessage } from "./JourneyReadMessage";
import { useLiveJourney } from "./useLiveJourney";

interface LiveJourneyOverviewProps {
  organizationSlug: string;
}

export function LiveJourneyOverview({ organizationSlug }: LiveJourneyOverviewProps) {
  const { state, retry } = useLiveJourney(organizationSlug);
  if (state.status === "loading") return <JourneyReadMessage message="Loading your journey..." />;
  if (state.status === "empty") return <JourneyReadMessage message="No journeys are available right now." />;
  if (state.status === "unavailable") return <JourneyReadMessage role="alert" message="Journey information is unavailable right now." onRetry={retry} />;
  if (state.status === "error") return <JourneyReadMessage role="alert" message="We could not load your journey. Please try again." onRetry={retry} />;
  if (!state.snapshot) {
    return <JourneyReadMessage role="alert" message="Unable to connect. Reconnecting automatically when a connection is available." />;
  }
  const model = buildLiveJourneyOverview(state.snapshot);
  return (
    <>
      <JourneyHeader model={model} />
      {state.status === "disconnected" ? (
        <p role="alert" className="mb-ui-5 rounded-md border border-border bg-surface-raised p-ui-4 text-ui-sm">
          Connection lost. Showing the last received journey; it may be outdated. Reconnecting automatically.
        </p>
      ) : null}
      <div className="mb-ui-5 rounded-md bg-surface-raised p-ui-4 text-ui-sm text-text-muted">
        <p>Pickup requests are not available yet.</p>
        <p className="mt-ui-2">{formatRecordedLocation(state.snapshot)}</p>
      </div>
      {model.routeCards.map(route => (
        <RouteCard key={route.id} route={route} pickupAction={
          <span className="basis-full text-center text-ui-sm text-text-muted">
            {route.pickupEligible ? "Pickup requests unavailable" : "Pickup closed"}
          </span>
        } />
      ))}
    </>
  );
}
