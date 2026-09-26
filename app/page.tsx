import { GuestJourneyOverview } from "@/components/guest-pickup/GuestJourneyOverview";
import {
  ROUTING_SNAPSHOTS,
  NORMALIZED_LOCATION_UPDATES,
  SUNDAY_SERVICE_FIXTURE,
  UNION_ORGANIZATION,
} from "@/fixtures";
import type { JourneyOverviewInput } from "@/lib/journey-overview";
import type { MockRoutePreset } from "@/types/mock-journey";

const routePresets: MockRoutePreset[] = ROUTING_SNAPSHOTS.map((routingSnapshot, index) => ({
  routeLegId: routingSnapshot.routeLegId,
  routingSnapshot,
  locationUpdate: NORMALIZED_LOCATION_UPDATES[index],
}));

const journeyInput = {
  organization: UNION_ORGANIZATION,
  journey: SUNDAY_SERVICE_FIXTURE.journey,
  routeLegs: SUNDAY_SERVICE_FIXTURE.routeLegs,
  locations: SUNDAY_SERVICE_FIXTURE.locations,
  users: SUNDAY_SERVICE_FIXTURE.users,
  shuttle: SUNDAY_SERVICE_FIXTURE.shuttle,
  routingSnapshots: ROUTING_SNAPSHOTS,
} satisfies Omit<JourneyOverviewInput, "currentRiderId">;

export default function Home() {
  return (
    <main className="app-canvas">
      <GuestJourneyOverview input={journeyInput} routePresets={routePresets} />
    </main>
  );
}
