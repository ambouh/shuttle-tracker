import type {
  Journey,
  Location,
  Organization,
  RouteLeg,
  RouteLegId,
  RouteStatus,
  RoutingSnapshot,
  Shuttle,
  User,
  UserId,
} from "@/types/domain";

const EASTERN_TIME_ZONE = "America/New_York";
const WAITLIST_TONES = [
  "green",
  "blue",
  "lilac",
  "peach",
  "mint",
  "gold",
] as const;

export type RouteCardTone = "active" | "idle";
export type WaitlistAvatarTone = (typeof WAITLIST_TONES)[number];

export interface JourneyOverviewInput {
  organization: Organization;
  journey: Journey;
  routeLegs: readonly RouteLeg[];
  locations: readonly Location[];
  users: readonly User[];
  shuttle: Shuttle;
  routingSnapshots: readonly RoutingSnapshot[];
  currentRiderId: UserId | null;
}

export interface PersonViewModel {
  displayName: string;
  initials: string;
}

export interface CurrentRiderViewModel extends PersonViewModel {
  firstName: string;
  profileImageUrl: string | null;
}

export interface JourneyDisplayPerson extends CurrentRiderViewModel {
  id: UserId;
}

export interface JourneyPresentationInput {
  organization: Pick<Organization, "details">;
  journey: Pick<Journey, "id" | "name" | "routeLegIds">;
  routeLegs: readonly Pick<RouteLeg,
    "id" | "departureLocationId" | "arrivalLocationId" | "status" |
    "scheduledDepartureAt" | "scheduledArrivalAt" | "waitlist"
  >[];
  locations: readonly Pick<Location, "id" | "name">[];
  users: readonly JourneyDisplayPerson[];
  shuttle: Pick<Shuttle, "activeDriverId">;
  routingSnapshots: readonly RoutingSnapshot[];
  currentRiderId: UserId | null;
}

export interface WaitlistAvatarViewModel extends PersonViewModel {
  userId: UserId;
  tone: WaitlistAvatarTone;
}

export interface RouteCardViewModel {
  id: RouteLegId;
  departureName: string;
  arrivalName: string;
  driver: PersonViewModel | null;
  driverLabel: string;
  statusLabel: string;
  tone: RouteCardTone;
  departureTime: string;
  arrivalTime: string;
  timingMessage: string;
  progressPercent: number;
  waitlistAvatars: WaitlistAvatarViewModel[];
  waitlistCopy: string;
  pickupEligible: boolean;
  currentRiderWaiting: boolean;
}

export interface JourneyOverviewViewModel {
  organization: {
    displayName: string;
    logoUrl: string | null;
    logoAltText: string | null;
    fallbackInitials: string;
  };
  currentRider: CurrentRiderViewModel;
  journeyId: Journey["id"];
  journeyName: string;
  routeCards: RouteCardViewModel[];
}

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: EASTERN_TIME_ZONE,
});

function getStatusPresentation(status: RouteStatus): {
  label: string;
  tone: RouteCardTone;
} {
  switch (status) {
    case "IN_TRANSIT":
      return { label: "In transit", tone: "active" };
    case "DEPARTING":
      return { label: "Departing", tone: "active" };
    case "NOT_STARTED":
      return { label: "Not started", tone: "idle" };
  }
}

function getTimingMessage(
  status: RouteStatus,
  routingSnapshot: RoutingSnapshot | undefined,
): string {
  if (!routingSnapshot) {
    return "Timing unavailable";
  }

  const minutes = Math.max(
    1,
    Math.ceil(routingSnapshot.estimatedDurationSeconds / 60),
  );

  switch (status) {
    case "IN_TRANSIT":
      return `${minutes} mins remaining`;
    case "DEPARTING":
      return "Departing now";
    case "NOT_STARTED":
      return `Starting in ${minutes} mins`;
  }
}

function getProgressPercent(
  routingSnapshot: RoutingSnapshot | undefined,
): number {
  if (!routingSnapshot) {
    return 0;
  }

  return Math.round(
    Math.min(1, Math.max(0, routingSnapshot.progressRatio)) * 100,
  );
}

