"use client";

import * as React from "react";

import { Calendar03, MoreHorizontal, Time04 } from "@/assets/icons";
import { AppTopNav } from "@/components/AppTopNav";
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
  upcoming: { label: "Upcoming", status: "info" },
  completed: { label: "Completed", status: "neutral" },
} as const;

export default function MentorLiveSessionsPage() {
  const [tab, setTab] = React.useState<Tab>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const sessions = sampleSessions.filter(
    (session) => tab === "all" || session.status === tab,
  );
  const selected = sampleSessions.find((session) => session.id === selectedId);

  return (
    // On desktop the page fits the viewport so the list and the preview
    // scroll on their own instead of stretching each other.
    <div className="flex min-w-0 flex-1 flex-col lg:h-dvh lg:flex-none lg:overflow-hidden">
      <AppTopNav
        basePath="/mentor"
        breadcrumb={[
          "Overview",
          { label: "Live Sessions", href: "/mentor/live-sessions" },
        ]}
      />
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

        <aside className="border-t border-border-default lg:w-[460px] lg:shrink-0 lg:overflow-y-auto lg:border-t-0 lg:border-l">
          {selected ? (
            <SessionPreview session={selected} />
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
  const upcoming = session.status === "upcoming";

  return (
    <article
      className={cn(
        "relative flex h-[200px] flex-col gap-8 rounded-xl border border-transparent p-3 shadow-[0_1px_3px_rgb(0_0_0/0.15)]",
        upcoming
          ? "bg-brand-300"
          : selected
            ? "border-border-focus bg-surface-subtle"
            : "bg-surface-default",
      )}
    >
      <div className="flex items-center justify-between">
        <Badge
          variant="light"
          status={badge.status}
          size="lg"
          className="bg-transparent"
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
        <Guests session={session} size={24} />
      </div>
    </article>
  );
}

function SessionPreview({ session }: { session: LiveSession }) {
  const completed = session.status === "completed";

  return (
    <div className="flex flex-col gap-8 px-6 pt-8 pb-8">
      <div className="flex flex-col gap-4">
        {completed && (
          <LessonVideo
            key={session.id}
            recordings={session.recordings}
            emptyMessage="No recording for this session yet"
          />
        )}

        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold text-text-primary">
            {session.title}
          </h2>
          {completed && <ActionsButton title={session.title} />}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-work text-sm font-medium text-text-secondary">
          <span className="flex items-center gap-2">
            <Calendar03 className="size-6 shrink-0" />
            {sessionDate(session.date)}
          </span>
          <span className="flex items-center gap-2">
            <Time04 className="size-6 shrink-0" />
            {sessionTime(session)}
          </span>
        </div>

        <section className="mt-4 flex flex-col gap-3">
          <h3 className="text-lg/6 font-semibold text-text-primary">
            Participants ({session.guests.length})
          </h3>
          <Guests session={session} size={40} />
        </section>

        {session.description && (
          <section className="mt-2 flex flex-col gap-3">
            <h3 className="text-lg/6 font-semibold text-text-primary">
              Description
            </h3>
            <p className="font-work text-sm text-text-primary">
              {session.description}
            </p>
          </section>
        )}
      </div>

      {!completed && (
        <Button
          variant="primary"
          size="medium"
          className="w-full"
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
  return (
    <div className={cn("flex", size === 24 ? "-space-x-2" : "-space-x-[14px]")}>
      {session.guests.map((guest) => (
        <PersonAvatar
          key={guest.id}
          name={guest.name}
          colorKey={guest.id}
          size={size}
          className="ring-[1.5px] ring-white"
        />
      ))}
    </div>
  );
}

function ActionsButton({ title }: { title: string }) {
  // The design has no menu for this button yet.
  return (
    <button
      type="button"
      aria-label={`${title} actions`}
      className="relative z-10 flex size-6 items-center justify-center text-text-primary"
    >
      <MoreHorizontal className="size-5" />
    </button>
  );
}
