import { LiveJourneyProvider } from "@/components/live-journey/LiveJourneyProvider";
import { JourneyReadMessage } from "@/components/live-journey/JourneyReadMessage";
import { LIVE_ORGANIZATION_SLUG, resolveJourneyDataMode } from "@/lib/journey-data-mode";

export default async function Home() {
  const config = resolveJourneyDataMode({
    mode: process.env.JOURNEY_DATA_MODE,
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
  });
  if (config.mode === "demo") {
    const { DemoJourneyOverview } = await import("@/components/journey-overview/DemoJourneyOverview");
    return <main className="app-canvas"><DemoJourneyOverview /></main>;
  }
  return (
    <main className="app-canvas">
      {config.mode === "live" ? (
        <LiveJourneyProvider convexUrl={config.convexUrl} organizationSlug={LIVE_ORGANIZATION_SLUG} />
      ) : <JourneyReadMessage message="Journey information is unavailable right now." />}
    </main>
  );
}
