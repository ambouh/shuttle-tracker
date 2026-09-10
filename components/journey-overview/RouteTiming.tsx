import { RouteProgress } from "@/components/shuttle/RouteProgress";

interface RouteTimingProps {
  departureTime: string;
  arrivalTime: string;
  timingMessage: string;
  progressPercent: number;
  active: boolean;
}

const MARKER_POSITIONS = [
  "left-[0%]",
  "left-[10%]",
  "left-[20%]",
  "left-[30%]",
  "left-[40%]",
  "left-[50%]",
  "left-[60%]",
  "left-[70%]",
  "left-[80%]",
  "left-[90%]",
  "left-[100%]",
] as const;

function getMarkerPosition(progressPercent: number): string {
  const index = Math.round(progressPercent / 10);

  return MARKER_POSITIONS[index] ?? MARKER_POSITIONS[0];
}

export function RouteTiming({
  departureTime,
  arrivalTime,
  timingMessage,
  progressPercent,
  active,
}: RouteTimingProps) {
  return (
    <div className="mt-ui-6 grid min-w-0 grid-cols-[max-content_minmax(0,1fr)_max-content] items-end gap-ui-5 max-[36rem]:grid-cols-2 max-[36rem]:gap-x-ui-4 max-[36rem]:gap-y-ui-3">
      <div className="flex flex-col gap-ui-1">
        <strong className="text-ui-lg font-medium">{departureTime}</strong>
        <span className="text-ui-sm text-text-muted">Departure</span>
      </div>

      <div className="min-w-0 max-[36rem]:col-span-2 max-[36rem]:row-start-2">
        <p className="mb-ui-3 truncate text-center text-ui-base text-text-muted">
          {timingMessage}
        </p>
        <RouteProgress
          progressPercent={progressPercent}
          active={active}
          markerPositionClassName={getMarkerPosition(progressPercent)}
        />
      </div>

      <div className="flex flex-col gap-ui-1 text-right max-[36rem]:col-start-2 max-[36rem]:row-start-1">
        <strong className="text-ui-lg font-medium">{arrivalTime}</strong>
        <span className="text-ui-sm text-text-muted">Arrival</span>
      </div>
    </div>
  );
}
