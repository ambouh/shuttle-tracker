import { JourneyHeader } from "@/components/journey-overview/JourneyHeader";
import { RouteCard } from "@/components/journey-overview/RouteCard";
import {
  JOSH_WILLIAMS,
  ROUTING_SNAPSHOTS,
  SUNDAY_SERVICE_FIXTURE,
  UNION_ORGANIZATION,
} from "@/fixtures";
import { buildJourneyOverviewViewModel } from "@/lib/journey-overview";

const journeyOverview = buildJourneyOverviewViewModel({
  organization: UNION_ORGANIZATION,
  journey: SUNDAY_SERVICE_FIXTURE.journey,
  routeLegs: SUNDAY_SERVICE_FIXTURE.routeLegs,
  locations: SUNDAY_SERVICE_FIXTURE.locations,
  users: SUNDAY_SERVICE_FIXTURE.users,
  shuttle: SUNDAY_SERVICE_FIXTURE.shuttle,
  routingSnapshots: ROUTING_SNAPSHOTS,
  currentRiderId: JOSH_WILLIAMS.id,
});

export default function Home() {
  return (
    <main className="app-canvas">
      <JourneyHeader model={journeyOverview} />
      {journeyOverview.routeCards.map((route) => (
        <RouteCard key={route.id} route={route} />
      ))}
    </main>
  );
}
