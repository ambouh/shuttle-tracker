import { FIXTURE_IDS } from "../fixtures/ids";
import { ROUTING_SNAPSHOTS } from "../fixtures/operational-scenarios";
import { UNION_ORGANIZATION } from "../fixtures/organization";
import { SUNDAY_SERVICE_FIXTURE } from "../fixtures/sunday-service";
import type {
  Journey, Location, Organization, RouteLeg, RouteLegComment, RouteLegId,
  RoutingSnapshot, Shuttle, ShuttleId, User, WaitlistEntry,
} from "@/types/domain";

import { validateSeedSource } from "./seedValidation";

export interface SeedSource {
  organization: Organization;
  journey: Journey;
  routeLegs: RouteLeg[];
  locations: Location[];
  users: User[];
  shuttle: Shuttle;
  activeRouteLegId: RouteLegId | null;
  routingSnapshots: RoutingSnapshot[];
}

export interface SeedJourney extends Journey {
  shuttleId: ShuttleId;
  activeRouteLegId: RouteLegId | null;
}

export interface SeedRouteLeg extends Omit<RouteLeg, "waitlist" | "comments"> {
  currentCycle: number;
}

export interface SeedWaitlistEntry extends WaitlistEntry { cycle: number }
export interface SeedComment extends RouteLegComment { cycle: number }

// IDs remain fixture lookup keys here; the import allocates real Convex IDs later.
export interface SeedData {
  organization: Organization;
  journey: SeedJourney;
  routeLegs: SeedRouteLeg[];
  locations: Location[];
  users: User[];
  shuttle: Shuttle;
  waitlistEntries: SeedWaitlistEntry[];
  routeLegComments: SeedComment[];
  routingSnapshots: RoutingSnapshot[];
}

function copyShuttle(shuttle: Shuttle): Shuttle {
  const tracking = shuttle.tracking;
  return {
    ...shuttle,
    tracking: tracking === null ? null : {
      ...tracking,
      coordinates: tracking.coordinates === null ? null : { ...tracking.coordinates },
    },
  };
}

function extractRouteData(legs: RouteLeg[]) {
  const routeLegs: SeedRouteLeg[] = [];
  const waitlistEntries: SeedWaitlistEntry[] = [];
  const routeLegComments: SeedComment[] = [];
  for (const { waitlist, comments, ...leg } of legs) {
    routeLegs.push({ ...leg, currentCycle: 1 });
    waitlistEntries.push(...waitlist.map((entry) => ({ ...entry, cycle: 1 })));
    routeLegComments.push(...comments.map((comment) => ({ ...comment, cycle: 1 })));
  }
  return { routeLegs, waitlistEntries, routeLegComments };
}

export function prepareSeedData(source: SeedSource): SeedData {
  validateSeedSource(source);
  return {
    organization: { ...source.organization, details: { ...source.organization.details } },
    journey: {
      ...source.journey,
      routeLegIds: [...source.journey.routeLegIds],
      shuttleId: source.shuttle.id,
      activeRouteLegId: source.activeRouteLegId,
    },
    locations: source.locations.map((location) => ({ ...location })),
    users: source.users.map((user) => ({ ...user })),
    shuttle: copyShuttle(source.shuttle),
    ...extractRouteData(source.routeLegs),
    routingSnapshots: source.routingSnapshots.map((snapshot) => ({
      ...snapshot, origin: { ...snapshot.origin }, destination: { ...snapshot.destination },
    })),
  };
}

export function prepareSundayServiceSeed(): SeedData {
  return prepareSeedData({
    ...SUNDAY_SERVICE_FIXTURE,
    organization: UNION_ORGANIZATION,
    activeRouteLegId: FIXTURE_IDS.routeLegs.outbound,
    routingSnapshots: ROUTING_SNAPSHOTS,
  });
}
