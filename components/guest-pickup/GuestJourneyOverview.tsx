"use client";

import { useRef, useState } from "react";
import { CircleMinus, CirclePlus } from "lucide-react";
import { JourneyHeader } from "@/components/journey-overview/JourneyHeader";
import { RouteCard } from "@/components/journey-overview/RouteCard";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { guestIdentityToUser } from "@/lib/guest-identity";
import { applyGuestPickup, type GuestPickupSnapshot } from "@/lib/guest-pickup";
import { buildJourneyOverviewViewModel, type JourneyOverviewInput } from "@/lib/journey-overview";
import type { RouteLegId, UserId, WaitlistEntryId } from "@/types/domain";
import type { GuestDetails, StoredGuestIdentity } from "@/types/guest-identity";
import { GuestIdentityForm } from "./GuestIdentityForm";
import { useGuestIdentity } from "./useGuestIdentity";

interface GuestJourneyOverviewProps {
  input: Omit<JourneyOverviewInput, "currentRiderId">;
}

export function GuestJourneyOverview({ input }: GuestJourneyOverviewProps) {
  const { state, retry, save } = useGuestIdentity();
  const [snapshot, setSnapshot] = useState<GuestPickupSnapshot>({ users: input.users, routeLegs: input.routeLegs });
  const snapshotRef = useRef(snapshot);
  const [actionError, setActionError] = useState<{ routeId: RouteLegId; message: string } | null>(null);
  const [selected, setSelected] = useState<RouteLegId | null>(null);
  const selectedRef = useRef<RouteLegId | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const pendingIdentity = useRef<StoredGuestIdentity | null>(null);
  const pendingActions = useRef(new Set<RouteLegId>());
  const guest = state.status === "ready" ? guestIdentityToUser(state.identity) : null;
  const model = buildJourneyOverviewViewModel({
    ...input, ...snapshot,
    users: guest && !snapshot.users.some(user => user.id === guest.id) ? [...snapshot.users, guest] : snapshot.users,
    currentRiderId: guest?.id ?? null,
  });

  function closeForm() {
    selectedRef.current = null;
    setSelected(null);
    pendingIdentity.current = null;
  }

  function submitDetails(details: GuestDetails, requestedAt: number): string | null {
    const routeLegId = selectedRef.current;
    if (!routeLegId) return "Select a route before requesting pickup.";
    try {
      const identity: StoredGuestIdentity = {
        version: 1, userId: pendingIdentity.current?.userId ?? `guest_${crypto.randomUUID()}` as UserId,
        createdAt: pendingIdentity.current?.createdAt ?? requestedAt, ...details,
      };
      pendingIdentity.current = identity;
      const result = applyGuestPickup(snapshotRef.current, {
        organization: input.organization, journey: input.journey, routeLegId,
      }, { type: "join", guest: guestIdentityToUser(identity), entryId: `waitlist_${crypto.randomUUID()}` as WaitlistEntryId, requestedAt });
      if (!result.ok) return "Pickup is unavailable for this route. Your request was not added.";
      if (save(identity).status !== "ready") return "Your details could not be saved. Allow browser storage and retry. You have not joined the waitlist.";
      snapshotRef.current = result.snapshot;
      setSnapshot(result.snapshot);
      closeForm();
      return null;
    } catch {
      return "Your pickup request could not be created. Please try again.";
    }
  }

  function changePickup(routeLegId: RouteLegId, leave: boolean, requestedAt: number) {
    if (!guest || selectedRef.current || pendingActions.current.has(routeLegId)) return;
    pendingActions.current.add(routeLegId);
    setActionError(null);
    try {
      const result = applyGuestPickup(snapshotRef.current, {
        organization: input.organization, journey: input.journey, routeLegId,
      }, leave ? { type: "leave", guestId: guest.id } : {
        type: "join", guest, entryId: `waitlist_${crypto.randomUUID()}` as WaitlistEntryId, requestedAt,
      });
      if (!result.ok) {
        setActionError({ routeId: routeLegId, message: "Pickup could not be changed. The route may no longer accept requests." });
        return;
      }
      snapshotRef.current = result.snapshot;
      setSnapshot(result.snapshot);
    } catch {
      setActionError({ routeId: routeLegId, message: "Pickup could not be changed. Please try again." });
    } finally {
      queueMicrotask(() => pendingActions.current.delete(routeLegId));
    }
  }

  return (
    <>
      <JourneyHeader model={model} />
      <p className="mb-ui-5 text-ui-sm text-text-muted">Demo pickup requests reset when this page reloads.</p>
      {state.status === "storage-error" && !selected ? (
        <div className="mb-ui-5 rounded-md bg-surface-raised p-ui-4">
          <p role="alert" className="text-ui-sm">We could not access your saved guest details. Allow browser storage and try again.</p>
          <Button type="button" variant="secondary" className="mt-ui-3" onClick={retry}>Retry saved details</Button>
        </div>
      ) : null}
      {model.routeCards.map(route => {
        const joined = route.currentRiderWaiting;
        return (
          <RouteCard key={route.id} route={route} pickupAction={route.pickupEligible ? (
            <Button type="button" variant="ghost" size="icon-lg"
              className="size-11 shrink-0 rounded-full p-1 text-accent hover:bg-accent/10 hover:text-accent"
              aria-label={joined ? "Remove my pickup request" : "Join the waitlist"}
              disabled={state.status === "loading" || state.status === "storage-error" || Boolean(selected)}
              onClick={event => {
                if (selectedRef.current) return;
                if (guest) {
                  changePickup(route.id, joined, Date.now());
                  return;
                }
                if (state.status !== "anonymous") return;
                trigger.current = event.currentTarget;
                selectedRef.current = route.id;
                setSelected(route.id);
              }}>
              {joined ? <CircleMinus className="size-8!" aria-hidden="true" /> : <CirclePlus className="size-8!" aria-hidden="true" />}
            </Button>
          ) : <span className="basis-full text-center text-ui-sm text-text-muted">Pickup closed</span>}>
            {actionError?.routeId === route.id ? <p role="alert" className="pb-ui-4 text-ui-sm">{actionError.message}</p> : null}
          </RouteCard>
        );
      })}
      <Modal open={selected !== null} onOpenChange={open => { if (!open) closeForm(); }}
        title="Your pickup details" returnFocus={trigger}
        description="Enter your details to join this route's waitlist.">
        <GuestIdentityForm onSubmit={submitDetails} onCancel={closeForm} />
      </Modal>
    </>
  );
}
