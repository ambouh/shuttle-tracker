import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WaitlistAvatarViewModel } from "@/lib/journey-overview";
import { cn } from "@/lib/utils";

interface WaitlistPreviewProps {
  avatars: WaitlistAvatarViewModel[];
  copy: string;
  pickupEligible: boolean;
}

const TONE_CLASSES: Record<WaitlistAvatarViewModel["tone"], string> = {
  green: "bg-accent",
  blue: "bg-avatar-blue",
  lilac: "bg-avatar-lilac",
  peach: "bg-avatar-peach",
  mint: "bg-avatar-mint",
  gold: "bg-avatar-gold",
};

export function WaitlistPreview({
  avatars,
  copy,
  pickupEligible,
}: WaitlistPreviewProps) {
  return (
    <div className="mt-ui-5 flex min-h-[calc(var(--spacing-control)+var(--spacing-ui-6))] items-center justify-between gap-ui-4 border-t border-dashed border-border-soft py-ui-3">
      <div className="flex min-w-0 items-center gap-ui-4 max-[36rem]:gap-ui-2">
        {avatars.length > 0 ? (
          <ul className="flex shrink-0 pl-ui-2" aria-label="Riders">
            {avatars.slice(0, 3).map((avatar) => (
              <li
                key={avatar.userId}
                className={cn(
                  "-ml-ui-2 grid size-avatar-sm place-items-center rounded-full border-2 border-surface-raised text-ui-sm font-bold text-canvas",
                  TONE_CLASSES[avatar.tone],
                )}
                title={avatar.displayName}
              >
                <span aria-hidden="true">{avatar.initials}</span>
                <span className="sr-only">{avatar.displayName}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <span className="min-w-0 text-ui-base leading-normal-ui text-text-muted max-[36rem]:text-ui-sm">
          {copy}
        </span>
      </div>

      {pickupEligible ? (
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="relative size-9 shrink-0 rounded-full border-2 border-accent bg-transparent p-0 text-accent shadow-none after:absolute after:-inset-1.5 after:content-[''] hover:bg-accent/10 hover:text-accent disabled:opacity-100"
          aria-label="Request pickup, available in a later step"
          aria-disabled="true"
          disabled
          title="Pickup requests will be enabled in the guest pickup flow"
        >
          <Plus className="size-5 stroke-2" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
