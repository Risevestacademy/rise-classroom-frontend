"use client";

import * as React from "react";
import { Popover } from "@base-ui/react/popover";

import { ArrowDown01, ArrowLeft01, ArrowRight01 } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { addDays, monthNames, toDateKey } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const weekdayInitials = ["M", "T", "W", "T", "F", "S", "S"];

/** The 42 days shown for a month, Monday first. */
function mondayGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/**
 * A date field's picker: choose a day, then Apply. Days that already have
 * events carry a dot.
 */
export function DatePickerPopup({
  open,
  onOpenChange,
  anchor,
  value,
  onApply,
  hasEvents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: React.RefObject<HTMLElement | null>;
  value: Date;
  onApply: (date: Date) => void;
  hasEvents?: (date: Date) => boolean;
}) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Portal>
        <Popover.Positioner
          anchor={anchor}
          side="bottom"
          align="start"
          sideOffset={6}
          className="z-50"
        >
          <Popover.Popup className="w-[368px] max-w-[calc(100vw-2rem)] rounded-xl bg-neutral-50 shadow-[0_16px_32px_-12px_rgb(88_92_95/0.1)] outline-none">
            {/* Mounted per opening, so it starts from the field's date. */}
            <DatePicker
              value={value}
              hasEvents={hasEvents}
              onCancel={() => onOpenChange(false)}
              onApply={(date) => {
                onApply(date);
                onOpenChange(false);
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function DatePicker({
  value,
  hasEvents,
  onCancel,
  onApply,
}: {
  value: Date;
  hasEvents?: (date: Date) => boolean;
  onCancel: () => void;
  onApply: (date: Date) => void;
}) {
  const [selected, setSelected] = React.useState(value);
  const [view, setView] = React.useState({
    year: value.getFullYear(),
    month: value.getMonth(),
  });

  const shiftMonth = (by: number) =>
    setView(({ year, month }) => {
      const next = new Date(year, month + by, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  const selectedKey = toDateKey(selected);

  return (
    <>
      <div className="px-5 pt-5">
        <div className="flex h-9 items-center justify-between rounded-lg bg-neutral-100 px-1.5">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="flex size-6 items-center justify-center rounded-md bg-white text-text-primary"
          >
            <ArrowLeft01 className="size-4" />
          </button>
          <div className="flex items-center gap-1">
            <MonthSelect
              value={view.month}
              onChange={(month) => setView((current) => ({ ...current, month }))}
            />
            <YearSelect
              value={view.year}
              onChange={(year) => setView((current) => ({ ...current, year }))}
            />
          </div>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="flex size-6 items-center justify-center rounded-md bg-white text-text-primary"
          >
            <ArrowRight01 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-1 grid grid-cols-7 px-4 pb-4">
        {weekdayInitials.map((day, i) => (
          <span
            key={i}
            className="flex h-12 items-center justify-center text-sm text-text-muted"
          >
            {day}
          </span>
        ))}
        {mondayGrid(view.year, view.month).map((date) => {
          const key = toDateKey(date);
          const inMonth = date.getMonth() === view.month;
          const isSelected = key === selectedKey;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isSelected}
              aria-label={date.toDateString()}
              onClick={() => setSelected(date)}
              className="group flex h-12 items-center justify-center"
            >
              <span
                className={cn(
                  "relative flex size-10 items-center justify-center text-base",
                  isSelected
                    ? "rounded-full bg-brand-primary text-white"
                    : "rounded-lg group-hover:bg-neutral-100",
                  !isSelected &&
                    (inMonth ? "text-text-primary" : "text-text-disabled"),
                )}
              >
                {date.getDate()}
                {!isSelected && hasEvents?.(date) && (
                  <span
                    className={cn(
                      "absolute bottom-0.5 size-1 rounded-full",
                      inMonth ? "bg-brand-primary" : "bg-text-disabled",
                    )}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 border-t border-neutral-200 px-4 py-4">
        <Button
          variant="secondary"
          size="medium"
          onClick={onCancel}
          className="flex-1 border-neutral-200 bg-neutral-50 text-base font-normal text-text-secondary"
        >
          Cancel
        </Button>
        <Button
          size="medium"
          onClick={() => onApply(selected)}
          className="flex-1 text-base font-normal"
        >
          Apply
        </Button>
      </div>
    </>
  );
}

const pickerTriggerClass =
  "flex h-7 items-center gap-1 rounded-md px-2 text-sm font-medium text-text-primary hover:bg-white data-[popup-open]:bg-white";

const pickerOptionClass =
  "flex h-9 items-center justify-center rounded-lg text-sm text-text-primary hover:bg-neutral-100 aria-pressed:bg-brand-primary aria-pressed:text-white";

/** A header button that opens a small popup under it. */
function HeaderDropdown({
  label,
  ariaLabel,
  open,
  onOpenChange,
  children,
}: {
  label: React.ReactNode;
  ariaLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger aria-label={ariaLabel} className={pickerTriggerClass}>
        {label}
        <ArrowDown01 className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="center" sideOffset={6} className="z-50">
          <Popover.Popup className="w-64 rounded-xl bg-neutral-50 p-3 shadow-[0_2px_6px_rgb(0_0_0/0.19),0_0_1px_rgb(0_0_0/0.25)] outline-none">
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function MonthSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (month: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <HeaderDropdown
      label={monthNames[value]}
      ariaLabel={`Month, ${monthNames[value]}`}
      open={open}
      onOpenChange={setOpen}
    >
      <div className="grid grid-cols-3 gap-1">
        {monthNames.map((name, month) => (
          <button
            key={name}
            type="button"
            aria-pressed={month === value}
            aria-label={name}
            onClick={() => {
              onChange(month);
              setOpen(false);
            }}
            className={pickerOptionClass}
          >
            {name.slice(0, 3)}
          </button>
        ))}
      </div>
    </HeaderDropdown>
  );
}

/** Twelve years at a time; the arrows page back or forward without limit. */
function YearSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (year: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [firstYear, setFirstYear] = React.useState(value - 5);
  const years = Array.from({ length: 12 }, (_, i) => firstYear + i);

  return (
    <HeaderDropdown
      label={value}
      ariaLabel={`Year, ${value}`}
      open={open}
      onOpenChange={(next) => {
        // Each opening starts with the shown year in view.
        if (next) setFirstYear(value - 5);
        setOpen(next);
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Earlier years"
          onClick={() => setFirstYear((year) => year - 12)}
          className="flex size-7 items-center justify-center rounded-md hover:bg-neutral-100"
        >
          <ArrowLeft01 className="size-4" />
        </button>
        <span className="text-sm font-medium text-text-primary">
          {years[0]} – {years[11]}
        </span>
        <button
          type="button"
          aria-label="Later years"
          onClick={() => setFirstYear((year) => year + 12)}
          className="flex size-7 items-center justify-center rounded-md hover:bg-neutral-100"
        >
          <ArrowRight01 className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            aria-pressed={year === value}
            onClick={() => {
              onChange(year);
              setOpen(false);
            }}
            className={pickerOptionClass}
          >
            {year}
          </button>
        ))}
      </div>
    </HeaderDropdown>
  );
}
