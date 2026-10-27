"use client";

import * as React from "react";
import { Popover } from "@base-ui/react/popover";

import { ArrowDown01, Message01 } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type AttendanceStatus = "attended" | "absent" | "none";

/** The white card every student profile section sits in. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-6 rounded-xl bg-surface-default p-6 shadow-[0_1px_3px_rgb(0_0_0/0.15)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  subtitleClassName,
  action,
  size = "h3",
}: {
  title: string;
  subtitle?: string;
  subtitleClassName?: string;
  action?: React.ReactNode;
  /** H3 (20px) for card titles, H4 (18px) for list and panel titles. */
  size?: "h3" | "h4";
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h2
          className={cn(
            "font-semibold text-text-primary",
            size === "h3" ? "text-xl" : "text-lg/6",
          )}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={cn(
              "font-work text-sm text-text-secondary",
              subtitleClassName,
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function IconBox({
  icon: Icon,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg",
        className,
      )}
    >
      <Icon className="size-6" />
    </span>
  );
}

/** A compact select styled as the design's small secondary button. */
export function CardSelect<T extends string>({
  value,
  options,
  label,
  onChange,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  label: string;
  onChange: (value: T) => void;
}) {
  return (
    <SelectInput
      aria-label={label}
      value={value}
      onChange={onChange}
      options={[...options]}
      className="h-8 w-fit shrink-0 gap-1 bg-interactive-secondary-default px-3 font-medium text-text-secondary"
      chevron={<ArrowDown01 className="size-4" />}
      chevronClassName="text-icon-secondary"
    />
  );
}

/** A pill on the brand surface; only the text carries the colour. */
export function BrandBadge({
  size = "sm",
  className,
  children,
}: {
  size?: "sm" | "lg";
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center rounded-full bg-surface-brand font-medium whitespace-nowrap",
        size === "lg" ? "h-7 p-2 text-sm" : "h-6 p-1.5 text-xs",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function MessageButton() {
  // PENDING-BACKEND: there's no messaging yet.
  return (
    <Button variant="tertiary" size="medium">
      <Message01 className="size-[18px]" />
      Message
    </Button>
  );
}

/** A row of text items, each led by an icon, as in the profile and mentor cards. */
export function DetailItem({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 p-2">
      <Icon className="size-6 shrink-0 text-icon-secondary" />
      <span className="truncate font-work text-sm font-medium text-text-secondary">
        {children}
      </span>
    </div>
  );
}

export type TimelineGroup = {
  label: string;
  items: { time: string; title: string; detail: string }[];
};

/** Days of events on a vertical line, as in the Activity tabs. */
export function ActivityTimeline({ groups }: { groups: TimelineGroup[] }) {
  return (
    <div className="flex flex-col gap-4 p-2.5">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-8">
          <p className="text-sm font-medium text-black">{group.label}</p>
          <ol className="relative ml-[22px] flex flex-col gap-[38px] border-l-2 border-border-strong pl-4">
            {group.items.map((item) => (
              <li key={item.time + item.title} className="relative">
                <span className="absolute top-1 -left-[21px] size-2 rounded-full bg-border-strong" />
                <p className="font-work text-xs font-medium text-text-secondary">
                  {item.time}
                </p>
                <p className="mt-1 font-work text-sm font-medium tracking-[-0.01em] text-black">
                  {item.title}
                </p>
                <p className="mt-1 font-work text-[13px]/[18px] text-text-secondary">
                  {item.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-text-primary">{children}</p>;
}

export function ProgressBar({
  value,
  className,
  fillClassName = "bg-interactive-primary-default",
}: {
  value: number;
  className?: string;
  fillClassName?: string;
}) {
  return (
    <span className={cn("block h-2 rounded-full bg-brand-100", className)}>
      <span
        className={cn("block h-2 rounded-full", fillClassName)}
        style={{ width: `${value}%` }}
      />
    </span>
  );
}

export const attendanceCell: Record<AttendanceStatus, string> = {
  attended: "bg-brand-500",
  absent: "bg-surface-error-badge",
  none: "bg-surface-subtle",
};

export const attendanceLabels: Record<AttendanceStatus, string> = {
  attended: "Attended",
  absent: "Absent",
  none: "No session",
};

const weekdayLetters = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * A month of attendance squares under a row of weekday letters. `small` is
 * the Overview card's grid; `large` is the Attendance tab's.
 */
export function AttendanceGrid({
  monthLabel,
  leadingBlanks,
  days,
  size,
  cells = attendanceCell,
  details,
}: {
  monthLabel: string;
  leadingBlanks: number;
  days: { status: AttendanceStatus; multiple?: boolean }[];
  size: "small" | "large";
  /** Square colours per status; defaults to `attendanceCell`. */
  cells?: Record<AttendanceStatus, string>;
  /** What a day shows on hover, by day of the month; null shows nothing. */
  details?: (day: number) => React.ReactNode;
}) {
  const large = size === "large";

  return (
    <div
      className={cn(
        "grid w-fit",
        large
          ? // The weekday row is 20px; the extra 8px makes the design's 16px gap below it.
            "grid-cols-[repeat(7,30px)] grid-rows-[28px] auto-rows-[30px] gap-2"
          : "grid-cols-[repeat(7,20px)] grid-rows-[18px] auto-rows-[20px] gap-2",
      )}
    >
      {weekdayLetters.map((day, index) => (
        <span
          key={index}
          className={cn(
            "text-center font-work text-text-secondary",
            large
              ? "text-sm font-medium tracking-[-0.01em]"
              : "text-[13px]/[18px]",
          )}
        >
          {day}
        </span>
      ))}
      {Array.from({ length: leadingBlanks }).map((_, index) => (
        <span key={`blank-${index}`} />
      ))}
      {days.map((day, index) => {
        const label = `${monthLabel} ${index + 1}: ${attendanceLabels[day.status]}${
          day.multiple ? " (multiple sessions)" : ""
        }`;
        const className = cn("relative rounded-md", cells[day.status]);
        const dots = day.multiple && (
          <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
            <span className="size-1.5 rounded-full bg-brand-900" />
            <span className="size-1.5 rounded-full bg-surface-error-badge" />
          </span>
        );
        const content = details?.(index + 1);

        if (!content) {
          return (
            <span key={index} title={label} className={className}>
              {dots}
            </span>
          );
        }

        return (
          <Popover.Root key={index}>
            <Popover.Trigger
              openOnHover
              delay={100}
              aria-label={label}
              className={cn(className, "cursor-default")}
            >
              {dots}
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner side="bottom" sideOffset={8} className="z-50">
                <Popover.Popup className="flex w-[188px] flex-col gap-3 rounded-lg bg-surface-default p-5 shadow-[0_1px_3px_rgb(0_0_0/0.25)] outline-none">
                  {content}
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        );
      })}
    </div>
  );
}
