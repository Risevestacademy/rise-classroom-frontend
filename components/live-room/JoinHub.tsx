"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { addDays, fromDateKey, monthNames, shortDate, toDateKey } from "@/lib/calendar";
import { liveSessionQueries, sessionSpan, sessionTime, zonedParts, type LiveSession } from "@/lib/live-sessions";
import { cn } from "@/lib/utils";
import { roomButton } from "./RoomStatus";

const weekLetters = ["M", "T", "W", "T", "F", "S", "S"];

const subscribeToMinutes = (onChange: () => void) => {
  const timer = setInterval(onChange, 15_000);
  return () => clearInterval(timer);
};
const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000;

/** Monday-first week around `date`. */
function weekOf(date: Date) {
  const monday = addDays(date, -((date.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** How early the host can go in and start a session. */
const START_WINDOW_MS = 15 * 60_000;

/**
 * Where a session stands right now, for its badge and whether Join works.
 * Join opens shortly before the start too, so the host can start it; anyone
 * else who's early is told it hasn't started yet.
 */
function standing(session: LiveSession, now: number) {
  if (session.status === "live") return { joinable: true, label: "Live now", status: "success" } as const;
  if (session.status !== "upcoming") return { joinable: false, label: "Ended", status: "neutral" } as const;
  const { start } = sessionSpan(session);
  const joinable = start.getTime() - now <= START_WINDOW_MS;
  const minutes = Math.ceil((start.getTime() - now) / 60_000);
  if (minutes <= 0) return { joinable, label: "Starting soon", status: "info" } as const;
  const label =
    minutes < 60 ? `In ${minutes} ${minutes === 1 ? "Minute" : "Minutes"}` : `In ${Math.round(minutes / 60)} ${minutes < 90 ? "Hour" : "Hours"}`;
  return { joinable, label, status: "info" } as const;
}

/** The week's sessions, with a day either side so no time zone loses one. */
function weekRange(week: Date[]) {
  const iso = (date: Date) => `${toDateKey(date)}T00:00:00Z`;
  return { from: iso(addDays(week[0], -1)), to: iso(addDays(week[6], 2)) };
}

/**
 * Join a live session: paste a link, or pick one on the calendar for the
 * week. `serverNow` is when the server rendered, so the first render matches.
 */
export function JoinHub({
  serverNow,
  deviceCheckPath,
}: {
  serverNow: number;
  /** Joining goes to `${deviceCheckPath}/${id}`. */
  deviceCheckPath: string;
}) {
  const router = useRouter();
  const today = zonedParts(new Date(serverNow).toISOString()).date;
  const [selected, setSelected] = React.useState(today);
  const [link, setLink] = React.useState("");
  const [linkError, setLinkError] = React.useState<string | null>(null);
  const now = React.useSyncExternalStore(subscribeToMinutes, currentMinute, () => serverNow);

  const week = weekOf(fromDateKey(selected));
  const list = useQuery(liveSessionQueries.list(weekRange(week)));
  const sessions = list.data ?? [];
  const daysWithSessions = new Set(sessions.map((session) => session.date));
  const onDay = sessions
    .filter((session) => session.date === selected)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const selectedDate = fromDateKey(selected);

  function joinWithLink(event: React.FormEvent) {
    event.preventDefault();
    const id = sessionIdFromLink(link);
    if (!id) {
      setLinkError("That isn't a Rise Classroom session link. Check it and try again.");
      return;
    }
    router.push(`${deviceCheckPath}/${id}`);
  }

  return (
    <main className="flex flex-1 justify-center px-4 pt-[52px] pb-16 sm:px-8">
      <div className="flex w-full max-w-[726px] flex-col items-center gap-11">
        <form onSubmit={joinWithLink} className="flex w-full max-w-[352px] flex-col items-center gap-3">
          <label htmlFor="session-link" className="text-sm font-medium text-text-primary">
            Join with a link
          </label>
          <div
            className={cn(
              "flex h-[52px] w-full items-center overflow-hidden rounded-full border bg-white focus-within:border-border-focus",
              linkError ? "border-border-error" : "border-border-default",
            )}
          >
            <span className="flex h-full items-center border-r border-border-default px-3.5 text-base text-text-secondary">
              https://
            </span>
            <input
              id="session-link"
              value={link}
              onChange={(event) => {
                setLink(event.target.value);
                setLinkError(null);
              }}
              placeholder="www.classroom.com"
              aria-invalid={Boolean(linkError)}
              aria-describedby={linkError ? "session-link-error" : undefined}
              className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-base text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
          {linkError && (
            <p id="session-link-error" role="alert" className="text-center text-sm text-text-error">
              {linkError}
            </p>
          )}
          <button type="submit" disabled={!link.trim()} className={cn(roomButton.primary, "disabled:text-text-disabled")}>
            Join live session
          </button>
        </form>

        <div className="flex w-full max-w-[326px] flex-col gap-3">
          <p className="flex h-10 items-center justify-center rounded-full bg-surface-subtle text-base font-medium text-text-primary">
            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </p>
          <div role="group" aria-label="Pick a day" className="grid grid-cols-7 gap-2">
            {weekLetters.map((letter, index) => (
              <span
                key={index}
                aria-hidden
                className="flex size-10 items-center justify-center bg-surface-subtle text-sm text-text-secondary"
              >
                {letter}
              </span>
            ))}
            {week.map((day) => {
              const key = toDateKey(day);
              const isSelected = key === selected;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${shortDate(day)}${daysWithSessions.has(key) ? ", has live sessions" : ""}`}
                  onClick={() => setSelected(key)}
                  className={cn(
                    "relative flex size-10 cursor-pointer items-center justify-center text-sm transition-colors",
                    isSelected
                      ? "rounded-full bg-interactive-primary-default text-white"
                      : "rounded-lg bg-surface-subtle text-text-primary hover:bg-neutral-200",
                  )}
                >
                  {day.getDate()}
                  {daysWithSessions.has(key) && (
                    <span
                      aria-hidden
                      className={cn("absolute bottom-1 size-1 rounded-full", isSelected ? "bg-white" : "bg-text-primary")}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <section className="flex w-full flex-col gap-3">
          <h1 className="text-base font-medium text-black">
            On the calendar {selected === today ? "today" : shortDate(selectedDate)}
          </h1>
          {list.isPending ? (
            <p role="status" className="rounded-[32px] bg-surface-brand px-10 py-12 text-center text-sm text-text-secondary">
              Loading sessions…
            </p>
          ) : list.isError ? (
            <p className="rounded-[32px] bg-surface-brand px-10 py-12 text-center text-sm text-text-secondary">
              We couldn&apos;t load your sessions.{" "}
              <button type="button" onClick={() => list.refetch()} className="cursor-pointer font-medium text-text-brand underline">
                Try again
              </button>
            </p>
          ) : onDay.length === 0 ? (
            <p className="rounded-[32px] bg-surface-brand px-10 py-12 text-center text-sm text-text-secondary">
              No live sessions on this day.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {onDay.map((session) => {
                const state = standing(session, now);
                return (
                  <li
                    key={session.id}
                    className="flex flex-col gap-6 rounded-[32px] bg-surface-brand p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10"
                  >
                    <div className="flex min-w-0 flex-col items-start gap-1">
                      <Badge variant="light" status={state.status} size="lg">
                        {state.label}
                      </Badge>
                      <h2 className="text-2xl/8 font-semibold text-text-primary">{session.title}</h2>
                      <p className="text-sm font-medium text-text-secondary">{sessionTime(session)}</p>
                    </div>
                    {state.joinable ? (
                      <Link href={`${deviceCheckPath}/${session.id}`} className={cn(roomButton.primary, "shrink-0 border-brand-300")}>
                        Join live session
                      </Link>
                    ) : (
                      <button type="button" disabled className={cn(roomButton.primary, "shrink-0 disabled:text-text-disabled")}>
                        Join live session
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

/** The session id from a pasted room link (`…/live/<id>`), with or without the scheme. */
function sessionIdFromLink(value: string) {
  const text = value.trim();
  try {
    const url = new URL(/^https?:\/\//.test(text) ? text : `https://${text}`);
    return url.pathname.match(/\/live\/([^/?#]+)/)?.[1] ?? null;
  } catch {
    return null;
  }
}
