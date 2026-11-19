import { cn } from "@/lib/utils";

/** Three small rising steps, drawn in as their heading scrolls into view. */
export function RiseMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      data-rise-mark
      viewBox="0 0 64 24"
      fill="none"
      className={cn("h-6 w-14 text-brand-500", className)}
    >
      <path
        d="M2 22H18V14H34V7H50V2H62"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
