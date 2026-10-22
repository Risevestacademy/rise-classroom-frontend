"use client";

import * as React from "react";

import { ArrowLeft01, ArrowRight01, Calendar03 } from "@/assets/icons";
import { cn } from "@/lib/utils";
import { attendanceByMonth } from "@/app/admin/students/[id]/profile-data";
import {
  AttendanceGrid,
  Card,
  CardHeader,
  attendanceCell,
  attendanceLabels,
  type AttendanceStatus,
} from "./shared";

const MONTHS_SHOWN = 4;

const navButtonClass =
  "flex size-10 items-center justify-center rounded-full border border-border-default bg-interactive-secondary-default text-text-primary hover:bg-interactive-secondary-hover";

function monthAt(start: { year: number; month: number }, offset: number) {
  const date = new Date(start.year, start.month + offset, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function shortMonth(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "short",
  });
}

export function AttendanceTab({ firstName }: { firstName: string }) {
  // The design opens on Sep - Dec 2026, where the sample sessions are.
  const [start, setStart] = React.useState({ year: 2026, month: 8 });

  const months = Array.from({ length: MONTHS_SHOWN }, (_, index) =>
    monthAt(start, index),
  );
  const first = months[0];
  const last = months[MONTHS_SHOWN - 1];
  const rangeLabel =
    first.year === last.year
      ? `${shortMonth(first.year, first.month)} - ${shortMonth(last.year, last.month)} ${last.year}`
      : `${shortMonth(first.year, first.month)} ${first.year} - ${shortMonth(last.year, last.month)} ${last.year}`;

  return (
    <Card className="gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardHeader
          title="Attendance"
          subtitle={`Live sessions attendance for ${firstName}.`}
          subtitleClassName="text-text-primary"
        />
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label="Previous months"
            onClick={() => setStart(monthAt(start, -MONTHS_SHOWN))}
            className={navButtonClass}
          >
            <ArrowLeft01 className="size-5" />
          </button>
          <span className="flex h-10 items-center gap-1 rounded-lg border border-border-default bg-surface-default px-2 py-1 font-work text-sm text-text-primary">
            <Calendar03 className="size-5 text-icon-secondary" />
            {rangeLabel}
          </span>
          <button
            type="button"
            aria-label="Next months"
            onClick={() => setStart(monthAt(start, MONTHS_SHOWN))}
            className={navButtonClass}
          >
            <ArrowRight01 className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-5 overflow-x-auto">
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
              className="flex w-[258px] shrink-0 flex-col gap-4"
            >
              <h3 className="text-lg/6 font-semibold text-black">{name}</h3>
              <AttendanceGrid
                size="large"
                monthLabel={shortMonth(year, month)}
                leadingBlanks={new Date(year, month, 1).getDay()}
                days={days}
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
