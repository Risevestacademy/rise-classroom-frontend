import { cn } from "@/lib/utils";

const avatarColors = [
  "bg-surface-warning-badge text-text-warning",
  "bg-surface-info-badge text-text-info",
  "bg-surface-success-badge text-text-success",
  "bg-surface-brand text-brand-primary",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarColor(name: string) {
  let charCodeTotal = 0;
  for (const char of name) {
    charCodeTotal += char.charCodeAt(0);
  }
  return avatarColors[charCodeTotal % avatarColors.length];
}

export function InitialsAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        getAvatarColor(name),
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
