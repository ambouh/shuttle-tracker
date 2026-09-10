import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface RouteDirectionProps {
  departureName: string;
  arrivalName: string;
  className?: string;
}

export function RouteDirection({
  departureName,
  arrivalName,
  className,
}: RouteDirectionProps) {
  return (
    <p
      className={cn(
        "grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-ui-2 text-center",
        className,
      )}
      title={`${departureName} to ${arrivalName}`}
    >
      <span className="truncate">{departureName}</span>
      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{arrivalName}</span>
    </p>
  );
}
