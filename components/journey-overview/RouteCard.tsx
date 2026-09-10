import { Card } from "@/components/ui/card";
import { RouteDirection } from "@/components/shuttle/RouteDirection";
import type { RouteCardViewModel } from "@/lib/journey-overview";
import { cn } from "@/lib/utils";

import { RouteStatus } from "./RouteStatus";
import { RouteTiming } from "./RouteTiming";
import { WaitlistPreview } from "./WaitlistPreview";

interface RouteCardProps {
  route: RouteCardViewModel;
}

export function RouteCard({ route }: RouteCardProps) {
  const active = route.tone === "active";

  return (
    <article className="min-w-0">
      <Card
        className={cn(
          "mb-ui-5 w-full min-w-0 gap-0 overflow-hidden rounded-lg border py-0 shadow-card ring-0",
          active
            ? "border-status-active bg-status-active"
            : "border-status-idle bg-status-idle",
        )}
      >
        <header
          className={cn(
            "px-ui-5 py-ui-2 text-ui-lg",
            active ? "text-status-active-foreground" : "text-foreground",
          )}
        >
          <RouteDirection
            departureName={route.departureName}
            arrivalName={route.arrivalName}
          />
        </header>

        <div className="m-ui-1 mt-0 min-w-0 rounded-[calc(var(--radius-lg)-var(--spacing-ui-1))] bg-surface-raised px-ui-6 pt-ui-6 max-[36rem]:px-ui-4 max-[36rem]:pt-ui-5">
          <div className="flex items-center justify-between gap-ui-4">
            <div className="flex min-w-0 items-center gap-ui-4">
              <span
                className="grid size-avatar-sm shrink-0 place-items-center rounded-full bg-surface-soft text-ui-sm font-bold text-accent"
                aria-label={route.driver?.displayName ?? route.driverLabel}
                role="img"
              >
                {route.driver?.initials ?? "?"}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {route.driver?.displayName ?? route.driverLabel}
                </p>
                {route.driver ? (
                  <p className="text-ui-sm text-text-muted">
                    {route.driverLabel}
                  </p>
                ) : null}
              </div>
            </div>
            <RouteStatus label={route.statusLabel} tone={route.tone} />
          </div>

          <RouteTiming
            departureTime={route.departureTime}
            arrivalTime={route.arrivalTime}
            timingMessage={route.timingMessage}
            progressPercent={route.progressPercent}
            active={active}
          />
          <WaitlistPreview
            avatars={route.waitlistAvatars}
            copy={route.waitlistCopy}
            pickupEligible={route.pickupEligible}
          />
        </div>
      </Card>
    </article>
  );
}
