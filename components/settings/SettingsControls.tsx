"use client";

import * as React from "react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Switch } from "@base-ui/react/switch";

import { settingsSelectClass } from "@/components/settings/SettingsSection";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectInput } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SettingsChoice<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

/* Pass `aria-label`, or `aria-labelledby` with the id of the setting's name. */
export function SettingsSwitch({
  checked,
  onCheckedChange,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}): React.JSX.Element {
  return (
    <Switch.Root
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full bg-neutral-300 p-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 data-[checked]:bg-brand-primary data-[disabled]:cursor-not-allowed data-[disabled]:bg-neutral-200"
    >
      <Switch.Thumb className="flex size-3 items-center justify-center rounded-full bg-surface-default transition-transform after:size-1 after:rounded-full after:bg-neutral-300 data-[checked]:translate-x-3 data-[checked]:after:bg-brand-primary data-[disabled]:after:bg-neutral-300" />
    </Switch.Root>
  );
}

function ChoiceText({ choice }: { choice: SettingsChoice }) {
  return (
    <span className="min-w-0">
      <span className="block text-base text-text-primary">{choice.label}</span>
      {choice.description && (
        <span className="mt-1 block font-work text-xs text-text-secondary">
          {choice.description}
        </span>
      )}
    </span>
  );
}

/* Checkboxes for picking any number of `choices`. */
export function SettingsCheckboxList<T extends string>({
  choices,
  value,
  onChange,
  "aria-labelledby": ariaLabelledBy,
}: {
  choices: SettingsChoice<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  "aria-labelledby"?: string;
}): React.JSX.Element {
  return (
    <div
      role="group"
      aria-labelledby={ariaLabelledBy}
      className="flex flex-col gap-3 px-0.5"
    >
      {choices.map((choice) => (
        <label
          key={choice.value}
          className="flex cursor-pointer items-start gap-3.5"
        >
          <Checkbox
            className="mt-1"
            checked={value.includes(choice.value)}
            onCheckedChange={(checked) =>
              onChange(
                checked
                  ? [...value, choice.value]
                  : value.filter((item) => item !== choice.value),
              )
            }
          />
          <ChoiceText choice={choice} />
        </label>
      ))}
    </div>
  );
}

/* Radios for picking one of `choices`. `renderExtra` puts more controls
   under a choice, lined up with its text. */
export function SettingsRadioList<T extends string>({
  choices,
  value,
  onChange,
  renderExtra,
  "aria-labelledby": ariaLabelledBy,
}: {
  choices: SettingsChoice<T>[];
  value: T;
  onChange: (value: T) => void;
  renderExtra?: (value: T) => React.ReactNode;
  "aria-labelledby"?: string;
}): React.JSX.Element {
  return (
    <RadioGroup
      aria-labelledby={ariaLabelledBy}
      value={value}
      onValueChange={(next) => onChange(next as T)}
      className="flex flex-col gap-3 px-0.5"
    >
      {choices.map((choice) => {
        const extra = renderExtra?.(choice.value);
        return (
          <div key={choice.value}>
            <label className="flex cursor-pointer items-start gap-3.5">
              <Radio.Root
                value={choice.value}
                className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-neutral-0 transition-colors outline-none hover:border-brand-primary focus-visible:ring-3 focus-visible:ring-brand-primary/30 data-[checked]:border-brand-primary data-[checked]:bg-brand-primary"
              >
                <Radio.Indicator className="size-1.5 rounded-full bg-neutral-0" />
              </Radio.Root>
              <ChoiceText choice={choice} />
            </label>
            {extra && <div className="mt-3 pl-7.5">{extra}</div>}
          </div>
        );
      })}
    </RadioGroup>
  );
}

/* A select with a small visible label above it, as in the cards' extra
   fields. `children` follow the select, e.g. its unit. */
export function SettingsSelectField<T extends string>({
  label,
  className,
  children,
  ...select
}: {
  label: string;
  value: T | "";
  onChange: (value: T) => void;
  options: SettingsChoice<T>[];
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <p aria-hidden className="font-work text-xs text-text-primary">
        {label}
      </p>
      <div className="mt-1.5 flex items-center gap-3.5">
        <SelectInput
          aria-label={label}
          className={cn(settingsSelectClass, className)}
          {...select}
        />
        {children}
      </div>
    </div>
  );
}
