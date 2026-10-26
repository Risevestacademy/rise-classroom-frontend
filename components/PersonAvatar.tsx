import { Avatar } from "@base-ui/react/avatar";

import { cn } from "@/lib/utils";

/**
 * The design system's Avatar sizes, plus the 36, 44 and 60px ones the
 * screens use. Each size has its own initials style; the in-between sizes
 * take the style of the step below them.
 */
const sizes = {
  80: "size-[80px] text-2xl/8 tracking-[-0.36px]",
  72: "size-[72px] text-2xl/8 tracking-[-0.36px]",
  64: "size-[64px] text-2xl/8 tracking-[-0.36px]",
  60: "size-[60px] text-lg/6 tracking-[-0.27px]",
  56: "size-[56px] text-lg/6 tracking-[-0.27px]",
  48: "size-[48px] text-lg/6 tracking-[-0.27px]",
  44: "size-[44px] text-lg/6 tracking-[-0.27px]",
  40: "size-[40px] text-base/6 tracking-[-0.176px]",
  36: "size-[36px] text-sm/5 tracking-[-0.084px]",
  32: "size-[32px] text-sm/5 tracking-[-0.084px]",
  24: "size-[24px] text-xs/4",
  20: "size-[20px] text-[11px]/3 tracking-[0.22px]",
} as const;

export type PersonAvatarSize = keyof typeof sizes;

const colors = [
  "bg-avatar-grey-surface text-avatar-grey-text",
  "bg-avatar-yellow-surface text-avatar-yellow-text",
  "bg-avatar-blue-surface text-avatar-blue-text",
  "bg-avatar-teal-surface text-avatar-teal-text",
  "bg-avatar-purple-surface text-avatar-purple-text",
  "bg-avatar-red-surface text-avatar-red-text",
];

/** The same key always gets the same colour. */
function colorFor(key: string) {
  let total = 0;
  for (const char of key) total += char.charCodeAt(0);
  return colors[total % colors.length];
}

/** Two initials, or just the first from 32px down, as in the design. */
function initialsFor(name: string, size: PersonAvatarSize) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials.slice(0, size <= 32 ? 1 : 2);
}

/**
 * A person's photo, or their initials on a colour picked from `colorKey`
 * (an id where there is one, so renaming someone keeps their colour).
 */
export function PersonAvatar({
  name,
  src,
  size,
  colorKey,
  className,
}: {
  name: string;
  src?: string | null;
  size: PersonAvatarSize;
  colorKey?: string;
  className?: string;
}) {
  return (
    <Avatar.Root
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-work font-medium select-none",
        sizes[size],
        colorFor(colorKey ?? name),
        className,
      )}
    >
      {src && (
        <Avatar.Image src={src} alt="" className="size-full object-cover" />
      )}
      <Avatar.Fallback>{initialsFor(name, size)}</Avatar.Fallback>
    </Avatar.Root>
  );
}
