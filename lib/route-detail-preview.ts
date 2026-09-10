import type {
  Journey,
  Location,
  Organization,
  RouteLeg,
  RouteLegId,
  RoutingSnapshot,
  Shuttle,
  Timestamp,
  User,
  UserId,
} from "@/types/domain";
import type {
  NormalizedMapPoint,
  RouteDetailPreviewScenario,
} from "@/fixtures";

const EASTERN_TIME_ZONE = "America/New_York";
const METERS_PER_MILE = 1_609.344;
const FALLBACK_MAP_PATH: readonly NormalizedMapPoint[] = [
  { x: 0.2, y: 0.2 },
  { x: 0.8, y: 0.8 },
];
const AVATAR_TONES = ["green", "blue", "lilac"] as const;

export interface RouteDetailPreviewInput {
  organization: Organization;
  journey: Journey;
  routeLegs: readonly RouteLeg[];
  locations: readonly Location[];
  users: readonly User[];
  shuttle: Shuttle;
  currentRiderId: UserId;
  scenario: RouteDetailPreviewScenario;
}

interface PersonDisplay {
  displayName: string;
  initials: string;
  profileImageUrl: string | null;
}

export interface RouteDetailPreviewViewModel {
  routeLegId: RouteLegId;
  rider: PersonDisplay & { subtitle: string };
  route: {
    departureName: string;
    arrivalName: string;
    statusLabel: string;
    departureTime: string;
    arrivalTime: string;
    progressPercent: number;
  };
  metrics: {
    eta: string;
    distance: string;
    freshness: string;
  };
  map: {
    path: readonly NormalizedMapPoint[];
    shuttlePoint: NormalizedMapPoint;
  };
  waitlist: Array<PersonDisplay & { userId: UserId; tone: string }>;
  waitlistCopy: string;
  comments: Array<
    PersonDisplay & {
      id: string;
      message: string;
      isDriver: boolean;
    }
  >;
  emptyCommentsCopy: string;
  scheduledPickup: {
    scheduledTime: string;
    bestPickupTime: string;
    partyCopy: string;
  };
  driver: (PersonDisplay & { phoneNumber: string | null }) | null;
}

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
  timeZone: EASTERN_TIME_ZONE,
});

const scheduleTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: EASTERN_TIME_ZONE,
});

function formatScheduleTime(timestamp: Timestamp): string {
  return scheduleTimeFormatter.format(timestamp).toLowerCase();
}

