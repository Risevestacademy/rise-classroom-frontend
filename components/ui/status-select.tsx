"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

export function StatusSelect<T extends string>({
  value,
  onChange,
  options,
  disabledOptions,
  children,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Record<T, string>;
  disabledOptions?: readonly T[];
  children?: React.ReactNode;
}) {
  const id = React.useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-800">
        Status
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-11 w-full appearance-none rounded-lg border border-neutral-200 bg-transparent px-3 pr-9 text-sm text-neutral-800 outline-none focus:border-brand-primary"
        >
          {Object.entries<string>(options).map(([status, label]) => (
            <option
              key={status}
              value={status}
              disabled={disabledOptions?.includes(status as T)}
            >
              {label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      </div>
      {children}
    </div>
  );
}
