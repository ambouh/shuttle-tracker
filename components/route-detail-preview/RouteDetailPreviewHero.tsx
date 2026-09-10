import type { RouteDetailPreviewViewModel } from "@/lib/route-detail-preview";

import { RiderProfileCard } from "./RiderProfileCard";
import { RouteMapPreview } from "./RouteMapPreview";

interface RouteDetailPreviewHeroProps {
  model: RouteDetailPreviewViewModel;
}

export function RouteDetailPreviewHero({
  model,
}: RouteDetailPreviewHeroProps) {
  return (
    <div className="relative min-h-[38rem] overflow-hidden">
      <RouteMapPreview map={model.map} metrics={model.metrics} route={model.route} />
      <div className="relative px-ui-5 pt-ui-4">
        <RiderProfileCard {...model.rider} />
      </div>
    </div>
  );
}
