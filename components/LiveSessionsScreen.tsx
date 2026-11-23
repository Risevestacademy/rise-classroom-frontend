"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Calendar03, MoreHorizontal, Time04, Track } from "@/assets/icons";
import { EditLiveSessionDialog } from "@/components/calendar/LiveSessionForm";
import { CohortTabs } from "@/components/cohorts/CohortTabs";
import { LessonVideo } from "@/components/lessons/LessonVideo";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SuccessToast } from "@/components/ui/toast";
import {
  liveSessionQueries,
  personName,
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
  cancelled: { label: "Cancelled", status: "error" },
} as const;

const order = { live: 0, upcoming: 1, completed: 2, cancelled: 3 };

/** Live first, then the next ones coming up, then the most recent past ones. */
function byWhen(a: LiveSession, b: LiveSession) {
  if (a.status !== b.status) return order[a.status] - order[b.status];
  const sooner = a.startsAt.localeCompare(b.startsAt);
  return a.status === "completed" ? -sooner : sooner;
}

/** Avatars shown before the rest collapse into "+N". */
const VISIBLE_GUESTS = 5;

const inTab = (session: LiveSession, tab: Tab) =>
  tab === "all" ||
  (tab === "upcoming"
    ? session.status !== "completed"
    : session.status === tab);

/**
 * The Live Sessions page admins and mentors share; each passes its own top nav.
 * Join goes to `${joinPath}/<id>`: the room itself, or a device check first.
 */
