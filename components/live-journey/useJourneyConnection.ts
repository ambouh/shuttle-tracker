"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useConvex } from "convex/react";
import { getJourneyConnection, type JourneyConnection } from "@/lib/journey-read-state";

const getServerSnapshot = (): JourneyConnection => "connecting";

export function useJourneyConnection(): JourneyConnection {
  const client = useConvex();
  const subscribe = useCallback((onChange: () => void) => {
    const unsubscribe = client.subscribeToConnectionState(onChange);
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    return () => {
      unsubscribe();
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
    };
  }, [client]);
  const getSnapshot = useCallback(() => getJourneyConnection({
    ...client.connectionState(), online: navigator.onLine,
  }), [client]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
