"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CardEmptyState } from "@/components/student-dashboard/DashboardParts";
import {
  liveSessionQueries,
  sessionStanding,
  stillAhead,
  typeNames,
  upcomingRange,
  type LiveSession,
} from "@/lib/live-sessions";
import { useCurrentMinute } from "@/lib/use-current-minute";
import { cn } from "@/lib/utils";

/** Events shown before the rest wait for the calendar. */
const VISIBLE_EVENTS = 3;

/** A town hall stands out from classes and mentorship. */
function accentFor(session: LiveSession, live: boolean) {
  if (live) return "bg-text-success";
  if (session.type === "TOWNHALL") return "bg-text-warning";
  return "bg-brand-primary";
}

/** "24 Nov" and "7:00 PM", in the session's own time zone. */
function when(session: LiveSession) {
  const start = new Date(session.startsAt);
  const options = { timeZone: session.timeZone } as const;
  return {
    day: new Intl.DateTimeFormat("en-GB", {
      ...options,
      day: "numeric",
      month: "short",
    }).format(start),
    time: new Intl.DateTimeFormat("en-US", {
      ...options,
      hour: "numeric",
      minute: "2-digit",
    }).format(start),
  };
}

/** The student's next live sessions, with Join once one is open. */
export function UpcomingEvents() {
  const now = useCurrentMinute();
  // Fixed when the dashboard opens, so the query isn't refetched every minute.
  const [range] = React.useState(() => upcomingRange(Date.now()));
  const list = useQuery(liveSessionQueries.list(range));
  const events =
    now === null
      ? []
      : stillAhead(list.data ?? [], now).slice(0, VISIBLE_EVENTS);

  return (
    <section className="flex flex-col">
      <h2 className="mb-6 text-xl font-medium text-neutral-800">
        Upcoming Event
      </h2>
      {list.isPending || now === null ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-[76px] rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex min-h-58 flex-col rounded-2xl bg-white px-6 shadow-sm">
          <CardEmptyState
            icon={CalendarDays}
            title={
              list.isError
                ? "We couldn't load your events"
                : "No upcoming events"
            }
            description={
              list.isError
                ? "Check your connection, then refresh the page."
                : "Live classes and program meetings will show up here."
            }
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((session) => {
            const live = session.status === "live";
            // Students join once the host has started it.
            const { joinable } = sessionStanding(session, now, { early: false });
            const { day, time } = when(session);
            return (
              <li
                key={session.id}
                className={cn(
                  "flex items-center gap-4 rounded-2xl p-4",
                  live ? "bg-neutral-100 shadow-sm" : "bg-white",
                )}
              >
                <div className="w-16 shrink-0">
                  <p className="text-lg font-semibold text-neutral-800">
                    {day}
                  </p>
                  <p className="text-sm text-neutral-400">{time}</p>
                </div>
                <span
                  className={cn(
                    "h-10 w-[3px] shrink-0 rounded-full",
                    accentFor(session, live),
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-neutral-400">
                    {typeNames[session.type]}
                  </p>
                  <p className="truncate text-base font-medium text-neutral-800">
                    {session.title}
                  </p>
                </div>
                {live && (
                  <Badge variant="light" status="info">
                    Now
                  </Badge>
                )}
                {joinable && (
                  <Button
                    pill
                    nativeButton={false}
                    render={<Link href={`/student/live/${session.id}`} />}
                  >
                    Join
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
