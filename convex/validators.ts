import { v } from "convex/values";

export const timestampFields = {
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const coordinatesValidator = v.object({
  latitude: v.number(),
  longitude: v.number(),
});

export const trackingSnapshotValidator = v.object({
  status: v.union(
    v.literal("UNAVAILABLE"),
    v.literal("CURRENT"),
    v.literal("STALE"),
  ),
  coordinates: v.union(coordinatesValidator, v.null()),
  accuracyMeters: v.union(v.number(), v.null()),
  recordedAt: v.union(v.number(), v.null()),
  receivedAt: v.union(v.number(), v.null()),
});
