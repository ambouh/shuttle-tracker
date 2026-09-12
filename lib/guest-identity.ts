import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { z } from "zod";

import type { User, UserId } from "@/types/domain";
import type {
  GuestDetailsResult,
  StoredGuestIdentity,
} from "@/types/guest-identity";

export const GUEST_IDENTITY_STORAGE_KEY = "union-shuttle.guest-identity.v1";
const GUEST_ID_PATTERN = /^guest_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTROL_CHARACTERS = /\p{Cc}/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string" || CONTROL_CHARACTERS.test(value)) return null;
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  const isTenDigitInput = digits.length === 10;
  const isStoredUsNumber = trimmed.startsWith("+1") && digits.length === 11;
  if (!isTenDigitInput && !isStoredUsNumber) return null;
  const phone = parsePhoneNumberFromString(value.trim(), {
    defaultCountry: "US",
    extract: false,
  });
  return phone?.isValid() && !phone.ext ? phone.number : null;
}

export function formatGuestPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const nameSchema = (label: "first" | "last") =>
  z
    .string({ error: `Enter a ${label} name.` })
    .refine((value) => !CONTROL_CHARACTERS.test(value), {
      message: `Enter a ${label} name without control characters.`,
    })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0 && [...value].length <= 80, {
      message: `Enter a ${label} name of 1 to 80 characters.`,
    });

const phoneSchema = z
  .string({ error: "Enter a phone number." })
  .transform((value) => normalizePhone(value))
  .refine((value): value is string => value !== null, {
    message: "Enter a valid 10-digit US phone number.",
  });

export const guestDetailsSchema = z.object({
  firstName: nameSchema("first"),
  lastName: nameSchema("last"),
  phoneNumber: phoneSchema,
});

export function validateGuestDetails(input: unknown): GuestDetailsResult {
  const result = guestDetailsSchema.safeParse(input);
  if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors;
    return {
      ok: false,
      errors: {
        ...(errors.firstName?.[0] && { firstName: errors.firstName[0] }),
        ...(errors.lastName?.[0] && { lastName: errors.lastName[0] }),
        ...(errors.phoneNumber?.[0] && { phoneNumber: errors.phoneNumber[0] }),
      },
    };
  }
  return { ok: true, value: result.data };
}

export function parseGuestIdentity(input: unknown): StoredGuestIdentity | null {
  let value: unknown = input;
  if (typeof input === "string") {
    try {
      value = JSON.parse(input);
    } catch {
      return null;
    }
  }
  if (!isRecord(value) || value.version !== 1 ||
    typeof value.userId !== "string" || !GUEST_ID_PATTERN.test(value.userId) ||
    typeof value.createdAt !== "number" || !Number.isSafeInteger(value.createdAt) ||
    value.createdAt < 0) return null;
  const details = validateGuestDetails(value);
  if (!details.ok) return null;
  return {
    version: 1,
    userId: value.userId as UserId,
    createdAt: value.createdAt,
    ...details.value,
  };
}

export function guestIdentityToUser(identity: StoredGuestIdentity): User {
  return {
    id: identity.userId,
    firstName: identity.firstName,
    lastName: identity.lastName,
    phoneNumber: identity.phoneNumber,
    role: "guest",
    organizationId: null,
    profileImageUrl: null,
    createdAt: identity.createdAt,
    updatedAt: identity.createdAt,
  };
}
