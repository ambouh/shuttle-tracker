import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { RouteDetailPreviewHero } from "@/components/route-detail-preview/RouteDetailPreviewHero";
import { RouteDetailSheet } from "@/components/route-detail-preview/RouteDetailSheet";
import {
  JOSH_WILLIAMS,
  ROUTE_DETAIL_PREVIEW_SCENARIO,
  SUNDAY_SERVICE_FIXTURE,
  UNION_ORGANIZATION,
} from "@/fixtures";
import { buildRouteDetailPreviewViewModel } from "@/lib/route-detail-preview";
import { isRouteDetailPreviewEnabled } from "@/lib/route-detail-preview-flag";

export const metadata: Metadata = {
  title: "Route Detail Preview | Shuttle Tracker",
  description: "Preview the current Sunday Service shuttle route.",
};

export default async function RouteDetailPreviewPage({
  params,
}: PageProps<"/routes/[routeLegId]">) {
  await connection();

  if (!isRouteDetailPreviewEnabled()) {
    notFound();
  }

  const { routeLegId } = await params;
  const model = buildRouteDetailPreviewViewModel({
    organization: UNION_ORGANIZATION,
    journey: SUNDAY_SERVICE_FIXTURE.journey,
    routeLegs: SUNDAY_SERVICE_FIXTURE.routeLegs,
    locations: SUNDAY_SERVICE_FIXTURE.locations,
    users: SUNDAY_SERVICE_FIXTURE.users,
    shuttle: SUNDAY_SERVICE_FIXTURE.shuttle,
    currentRiderId: JOSH_WILLIAMS.id,
    scenario: ROUTE_DETAIL_PREVIEW_SCENARIO,
  });

  if (!model || model.routeLegId !== routeLegId) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-screen overflow-hidden bg-canvas">
      <h1 className="sr-only">
        {model.route.departureName} to {model.route.arrivalName}
      </h1>
      <RouteDetailPreviewHero model={model} />
      <RouteDetailSheet model={model} />
    </main>
  );
}
