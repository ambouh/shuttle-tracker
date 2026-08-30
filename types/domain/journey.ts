import type { RouteLegComment } from "./comment";
import type {
  DistanceMeters,
  JourneyId,
  LocationId,
  RouteLegId,
  Timestamp,
} from "./primitives";
import type { WaitlistEntry } from "./waitlist";

export type RouteStatus = "NOT_STARTED" | "DEPARTING" | "IN_TRANSIT";

export interface Location {
  id: LocationId;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Journey {
  id: JourneyId;
  name: string;
  description: string | null;
  active: boolean;
  routeLegIds: RouteLegId[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RouteLeg {
  id: RouteLegId;
  journeyId: JourneyId;
  sequence: number;
  name: string;
  departureLocationId: LocationId;
  arrivalLocationId: LocationId;
  status: RouteStatus;
  departureGeofenceRadius: DistanceMeters;
  arrivalGeofenceRadius: DistanceMeters;
  waitlist: WaitlistEntry[];
  comments: RouteLegComment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
