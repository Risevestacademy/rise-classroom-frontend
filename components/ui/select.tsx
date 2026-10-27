"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "cn";

type SelectOption<T extends string> = { value: T; label: string };
type SelectOptions<T extends string> = Record<T, string> | SelectOption<T>[];

const sizes = {
  medium: {
    label: "text-neutral-800",
    select: "h-11 px-3",
    chevron: "text-neutral-400",
  },
  large: {
    label: "text-neutral-700",
    select: "h-[52px] px-3.5 hover:bg-neutral-100",
    chevron: "text-neutral-800",
  },
} as const;

const ALL = "__all__";

function toList<T extends string>(
  options: SelectOptions<T>,
): SelectOption<T>[] {
  return Array.isArray(options)
    ? options
    : (Object.entries(options) as [T, string][]).map(([v, l]) => ({
        value: v,
        label: l,
      }));
}

// States follow the design system's Dropdown, which matches the Text Input.
const triggerClass =
  "flex w-full min-w-0 items-center gap-2 rounded-lg border border-border-default bg-transparent text-left font-work text-sm text-text-primary outline-none transition-colors hover:bg-surface-subtle focus-visible:border-border-focus focus-visible:bg-surface-subtle data-[popup-open]:border-border-focus data-[popup-open]:bg-surface-subtle data-[disabled]:cursor-not-allowed data-[disabled]:bg-transparent data-[disabled]:text-text-disabled";

const itemClass =
  "flex min-h-10 cursor-pointer items-center gap-3 px-4 py-1.5 text-sm text-text-primary outline-none select-none data-[highlighted]:bg-brand-100 data-[selected]:bg-brand-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50";

