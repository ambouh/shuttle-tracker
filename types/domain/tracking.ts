import type {
  Coordinates,
  DistanceMeters,
  LocationUpdateId,
  ShuttleId,
  Timestamp,
  TrackingProviderConfigurationId,
} from "./primitives";

export type ShuttleTrackingStatus = "UNAVAILABLE" | "CURRENT" | "STALE";

export type TrackingProvider = "AIRTAG" | "DRIVER_GPS";

export interface ShuttleTrackingSnapshot {
  status: ShuttleTrackingStatus;
  coordinates: Coordinates | null;
  accuracyMeters: DistanceMeters | null;
  recordedAt: Timestamp | null;
  receivedAt: Timestamp | null;
}

export interface Shuttle {
  id: ShuttleId;
  name: string;
  activeTrackingProvider: TrackingProvider | null;
  tracking: ShuttleTrackingSnapshot | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LocationUpdate {
  id: LocationUpdateId;
  shuttleId: ShuttleId;
  provider: TrackingProvider;
  coordinates: Coordinates;
  accuracyMeters: DistanceMeters | null;
  recordedAt: Timestamp;
  receivedAt: Timestamp;
}

export interface TrackingProviderConfiguration<TSettings = unknown> {
  id: TrackingProviderConfigurationId;
  shuttleId: ShuttleId;
  provider: TrackingProvider;
  active: boolean;
  settings: TSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
