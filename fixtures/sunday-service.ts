import type {
  Journey,
  RouteLeg,
  RouteLegComment,
  WaitlistEntry,
} from "@/types/domain";

import { FIXTURE_IDS } from "./ids";
import { REFERENCE_TIMESTAMPS } from "./reference-time";
import {
  SUNDAY_SERVICE_LOCATIONS,
  SUNDAY_SERVICE_USERS,
  UNION_SHUTTLE,
} from "./shared-entities";

export const OUTBOUND_WAITLIST = [
  {
    id: FIXTURE_IDS.waitlistEntries.outboundFaith,
    userId: FIXTURE_IDS.users.faithAnderson,
    routeLegId: FIXTURE_IDS.routeLegs.outbound,
    requestedAt: REFERENCE_TIMESTAMPS.outboundRequests[0],
  },
  {
    id: FIXTURE_IDS.waitlistEntries.outboundAlex,
    userId: FIXTURE_IDS.users.alexMorgan,
    routeLegId: FIXTURE_IDS.routeLegs.outbound,
    requestedAt: REFERENCE_TIMESTAMPS.outboundRequests[1],
  },
  {
    id: FIXTURE_IDS.waitlistEntries.outboundSam,
    userId: FIXTURE_IDS.users.samRivera,
    routeLegId: FIXTURE_IDS.routeLegs.outbound,
    requestedAt: REFERENCE_TIMESTAMPS.outboundRequests[2],
  },
] satisfies WaitlistEntry[];

export const RETURN_WAITLIST = [
  {
    id: FIXTURE_IDS.waitlistEntries.returnMaya,
    userId: FIXTURE_IDS.users.mayaChen,
    routeLegId: FIXTURE_IDS.routeLegs.return,
    requestedAt: REFERENCE_TIMESTAMPS.returnRequests[0],
  },
  {
    id: FIXTURE_IDS.waitlistEntries.returnTaylor,
    userId: FIXTURE_IDS.users.taylorBrown,
    routeLegId: FIXTURE_IDS.routeLegs.return,
    requestedAt: REFERENCE_TIMESTAMPS.returnRequests[1],
  },
  {
    id: FIXTURE_IDS.waitlistEntries.returnChris,
    userId: FIXTURE_IDS.users.chrisDavis,
    routeLegId: FIXTURE_IDS.routeLegs.return,
    requestedAt: REFERENCE_TIMESTAMPS.returnRequests[2],
  },
] satisfies WaitlistEntry[];

export const OUTBOUND_COMMENTS = [
  {
    id: FIXTURE_IDS.comments.outboundJosh,
    routeLegId: FIXTURE_IDS.routeLegs.outbound,
    authorUserId: FIXTURE_IDS.users.joshWilliams,
    message: "I'm coming...",
    createdAt: REFERENCE_TIMESTAMPS.outboundComments[0],
  },
  {
    id: FIXTURE_IDS.comments.outboundJohn,
    routeLegId: FIXTURE_IDS.routeLegs.outbound,
    authorUserId: FIXTURE_IDS.users.johnSmith,
    message: "Okay, I'll wait for you",
    createdAt: REFERENCE_TIMESTAMPS.outboundComments[1],
  },
] satisfies RouteLegComment[];

export const SUNDAY_SERVICE_JOURNEY = {
  id: FIXTURE_IDS.journey,
  organizationId: FIXTURE_IDS.organization,
  name: "Sunday Service",
  description: "Sunday shuttle service between Union Church and Guilford Elementary School.",
  active: true,
  routeLegIds: [FIXTURE_IDS.routeLegs.outbound, FIXTURE_IDS.routeLegs.return],
  createdAt: REFERENCE_TIMESTAMPS.createdAt,
  updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
} satisfies Journey;

export const OUTBOUND_ROUTE_LEG = {
  id: FIXTURE_IDS.routeLegs.outbound,
  journeyId: FIXTURE_IDS.journey,
  sequence: 1,
  name: "Union Church to Guilford Elementary",
  departureLocationId: FIXTURE_IDS.locations.unionChurch,
  arrivalLocationId: FIXTURE_IDS.locations.guilfordElementary,
  scheduledDepartureAt: REFERENCE_TIMESTAMPS.serviceStartsAt,
  scheduledArrivalAt: REFERENCE_TIMESTAMPS.outboundScheduledArrivalAt,
  status: "IN_TRANSIT",
  departureGeofenceRadius: 160.9344,
  arrivalGeofenceRadius: 160.9344,
  waitlist: OUTBOUND_WAITLIST,
  comments: OUTBOUND_COMMENTS,
  createdAt: REFERENCE_TIMESTAMPS.createdAt,
  updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
} satisfies RouteLeg;

export const RETURN_ROUTE_LEG = {
  id: FIXTURE_IDS.routeLegs.return,
  journeyId: FIXTURE_IDS.journey,
  sequence: 2,
  name: "Guilford Elementary to Union Church",
  departureLocationId: FIXTURE_IDS.locations.guilfordElementary,
  arrivalLocationId: FIXTURE_IDS.locations.unionChurch,
  scheduledDepartureAt: REFERENCE_TIMESTAMPS.returnScheduledDepartureAt,
  scheduledArrivalAt: REFERENCE_TIMESTAMPS.returnScheduledArrivalAt,
  status: "NOT_STARTED",
  departureGeofenceRadius: 160.9344,
  arrivalGeofenceRadius: 160.9344,
  waitlist: RETURN_WAITLIST,
  comments: [],
  createdAt: REFERENCE_TIMESTAMPS.createdAt,
  updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
} satisfies RouteLeg;

export const SUNDAY_SERVICE_FIXTURE = {
  journey: SUNDAY_SERVICE_JOURNEY,
  routeLegs: [OUTBOUND_ROUTE_LEG, RETURN_ROUTE_LEG],
  locations: SUNDAY_SERVICE_LOCATIONS,
  users: SUNDAY_SERVICE_USERS,
  shuttle: UNION_SHUTTLE,
};
