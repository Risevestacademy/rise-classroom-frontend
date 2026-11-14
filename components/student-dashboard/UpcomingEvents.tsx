"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CardEmptyState } from "@/components/student-dashboard/DashboardParts";
import { getSampleEvents, type SampleEvent } from "@/lib/dashboard-sample-data";
import { cn } from "@/lib/utils";

// No events endpoint exists yet. Sample data fills this in local development
// only, so deployed builds never show made-up events to real students.
const SHOW_SAMPLE_DATA = process.env.NODE_ENV === "development";

const eventAccent: Record<SampleEvent["accent"], string> = {
  success: "bg-text-success",
  warning: "bg-text-warning",
  brand: "bg-brand-primary",
};

const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

export function UpcomingEvents() {
  const events = useMemo(() => (SHOW_SAMPLE_DATA ? getSampleEvents() : []), []);

  return (
    <section className="flex flex-col">
      <h2 className="mb-6 text-xl font-medium text-neutral-800">Upcoming Event</h2>
      {events.length === 0 ? (
        <div className="flex min-h-58 flex-col rounded-2xl bg-white px-6 shadow-sm">
          <CardEmptyState
            icon={CalendarDays}
            title="No upcoming events"
            description="Live classes and program meetings will show up here."
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li
              key={event.id}
              className={cn(
                "flex items-center gap-4 rounded-2xl p-4",
                event.live ? "bg-neutral-100 shadow-sm" : "bg-white"
              )}
            >
              <div className="w-16 shrink-0">
                <p className="text-lg font-semibold text-neutral-800">
                  {dayFormat.format(event.startsAt)}
                </p>
                <p className="text-sm text-neutral-400">{timeFormat.format(event.startsAt)}</p>
              </div>
              <span
                className={cn("h-10 w-[3px] shrink-0 rounded-full", eventAccent[event.accent])}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-400">{event.kind}</p>
                <p className="truncate text-base font-medium text-neutral-800">{event.title}</p>
              </div>
              {event.live && (
                <Badge variant="light" status="info">
                  Now
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
