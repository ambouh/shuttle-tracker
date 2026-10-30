import { ConvexError, v } from "convex/values";

import type { PublicJourneyResult } from "../types/live-journey";
import { query } from "./_generated/server";
import { readJourneyGraph } from "./journeyRead";
import { projectPublicJourney } from "./publicJourney";
import { publicJourneyResultValidator } from "./publicJourneyValidators";

export const getOverview = query({
  args: { organizationSlug: v.string(), journeyId: v.optional(v.string()) },
  returns: publicJourneyResultValidator,
  handler: async ({ db }, selection): Promise<PublicJourneyResult> => {
    try {
      const result = await readJourneyGraph(db, selection);
      if (result.status !== "ready") return result;
      return { status: "ready", snapshot: projectPublicJourney(result.graph) };
    } catch {
      // Development errors can include record contents; expose only a fixed failure code.
      throw new ConvexError({ code: "JOURNEY_READ_FAILED" });
    }
  },
});
