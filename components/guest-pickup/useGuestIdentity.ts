"use client";

import { useEffect, useState } from "react";

import { readGuestIdentity, saveGuestIdentity, type GuestIdentityState } from "@/lib/guest-identity-storage";
import type { StoredGuestIdentity } from "@/types/guest-identity";

const getBrowserStorage = () => window.localStorage;

export function useGuestIdentity() {
  const [state, setState] = useState<GuestIdentityState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    // Restore after hydration, keeping the server and initial client output identical.
    queueMicrotask(() => {
      if (active) setState(readGuestIdentity(getBrowserStorage));
    });
    return () => { active = false; };
  }, []);

  function retry() {
    setState(readGuestIdentity(getBrowserStorage));
  }

  function save(identity: StoredGuestIdentity) {
    const result = saveGuestIdentity(getBrowserStorage, identity);
    setState(result);
    return result;
  }

  return { state, retry, save };
}
