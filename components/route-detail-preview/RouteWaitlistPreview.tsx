import { AvatarStack } from "@/components/shuttle/AvatarStack";
import { PickupButton } from "@/components/shuttle/PickupButton";
import type { RouteDetailPreviewViewModel } from "@/lib/route-detail-preview";

interface RouteWaitlistPreviewProps {
  riders: RouteDetailPreviewViewModel["waitlist"];
  copy: string;
}

export function RouteWaitlistPreview({
  riders,
  copy,
}: RouteWaitlistPreviewProps) {
  return (
    <section
      className="mt-ui-5 flex items-center gap-ui-4 border-y border-border-soft px-ui-7 py-ui-5"
      aria-label="Current riders"
    >
      <AvatarStack
        people={riders.map((rider) => ({ ...rider, id: rider.userId }))}
        label="Picked-up riders"
        size="compact"
      />
      <p className="min-w-0 flex-1 text-ui-sm text-text-muted">{copy}</p>
      <PickupButton ariaLabel="Pickup controls are available in a later feature" />
    </section>
  );
}
