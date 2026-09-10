interface RouteDetailPreviewEnvironment {
  NODE_ENV?: string;
  ROUTE_DETAIL_PREVIEW_ENABLED?: string;
}

export function isRouteDetailPreviewEnabled(
  environment: RouteDetailPreviewEnvironment = process.env,
): boolean {
  const override = environment.ROUTE_DETAIL_PREVIEW_ENABLED;

  if (override !== undefined) {
    return override === "true";
  }

  return environment.NODE_ENV === "development";
}
