import type {
  JourneyId,
  LocationId,
  LocationUpdateId,
  RouteLegCommentId,
  RouteLegId,
  ShuttleId,
  UserId,
  WaitlistEntryId,
} from "@/types/domain";

export const FIXTURE_IDS = {
  journey: "journey-sunday-service" as JourneyId,
  locations: {
    unionChurch: "location-union-church" as LocationId,
    guilfordElementary: "location-guilford-elementary" as LocationId,
  },
  routeLegs: {
    outbound: "route-leg-sunday-outbound" as RouteLegId,
    return: "route-leg-sunday-return" as RouteLegId,
  },
  users: {
    joshWilliams: "user-josh-williams" as UserId,
    johnSmith: "user-john-smith" as UserId,
    faithAnderson: "user-faith-anderson" as UserId,
    alexMorgan: "user-alex-morgan" as UserId,
    samRivera: "user-sam-rivera" as UserId,
    mayaChen: "user-maya-chen" as UserId,
    taylorBrown: "user-taylor-brown" as UserId,
    chrisDavis: "user-chris-davis" as UserId,
  },
  shuttle: "shuttle-union-one" as ShuttleId,
  locationUpdates: {
    outboundCurrent: "location-update-outbound-current" as LocationUpdateId,
    returnCurrent: "location-update-return-current" as LocationUpdateId,
  },
  waitlistEntries: {
    outboundFaith: "waitlist-outbound-faith" as WaitlistEntryId,
    outboundAlex: "waitlist-outbound-alex" as WaitlistEntryId,
    outboundSam: "waitlist-outbound-sam" as WaitlistEntryId,
    returnMaya: "waitlist-return-maya" as WaitlistEntryId,
    returnTaylor: "waitlist-return-taylor" as WaitlistEntryId,
    returnChris: "waitlist-return-chris" as WaitlistEntryId,
  },
  comments: {
    outboundJosh: "comment-outbound-josh" as RouteLegCommentId,
    outboundJohn: "comment-outbound-john" as RouteLegCommentId,
  },
} as const;
