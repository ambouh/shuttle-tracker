import type { Timestamp } from "@/types/domain";

export const REFERENCE_TIMESTAMPS = {
  createdAt: 1_788_698_700_000 as Timestamp,
  outboundRequests: [
    1_788_698_880_000,
    1_788_698_940_000,
    1_788_699_000_000,
  ] as const satisfies readonly Timestamp[],
  returnRequests: [
    1_788_699_060_000,
    1_788_699_120_000,
    1_788_699_180_000,
  ] as const satisfies readonly Timestamp[],
  outboundComments: [
    1_788_699_240_000,
    1_788_699_300_000,
  ] as const satisfies readonly Timestamp[],
  serviceStartsAt: 1_788_699_600_000 as Timestamp,
  outboundScheduledArrivalAt: 1_788_702_300_000 as Timestamp,
  returnScheduledDepartureAt: 1_788_704_100_000 as Timestamp,
  returnScheduledArrivalAt: 1_788_706_800_000 as Timestamp,
  currentLocationRecordedAt: 1_788_699_600_000 as Timestamp,
  currentLocationReceivedAt: 1_788_699_605_000 as Timestamp,
  updatedAt: 1_788_700_500_000 as Timestamp,
  outboundEstimatedArrivalAt: 1_788_700_500_000 as Timestamp,
  returnEstimatedArrivalAt: 1_788_704_100_000 as Timestamp,
} as const;
