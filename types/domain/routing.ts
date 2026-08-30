import type {
  Coordinates,
  DistanceMeters,
  DurationSeconds,
  ProgressRatio,
  RouteLegId,
  ShuttleId,
  Timestamp,
} from "./primitives";

export interface RoutingSnapshot {
  routeLegId: RouteLegId;
  shuttleId: ShuttleId;
  origin: Coordinates;
  destination: Coordinates;
  totalDistanceMeters: DistanceMeters;
  remainingDistanceMeters: DistanceMeters;
  estimatedDurationSeconds: DurationSeconds;
  estimatedArrivalAt: Timestamp;
  progressRatio: ProgressRatio;
  encodedGeometry: string | null;
  calculatedAt: Timestamp;
}
