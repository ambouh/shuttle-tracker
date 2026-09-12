import { ChevronDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { JourneyOverviewViewModel } from "@/lib/journey-overview";

import { OrganizationAvatar } from "./OrganizationAvatar";
import { ProfileAvatar } from "./ProfileAvatar";

interface JourneyHeaderProps {
  model: JourneyOverviewViewModel;
}

export function JourneyHeader({ model }: JourneyHeaderProps) {
  const { organization } = model;

  return (
    <>
      <header className="mb-ui-6 flex items-center gap-ui-4">
        <div className="flex items-center gap-ui-3">
          <OrganizationAvatar {...organization} />
          <span className="text-ui-sm font-bold tracking-wide-ui uppercase">
            Shuttle Tracker
          </span>
        </div>
      </header>

      <Card className="mb-ui-5 gap-0 rounded-lg border-0 bg-surface-raised px-ui-7 py-ui-10 shadow-card ring-0 max-[36rem]:px-ui-5 max-[36rem]:py-ui-8">
        <ProfileAvatar {...model.currentRider} />
        <h1 className="mt-ui-6 text-ui-2xl leading-tight-ui font-regular tracking-[-0.04em]">
          Welcome, {model.currentRider.firstName}
        </h1>
        <p className="mt-ui-3 text-ui-lg text-text-muted">
          Where are you going?
        </p>
      </Card>

      <section
        className="mb-ui-5 flex items-center justify-between gap-ui-4"
        aria-labelledby="journey-heading"
      >
        <h2
          id="journey-heading"
          className="text-ui-xl leading-tight-ui font-regular tracking-[-0.04em]"
        >
          Your Journey
        </h2>
        <div className="relative shrink-0">
          <select
            className="h-control min-w-[10rem] appearance-none rounded-pill border border-border bg-transparent py-0 pr-8 pl-ui-3 text-ui-sm outline-none focus-visible:ring-2 focus-visible:ring-ring min-[36rem]:pr-10 min-[36rem]:pl-ui-6 min-[36rem]:text-ui-base"
            aria-label="Journey"
            defaultValue={model.journeyId}
          >
            <option value={model.journeyId}>{model.journeyName}</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-ui-4 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
        </div>
      </section>
    </>
  );
}
