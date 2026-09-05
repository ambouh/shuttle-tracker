interface ProfileAvatarProps {
  displayName: string;
  profileImageUrl: string | null;
  initials: string;
}

export function ProfileAvatar({
  displayName,
  profileImageUrl,
  initials,
}: ProfileAvatarProps) {
  const className =
    "grid size-avatar-hero shrink-0 place-items-center overflow-hidden rounded-full bg-surface-soft text-ui-lg font-bold text-accent";

  if (profileImageUrl) {
    return (
      <span className={className}>
        {/* User-managed image hosts cannot be statically allowlisted. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="size-full object-cover"
          src={profileImageUrl}
          alt={displayName}
        />
      </span>
    );
  }

  return (
    <span className={className} aria-label={displayName} role="img">
      {initials}
    </span>
  );
}
