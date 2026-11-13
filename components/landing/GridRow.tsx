import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * One row of the landing page grid: a full-width hairline under it and the
 * centre column's side lines, with a dot where the lines meet.
 */
export function GridRow({
  className,
  innerClassName,
  children,
  ...props
}: ComponentProps<"div"> & { innerClassName?: string }) {
  return (
    <div className={cn("border-b border-border-default px-4 lg:px-0", className)} {...props}>
      <div
        className={cn(
          "relative mx-auto w-full max-w-[800px] lg:border-x lg:border-border-default",
          innerClassName,
        )}
      >
        {children}
        <span
          aria-hidden
          className="absolute -bottom-[3px] -left-[3px] hidden size-[5px] rounded-full bg-border-strong lg:block"
        />
        <span
          aria-hidden
          className="absolute -right-[3px] -bottom-[3px] hidden size-[5px] rounded-full bg-border-strong lg:block"
        />
      </div>
    </div>
  );
}
