import type { Location, Shuttle, User } from "@/types/domain";

import { FIXTURE_IDS } from "./ids";
import { REFERENCE_TIMESTAMPS } from "./reference-time";

export const UNION_CHURCH = {
  id: FIXTURE_IDS.locations.unionChurch,
  organizationId: FIXTURE_IDS.organization,
  name: "Union Church",
  address: "7195 Oakland Mills Rd, Columbia, MD 21046",
  latitude: 39.1731151,
  longitude: -76.8256621,
} satisfies Location;

export const GUILFORD_ELEMENTARY = {
  id: FIXTURE_IDS.locations.guilfordElementary,
  organizationId: FIXTURE_IDS.organization,
  name: "Guilford Elementary School",
  address: "7335 Oakland Mills Rd, Columbia, MD 21046",
  latitude: 39.169404,
  longitude: -76.829793,
} satisfies Location;

export const JOHN_SMITH = {
  id: FIXTURE_IDS.users.johnSmith,
  organizationId: FIXTURE_IDS.organization,
  firstName: "John",
  lastName: "Smith",
  phoneNumber: null,
  profileImageUrl: null,
  role: "driver",
  createdAt: REFERENCE_TIMESTAMPS.createdAt,
  updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
} satisfies User;

export const JOSH_WILLIAMS = {
  id: FIXTURE_IDS.users.joshWilliams,
  organizationId: null,
  firstName: "Josh",
  lastName: "Williams",
  phoneNumber: "+1-410-555-0101",
  profileImageUrl: null,
  role: "guest",
  createdAt: REFERENCE_TIMESTAMPS.createdAt,
  updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
} satisfies User;

export const GUEST_RIDERS = [
  JOSH_WILLIAMS,
  {
    id: FIXTURE_IDS.users.faithAnderson,
    organizationId: null,
    firstName: "Faith",
    lastName: "Anderson",
    phoneNumber: "+1-410-555-0102",
    profileImageUrl: null,
    role: "guest",
    createdAt: REFERENCE_TIMESTAMPS.createdAt,
    updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
  },
  {
    id: FIXTURE_IDS.users.alexMorgan,
    organizationId: null,
    firstName: "Alex",
    lastName: "Morgan",
    phoneNumber: "+1-410-555-0103",
    profileImageUrl: null,
    role: "guest",
    createdAt: REFERENCE_TIMESTAMPS.createdAt,
    updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
  },
  {
    id: FIXTURE_IDS.users.samRivera,
    organizationId: null,
    firstName: "Sam",
    lastName: "Rivera",
    phoneNumber: "+1-410-555-0104",
    profileImageUrl: null,
    role: "guest",
    createdAt: REFERENCE_TIMESTAMPS.createdAt,
    updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
  },
  {
    id: FIXTURE_IDS.users.mayaChen,
    organizationId: null,
    firstName: "Maya",
    lastName: "Chen",
    phoneNumber: "+1-410-555-0105",
    profileImageUrl: null,
    role: "guest",
    createdAt: REFERENCE_TIMESTAMPS.createdAt,
    updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
  },
  {
    id: FIXTURE_IDS.users.taylorBrown,
    organizationId: null,
    firstName: "Taylor",
    lastName: "Brown",
    phoneNumber: "+1-410-555-0106",
    profileImageUrl: null,
    role: "guest",
    createdAt: REFERENCE_TIMESTAMPS.createdAt,
    updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
  },
  {
    id: FIXTURE_IDS.users.chrisDavis,
    organizationId: null,
    firstName: "Chris",
    lastName: "Davis",
    phoneNumber: "+1-410-555-0107",
    profileImageUrl: null,
    role: "guest",
    createdAt: REFERENCE_TIMESTAMPS.createdAt,
    updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
  },
] satisfies User[];

export const SUNDAY_SERVICE_USERS = [JOHN_SMITH, ...GUEST_RIDERS] satisfies User[];

export const UNION_SHUTTLE = {
  id: FIXTURE_IDS.shuttle,
  organizationId: FIXTURE_IDS.organization,
  activeDriverId: FIXTURE_IDS.users.johnSmith,
  name: "Union Shuttle 1",
  activeTrackingProvider: "AIRTAG",
  tracking: {
    status: "CURRENT",
    coordinates: {
      latitude: 39.171092,
      longitude: -76.827236,
    },
    accuracyMeters: 12,
    recordedAt: REFERENCE_TIMESTAMPS.currentLocationRecordedAt,
    receivedAt: REFERENCE_TIMESTAMPS.currentLocationReceivedAt,
  },
  createdAt: REFERENCE_TIMESTAMPS.createdAt,
  updatedAt: REFERENCE_TIMESTAMPS.updatedAt,
} satisfies Shuttle;

export const SUNDAY_SERVICE_LOCATIONS = [
  UNION_CHURCH,
  GUILFORD_ELEMENTARY,
] satisfies Location[];