export function LiveSessionsScreen({
  topNav,
  joinPath = "/live",
  action,
  canEdit = false,
}: {
  topNav: React.ReactNode;
  joinPath?: string;
  /** Beside the title, such as the admin's "Schedule live session". */
  action?: React.ReactNode;
  /** The three-dot buttons open an edit dialog for upcoming sessions. */
  canEdit?: boolean;
}) {
  const [editing, setEditing] = React.useState<LiveSession | null>(null);
  const [saved, setSaved] = React.useState<string | null>(null);
  const dismissSaved = React.useCallback(() => setSaved(null), []);
  const onEdit = canEdit ? setEditing : undefined;
  const [tab, setTab] = React.useState<Tab>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const list = useQuery(liveSessionQueries.list());
  const all = React.useMemo(
    () => [...(list.data ?? [])].sort(byWhen),
    [list.data],
  );
  const sessions = all.filter((session) => inTab(session, tab));
  const selected = all.find((session) => session.id === selectedId);

  return (
    // On desktop the page fits the viewport so the list and the preview
    // scroll on their own instead of stretching each other.
    <div className="flex min-w-0 flex-1 flex-col lg:h-dvh lg:flex-none lg:overflow-hidden">
      {topNav}
      <div className="flex min-w-0 flex-1 flex-col lg:min-h-0 lg:flex-row">
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:overflow-y-auto lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl leading-8 font-semibold text-text-primary">
                Live Sessions
              </h1>
              <p className="mt-1 font-work text-sm text-text-secondary">
                Review your past mentoring sessions and stay informed about your
                next session.
              </p>
            </div>
            {action}
          </div>

          <CohortTabs
            label="Session status"
            tabs={tabs}
            value={tab}
            onChange={setTab}
            className="mt-6 shadow-[0_1px_3px_rgb(0_0_0/0.15)]"
          />

          {list.isError ? (
            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <p className="font-work text-sm text-text-secondary">
                We couldn&apos;t load your live sessions.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => list.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : !list.isPending && sessions.length === 0 ? (
            <p className="mt-10 text-center font-work text-sm text-text-secondary">
              {tab === "completed"
                ? "No completed sessions yet."
                : tab === "upcoming"
                  ? "No upcoming sessions. New ones will show here once they're scheduled."
                  : "No live sessions yet. They'll show here once they're scheduled."}
            </p>
          ) : null}

          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(3,220px)]">
            {list.isPending &&
              Array.from({ length: 6 }, (_, index) => (
                <li key={index}>
                  <Skeleton className="h-[186px] rounded-xl" />
                </li>
              ))}
            {sessions.map((session) => (
              <li key={session.id}>
                <SessionCard
                  session={session}
                  selected={session.id === selectedId}
                  onSelect={() => setSelectedId(session.id)}
                  onEdit={onEdit}
                />
              </li>
            ))}
          </ul>
        </main>

        <aside className="border-t border-border-default lg:w-[461px] lg:shrink-0 lg:overflow-y-auto lg:border-t-0 lg:border-l">
          {selected ? (
            <SessionPreview
              key={selected.id}
              session={selected}
              joinPath={joinPath}
              onEdit={onEdit}
            />
          ) : (
            <p className="flex min-h-[240px] items-center justify-center p-6 font-work text-sm text-text-primary lg:h-full">
              Select a session to preview
            </p>
          )}
        </aside>
      </div>

      {canEdit && (
        <EditLiveSessionDialog
          session={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={setSaved}
        />
      )}
      {saved && (
        <SuccessToast
          title="Live session updated"
          message={`“${saved}” has been updated`}
          onDismiss={dismissSaved}
        />
      )}
    </div>
  );
}

function SessionCard({
  session,
  selected,
  onSelect,
  onEdit,
}: {
  session: LiveSession;
  selected: boolean;
  onSelect: () => void;
  onEdit?: (session: LiveSession) => void;
}) {
  const badge = statusBadge[session.status];

  return (
    <article
      className={cn(
        "relative flex flex-col gap-8 rounded-xl border border-transparent p-3 shadow-[0_1px_3px_rgb(0_0_0/0.15)]",
        selected
          ? "border-border-focus bg-surface-subtle"
          : "bg-surface-default",
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
        <ActionsButton session={session} onEdit={onEdit} />
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
        <Guests sessionId={session.id} size={24} />
      </div>
    </article>
  );
}

function SessionPreview({
  session,
  joinPath,
  onEdit,
}: {
  session: LiveSession;
  joinPath: string;
  onEdit?: (session: LiveSession) => void;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const completed = session.status === "completed";
  const guests =
    useQuery(liveSessionQueries.participants(session.id)).data ?? [];

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
        <ActionsButton session={session} onEdit={onEdit} />
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
          {/* PENDING-BACKEND: who actually attended isn't recorded yet, so a
            past session lists everyone who was invited. */}
          {completed ? "Attendance" : "Participants"} ({guests.length})
        </h3>
        <div className="flex items-center justify-between gap-3">
          <Guests sessionId={session.id} size={40} />
          {guests.length > VISIBLE_GUESTS && (
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
            {guests.map((guest) => (
              <li
                key={guest.userId}
                className="flex items-center gap-3 border-b border-border-default p-3 last:border-b-0"
              >
                <PersonAvatar
                  name={guest.name}
                  src={guest.image ?? undefined}
                  colorKey={guest.userId}
                  size={40}
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-medium text-text-primary">
                    {personName({ id: guest.userId, ...guest })}
                  </p>
                  {guest.email && (
                    <p className="truncate text-sm text-text-secondary">
                      {guest.email}
                    </p>
                  )}
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
          render={<Link href={`${joinPath}/${session.id}`} />}
        >
          Join session
        </Button>
      )}
    </div>
  );
}

function Guests({ sessionId, size }: { sessionId: string; size: 24 | 40 }) {
  const guests =
    useQuery(liveSessionQueries.participants(sessionId)).data ?? [];
  const shown = guests.slice(0, VISIBLE_GUESTS);
  const rest = guests.length - shown.length;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((guest) => (
        <PersonAvatar
          key={guest.userId}
          name={guest.name}
          src={guest.image ?? undefined}
          colorKey={guest.userId}
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

function ActionsButton({
  session,
  onEdit,
}: {
  session: LiveSession;
  onEdit?: (session: LiveSession) => void;
}) {
  // Only a session that hasn't started can be changed.
  const editable = onEdit !== undefined && session.status === "upcoming";
  return (
    <button
      type="button"
      aria-label={
        editable ? `Edit ${session.title}` : `${session.title} actions`
      }
      onClick={editable ? () => onEdit(session) : undefined}
      className="relative z-10 flex size-6 shrink-0 items-center justify-center text-text-primary"
    >
      <MoreHorizontal className="size-5" />
    </button>
  );
}
