import type { UserId } from "./primitives";

export type UserType = "guest" | "rider" | "driver" | "admin";

export interface User {
  id: UserId;
  firstName: string;
  lastName: string;
  userType: UserType;
}

export interface GuestUser extends User {
  userType: "guest";
  name: string;
  phoneNumber: string | null;
}
