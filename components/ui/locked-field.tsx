import * as React from "react";

import { cn } from "@/lib/utils";

const sizes = {
  medium: { label: "text-neutral-800", box: "h-11 px-3" },
  large: { label: "text-neutral-700", box: "h-[52px] px-3.5" },
} as const;

/**
 * A labelled value the user can see but not change, laid out like `Select`
 * so it sits in the same forms. Used for the cohort, which comes from the
 * top nav: a cohort shouldn't be changed from inside another cohort.
 */
export function LockedField({
  label,
  value,
  size = "medium",
}: {
  label: string;
  value: string;
  size?: keyof typeof sizes;
}) {
  const id = React.useId();
  const styles = sizes[size];

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={cn("text-sm font-medium", styles.label)}>
        {label}
      </label>
      <input
        id={id}
        readOnly
        aria-readonly
        value={value}
        className={cn(
          "w-full cursor-not-allowed truncate rounded-lg border border-neutral-200 bg-surface-subtle text-sm text-neutral-800 outline-none",
          styles.box,
        )}
      />
    </div>
  );
}
