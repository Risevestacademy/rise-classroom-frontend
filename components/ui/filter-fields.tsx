import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";

/** Adds or removes `value` from a filter list. */
export function toggle<T>(list: T[], value: T, checked: boolean) {
  return checked ? [...list, value] : list.filter((item) => item !== value);
}

export function FilterSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="py-5.5">
      <legend className="text-lg leading-7 font-medium text-text-primary">
        {title}
      </legend>
      {description && (
        <p className="text-sm leading-5 text-text-secondary">{description}</p>
      )}
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </fieldset>
  );
}

export function FilterOption({
  name,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  name: string;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    // A named Checkbox positions its hidden input absolutely; `relative` keeps
    // it here, so focusing it on click doesn't scroll the dialog to the top.
    <label className="relative flex cursor-pointer items-start gap-3.5">
      <Checkbox
        name={name}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-1 border-[1.5px] border-neutral-600"
      />
      <span className="flex flex-col">
        <span className="text-base leading-6 text-text-primary">{label}</span>
        {hint && (
          <span className="font-work text-sm leading-5 text-text-muted">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}
