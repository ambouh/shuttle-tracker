import { Button } from "@/components/ui/button";
import type { RouteStatus } from "@/types/domain";

interface DemoJourneyControlsProps {
  routeName: string;
  status: RouteStatus;
  disabled: boolean;
  announcement: string;
  error: string | null;
  onStatusChange: (status: RouteStatus) => void;
  onArrival: () => void;
}

const statuses = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "DEPARTING", label: "Departing" },
  { value: "IN_TRANSIT", label: "In transit" },
] as const;

export function DemoJourneyControls({
  routeName, status, disabled, announcement, error, onStatusChange, onArrival,
}: DemoJourneyControlsProps) {
  return (
    <section aria-label="Demo journey controls" className="mb-ui-5 min-w-0 rounded-lg border border-border bg-surface-raised p-ui-4">
      <h2 className="text-ui-sm font-medium">Demo journey controls</h2>
      <p className="mt-ui-2 break-words text-ui-sm text-text-muted">Active route: {routeName}</p>
      <div role="group" aria-label="Demo route status" className="mt-ui-3 flex flex-wrap gap-ui-2">
        {statuses.map(option => (
          <Button key={option.value} type="button"
            variant={status === option.value ? "default" : "secondary"}
            className="min-h-11"
            aria-pressed={status === option.value}
            disabled={disabled}
            onClick={() => onStatusChange(option.value)}>
            {option.label}
          </Button>
        ))}
        <Button type="button" variant="outline" className="min-h-11"
          disabled={disabled || status !== "IN_TRANSIT"} onClick={onArrival}>
          Arrive
        </Button>
      </div>
      <p className="mt-ui-3 text-ui-sm text-text-muted">Demo journey status and pickup requests reset when this page reloads. Your guest details stay saved.</p>
      <p role="status" aria-live="polite" aria-atomic="true" className="mt-ui-2 text-ui-sm">{announcement}</p>
      {error ? <p role="alert" className="mt-ui-2 text-ui-sm">{error}</p> : null}
    </section>
  );
}
