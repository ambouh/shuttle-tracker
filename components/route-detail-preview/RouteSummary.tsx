import { RouteProgress } from "@/components/shuttle/RouteProgress";
import type { RouteDetailPreviewViewModel } from "@/lib/route-detail-preview";

interface RouteSummaryProps {
  route: RouteDetailPreviewViewModel["route"];
}

export function RouteSummary({ route }: RouteSummaryProps) {
  return (
    <section className="px-ui-7 pt-ui-5" aria-label="Route timing">
      <div className="grid grid-cols-[max-content_minmax(0,1fr)_max-content] items-end gap-ui-5 max-[24rem]:gap-ui-3">
        <div>
          <strong className="text-ui-lg font-bold">{route.departureTime}</strong>
          <span className="block text-ui-sm text-text-muted">Departure</span>
        </div>

        <div className="mb-ui-2 min-w-0">
          <RouteProgress
            progressPercent={route.progressPercent}
            active
          />
        </div>

        <div className="text-right">
          <strong className="text-ui-lg font-bold">{route.arrivalTime}</strong>
          <span className="block text-ui-sm text-text-muted">Arrival</span>
        </div>
      </div>
    </section>
  );
}
