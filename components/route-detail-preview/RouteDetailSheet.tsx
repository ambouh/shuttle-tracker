import { ArrowLeft } from "lucide-react";

import { RouteDirection } from "@/components/shuttle/RouteDirection";
import { Button } from "@/components/ui/button";
import type { RouteDetailPreviewViewModel } from "@/lib/route-detail-preview";

import { CommentPreview } from "./CommentPreview";
import { OperatingDriverCard } from "./OperatingDriverCard";
import { RouteSummary } from "./RouteSummary";
import { RouteWaitlistPreview } from "./RouteWaitlistPreview";
import { ScheduledPickupPreview } from "./ScheduledPickupPreview";

interface RouteDetailSheetProps {
  model: RouteDetailPreviewViewModel;
}

export function RouteDetailSheet({ model }: RouteDetailSheetProps) {
  return (
    <section
      className="relative z-20 -mt-32 overflow-hidden rounded-t-lg bg-status-active text-status-active-foreground"
      aria-label="Route details"
    >
      <header className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-ui-4 px-ui-5 py-ui-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-9 rounded-full border-2 border-accent-deep p-0 text-accent-deep disabled:opacity-100"
          aria-label="Back navigation is available in a later feature"
          disabled
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Button>
        <RouteDirection
          departureName={model.route.departureName}
          arrivalName={model.route.arrivalName}
          className="text-ui-base font-medium"
        />
      </header>

      <div className="rounded-t-lg bg-surface-raised pb-ui-8 text-foreground">
        <RouteSummary route={model.route} />
        <RouteWaitlistPreview
          riders={model.waitlist}
          copy={model.waitlistCopy}
        />
        <CommentPreview
          comments={model.comments}
          emptyCopy={model.emptyCommentsCopy}
        />
        <ScheduledPickupPreview pickup={model.scheduledPickup} />
        <OperatingDriverCard driver={model.driver} />
      </div>
    </section>
  );
}
