"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { ArrowLeft01, ArrowRight01, Calendar03 } from "@/assets/icons";
import { cn } from "@/lib/utils";
import {
  attendanceByMonth,
  sessionsOn,
  type AttendanceSession,
} from "@/app/admin/students/[id]/profile-data";
import {
  AttendanceGrid,
  BrandBadge,
  Card,
  CardHeader,
  attendanceCell,
  attendanceLabels,
  type AttendanceStatus,
} from "./shared";

const MONTHS_DESKTOP = 4;
const MONTHS_MOBILE = 1;

// Matches Tailwind's `sm` breakpoint (640px).
const MOBILE_QUERY = "(max-width: 639px)";

const navButtonClass =
  "flex size-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-interactive-secondary-default text-text-primary hover:bg-interactive-secondary-hover";

function subscribeMobile(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

function monthAt(start: { year: number; month: number }, offset: number) {
  const date = new Date(start.year, start.month + offset, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function shortMonth(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "short",
  });
}

function monthIndex(year: number, month: number) {
  return year * 12 + month;
}

function formatRange(start: { year: number; month: number }, count: number) {
  const first = start;
  const last = monthAt(start, count - 1);

  if (count === 1) {
    return `${shortMonth(first.year, first.month)} ${first.year}`;
  }

  return first.year === last.year
    ? `${shortMonth(first.year, first.month)} - ${shortMonth(last.year, last.month)} ${last.year}`
    : `${shortMonth(first.year, first.month)} ${first.year} - ${shortMonth(last.year, last.month)} ${last.year}`;
}

export function AttendanceTab({ firstName }: { firstName: string }) {
  // The design opens on Sep - Dec 2026, where the sample sessions are.
  const [start, setStart] = React.useState({ year: 2026, month: 8 });
  const isMobile = useIsMobile();
  const monthCount = isMobile ? MONTHS_MOBILE : MONTHS_DESKTOP;

  const months = Array.from({ length: monthCount }, (_, index) =>
    monthAt(start, index),
  );

  return (
    <Card className="gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardHeader
          title="Attendance"
          subtitle={`Live sessions attendance for ${firstName}.`}
          subtitleClassName="text-text-primary"
        />
        <div className="flex w-full items-center gap-3 sm:w-auto sm:shrink-0">
          <Button
            type="button"
            aria-label="Previous months"
            onClick={() => setStart(monthAt(start, -monthCount))}
            className={navButtonClass}
          >
            <ArrowLeft01 className="size-5" />
          </Button>
          <MonthRangePicker
            start={start}
            count={monthCount}
            onChange={setStart}
          />
          <Button
            type="button"
            aria-label="Next months"
            onClick={() => setStart(monthAt(start, monthCount))}
            className={navButtonClass}
          >
            <ArrowRight01 className="size-5" />
          </Button>
        </div>
      </div>

      <div className="flex gap-5 sm:overflow-x-auto">
        {months.map(({ year, month }) => {
          const name = new Date(year, month, 1).toLocaleDateString("en-US", {
            month: "long",
          });
          const sessions = attendanceByMonth[`${year}-${month}`] ?? {};
          const dayCount = new Date(year, month + 1, 0).getDate();
          const days = Array.from(
            { length: dayCount },
            (_, index) =>
              sessions[index + 1] ?? { status: "none" as AttendanceStatus },
          );

          return (
            <div
              key={`${year}-${month}`}
              className="flex w-full min-w-0 flex-col gap-4 sm:w-[258px] sm:shrink-0"
            >
              <h3 className="text-lg/6 font-semibold text-black">{name}</h3>
              <AttendanceGrid
                size="large"
                monthLabel={shortMonth(year, month)}
                leadingBlanks={new Date(year, month, 1).getDay()}
                days={days}
                details={(day) => {
                  const sessions = sessionsOn(days[day - 1]);
                  return sessions.length > 0 ? (
                    <SessionSummary
                      date={new Date(year, month, day)}
                      sessions={sessions}
                    />
                  ) : null;
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="h-px bg-border-default" />

      <ul className="flex flex-wrap gap-3">
        {(Object.keys(attendanceLabels) as AttendanceStatus[]).map((status) => (
          <li
            key={status}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary"
          >
            <span className={cn("size-4 rounded-sm", attendanceCell[status])} />
            {attendanceLabels[status]}
          </li>
        ))}
        <li className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <span className="flex size-4 items-center justify-center">
            <span className="size-2.5 rounded-full bg-brand-900" />
          </span>
          Multiple session that day
        </li>
      </ul>
    </Card>
  );
}

const MONTH_NAMES = Array.from({ length: 12 }, (_, month) =>
  shortMonth(2000, month),
);

/**
 * Trigger + popover for choosing the first month of the range.
 * The last month is derived from `count` (4 on desktop, 1 on mobile).
 */
function MonthRangePicker({
  start,
  count,
  onChange,
}: {
  start: { year: number; month: number };
  count: number;
  onChange: (next: { year: number; month: number }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [pickerYear, setPickerYear] = React.useState(start.year);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const close = React.useCallback(() => {
    setOpen(false);
    setHovered(null);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const startIndex = monthIndex(start.year, start.month);
  // While hovering, preview the range the hovered month would produce.
  const previewIndex = hovered ?? startIndex;
  const previewStart = {
    year: Math.floor(previewIndex / 12),
    month: previewIndex % 12,
  };

  function toggle() {
    if (open) {
      close();
      return;
    }
    setPickerYear(start.year);
    setOpen(true);
  }

  function select(month: number) {
    onChange({ year: pickerYear, month });
    close();
    triggerRef.current?.focus();
  }

  return (
    <div
      ref={rootRef}
      className="relative flex min-w-0 flex-1 justify-center sm:flex-none"
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className="flex h-10 w-full items-center justify-center gap-1 rounded-lg cursor-pointer border border-border-default bg-surface-default px-2 py-1 font-work text-sm text-text-primary hover:bg-interactive-secondary-hover sm:w-auto"
      >
        <Calendar03 className="size-5 text-icon-secondary" />
        {formatRange(start, count)}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Select start month"
          className="absolute top-full left-1/2 z-20 mt-2 flex w-[280px] -translate-x-1/2 flex-col gap-4 rounded-xl border border-border-default bg-surface-default p-4 shadow-lg sm:right-0 sm:left-auto sm:translate-x-0"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous year"
              onClick={() => setPickerYear((year) => year - 1)}
              className={cn(navButtonClass, "size-8")}
            >
              <ArrowLeft01 className="size-4" />
            </button>
            <span className="font-work text-sm font-semibold text-text-primary">
              {pickerYear}
            </span>
            <button
              type="button"
              aria-label="Next year"
              onClick={() => setPickerYear((year) => year + 1)}
              className={cn(navButtonClass, "size-8")}
            >
              <ArrowRight01 className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2" onPointerLeave={() => setHovered(null)}>
            {MONTH_NAMES.map((label, month) => {
              const index = monthIndex(pickerYear, month);
              const isStart = index === previewIndex;
              const inRange =
                index > previewIndex && index < previewIndex + count;
              const isSelected = index === startIndex;

              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => select(month)}
                  onPointerEnter={() => setHovered(index)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(null)}
                  className={cn(
                    "h-9 rounded-lg font-work text-sm font-medium",
                    isStart
                      ? "bg-brand-900 text-white"
                      : inRange
                        ? "bg-interactive-secondary-default text-text-primary"
                        : "text-text-primary hover:bg-interactive-secondary-hover",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <p className="font-work text-xs text-text-secondary">
            Showing {formatRange(previewStart, count)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

const sessionStatus = {
  attended: { label: "Attended", dot: "bg-brand-500", text: "text-text-success" },
  absent: {
    label: "Absent",
    dot: attendanceCell.absent,
    text: "text-text-error",
  },
} as const;

/** The card a day with sessions shows on hover. */
function SessionSummary({
  date,
  sessions,
}: {
  date: Date;
  sessions: AttendanceSession[];
}) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-text-primary">
          {/* The design drops the comma after the weekday: "Mon Oct 12, 2026". */}
          {date.toLocaleDateString("en-US", { weekday: "short" })}{" "}
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <p className="font-work text-[13px]/[18px] text-text-secondary">
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {sessions.map((session, index) => {
          const status = sessionStatus[session.status];
          return (
            <li key={index} className="flex items-start gap-2">
              <span className="flex px-0.5 py-[3px]">
                <span className={cn("size-2.5 rounded-full", status.dot)} />
              </span>
              <div className="flex min-w-0 flex-col gap-1 font-work text-xs">
                <p className="truncate font-medium text-text-primary">
                  {session.name}
                </p>
                <p className="text-text-secondary">{session.time}</p>
                <BrandBadge className={cn("w-fit", status.text)}>
                  {status.label}
                </BrandBadge>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}