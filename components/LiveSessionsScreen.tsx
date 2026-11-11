"use client";

import * as React from "react";

import { Calendar03, MoreHorizontal, Time04, Track } from "@/assets/icons";
import { CohortTabs } from "@/components/cohorts/CohortTabs";
import { LessonVideo } from "@/components/lessons/LessonVideo";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  sampleSessions,
  sessionDate,
  sessionTime,
  type LiveSession,
} from "@/lib/live-sessions";
import { cn } from "@/lib/utils";

const tabs = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
] as const;

type Tab = (typeof tabs)[number]["value"];

const statusBadge = {
  live: { label: "Live now", status: "success" },
  upcoming: { label: "Upcoming", status: "info" },
  completed: { label: "Completed", status: "neutral" },
} as const;

/** Avatars shown before the rest collapse into "+N". */
const VISIBLE_GUESTS = 5;

const inTab = (session: LiveSession, tab: Tab) =>
  tab === "all" ||
  (tab === "upcoming" ? session.status !== "completed" : session.status === tab);

/** The Live Sessions page admins and mentors share; each passes its own top nav. */
export function LiveSessionsScreen({ topNav }: { topNav: React.ReactNode }) {
  const [tab, setTab] = React.useState<Tab>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const sessions = sampleSessions.filter((session) => inTab(session, tab));
  const selected = sampleSessions.find((session) => session.id === selectedId);

  return (
    // On desktop the page fits the viewport so the list and the preview
    // scroll on their own instead of stretching each other.
    <div className="flex min-w-0 flex-1 flex-col lg:h-dvh lg:flex-none lg:overflow-hidden">
      {topNav}
      <div className="flex min-w-0 flex-1 flex-col lg:min-h-0 lg:flex-row">
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:overflow-y-auto lg:p-8">
          <h1 className="text-2xl leading-8 font-semibold text-text-primary">
            Live Sessions
          </h1>
          <p className="mt-1 font-work text-sm text-text-secondary">
            Review your past mentoring sessions and stay informed about your
            next session.
          </p>

          <CohortTabs
            label="Session status"
            tabs={tabs}
            value={tab}
            onChange={setTab}
            className="mt-6 shadow-[0_1px_3px_rgb(0_0_0/0.15)]"
          />

          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(3,220px)]">
            {sessions.map((session) => (
              <li key={session.id}>
                <SessionCard
                  session={session}
                  selected={session.id === selectedId}
                  onSelect={() => setSelectedId(session.id)}
                />
              </li>
            ))}
          </ul>
        </main>

        <aside className="border-t border-border-default lg:w-[461px] lg:shrink-0 lg:overflow-y-auto lg:border-t-0 lg:border-l">
          {selected ? (
            <SessionPreview key={selected.id} session={selected} />
          ) : (
            <p className="flex min-h-[240px] items-center justify-center p-6 font-work text-sm text-text-primary lg:h-full">
              Select a session to preview
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function SessionCard({
  session,
  selected,
  onSelect,
}: {
  session: LiveSession;
  selected: boolean;
  onSelect: () => void;
}) {
  const badge = statusBadge[session.status];

  return (
    <article
      className={cn(
        "relative flex flex-col gap-8 rounded-xl border border-transparent p-3 shadow-[0_1px_3px_rgb(0_0_0/0.15)]",
        selected ? "border-border-focus bg-surface-subtle" : "bg-surface-default",
      )}
    >
      <div className="flex items-center justify-between">
        <Badge
          variant="light"
          status={badge.status}
          size="lg"
          className="bg-surface-brand"
        >
          {badge.label}
        </Badge>
        <ActionsButton title={session.title} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-black">
          <button
            type="button"
            aria-pressed={selected}
            onClick={onSelect}
            className="cursor-pointer text-left after:absolute after:inset-0 after:rounded-xl"
          >
            {session.title}
          </button>
        </h2>
        <p className="flex items-center gap-2 font-work text-[13px]/[18px] text-text-secondary">
          <Calendar03 className="size-4 shrink-0 text-icon-secondary" />
          {sessionDate(session.date)}
        </p>
        <p className="flex items-center gap-2 font-work text-[13px]/[18px] text-text-secondary">
          <Track className="size-4 shrink-0 text-icon-secondary" />
          {session.trackName}
        </p>
        <Guests session={session} size={24} />
      </div>
    </article>
  );
}

function SessionPreview({ session }: { session: LiveSession }) {
  const [showAll, setShowAll] = React.useState(false);
  const completed = session.status === "completed";

  return (
    <div className="flex flex-col gap-3 p-6">
      {completed && (
        <LessonVideo
          recordings={session.recordings}
          emptyMessage="No recording for this session yet"
        />
      )}

      <div className="flex items-start justify-between gap-3 py-2.5">
        <h2 className="text-xl font-semibold text-text-primary">
          {session.title}
        </h2>
        <ActionsButton title={session.title} />
      </div>

      <div className="flex flex-col gap-3 font-work text-sm font-medium text-text-secondary">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-3">
            <Calendar03 className="size-6 shrink-0" />
            {sessionDate(session.date)}
          </span>
          <span className="flex items-center gap-3">
            <Time04 className="size-6 shrink-0" />
            {sessionTime(session)}
          </span>
        </div>
        <span className="flex items-center gap-3">
          <Track className="size-6 shrink-0" />
          {session.trackName}
        </span>
      </div>

      {session.description && (
        <section className="mt-3 flex flex-col gap-2">
          <h3 className="text-lg/6 font-semibold text-text-primary">
            Description
          </h3>
          <p className="text-sm text-text-primary">{session.description}</p>
        </section>
      )}

      <section className="mt-3 flex flex-col gap-3">
        <h3 className="text-lg/6 font-semibold text-text-primary">
          {completed ? "Attendance" : "Participants"} ({session.guests.length})
        </h3>
        <div className="flex items-center justify-between gap-3">
          <Guests session={session} size={40} />
          {session.guests.length > VISIBLE_GUESTS && (
            <Button
              variant="tertiary"
              aria-expanded={showAll}
              onClick={() => setShowAll((open) => !open)}
            >
              {showAll ? "Collapse list" : "See full list"}
            </Button>
          )}
        </div>
        {showAll && (
          <ul className="flex flex-col gap-3 rounded-xl bg-surface-default p-3 shadow-[0_1px_4px_0_rgb(0_0_0/0.25)]">
            {session.guests.map((guest) => (
              <li
                key={guest.id}
                className="flex items-center gap-3 border-b border-border-default p-3 last:border-b-0"
              >
                <PersonAvatar
                  name={guest.name}
                  colorKey={guest.id}
                  size={40}
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-medium text-text-primary">
                    {guest.name}
                  </p>
                  <p className="truncate text-sm text-text-secondary">
                    {guest.email}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {session.status === "live" && (
        <Button
          variant="primary"
          size="medium"
          className="mt-6 w-full"
          nativeButton={false}
          render={<a href={session.link} target="_blank" rel="noopener noreferrer" />}
        >
          Join session
        </Button>
      )}
    </div>
  );
}

function Guests({ session, size }: { session: LiveSession; size: 24 | 40 }) {
  const shown = session.guests.slice(0, VISIBLE_GUESTS);
  const rest = session.guests.length - shown.length;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((guest) => (
        <PersonAvatar
          key={guest.id}
          name={guest.name}
          colorKey={guest.id}
          size={size}
          className="ring-[1.5px] ring-white"
        />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-full ring-[1.5px] ring-white",
            size === 24
              ? "size-6 bg-surface-brand font-work text-xs text-text-brand"
              : "size-10 bg-surface-subtle text-base font-medium tracking-[-0.176px] text-black",
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

function ActionsButton({ title }: { title: string }) {
  // The design has no menu for this button yet.
  return (
    <button
      type="button"
      aria-label={`${title} actions`}
      className="relative z-10 flex size-6 shrink-0 items-center justify-center text-text-primary"
    >
      <MoreHorizontal className="size-5" />
    </button>
  );
}
