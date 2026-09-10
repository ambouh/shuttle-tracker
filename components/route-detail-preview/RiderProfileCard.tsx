import { Card } from "@/components/ui/card";

interface RiderProfileCardProps {
  displayName: string;
  initials: string;
  profileImageUrl: string | null;
  subtitle: string;
}

export function RiderProfileCard({
  displayName,
  initials,
  profileImageUrl,
  subtitle,
}: RiderProfileCardProps) {
  return (
    <Card className="relative z-10 flex-row items-center gap-ui-4 rounded-md border-0 bg-surface-raised px-ui-5 py-ui-4 shadow-card ring-0">
      <span
        className="grid size-avatar-sm shrink-0 place-items-center overflow-hidden rounded-full bg-surface-soft text-ui-sm font-bold text-accent"
        aria-label={displayName}
        role="img"
      >
        {profileImageUrl ? (
          // User-managed image hosts cannot be statically allowlisted.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="size-full object-cover"
            src={profileImageUrl}
            alt={displayName}
          />
        ) : (
          initials
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate text-ui-lg font-medium">{displayName}</p>
        <p className="truncate text-ui-sm text-text-muted">{subtitle}</p>
      </div>
    </Card>
  );
}
