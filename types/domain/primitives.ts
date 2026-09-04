declare const entityIdBrand: unique symbol;

export type EntityId<TEntity extends string> = string & {
  readonly [entityIdBrand]: TEntity;
};

export type UserId = EntityId<"User">;
export type OrganizationId = EntityId<"Organization">;
export type JourneyId = EntityId<"Journey">;
export type RouteLegId = EntityId<"RouteLeg">;
export type LocationId = EntityId<"Location">;
export type WaitlistEntryId = EntityId<"WaitlistEntry">;
export type RouteLegCommentId = EntityId<"RouteLegComment">;
export type ShuttleId = EntityId<"Shuttle">;
export type LocationUpdateId = EntityId<"LocationUpdate">;
export type TrackingProviderConfigurationId =
  EntityId<"TrackingProviderConfiguration">;

export type Timestamp = number;
export type DistanceMeters = number;
export type DurationSeconds = number;
export type ProgressRatio = number;

export interface Coordinates {
  latitude: number;
  longitude: number;
}
