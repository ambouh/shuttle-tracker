import { cn } from "@/lib/utils";

interface AvatarStackPerson {
  id: string;
  displayName: string;
  initials: string;
  tone: string;
}

interface AvatarStackProps {
  people: readonly AvatarStackPerson[];
  label: string;
  size?: "default" | "compact";
}

const TONE_CLASSES: Record<string, string> = {
  green: "bg-accent",
  blue: "bg-avatar-blue",
  lilac: "bg-avatar-lilac",
  peach: "bg-avatar-peach",
  mint: "bg-avatar-mint",
  gold: "bg-avatar-gold",
};

export function AvatarStack({
  people,
  label,
  size = "default",
}: AvatarStackProps) {
  return (
    <ul className="flex shrink-0 pl-ui-2" aria-label={label}>
      {people.slice(0, 3).map((person) => (
        <li
          key={person.id}
          className={cn(
            "-ml-ui-2 grid place-items-center rounded-full border-2 border-surface-raised font-bold text-canvas",
            size === "compact"
              ? "size-9 text-ui-xs"
              : "size-avatar-sm text-ui-sm",
            TONE_CLASSES[person.tone] ?? "bg-avatar-mint",
          )}
          title={person.displayName}
        >
          <span aria-hidden="true">{person.initials}</span>
          <span className="sr-only">{person.displayName}</span>
        </li>
      ))}
    </ul>
  );
}
