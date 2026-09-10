import { Bus } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface RouteProgressProps {
  progressPercent: number;
  active: boolean;
  markerPositionClassName?: string;
}

export function RouteProgress({
  progressPercent,
  active,
  markerPositionClassName,
}: RouteProgressProps) {
  return (
    <div className="relative my-ui-2 h-progress">
      <Progress
        className="block size-full gap-0"
        trackClassName="h-progress bg-border-soft"
        indicatorClassName={cn(
          "bg-accent-strong",
          active && "animate-trip-pulse",
        )}
        value={progressPercent}
        aria-label="Route progress"
      />
      <span
        className={cn(
          "absolute top-1/2 size-ui-7 -translate-x-1/2 -translate-y-1/2",
          markerPositionClassName,
        )}
        style={
          markerPositionClassName ? undefined : { left: `${progressPercent}%` }
        }
        aria-hidden="true"
      >
        <span
          className={cn(
            "grid size-full place-items-center rounded-full",
            active
              ? "bg-accent text-accent-deep"
              : "bg-status-idle text-foreground",
            active && "animate-trip-marker",
          )}
        >
          <Bus className="size-4 stroke-[2.25]" />
        </span>
      </span>
    </div>
  );
}
