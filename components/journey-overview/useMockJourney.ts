"use client";

import { useRef, useState } from "react";
import { applyMockJourneyAction, createMockJourneyState } from "@/lib/mock-journey";
import type { MockJourneyAction, MockJourneyContext, MockJourneyState } from "@/types/mock-journey";

export function useMockJourney(initial: MockJourneyState, context: MockJourneyContext) {
  const [snapshot, setSnapshot] = useState(() => createMockJourneyState(initial));
  const snapshotRef = useRef(snapshot);

  function commit(next: MockJourneyState) {
    snapshotRef.current = next;
    setSnapshot(next);
  }

  function dispatch(action: MockJourneyAction) {
    const result = applyMockJourneyAction(snapshotRef.current, context, action);
    if (result.ok) commit(result.state);
    return result;
  }

  return { snapshot, snapshotRef, commit, dispatch };
}
