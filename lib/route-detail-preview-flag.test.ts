import { describe, expect, it } from "vitest";

import { isRouteDetailPreviewEnabled } from "./route-detail-preview-flag";

describe("isRouteDetailPreviewEnabled", () => {
  it("enables the preview by default in development", () => {
    expect(isRouteDetailPreviewEnabled({ NODE_ENV: "development" })).toBe(true);
  });

  it("keeps the preview hidden by default in production and test", () => {
    expect(isRouteDetailPreviewEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isRouteDetailPreviewEnabled({ NODE_ENV: "test" })).toBe(false);
  });

  it("allows an explicit true override in production", () => {
    expect(
      isRouteDetailPreviewEnabled({
        NODE_ENV: "production",
        ROUTE_DETAIL_PREVIEW_ENABLED: "true",
      }),
    ).toBe(true);
  });

  it("allows an explicit false override in development", () => {
    expect(
      isRouteDetailPreviewEnabled({
        NODE_ENV: "development",
        ROUTE_DETAIL_PREVIEW_ENABLED: "false",
      }),
    ).toBe(false);
  });

  it("fails closed for unrecognized override values", () => {
    expect(
      isRouteDetailPreviewEnabled({
        NODE_ENV: "development",
        ROUTE_DETAIL_PREVIEW_ENABLED: "TRUE",
      }),
    ).toBe(false);
  });
});
