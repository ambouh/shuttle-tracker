import type { ReactNode } from "react";
import { AvatarStack } from "@/components/shuttle/AvatarStack";
import { PickupButton } from "@/components/shuttle/PickupButton";
import type { WaitlistAvatarViewModel } from "@/lib/journey-overview";

interface WaitlistPreviewProps {
  avatars: WaitlistAvatarViewModel[];
  copy: string;
  pickupEligible: boolean;
  pickupAction?: ReactNode;
}

export function WaitlistPreview({
  avatars,
  copy,
  pickupEligible,
  pickupAction,
}: WaitlistPreviewProps) {
  return (
    <div className="mt-ui-5 flex min-h-[calc(var(--spacing-control)+var(--spacing-ui-6))] flex-wrap items-center justify-between gap-ui-4 border-t border-dashed border-border-soft py-ui-3">
      <div className="flex min-w-0 flex-1 items-center gap-ui-4 max-[36rem]:gap-ui-2">
        {avatars.length > 0 ? (
          <AvatarStack
            people={avatars.map((avatar) => ({
              ...avatar,
              id: avatar.userId,
            }))}
            label="Riders"
          />
        ) : null}
        <span role="status" className="min-w-0 text-ui-base leading-normal-ui text-text-muted max-[36rem]:text-ui-sm">
          {copy}
        </span>
      </div>

      {pickupAction ?? (pickupEligible ? (
        <PickupButton
          ariaLabel="Request pickup, available in a later step"
          title="Pickup requests will be enabled in the guest pickup flow"
        />
      ) : null)}
    </div>
  );
}
