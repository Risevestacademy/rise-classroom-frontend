"use client";

import * as React from "react";

import { ArrowDown01 } from "@/assets/icons";
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
}: {
  monthLabel: string;
  leadingBlanks: number;
  days: { status: AttendanceStatus; multiple?: boolean }[];
  size: "small" | "large";
  /** Square colours per status; defaults to `attendanceCell`. */
  cells?: Record<AttendanceStatus, string>;
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
      {days.map((day, index) => (
        <span
          key={index}
          title={`${monthLabel} ${index + 1}: ${attendanceLabels[day.status]}${
            day.multiple ? " (multiple sessions)" : ""
          }`}
          className={cn("relative rounded-md", cells[day.status])}
        >
          {day.multiple && (
            <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
              <span className="size-1.5 rounded-full bg-brand-900" />
              <span className="size-1.5 rounded-full bg-surface-error-badge" />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
