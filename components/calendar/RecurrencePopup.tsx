"use client";

import * as React from "react";
import { Popover } from "@base-ui/react/popover";

import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/select";
import { DatePickerPopup } from "@/components/calendar/DatePickerPopup";
import {
  addDays,
  fromDateKey,
  shortDate,
  toDateKey,
  type RepeatFrequency,
  type RepeatRule,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

const dayInitials = ["S", "M", "T", "W", "T", "F", "S"];

const frequencies: { value: RepeatFrequency; label: string }[] = [
  { value: "day", label: "day" },
  { value: "week", label: "week" },
  { value: "month", label: "month" },
  { value: "year", label: "year" },
];

type EndType = RepeatRule["ends"]["type"];

/** "Custom recurrence": every N units, on chosen weekdays, ending never/on/after. */
export function RecurrencePopup({
  open,
  onOpenChange,
  anchor,
  start,
  value,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: React.RefObject<HTMLElement | null>;
  start: Date;
  value: RepeatRule | null;
  onDone: (rule: RepeatRule) => void;
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
          <Popover.Popup className="w-[323px] max-w-[calc(100vw-2rem)] rounded-3xl bg-neutral-50 px-6 pt-6 pb-7 font-work text-sm text-text-primary shadow-[0_4px_4px_rgb(0_0_0/0.25)] outline-none">
            {/* Mounted per opening, so it starts from the event's rule. */}
            <RecurrenceForm
              start={start}
              value={value}
              onCancel={() => onOpenChange(false)}
              onDone={(rule) => {
                onDone(rule);
                onOpenChange(false);
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function RecurrenceForm({
  start,
  value,
  onCancel,
  onDone,
}: {
  start: Date;
  value: RepeatRule | null;
  onCancel: () => void;
  onDone: (rule: RepeatRule) => void;
}) {
  const [interval, setRepeatInterval] = React.useState(value?.interval ?? 1);
  const [frequency, setFrequency] = React.useState<RepeatFrequency>(
    value?.frequency ?? "week",
  );
  const [weekdays, setWeekdays] = React.useState<number[]>(
    value?.weekdays ?? [start.getDay()],
  );
  const [endType, setEndType] = React.useState<EndType>(
    value?.ends.type ?? "never",
  );
  const [endDate, setEndDate] = React.useState(() =>
    value?.ends.type === "on"
      ? fromDateKey(value.ends.date)
      : addDays(start, 7 * 10),
  );
  const [count, setCount] = React.useState(
    value?.ends.type === "after" ? value.ends.count : 13,
  );
  const [pickingDate, setPickingDate] = React.useState(false);
  const endDateRef = React.useRef<HTMLButtonElement>(null);

  const toggleWeekday = (day: number) =>
    setWeekdays((days) =>
      days.includes(day)
        ? days.length > 1
          ? days.filter((d) => d !== day)
          : days
        : [...days, day],
    );

  const done = () =>
    onDone({
      frequency,
      interval,
      weekdays: frequency === "week" ? [...weekdays].sort() : undefined,
      monthlyOn: frequency === "month" ? "date" : undefined,
      ends:
        endType === "on"
          ? { type: "on", date: toDateKey(endDate) }
          : endType === "after"
            ? { type: "after", count }
            : { type: "never" },
    });

  return (
    <>
      <Popover.Title className="font-tomato text-lg leading-7 font-semibold">
        Custom recurrence
      </Popover.Title>

      <div className="mt-5 flex items-center">
        <span className="mr-3 shrink-0">Repeat every</span>
        <input
          type="number"
          min={1}
          max={99}
          aria-label="Repeat interval"
          value={interval}
          onChange={(e) =>
            setRepeatInterval(
              Math.max(1, Math.min(99, Number(e.target.value) || 1)),
            )
          }
          className="h-10 w-[51px] [appearance:textfield] rounded-lg bg-neutral-100 text-center outline-none focus-visible:ring-2 focus-visible:ring-brand-300 [&::-webkit-inner-spin-button]:appearance-none"
        />
        <Stepper
          label="interval"
          onUp={() => setRepeatInterval((n) => Math.min(99, n + 1))}
          onDown={() => setRepeatInterval((n) => Math.max(1, n - 1))}
        />
        <SelectInput
          aria-label="Repeat unit"
          value={frequency}
          onChange={setFrequency}
          options={frequencies.map((f) => ({
            value: f.value,
            label: interval > 1 ? `${f.label}s` : f.label,
          }))}
          chevron={<Caret />}
          chevronClassName="text-text-primary"
          className="ml-2 h-10 w-[97px] gap-2 border-0 bg-neutral-100 pr-4 pl-4 font-work text-sm text-text-primary focus-visible:ring-2 focus-visible:ring-brand-300"
        />
      </div>

      {frequency === "week" && (
        <>
          <p className="mt-6">Repeat on</p>
          <div className="mt-3 flex gap-2">
            {dayInitials.map((initial, day) => {
              const on = weekdays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={on}
                  aria-label={
                    [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ][day]
                  }
                  onClick={() => toggleWeekday(day)}
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[10px] font-medium",
                    on
                      ? "bg-brand-900 text-white"
                      : "bg-neutral-100 text-brand-primary",
                  )}
                >
                  {initial}
                </button>
              );
            })}
          </div>
        </>
      )}

      <fieldset className="mt-6">
        <legend>Ends</legend>
        <div className="mt-[23px] grid grid-cols-[124px_auto] items-center gap-y-1">
          <EndOption
            label="Never"
            checked={endType === "never"}
            onSelect={() => setEndType("never")}
          />
          <span className="h-10" />

          <EndOption
            label="On"
            checked={endType === "on"}
            onSelect={() => setEndType("on")}
          />
          <button
            ref={endDateRef}
            type="button"
            disabled={endType !== "on"}
            onClick={() => setPickingDate(true)}
            className="h-10 justify-self-start rounded-lg bg-neutral-100 px-4 disabled:text-text-disabled"
          >
            {shortDate(endDate)}
          </button>

          <EndOption
            label="After"
            checked={endType === "after"}
            onSelect={() => setEndType("after")}
          />
          <div className="flex items-center">
            <label
              className={cn(
                "flex h-10 w-36 items-center gap-2 rounded-lg bg-neutral-100 px-4",
                endType !== "after" && "text-text-disabled",
              )}
            >
              <input
                type="number"
                min={1}
                max={999}
                disabled={endType !== "after"}
                aria-label="Number of occurrences"
                value={count}
                onChange={(e) =>
                  setCount(
                    Math.max(1, Math.min(999, Number(e.target.value) || 1)),
                  )
                }
                className="w-7 [appearance:textfield] bg-transparent outline-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              occurrences
            </label>
            <Stepper
              label="occurrences"
              disabled={endType !== "after"}
              onUp={() => setCount((n) => Math.min(999, n + 1))}
              onDown={() => setCount((n) => Math.max(1, n - 1))}
            />
          </div>
        </div>
      </fieldset>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          variant="secondary"
          size="medium"
          onClick={onCancel}
          className="border-neutral-200 px-5 font-tomato text-base font-normal text-text-secondary"
        >
          Cancel
        </Button>
        <Button
          size="medium"
          onClick={done}
          className="px-5 font-tomato text-base font-normal"
        >
          Done
        </Button>
      </div>

      <DatePickerPopup
        open={pickingDate}
        onOpenChange={setPickingDate}
        anchor={endDateRef}
        value={endDate}
        onApply={setEndDate}
      />
    </>
  );
}

function EndOption({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label className="flex h-10 cursor-pointer items-center gap-3">
      <input
        type="radio"
        name="recurrence-end"
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="ml-0.5 flex size-5 items-center justify-center rounded-full border-2 border-text-primary peer-checked:border-brand-primary peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300"
      >
        {checked && <span className="size-2.5 rounded-full bg-brand-primary" />}
      </span>
      {label}
    </label>
  );
}

function Stepper({
  label,
  onUp,
  onDown,
  disabled,
}: {
  label: string;
  onUp: () => void;
  onDown: () => void;
  disabled?: boolean;
}) {
  return (
    <span
      className={cn(
        "ml-2 flex flex-col gap-1.5",
        disabled ? "text-text-disabled" : "text-text-primary",
      )}
    >
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={disabled}
        onClick={onUp}
      >
        <Caret className="rotate-180" />
      </button>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={disabled}
        onClick={onDown}
      >
        <Caret />
      </button>
    </span>
  );
}

function Caret({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 10 6"
      aria-hidden
      className={cn("h-1.5 w-2.5 fill-current", className)}
    >
      <path d="M0 0h10L5 6z" />
    </svg>
  );
}
