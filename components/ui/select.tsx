"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";

type SelectOption<T extends string> = { value: T; label: string };

const sizes = {
  medium: {
    label: "text-neutral-800",
    select: "h-11 px-3 pr-9",
    chevron: "right-3 text-neutral-400",
  },
  large: {
    label: "text-neutral-700",
    select: "h-[52px] px-3.5 pr-10 hover:bg-neutral-100",
    chevron: "right-3.5 text-neutral-800",
  },
} as const;

/**
 * Labelled native select. `options` takes either a value→label map or an
 * ordered list (use the list when order matters or values look numeric).
 */
export function Select<T extends string>({
  label = "Status",
  required = false,
  value,
  onChange,
  options,
  disabledOptions,
  leadingIcon,
  size = "medium",
  children,
}: {
  label?: string;
  required?: boolean;
  value: T;
  onChange: (value: T) => void;
  options: Record<T, string> | SelectOption<T>[];
  disabledOptions?: readonly T[];
  leadingIcon?: React.ReactNode;
  size?: keyof typeof sizes;
  children?: React.ReactNode;
}) {
  const id = React.useId();
  const styles = sizes[size];
  const list: SelectOption<T>[] = Array.isArray(options)
    ? options
    : (Object.entries(options) as [T, string][]).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={cn("text-sm font-medium", styles.label)}>
        {label}
        {required && <span className="ml-1 text-text-error">*</span>}
      </label>
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute top-1/2 left-3.5 flex -translate-y-1/2 [&>svg]:size-4">
            {leadingIcon}
          </span>
        )}
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className={cn(
            "w-full appearance-none rounded-lg border border-neutral-200 bg-transparent text-sm text-neutral-800 outline-none focus:border-brand-primary",
            styles.select,
            leadingIcon && "pl-10"
          )}
        >
          {list.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={disabledOptions?.includes(option.value)}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={cn(
            "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2",
            styles.chevron
          )}
        />
      </div>
      {children}
    </div>
  );
}
