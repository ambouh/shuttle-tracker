import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RouteCardTone } from "@/lib/journey-overview";

interface RouteStatusProps {
  label: string;
  tone: RouteCardTone;
}

export function RouteStatus({ label, tone }: RouteStatusProps) {
  return (
    <Badge
      className={cn(
        "h-auto rounded-pill px-ui-4 py-ui-2 text-ui-sm font-regular",
        tone === "active"
          ? "bg-status-active text-status-active-foreground"
          : "bg-status-idle text-foreground",
      )}
    >
      {label}
    </Badge>
  );
}
