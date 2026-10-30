import type {
  Coordinates, JourneyId, LocationId, OrganizationId, RouteLegCommentId,
  RouteLegId, RoutingSnapshot, ShuttleId, UserId, WaitlistEntryId,
} from "../types/domain";
import type { PublicJourneySnapshot, PublicRouteLeg } from "../types/live-journey";
import type { Doc } from "./_generated/dataModel";
import type { StoredJourneyGraph } from "./journeyRead";
import type { StoredLegActivity } from "./journeyReadActivity";
import { projectPublicPerson } from "./publicPeople";

function projectCoordinates(value: Coordinates): Coordinates {
  return { latitude: value.latitude, longitude: value.longitude };
}

function projectLeg({ leg, waitlist, comments }: StoredLegActivity): PublicRouteLeg {
  return {
    id: leg._id as string as RouteLegId,
    journeyId: leg.journeyId as string as JourneyId,
    sequence: leg.sequence,
    name: leg.name,
    departureLocationId: leg.departureLocationId as string as LocationId,
    arrivalLocationId: leg.arrivalLocationId as string as LocationId,
    scheduledDepartureAt: leg.scheduledDepartureAt,
    scheduledArrivalAt: leg.scheduledArrivalAt,
    status: leg.status,
    currentCycle: leg.currentCycle,
    waitlist: waitlist.map((entry) => ({
      id: entry._id as string as WaitlistEntryId,
      userId: entry.userId as string as UserId,
      routeLegId: entry.routeLegId as string as RouteLegId,
      requestedAt: entry.requestedAt,
    })),
    comments: comments.map((comment) => ({
      id: comment._id as string as RouteLegCommentId,
      routeLegId: comment.routeLegId as string as RouteLegId,
      authorUserId: comment.authorUserId as string as UserId,
      message: comment.message,
      createdAt: comment.createdAt,
    })),
  };
}

function projectRouting(snapshot: Doc<"routingSnapshots">): RoutingSnapshot {
  return {
    routeLegId: snapshot.routeLegId as string as RouteLegId,
    shuttleId: snapshot.shuttleId as string as ShuttleId,
    origin: projectCoordinates(snapshot.origin),
    destination: projectCoordinates(snapshot.destination),
    totalDistanceMeters: snapshot.totalDistanceMeters,
    remainingDistanceMeters: snapshot.remainingDistanceMeters,
    estimatedDurationSeconds: snapshot.estimatedDurationSeconds,
    estimatedArrivalAt: snapshot.estimatedArrivalAt,
    progressRatio: snapshot.progressRatio,
    encodedGeometry: snapshot.encodedGeometry,
    calculatedAt: snapshot.calculatedAt,
  };
}

function projectShuttle(shuttle: Doc<"shuttles">): PublicJourneySnapshot["shuttle"] {
  const tracking = shuttle.tracking;
  return {
    id: shuttle._id as string as ShuttleId,
    name: shuttle.name,
    activeDriverId: shuttle.activeDriverId === null ? null : shuttle.activeDriverId as string as UserId,
    activeTrackingProvider: shuttle.activeTrackingProvider,
    tracking: tracking === null ? null : {
      status: tracking.status,
      coordinates: tracking.coordinates === null ? null : projectCoordinates(tracking.coordinates),
      accuracyMeters: tracking.accuracyMeters,
      recordedAt: tracking.recordedAt,
      receivedAt: tracking.receivedAt,
    },
  };
}

export function projectPublicJourney(graph: StoredJourneyGraph): PublicJourneySnapshot {
  const { organization, journey } = graph;
  return {
    organization: {
      id: organization._id as string as OrganizationId,
      slug: organization.slug,
      details: {
        displayName: organization.details.displayName,
        description: organization.details.description,
        logoUrl: organization.details.logoUrl,
        logoAltText: organization.details.logoAltText,
        fallbackInitials: organization.details.fallbackInitials,
      },
    },
    journey: {
      id: journey._id as string as JourneyId,
      organizationId: journey.organizationId as string as OrganizationId,
      name: journey.name,
      description: journey.description,
      routeLegIds: journey.routeLegIds.map((id) => id as string as RouteLegId),
      activeRouteLegId: journey.activeRouteLegId === null ? null : journey.activeRouteLegId as string as RouteLegId,
    },
    routeLegs: graph.legs.map(projectLeg),
    locations: graph.locations.map((location) => ({
      id: location._id as string as LocationId,
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    })),
    users: graph.users.map(projectPublicPerson),
    shuttle: projectShuttle(graph.shuttle),
    routingSnapshots: graph.legs.flatMap(({ routing }) => routing === null ? [] : [projectRouting(routing)]),
  };
}
