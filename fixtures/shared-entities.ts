import type { GuestUser, Location, Shuttle, User } from "@/types/domain";

import { FIXTURE_IDS } from "./ids";
import { REFERENCE_TIMESTAMPS } from "./reference-time";

export const UNION_CHURCH = {
  id: FIXTURE_IDS.locations.unionChurch,
  name: "Union Church",
  address: "7195 Oakland Mills Rd, Columbia, MD 21046",
  latitude: 39.1731151,
  longitude: -76.8256621,
} satisfies Location;

export const GUILFORD_ELEMENTARY = {
  id: FIXTURE_IDS.locations.guilfordElementary,
  name: "Guilford Elementary School",
  address: "7335 Oakland Mills Rd, Columbia, MD 21046",
  latitude: 39.169404,
  longitude: -76.829793,
} satisfies Location;

export const JOHN_SMITH = {
  id: FIXTURE_IDS.users.johnSmith,
  firstName: "John",
  lastName: "Smith",
  userType: "driver",
} satisfies User;

export const JOSH_WILLIAMS = {
  id: FIXTURE_IDS.users.joshWilliams,
  firstName: "Josh",
  lastName: "Williams",
  userType: "guest",
  name: "Josh Williams",
  phoneNumber: null,
} satisfies GuestUser;

export const GUEST_RIDERS = [
  JOSH_WILLIAMS,
  {
    id: FIXTURE_IDS.users.faithAnderson,
    firstName: "Faith",
    lastName: "Anderson",
    userType: "guest",
    name: "Faith Anderson",
    phoneNumber: null,
  },
  {
    id: FIXTURE_IDS.users.alexMorgan,
    firstName: "Alex",
    lastName: "Morgan",
    userType: "guest",
    name: "Alex Morgan",
    phoneNumber: null,
  },
  {
    id: FIXTURE_IDS.users.samRivera,
    firstName: "Sam",
    lastName: "Rivera",
    userType: "guest",
    name: "Sam Rivera",
    phoneNumber: null,
  },
  {
    id: FIXTURE_IDS.users.mayaChen,
    firstName: "Maya",
    lastName: "Chen",
    userType: "guest",
    name: "Maya Chen",
    phoneNumber: null,
  },
  {
    id: FIXTURE_IDS.users.taylorBrown,
    firstName: "Taylor",
    lastName: "Brown",
    userType: "guest",
    name: "Taylor Brown",
    phoneNumber: null,
  },
  {
    id: FIXTURE_IDS.users.chrisDavis,
    firstName: "Chris",
    lastName: "Davis",
    userType: "guest",
    name: "Chris Davis",
    phoneNumber: null,
  },
] satisfies GuestUser[];

export const SUNDAY_SERVICE_USERS = [JOHN_SMITH, ...GUEST_RIDERS] satisfies User[];

export const UNION_SHUTTLE = {
  id: FIXTURE_IDS.shuttle,
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
