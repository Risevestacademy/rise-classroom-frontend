import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Wraps a phrase in a hand-drawn loop that the landing motion draws in.
 * Colour the stroke with a text colour class via `strokeClassName`.
 */
export function HandDrawn({
  children,
  strokeClassName,
}: {
  children: ReactNode;
  strokeClassName?: string;
}) {
  return (
    <span data-hand-drawn className="relative inline-block">
      {children}
      <svg
        data-stroke
        aria-hidden
        viewBox="0 0 300 100"
        preserveAspectRatio="none"
        fill="none"
        className={cn(
          "pointer-events-none absolute -top-[0.14em] -left-[0.2em] h-[calc(100%+0.28em)] w-[calc(100%+0.4em)] overflow-visible",
          strokeClassName
        )}
      >
        <path
          d="M150 6C60 4 6 24 8 52C10 82 78 96 160 94C240 92 294 76 292 48C290 20 230 6 120 10"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