function SelectPopup({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        alignItemWithTrigger={false}
        sideOffset={6}
        className="z-50 outline-none"
      >
        <SelectPrimitive.Popup
          className={cn(
            "max-h-[min(var(--available-height),20rem)] min-w-(--anchor-width) overflow-y-auto rounded-sm bg-neutral-50 py-2 font-work shadow-[0_2px_6px_rgb(0_0_0/0.19),0_0_1px_rgb(0_0_0/0.25)] outline-none",
            className,
          )}
        >
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

/**
 * An unlabelled single-choice select. Pass `aria-label` (or `id` with a
 * matching `<label htmlFor>`) so it has a name.
 */
export function SelectInput<T extends string>({
  value,
  onChange,
  options,
  disabledOptions,
  placeholder,
  leadingIcon,
  showChevron = true,
  disabled,
  id,
  "aria-label": ariaLabel,
  className,
  chevron = <ChevronDown className="size-5" />,
  chevronClassName,
  popupClassName,
}: {
  /** An empty string shows the placeholder. */
  value: T | "";
  onChange: (value: T) => void;
  options: SelectOptions<T>;
  disabledOptions?: readonly T[];
  placeholder?: string;
  leadingIcon?: React.ReactNode;
  showChevron?: boolean;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
  /** Replaces the default chevron icon. */
  chevron?: React.ReactNode;
  chevronClassName?: string;
  popupClassName?: string;
}) {
  const list = toList(options);

  return (
    <SelectPrimitive.Root
      value={value || null}
      onValueChange={(next) => {
        if (next) onChange(next as T);
      }}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(triggerClass, className)}
      >
        {leadingIcon && (
          <span className="flex shrink-0 [&>svg]:size-4">{leadingIcon}</span>
        )}
        <SelectPrimitive.Value
          className="min-w-0 flex-1 truncate data-[placeholder]:text-text-muted"
          placeholder={placeholder}
        >
          {(current: T | null) =>
            list.find((option) => option.value === current)?.label ??
            placeholder
          }
        </SelectPrimitive.Value>
        {showChevron && (
          <SelectPrimitive.Icon
            className={cn("flex shrink-0 text-icon-primary in-data-[disabled]:text-icon-disabled", chevronClassName)}
          >
            {chevron}
          </SelectPrimitive.Icon>
        )}
      </SelectPrimitive.Trigger>
      <SelectPopup className={popupClassName}>
        {list.map((option) => (
          <SelectPrimitive.Item
            key={option.value}
            value={option.value}
            disabled={disabledOptions?.includes(option.value)}
            className={itemClass}
          >
            <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
          </SelectPrimitive.Item>
        ))}
      </SelectPopup>
    </SelectPrimitive.Root>
  );
}

/**
 * A select that takes several values, shown with checkboxes. With
 * `allLabel`, a first item picks every option and the value becomes "all".
 */
export function MultiSelectInput<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  leadingIcon,
  disabled,
  id,
  "aria-label": ariaLabel,
  className,
  chevron = <ChevronDown className="size-5" />,
  chevronClassName,
  popupClassName,
}: {
  value: T[] | "all";
  onChange: (value: T[] | "all") => void;
  options: SelectOptions<T>;
  placeholder?: string;
  allLabel?: string;
  leadingIcon?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
  /** Replaces the default chevron icon. */
  chevron?: React.ReactNode;
  chevronClassName?: string;
  popupClassName?: string;
}) {
  const list = toList(options);
  const isAll = value === "all";
  const selected: string[] = isAll
    ? [ALL, ...list.map((option) => option.value)]
    : value;

  const handleChange = (next: string[]) => {
    const pickedAll = next.includes(ALL);
    if (allLabel && pickedAll !== isAll) {
      onChange(pickedAll ? "all" : []);
      return;
    }
    const values = next.filter((v): v is T => v !== ALL);
    onChange(
      allLabel && list.length > 0 && values.length === list.length
        ? "all"
        : values,
    );
  };

  const summary = isAll
    ? allLabel
    : list
        .filter((option) => value.includes(option.value))
        .map((option) => option.label)
        .join(", ");

  return (
    <SelectPrimitive.Root
      multiple
      value={selected}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(triggerClass, className)}
      >
        {leadingIcon && (
          <span className="flex shrink-0 [&>svg]:size-4">{leadingIcon}</span>
        )}
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !summary && "text-text-muted",
          )}
        >
          {summary || placeholder}
        </span>
        <SelectPrimitive.Icon
          className={cn("flex shrink-0 text-icon-primary in-data-[disabled]:text-icon-disabled", chevronClassName)}
        >
          {chevron}
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPopup className={popupClassName}>
        {allLabel && list.length > 0 && (
          <SelectPrimitive.Item
            value={ALL}
            className={cn(itemClass, "font-medium")}
          >
            <CheckboxMark />
            <SelectPrimitive.ItemText>{allLabel}</SelectPrimitive.ItemText>
          </SelectPrimitive.Item>
        )}
        {list.map((option) => (
          <SelectPrimitive.Item
            key={option.value}
            value={option.value}
            className={itemClass}
          >
            <CheckboxMark />
            <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
          </SelectPrimitive.Item>
        ))}
      </SelectPopup>
    </SelectPrimitive.Root>
  );
}

function CheckboxMark() {
  return (
    <span className="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-neutral-300 bg-neutral-0 in-data-[selected]:border-brand-primary in-data-[selected]:bg-brand-primary">
      <SelectPrimitive.ItemIndicator className="flex text-neutral-0">
        <Check className="size-3" strokeWidth={3} />
      </SelectPrimitive.ItemIndicator>
    </span>
  );
}

/**
 * Labelled select. `options` takes either a value→label map or an ordered
 * list (use the list when order matters or values look numeric).
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
  options: SelectOptions<T>;
  disabledOptions?: readonly T[];
  leadingIcon?: React.ReactNode;
  size?: keyof typeof sizes;
  children?: React.ReactNode;
}) {
  const id = React.useId();
  const styles = sizes[size];

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={cn("text-sm font-medium", styles.label)}>
        {label}
        {required && <span className="ml-1 text-text-error">*</span>}
      </label>
      <SelectInput
        id={id}
        value={value}
        onChange={onChange}
        options={options}
        disabledOptions={disabledOptions}
        leadingIcon={leadingIcon}
        className={cn(styles.select, leadingIcon && "gap-2.5")}
        chevronClassName={styles.chevron}
      />
      {children}
    </div>
  );
}
