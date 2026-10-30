import type {
  Journey,
  Location,
  Organization,
  RouteLeg,
  RouteLegId,
  RoutingSnapshot,
  Shuttle,
  UserId,
} from "./domain";

export interface PublicPerson {
  id: UserId;
  firstName: string;
  lastInitial: string;
  profileImageUrl: string | null;
}

export interface PublicRouteLeg extends Pick<RouteLeg,
  | "id" | "journeyId" | "sequence" | "name"
  | "departureLocationId" | "arrivalLocationId"
  | "scheduledDepartureAt" | "scheduledArrivalAt" | "status"
  | "waitlist" | "comments"
> {
  currentCycle: number;
}

export interface PublicJourneySnapshot {
  organization: Pick<Organization, "id" | "slug" | "details">;
  journey: Pick<Journey,
    "id" | "organizationId" | "name" | "description" | "routeLegIds"
  > & { activeRouteLegId: RouteLegId | null };
  routeLegs: PublicRouteLeg[];
  locations: Pick<Location, "id" | "name" | "address" | "latitude" | "longitude">[];
  users: PublicPerson[];
  shuttle: Pick<Shuttle,
    "id" | "name" | "activeDriverId" | "activeTrackingProvider" | "tracking"
  >;
  routingSnapshots: RoutingSnapshot[];
}

export type PublicJourneyResult =
  | { status: "ready"; snapshot: PublicJourneySnapshot }
  | { status: "empty" }
  | { status: "unavailable" };
