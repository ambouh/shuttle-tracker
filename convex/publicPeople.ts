import type { UserId } from "../types/domain";
import type { PublicPerson } from "../types/live-journey";
import type { Doc } from "./_generated/dataModel";

export function projectPublicPerson(user: Doc<"users">): PublicPerson {
  return {
    id: user._id as string as UserId,
    firstName: user.firstName.trim(),
    lastInitial: Array.from(user.lastName.trim())[0]?.toUpperCase() ?? "",
    profileImageUrl: user.profileImageUrl,
  };
}