function getPersonDisplay(user: User): PersonDisplay {
  return {
    displayName: `${user.firstName} ${user.lastName}`.trim(),
    initials: `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase(),
    profileImageUrl: user.profileImageUrl,
  };
}

function isValidPoint(point: NormalizedMapPoint): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 1 &&
    point.y >= 0 &&
    point.y <= 1
  );
}

function getMapPath(points: readonly NormalizedMapPoint[]) {
  return points.length >= 2 && points.every(isValidPoint)
    ? points
    : FALLBACK_MAP_PATH;
}

function getShuttlePoint(
  path: readonly NormalizedMapPoint[],
  progressRatio: number,
): NormalizedMapPoint {
  const index = Math.round(
    Math.min(1, Math.max(0, progressRatio)) * (path.length - 1),
  );

  return path[index] ?? path[0] ?? FALLBACK_MAP_PATH[0];
}

function formatDuration(snapshot: RoutingSnapshot | undefined): string {
  if (!snapshot) return "ETA unavailable";

  const minutes = Math.max(1, Math.ceil(snapshot.estimatedDurationSeconds / 60));
  return `${minutes} min`;
}

function formatDistance(snapshot: RoutingSnapshot | undefined): string {
  if (!snapshot) return "Distance unavailable";

  return `${(snapshot.totalDistanceMeters / METERS_PER_MILE).toFixed(1)} miles`;
}

function formatFreshness(
  receivedAt: Timestamp | null | undefined,
  referenceAt: Timestamp,
): string {
  if (receivedAt == null || receivedAt > referenceAt) {
    return "Location unavailable";
  }

  const minutes = Math.round((referenceAt - receivedAt) / 60_000);
  if (minutes < 1) return "Updated just now";
  return `Updated ${minutes} ${minutes === 1 ? "min" : "mins"} ago`;
}

function getStatusLabel(status: RouteLeg["status"]): string {
  if (status === "IN_TRANSIT") return "In transit";
  if (status === "DEPARTING") return "Departing";
  return "Not started";
}

export function buildRouteDetailPreviewViewModel(
  input: RouteDetailPreviewInput,
): RouteDetailPreviewViewModel | null {
  const routeLeg = input.routeLegs.find(
    ({ id }) => id === input.scenario.routeLegId,
  );
  const organizationIsValid =
    input.journey.organizationId === input.organization.id &&
    input.shuttle.organizationId === input.organization.id;

  if (
    !routeLeg ||
    !organizationIsValid ||
    routeLeg.journeyId !== input.journey.id ||
    !input.journey.routeLegIds.includes(routeLeg.id)
  ) {
    return null;
  }

  const locationsById = new Map(
    input.locations
      .filter(({ organizationId }) => organizationId === input.organization.id)
      .map((item) => [item.id, item]),
  );
  const usersById = new Map(input.users.map((user) => [user.id, user]));
  const departure = locationsById.get(routeLeg.departureLocationId);
  const arrival = locationsById.get(routeLeg.arrivalLocationId);
  const rider = usersById.get(input.currentRiderId);
  const snapshot =
    input.scenario.routingSnapshot.routeLegId === routeLeg.id &&
    input.scenario.routingSnapshot.shuttleId === input.shuttle.id
      ? input.scenario.routingSnapshot
      : undefined;
  const activeDriver = input.shuttle.activeDriverId
    ? usersById.get(input.shuttle.activeDriverId)
    : undefined;
  const driver =
    activeDriver?.role === "driver" &&
    activeDriver.organizationId === input.organization.id
      ? activeDriver
      : undefined;
  const mapPath = getMapPath(input.scenario.mapPath);
  const progressRatio = snapshot?.progressRatio ?? 0;
  const fallbackRider: PersonDisplay = {
    displayName: "Rider",
    initials: "R",
    profileImageUrl: null,
  };
  const waitlist = routeLeg.waitlist.flatMap((entry, index) => {
    const user = usersById.get(entry.userId);
    return user
      ? [
          {
            ...getPersonDisplay(user),
            userId: user.id,
            tone: AVATAR_TONES[index % AVATAR_TONES.length],
          },
        ]
      : [];
  });

  return {
    routeLegId: routeLeg.id,
    rider: {
      ...(rider ? getPersonDisplay(rider) : fallbackRider),
      subtitle: input.scenario.riderSubtitle || "Shuttle rider",
    },
    route: {
      departureName: departure?.name ?? "Location unavailable",
      arrivalName: arrival?.name ?? "Location unavailable",
      statusLabel: getStatusLabel(routeLeg.status),
      departureTime: timeFormatter.format(routeLeg.scheduledDepartureAt),
      arrivalTime: snapshot
        ? timeFormatter.format(snapshot.estimatedArrivalAt)
        : "Unavailable",
      progressPercent: Math.round(Math.min(1, Math.max(0, progressRatio)) * 100),
    },
    metrics: {
      eta: formatDuration(snapshot),
      distance: formatDistance(snapshot),
      freshness: formatFreshness(
        input.shuttle.tracking?.receivedAt,
        input.scenario.referenceAt,
      ),
    },
    map: {
      path: mapPath,
      shuttlePoint: getShuttlePoint(mapPath, progressRatio),
    },
    waitlist,
    waitlistCopy: `${waitlist.length} people picked up and riding`,
    comments: routeLeg.comments.map((comment) => {
      const author = usersById.get(comment.authorUserId);
      const person = author
        ? getPersonDisplay(author)
        : { displayName: "Unknown rider", initials: "?", profileImageUrl: null };
      return {
        ...person,
        id: comment.id,
        message: comment.message || "Comment unavailable",
        isDriver: comment.authorUserId === driver?.id,
      };
    }),
    emptyCommentsCopy: "No comments yet",
    scheduledPickup: {
      scheduledTime: formatScheduleTime(
        input.scenario.scheduledPickup.scheduledAt,
      ),
      bestPickupTime: formatScheduleTime(
        input.scenario.scheduledPickup.bestPickupAt,
      ),
      partyCopy: `You and ${Math.max(0, input.scenario.scheduledPickup.partySize - 1)} others are scheduled`,
    },
    driver: driver
      ? { ...getPersonDisplay(driver), phoneNumber: driver.phoneNumber }
      : null,
  };
}
