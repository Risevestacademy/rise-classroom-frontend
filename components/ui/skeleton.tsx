import { cn } from "@/lib/utils";

/** Grey placeholder block shown in place of content that is still loading. */
export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-neutral-200", className)}
      {...props}
    />
  );
}
