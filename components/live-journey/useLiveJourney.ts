"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueries, type RequestForQueries } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { getJourneyReadState } from "@/lib/journey-read-state";
import { useJourneyConnection } from "./useJourneyConnection";

export function useLiveJourney(organizationSlug: string) {
  const connection = useJourneyConnection();
  const [retrying, setRetrying] = useState(false);
  const queries = useMemo((): RequestForQueries => retrying ? {} : {
    overview: { query: api.journeys.getOverview, args: { organizationSlug } },
  }, [organizationSlug, retrying]);
  const result: FunctionReturnType<typeof api.journeys.getOverview> | Error | undefined = useQueries(queries).overview;

  useEffect(() => {
    if (!retrying) return;
    // Let the old query unsubscribe before starting a fresh subscription.
    const timer = setTimeout(() => setRetrying(false), 0);
    return () => clearTimeout(timer);
  }, [retrying]);

  return { state: getJourneyReadState(result, connection), retry: () => setRetrying(true) };
}
