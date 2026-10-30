"use client";

import { useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { LiveJourneyOverview } from "./LiveJourneyOverview";

interface LiveJourneyProviderProps {
  convexUrl: string;
  organizationSlug: string;
}

export function LiveJourneyProvider({ convexUrl, organizationSlug }: LiveJourneyProviderProps) {
  // Public pages must not log raw development query errors or record contents.
  const [client] = useState(() => new ConvexReactClient(convexUrl, { logger: false }));
  return (
    <ConvexProvider client={client}>
      <LiveJourneyOverview organizationSlug={organizationSlug} />
    </ConvexProvider>
  );
}
