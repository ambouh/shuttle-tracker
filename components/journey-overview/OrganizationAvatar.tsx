import { cn } from "@/lib/utils";

interface OrganizationAvatarProps {
  displayName: string;
  logoUrl: string | null;
  logoAltText: string | null;
  fallbackInitials: string;
}

export function OrganizationAvatar({
  displayName,
  logoUrl,
  logoAltText,
  fallbackInitials,
}: OrganizationAvatarProps) {
  const className = cn(
    "grid size-control shrink-0 place-items-center overflow-hidden rounded-full",
    "border-[0.45rem] border-white bg-canvas text-ui-xl leading-none font-bold text-white",
  );

  if (logoUrl) {
    return (
      <span className={className}>
        {/* Tenant-managed image hosts cannot be statically allowlisted. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="size-full object-cover"
          src={logoUrl}
          alt={logoAltText ?? displayName}
        />
      </span>
    );
  }

  return (
    <span className={className} aria-label={displayName} role="img">
      {fallbackInitials}
    </span>
  );
}
