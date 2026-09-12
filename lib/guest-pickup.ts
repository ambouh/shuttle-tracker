import type {
  Journey, Organization, RouteLeg, RouteLegId, User, UserId, WaitlistEntryId,
} from "@/types/domain";
import { guestIdentityToUser, parseGuestIdentity } from "./guest-identity";

export interface GuestPickupSnapshot {
  users: readonly User[];
  routeLegs: readonly RouteLeg[];
}

export interface GuestPickupContext {
  organization: Organization;
  journey: Journey;
  routeLegId: RouteLegId;
}

export type GuestPickupAction =
  | { type: "join"; guest: User; entryId: WaitlistEntryId; requestedAt: number }
  | { type: "leave"; guestId: UserId };

export type GuestPickupResult =
  | { ok: true; snapshot: GuestPickupSnapshot }
  | { ok: false; error: "route-unavailable" | "pickup-closed" | "invalid-guest" | "invalid-request" };

function validatedGuest(user: User | undefined): User | null {
  if (!user || user.role !== "guest" || user.organizationId !== null) return null;
  const identity = parseGuestIdentity({ ...user, version: 1, userId: user.id });
  return identity ? guestIdentityToUser(identity) : null;
}

export function applyGuestPickup(
  snapshot: GuestPickupSnapshot,
  context: GuestPickupContext,
  action: GuestPickupAction,
): GuestPickupResult {
  const { organization, journey, routeLegId } = context;
  const leg = snapshot.routeLegs.find(({ id }) => id === routeLegId);
  if (!organization.active || !journey.active ||
    journey.organizationId !== organization.id || !journey.routeLegIds.includes(routeLegId) ||
    !leg || leg.journeyId !== journey.id) return { ok: false, error: "route-unavailable" };
  if (leg.status !== "NOT_STARTED" && leg.status !== "DEPARTING") {
    return { ok: false, error: "pickup-closed" };
  }
  const guestId = action.type === "join" ? action.guest.id : action.guestId;
  const existing = snapshot.users.find(({ id }) => id === guestId);
  const guest = validatedGuest(action.type === "join" ? action.guest : existing);
  if (!guest || (existing && !validatedGuest(existing))) return { ok: false, error: "invalid-guest" };
  const member = leg.waitlist.some(entry => entry.userId === guestId);
  if ((action.type === "join" && member) || (action.type === "leave" && !member)) {
    return { ok: true, snapshot };
  }
  if (action.type === "join" && (
    !action.entryId.trim() || !Number.isSafeInteger(action.requestedAt) || action.requestedAt < 0 ||
    snapshot.routeLegs.some(route => route.waitlist.some(entry => entry.id === action.entryId))
  )) return { ok: false, error: "invalid-request" };
  const waitlist = action.type === "join"
    ? [...leg.waitlist, { id: action.entryId, userId: guestId, routeLegId, requestedAt: action.requestedAt }]
    : leg.waitlist.filter(entry => entry.userId !== guestId);
  return {
    ok: true,
    snapshot: {
      users: action.type === "join" && !existing ? [...snapshot.users, guest] : snapshot.users,
      routeLegs: snapshot.routeLegs.map(route => route.id === routeLegId ? { ...route, waitlist } : route),
    },
  };
}
