"use client";

import { cn } from "@/lib/utils";

/** The grey segmented tab bar used across the cohort screens. */
export function CohortTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full gap-3 overflow-x-auto rounded-xl bg-neutral-100 p-1 shadow-[0_2px_4px_rgb(17_24_25/0.06)]",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "h-8 shrink-0 rounded-lg px-[13px] text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-white text-text-primary"
                : "text-text-muted hover:text-text-primary",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
