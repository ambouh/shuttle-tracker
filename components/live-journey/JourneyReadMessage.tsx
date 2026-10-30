import { Button } from "@/components/ui/button";

interface JourneyReadMessageProps {
  message: string;
  role?: "status" | "alert";
  onRetry?: () => void;
}

export function JourneyReadMessage({ message, role = "status", onRetry }: JourneyReadMessageProps) {
  return (
    <section className="rounded-lg bg-surface-raised p-ui-6">
      <h1 className="text-ui-xl">Shuttle Tracker</h1>
      <p role={role} className="mt-ui-3 text-ui-sm text-text-muted">{message}</p>
      {onRetry ? <Button type="button" variant="secondary" className="mt-ui-4 min-h-11" onClick={onRetry}>Try again</Button> : null}
    </section>
  );
}
