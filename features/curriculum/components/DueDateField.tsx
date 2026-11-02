"use client";

import * as React from "react";
import { Clock } from "lucide-react";

import { AlertCircle, Calendar } from "@/assets/icons";
import { DatePickerPopup } from "@/components/calendar/DatePickerPopup";
import { SelectInput } from "@/components/ui/select";
import { fieldTime, shortDate, toDateKey } from "@/lib/calendar";
import { cn } from "@/lib/utils";

/* The time an assignment is due when only a date is picked. */
export const defaultDueTime = "23:59";

const pad = (value: number) => String(value).padStart(2, "0");

/* Every quarter hour, plus 11:59 PM so a deadline can be the end of the day. */
const quarterHours = Array.from(
  { length: 96 },
  (_, i) => `${pad(Math.floor(i / 4))}:${pad((i % 4) * 15)}`,
);

function timeOptions(current: string) {
  const times = [...quarterHours, defaultDueTime];
  /* An existing deadline at an odd minute keeps its own time in the list. */
  if (!times.includes(current)) times.push(current);
  return times.sort().map((time) => ({ value: time, label: fieldTime(time) }));
}

function toTimeInput(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* Matches InputWrapper at its medium size, for the date button. */
const fieldClass =
  "flex h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-border-default bg-transparent p-3 text-left font-work text-sm text-text-primary outline-none transition-colors hover:bg-surface-subtle focus-visible:border-border-focus focus-visible:bg-surface-subtle data-[popup-open]:border-border-focus";

/* A due date and time, or none. `value` is anything Date can read; changes come back
   as a local "YYYY-MM-DDTHH:mm:00" string, or null once the date is removed. */
export function DueDateField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [picking, setPicking] = React.useState(false);
  /* Kept for when there's no date yet, so a picked time isn't lost. */
  const [pendingTime, setPendingTime] = React.useState(defaultDueTime);
  const dateRef = React.useRef<HTMLButtonElement>(null);

  const due = value ? new Date(value) : null;
  const time = due ? toTimeInput(due) : pendingTime;

  function emit(date: Date | null, nextTime: string) {
    onChange(date ? `${toDateKey(date)}T${nextTime}:00` : null);
  }

  return (
    <div className="flex flex-col">
      <p className="text-sm leading-6 font-medium text-text-primary">
        Due date
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <button
          ref={dateRef}
          type="button"
          aria-label={due ? `Due date, ${shortDate(due)}` : "Due date"}
          aria-haspopup="dialog"
          onClick={() => setPicking(true)}
          className={cn(fieldClass, "flex-3")}
        >
          <Calendar className="size-4 shrink-0" />
          <span className={cn("truncate", !due && "text-text-muted")}>
            {due ? shortDate(due) : "Pick a date"}
          </span>
        </button>
        <SelectInput
          aria-label="Due time"
          value={time}
          onChange={(nextTime) => {
            setPendingTime(nextTime);
            emit(due, nextTime);
          }}
          options={timeOptions(time)}
          disabled={!due}
          leadingIcon={<Clock />}
          className="h-11 flex-2 p-3"
          popupClassName="max-h-60"
        />
      </div>
      {/* Hint only works inside a Field, so this copies its look. */}
      <p className="mt-1.5 flex items-center gap-1 font-work text-[13px]/[18px] text-text-secondary">
        <AlertCircle variant="solid" size={14} />
        {due
          ? "Students will see the due date in their dashboard"
          : "No due date. Pick a date to set one."}
      </p>
      {due && (
        <button
          type="button"
          onClick={() => {
            setPendingTime(defaultDueTime);
            onChange(null);
          }}
          className="mt-1 w-fit text-xs font-medium text-brand-primary hover:underline"
        >
          Remove due date
        </button>
      )}

      <DatePickerPopup
        open={picking}
        onOpenChange={setPicking}
        anchor={dateRef}
        value={due ?? new Date()}
        onApply={(date) => emit(date, time)}
      />
    </div>
  );
}
