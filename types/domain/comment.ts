import type {
  RouteLegCommentId,
  RouteLegId,
  Timestamp,
  UserId,
} from "./primitives";

export interface RouteLegComment {
  id: RouteLegCommentId;
  routeLegId: RouteLegId;
  authorUserId: UserId;
  message: string;
  createdAt: Timestamp;
}