function getWaitlistCopy(
  routeLeg: JourneyPresentationInput["routeLegs"][number],
  users: readonly JourneyDisplayPerson[],
  currentRiderId: UserId | null,
): string {
  const count = routeLeg.waitlist.length;
  const inTransit = routeLeg.status === "IN_TRANSIT";
  if (!count) return inTransit ? "No riders picked up" : "No one waiting for pickup";
  const includesYou = routeLeg.waitlist.some(entry => entry.userId === currentRiderId);
  const firstRider = users.find(user => user.id === routeLeg.waitlist[0].userId);
  const name = includesYou ? "You" : firstRider?.firstName.trim() || "A rider";
  const others = count - 1;
  const subject = others ? `${name} and ${others} ${others === 1 ? "other" : "others"}` : name;
  if (inTransit) {
    if (others) return `${subject} picked up`;
    return `${subject} ${includesYou ? "were" : "was"} picked up`;
  }
  return `${subject} ${includesYou || others ? "are" : "is"} waiting for pickup`;
}

function buildRouteCard(
  routeLeg: JourneyPresentationInput["routeLegs"][number],
  input: JourneyPresentationInput,
): RouteCardViewModel {
  const usersById = new Map(input.users.map((user) => [user.id, user]));
  const locationsById = new Map(
    input.locations.map((location) => [location.id, location]),
  );
  const routingSnapshot = input.routingSnapshots.find(
    (snapshot) => snapshot.routeLegId === routeLeg.id,
  );
  const activeDriver = input.shuttle.activeDriverId
    ? usersById.get(input.shuttle.activeDriverId)
    : undefined;
  const statusPresentation = getStatusPresentation(routeLeg.status);
  const waitlistAvatars = routeLeg.waitlist.flatMap((entry, index) => {
    const user = usersById.get(entry.userId);

    return user
      ? [
          {
            userId: user.id,
            displayName: user.displayName,
            initials: user.initials,
            tone: WAITLIST_TONES[index % WAITLIST_TONES.length],
          },
        ]
      : [];
  });

  return {
    id: routeLeg.id,
    departureName:
      locationsById.get(routeLeg.departureLocationId)?.name ??
      "Location unavailable",
    arrivalName:
      locationsById.get(routeLeg.arrivalLocationId)?.name ??
      "Location unavailable",
    driver: activeDriver
      ? {
          displayName: activeDriver.firstName,
          initials: activeDriver.initials,
        }
      : null,
    driverLabel: activeDriver ? "Driver" : "Driver unavailable",
    statusLabel: statusPresentation.label,
    tone: statusPresentation.tone,
    departureTime: timeFormatter.format(routeLeg.scheduledDepartureAt),
    arrivalTime: timeFormatter.format(routeLeg.scheduledArrivalAt),
    timingMessage: getTimingMessage(routeLeg.status, routingSnapshot),
    progressPercent: getProgressPercent(routingSnapshot),
    waitlistAvatars,
    waitlistCopy: getWaitlistCopy(routeLeg, input.users, input.currentRiderId),
    pickupEligible: routeLeg.status !== "IN_TRANSIT",
    currentRiderWaiting: routeLeg.waitlist.some(entry => entry.userId === input.currentRiderId),
  };
}

export function buildJourneyOverviewViewModel(
  input: JourneyOverviewInput,
): JourneyOverviewViewModel {
  return buildJourneyPresentation({
    ...input,
    users: input.users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      displayName: `${user.firstName} ${user.lastName}`.trim(),
      initials: `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase(),
      profileImageUrl: user.profileImageUrl,
    })),
  });
}

export function buildJourneyPresentation(
  input: JourneyPresentationInput,
): JourneyOverviewViewModel {
  const currentRider = input.users.find(({ id }) => id === input.currentRiderId);
  const routeLegsById = new Map(
    input.routeLegs.map((routeLeg) => [routeLeg.id, routeLeg]),
  );

  return {
    organization: {
      displayName: input.organization.details.displayName,
      logoUrl: input.organization.details.logoUrl,
      logoAltText: input.organization.details.logoAltText,
      fallbackInitials: input.organization.details.fallbackInitials,
    },
    currentRider: currentRider
      ? {
          firstName: currentRider.firstName,
          displayName: currentRider.displayName,
          initials: currentRider.initials,
          profileImageUrl: currentRider.profileImageUrl,
        }
      : {
          firstName: "Rider",
          displayName: "Rider",
          initials: "R",
          profileImageUrl: null,
        },
    journeyId: input.journey.id,
    journeyName: input.journey.name,
    routeCards: input.journey.routeLegIds.flatMap((routeLegId) => {
      const routeLeg = routeLegsById.get(routeLegId);

      return routeLeg ? [buildRouteCard(routeLeg, input)] : [];
    }),
  };
}
