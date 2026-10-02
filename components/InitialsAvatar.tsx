import { cn } from "@/lib/utils";

const avatarColors = [
  "bg-semantic-surface-warning-badge text-semantic-text-warning",
  "bg-semantic-surface-info-badge text-semantic-text-info",
  "bg-semantic-surface-success-badge text-semantic-text-success",
  "bg-primary-50 text-primary-500",
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
