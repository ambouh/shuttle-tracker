import type {
  RouteLegId,
  Timestamp,
  UserId,
  WaitlistEntryId,
} from "./primitives";

export interface WaitlistEntry {
  id: WaitlistEntryId;
  userId: UserId;
  routeLegId: RouteLegId;
  requestedAt: Timestamp;
}
