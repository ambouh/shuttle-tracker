import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RouteDetailPreviewViewModel } from "@/lib/route-detail-preview";

interface OperatingDriverCardProps {
  driver: RouteDetailPreviewViewModel["driver"];
}

export function OperatingDriverCard({ driver }: OperatingDriverCardProps) {
  return (
    <footer className="px-ui-5" aria-label="Operating driver">
      <Card className="flex-row items-center gap-ui-4 rounded-md border-0 bg-surface px-ui-4 py-ui-6 shadow-none ring-0">
        <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-deep text-ui-sm font-bold text-white" aria-hidden="true">
          {driver?.profileImageUrl ? (
            // User-managed image hosts cannot be statically allowlisted.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="size-full object-cover"
              src={driver.profileImageUrl}
              alt=""
            />
          ) : (
            driver?.initials ?? "?"
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-ui-base font-bold leading-normal-ui">
            {driver?.displayName ?? "No driver assigned"}
          </h2>
          <p className="text-ui-sm text-text-muted">Shuttle Driver</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon-lg"
          className="shrink-0 rounded-full bg-surface-soft disabled:opacity-100"
          aria-label={
            driver?.phoneNumber
              ? "Calling the driver is available in a later feature"
              : "Driver phone number unavailable"
          }
          disabled
        >
          <Phone className="size-5" aria-hidden="true" />
        </Button>
      </Card>
    </footer>
  );
}
