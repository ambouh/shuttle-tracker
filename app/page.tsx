import { GuestJourneyOverview } from "@/components/guest-pickup/GuestJourneyOverview";
import {
  ROUTING_SNAPSHOTS,
  SUNDAY_SERVICE_FIXTURE,
  UNION_ORGANIZATION,
} from "@/fixtures";
import type { JourneyOverviewInput } from "@/lib/journey-overview";

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
      <GuestJourneyOverview input={journeyInput} />
    </main>
  );
}
