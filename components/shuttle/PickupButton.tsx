import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PickupButtonProps {
  ariaLabel: string;
  title?: string;
}

export function PickupButton({ ariaLabel, title }: PickupButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      className="relative size-9 shrink-0 rounded-full border-2 border-accent bg-transparent p-0 text-accent shadow-none after:absolute after:-inset-1.5 after:content-[''] hover:bg-accent/10 hover:text-accent disabled:opacity-100"
      aria-label={ariaLabel}
      disabled
      title={title}
    >
      <Plus className="size-5 stroke-2" aria-hidden="true" />
    </Button>
  );
}
