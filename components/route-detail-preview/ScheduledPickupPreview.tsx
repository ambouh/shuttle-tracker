import { ChevronUp, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RouteDetailPreviewViewModel } from "@/lib/route-detail-preview";

interface ScheduledPickupPreviewProps {
  pickup: RouteDetailPreviewViewModel["scheduledPickup"];
}

export function ScheduledPickupPreview({
  pickup,
}: ScheduledPickupPreviewProps) {
  return (
    <section className="px-ui-5 pb-ui-7" aria-labelledby="scheduled-heading">
      <div className="flex items-center gap-ui-3 px-ui-2">
        <h2 id="scheduled-heading" className="text-ui-lg font-bold">
          Schedule a later pickup
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-7 rounded-full border-2 border-accent p-0 text-accent disabled:opacity-100"
          aria-label="Scheduling pickup is available in a later feature"
          disabled
        >
          <Plus className="size-4 stroke-2" aria-hidden="true" />
        </Button>
      </div>

      <Card className="mt-ui-4 gap-0 rounded-md border-0 bg-surface py-0 shadow-none ring-0">
        <div className="flex items-center gap-ui-4 px-ui-5 py-ui-4">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-6 rounded-full border-2 border-border p-0 text-text-muted disabled:opacity-100"
            aria-label="Removing scheduled pickup is available in a later feature"
            disabled
          >
            <Minus className="size-3" aria-hidden="true" />
          </Button>
          <strong className="text-ui-lg">{pickup.scheduledTime}</strong>
          <Button
            type="button"
            variant="secondary"
            size="icon-lg"
            className="ml-auto size-9 rounded-full bg-surface-soft p-0 disabled:opacity-100"
            aria-label="Scheduled pickup disclosure is available in a later feature"
            disabled
          >
            <ChevronUp className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="border-t border-border-soft px-ui-5 py-ui-4 text-center">
          <p className="text-ui-base text-accent">
            <strong>Best pickup time</strong> {pickup.bestPickupTime}
          </p>
          <p className="mt-ui-1 text-ui-sm text-text-muted">
            {pickup.partyCopy}
          </p>
        </div>
      </Card>
    </section>
  );
}
