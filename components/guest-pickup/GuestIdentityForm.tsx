"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, type FormEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { formatGuestPhoneInput, guestDetailsSchema } from "@/lib/guest-identity";
import type { GuestDetails } from "@/types/guest-identity";

interface GuestIdentityFormProps {
  onSubmit: (details: GuestDetails, requestedAt: number) => string | null;
  onCancel: () => void;
}

const fields = [
  { name: "firstName", label: "First name", autoComplete: "given-name", type: "text" },
  { name: "lastName", label: "Last name", autoComplete: "family-name", type: "text" },
] as const;

export function GuestIdentityForm({ onSubmit, onCancel }: GuestIdentityFormProps) {
  const id = useId();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<GuestDetails>({
    resolver: zodResolver(guestDetailsSchema),
    defaultValues: { firstName: "", lastName: "", phoneNumber: "" },
    shouldFocusError: true,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    const requestedAt = Date.now();
    void handleSubmit((details) => {
      const failure = onSubmit(details, requestedAt);
      if (failure) setError("root.server", { message: failure });
    })(event);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-ui-4" aria-label="Pickup details">
      {fields.map(field => (
        <div key={field.name}>
          <label htmlFor={`${id}-${field.name}`} className="mb-ui-2 block text-ui-sm">{field.label}</label>
          <input
            id={`${id}-${field.name}`} type={field.type}
            autoComplete={field.autoComplete} required
            {...register(field.name)}
            aria-invalid={Boolean(errors[field.name])}
            aria-describedby={errors[field.name] ? `${id}-${field.name}-error` : undefined}
            className="min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-ui-3 text-ui-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors[field.name]?.message ? <p id={`${id}-${field.name}-error`} className="mt-ui-1 text-ui-sm" role="alert">{errors[field.name]?.message}</p> : null}
        </div>
      ))}
      <div>
        <label htmlFor={`${id}-phoneNumber`} className="mb-ui-2 block text-ui-sm">Phone number</label>
        <Controller
          name="phoneNumber"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id={`${id}-phoneNumber`}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="555-555-5555"
              maxLength={12}
              required
              onChange={(event) => field.onChange(formatGuestPhoneInput(event.target.value))}
              aria-invalid={Boolean(errors.phoneNumber)}
              aria-describedby={`${id}-phone-help${errors.phoneNumber ? ` ${id}-phoneNumber-error` : ""}`}
              className="min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-ui-3 text-ui-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
        />
        {errors.phoneNumber?.message ? <p id={`${id}-phoneNumber-error`} className="mt-ui-1 text-ui-sm" role="alert">{errors.phoneNumber.message}</p> : null}
      </div>
      <p id={`${id}-phone-help`} className="text-ui-sm text-text-muted">Enter a 10-digit US number. Dashes are added as you type.</p>
      {errors.root?.server?.message ? <p role="alert" className="text-ui-sm">{errors.root.server.message}</p> : null}
      <div className="flex flex-wrap gap-ui-3">
        <Button type="submit" size="lg">{errors.root?.server ? "Retry pickup request" : "Save and request pickup"}</Button>
        <Button type="button" variant="secondary" size="lg" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
