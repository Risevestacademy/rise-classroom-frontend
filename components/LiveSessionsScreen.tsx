"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Calendar03, Cancel01, MoreHorizontal, Repeat, Time04, Track } from "@/assets/icons";
import { CancelSessionDialog } from "@/components/calendar/CancelSessionDialog";
import { EditLiveSessionDialog } from "@/components/calendar/LiveSessionForm";
import { CohortTabs } from "@/components/cohorts/CohortTabs";
import { LessonVideo } from "@/components/lessons/LessonVideo";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { SuccessToast } from "@/components/ui/toast";
import {
  byRelevance,
  liveSessionQueries,
  nextOfEachSeries,
  personName,
  sessionDate,
  sessionStanding,
  sessionTime,
  type AttendanceRecord,
  type LiveSession,
  type SessionParticipant,
} from "@/lib/live-sessions";
import { sessionQuery } from "@/lib/session-query";
import { useCurrentMinute } from "@/lib/use-current-minute";
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

/**
 * The previewed session, kept a moment after it closes so the panel can slide
 * away. `opening` is only set when it opens from nothing, not when switching.
 */
function usePresence(id: string | null) {
  const [shown, setShown] = React.useState({ id, opening: false });
  if (id !== null && id !== shown.id) setShown({ id, opening: shown.id === null });
  React.useEffect(() => {
    if (id !== null) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setShown({ id: null, opening: false }), still ? 0 : 200);
    return () => clearTimeout(timer);
  }, [id]);
  return { ...shown, leaving: id === null && shown.id !== null };
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
  openSessionId = null,
}: {
  topNav: React.ReactNode;
  joinPath?: string;
  /** A session to preview straight away, such as one a notification links to. */
  openSessionId?: string | null;
  /** Beside the title, such as the admin's "Schedule live session". */
  action?: React.ReactNode;
  /**
   * The three-dot buttons let people edit or cancel upcoming sessions: all of
   * them, or with "own" only the ones they host.
   */
  canEdit?: boolean | "own";
}) {
  const [editing, setEditing] = React.useState<LiveSession | null>(null);
  const [cancelling, setCancelling] = React.useState<LiveSession | null>(null);
  const [done, setDone] = React.useState<{ title: string; message: string } | null>(null);
  const dismissDone = React.useCallback(() => setDone(null), []);
  const me = useQuery({ ...sessionQuery(), enabled: canEdit === "own" }).data?.user.id;
  const actionsFor = (session: LiveSession) =>
    canEdit === true || (canEdit === "own" && session.hostId === me)
      ? { onEdit: setEditing, onCancel: setCancelling }
      : undefined;
  const [tab, setTab] = React.useState<Tab>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(openSessionId);

  const list = useQuery(liveSessionQueries.list());
  const all = React.useMemo(
    () => nextOfEachSeries(list.data ?? []).sort(byRelevance),
    [list.data],
  );
  const sessions = all.filter((session) => inTab(session, tab));
  const panel = usePresence(selectedId);
  // From the full list, so a notification can open an occurrence whose card is collapsed.
  const previewed = list.data?.find((session) => session.id === panel.id);
  const previewOpen = selectedId !== null && previewed !== undefined;
  const toggle = (id: string) =>
    setSelectedId((current) => (current === id ? null : id));

  const previewRef = React.useRef<HTMLElement>(null);
  // Focus moves into the preview so Escape closes it straight away.
  React.useEffect(() => {
    if (selectedId !== null) previewRef.current?.focus({ preventScroll: true });
  }, [selectedId]);

  // The mobile sheet covers the list, so the page behind it shouldn't scroll.
  React.useEffect(() => {
    if (selectedId === null || !window.matchMedia?.("(max-width: 1023px)").matches) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [selectedId]);

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

          <ul
            className={cn(
              "mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2",
              previewOpen ? "lg:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-4 xl:grid-cols-5",
            )}
          >
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
                  onSelect={() => toggle(session.id)}
                  actions={actionsFor(session)}
                />
              </li>
            ))}
          </ul>
        </main>

        {previewed && (
          // Beside the list on desktop, the frame widens from nothing so the cards slide
          // over. On smaller screens it's a bottom sheet over the list instead.
          <div
            onClick={(event) => {
              if (event.target === event.currentTarget) setSelectedId(null);
            }}
            className={cn(
              "max-lg:fixed max-lg:inset-0 max-lg:z-40 max-lg:flex max-lg:items-end max-lg:bg-neutral-800/40",
              "lg:w-[360px] lg:shrink-0 lg:overflow-hidden lg:border-l lg:border-border-default",
              panel.leaving
                ? "max-lg:motion-safe:animate-out max-lg:motion-safe:fade-out-0 max-lg:motion-safe:duration-200 max-lg:motion-safe:fill-mode-forwards motion-safe:lg:animate-[preview-panel-close_200ms_cubic-bezier(0.4,0,1,1)_forwards]"
                : panel.opening &&
                    "max-lg:motion-safe:animate-in max-lg:motion-safe:fade-in-0 max-lg:motion-safe:duration-200 motion-safe:lg:animate-[preview-panel-open_280ms_cubic-bezier(0.2,0,0,1)]",
            )}
          >
            <aside
              ref={previewRef}
              tabIndex={-1}
              aria-label="Session preview"
              onKeyDown={(event) => {
                if (event.key !== "Escape") return;
                event.preventDefault();
                setSelectedId(null);
              }}
              className={cn(
                "max-lg:max-h-[85dvh] max-lg:w-full max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:rounded-t-3xl max-lg:bg-surface-default max-lg:shadow-[0_-8px_24px_rgb(0_0_0/0.12)]",
                "outline-none lg:h-full lg:w-[360px] lg:overflow-y-auto",
                panel.leaving
                  ? "motion-safe:animate-out motion-safe:fade-out-0 motion-safe:duration-200 motion-safe:fill-mode-forwards max-lg:motion-safe:slide-out-to-bottom-1/2 lg:motion-safe:slide-out-to-right-6"
                  : "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 max-lg:motion-safe:slide-in-from-bottom-1/2 lg:motion-safe:slide-in-from-right-6",
              )}
            >
              <div aria-hidden className="flex justify-center pt-3 lg:hidden">
                <span className="h-1 w-10 rounded-full bg-neutral-300" />
              </div>
              <SessionPreview
                key={previewed.id}
                session={previewed}
                joinPath={joinPath}
                actions={actionsFor(previewed)}
                onClose={() => setSelectedId(null)}
              />
            </aside>
          </div>
        )}
      </div>

      {canEdit && (
        <>
          <EditLiveSessionDialog
            session={editing}
            onOpenChange={(open) => !open && setEditing(null)}
            onSaved={(title) =>
              setDone({ title: "Live session updated", message: `“${title}” has been updated` })
            }
          />
          <CancelSessionDialog
            event={cancelling}
            onOpenChange={(open) => !open && setCancelling(null)}
            onCancelled={(title) =>
              setDone({ title: "Live session cancelled", message: `“${title}” has been cancelled` })
            }
          />
        </>
      )}
      {done && <SuccessToast title={done.title} message={done.message} onDismiss={dismissDone} />}
    </div>
  );
}

function SessionCard({
  session,
  selected,
  onSelect,
  actions,
}: {
  session: LiveSession;
  selected: boolean;
  onSelect: () => void;
  actions?: SessionActions;
}) {
  const badge = statusBadge[session.status];

  return (
    <article
      className={cn(
        "relative flex h-full min-w-0 flex-col gap-6 rounded-xl border border-transparent p-3 shadow-[0_1px_3px_rgb(0_0_0/0.15)] transition-[translate,box-shadow,background-color,border-color] duration-200 hover:shadow-[0_4px_12px_rgb(0_0_0/0.12)] motion-safe:hover:-translate-y-0.5",
        selected
          ? "border-border-focus bg-surface-subtle"
          : "bg-surface-default",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="light"
          status={badge.status}
          size="lg"
          className="bg-surface-brand"
        >
          {badge.label}
        </Badge>
        <ActionsMenu session={session} actions={actions} />
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="line-clamp-2 text-sm font-medium break-words text-black">
          <button
            type="button"
            aria-pressed={selected}
            onClick={onSelect}
            className="cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-border-focus"
          >
            {session.title}
          </button>
        </h2>
        <p className="flex min-w-0 items-center gap-2 font-work text-[13px]/[18px] text-text-secondary">
          <Calendar03 className="size-4 shrink-0 text-icon-secondary" />
          <span className="truncate">{sessionDate(session.date)}</span>
        </p>
        <RepeatNote session={session} className="gap-2 text-[13px]/[18px]" iconClassName="size-4 text-icon-secondary" />
        <p className="flex min-w-0 items-center gap-2 font-work text-[13px]/[18px] text-text-secondary">
          <Track className="size-4 shrink-0 text-icon-secondary" />
          <span className="truncate">{session.trackName}</span>
        </p>
        <Guests sessionId={session.id} size={24} />
      </div>
    </article>
  );
}

function SessionPreview({
  session,
  joinPath,
  actions,
  onClose,
}: {
  session: LiveSession;
  joinPath: string;
  actions?: SessionActions;
  onClose: () => void;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const now = useCurrentMinute();
  const completed = session.status === "completed";
  // A finished session shows who came; until then, everyone invited.
  const attendance = useQuery({
    ...liveSessionQueries.attendance(session.id),
    enabled: completed,
  });
  const showsAttendance = completed && attendance.isSuccess;
  const participants = useQuery({
    ...liveSessionQueries.participants(session.id),
    enabled: !completed || attendance.isError,
  });
  const people: Person[] = showsAttendance
    ? attendance.data
    : (participants.data ?? []);
  const present = showsAttendance
    ? attendance.data.filter((record) => record.status === "PRESENT")
    : people;

  return (
    <div className="flex flex-col gap-3 p-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
      {completed && <SessionRecordingPlayer session={session} />}

      <div className="flex items-start justify-between gap-3 py-2.5">
        <h2 className="min-w-0 text-xl font-semibold break-words text-text-primary">
          {session.title}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <ActionsMenu session={session} actions={actions} />
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="flex size-6 items-center justify-center rounded-md text-text-primary transition-colors hover:bg-surface-subtle"
          >
            <Cancel01 className="size-5" />
          </button>
        </div>
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
        <RepeatNote session={session} className="gap-3" iconClassName="size-6" />
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
          {completed ? "Attendance" : "Participants"} ({present.length})
        </h3>
        <div className="flex items-center justify-between gap-3">
          {showsAttendance && people.length === 0 ? (
            <p className="font-work text-sm text-text-secondary">
              No one joined this session.
            </p>
          ) : (
            <Avatars people={present} size={40} />
          )}
          {(people.length > VISIBLE_GUESTS ||
            people.length > present.length) && (
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
            {people.map((guest) => (
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
                  {"status" in guest ? (
                    <p
                      className={cn(
                        "truncate text-sm",
                        guest.status === "PRESENT"
                          ? "text-text-success"
                          : "text-text-secondary",
                      )}
                    >
                      {attendanceNote(guest)}
                    </p>
                  ) : (
                    guest.email && (
                      <p className="truncate text-sm text-text-secondary">
                        {guest.email}
                      </p>
                    )
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Opens shortly before the start too, so the host can start it. */}
      {now !== null && sessionStanding(session, now).joinable && (
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

type Person = (SessionParticipant | AttendanceRecord) & { email?: string };

/** A finished session's recording, once the backend has processed it. */
function SessionRecordingPlayer({ session }: { session: LiveSession }) {
  const recording = useQuery(liveSessionQueries.recording(session.id));
  const ready = recording.data?.status === "READY";
  const url = useQuery({
    ...liveSessionQueries.recordingUrl(session.id),
    enabled: ready,
  });
  const recordings =
    ready && url.data
      ? [
          {
            id: recording.data!.id,
            lessonId: session.id,
            title: session.title,
            url: url.data,
            durationSec: recording.data!.durationSeconds,
          },
        ]
      : [];
  const status = recording.data?.status;

  return (
    <LessonVideo
      recordings={recordings}
      emptyMessage={
        recording.isPending || (ready && url.isPending)
          ? "Loading the recording…"
          : status === "RECORDING" || status === "PROCESSING"
            ? "The recording is still processing. Check back soon."
            : status === "FAILED" || url.isError
              ? "We couldn't load the recording for this session"
              : "No recording for this session"
      }
    />
  );
}

/** "Present · 45 min" or "Absent". */
function attendanceNote(record: AttendanceRecord) {
  if (record.status === "ABSENT") return "Absent";
  return `Present · ${Math.max(1, Math.round(record.connectedSeconds / 60))} min`;
}

/** The invited people's faces, for a session card. */
function Guests({ sessionId, size }: { sessionId: string; size: 24 | 40 }) {
  const guests =
    useQuery(liveSessionQueries.participants(sessionId)).data ?? [];
  return <Avatars people={guests} size={size} />;
}

function Avatars({
  people: guests,
  size,
}: {
  people: Pick<Person, "userId" | "name" | "image">[];
  size: 24 | 40;
}) {
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

/** "Weekly on Friday", for a session that repeats. */
function RepeatNote({
  session,
  className,
  iconClassName,
}: {
  session: LiveSession;
  className: string;
  iconClassName: string;
}) {
  const repeat = useQuery(liveSessionQueries.repeat(session)).data;
  if (!session.seriesId) return null;
  return (
    <p className={cn("flex min-w-0 items-center", className)}>
      <Repeat aria-hidden className={cn("shrink-0", iconClassName)} />
      <span className="truncate">{repeat || "Repeats"}</span>
    </p>
  );
}

type SessionActions = {
  onEdit: (session: LiveSession) => void;
  onCancel: (session: LiveSession) => void;
};

const menuItemClass =
  "cursor-pointer rounded-lg px-3 py-2 font-work text-sm text-text-primary hover:bg-neutral-100 focus:bg-neutral-100";

function ActionsMenu({
  session,
  actions,
}: {
  session: LiveSession;
  actions?: SessionActions;
}) {
  const trigger =
    "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-md text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-focus";
  // Only a session that hasn't started can be changed.
  if (!actions || session.status !== "upcoming") {
    return (
      <button type="button" aria-label={`${session.title} actions`} className={trigger}>
        <MoreHorizontal className="size-5" />
      </button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`${session.title} actions`} className={cn(trigger, "cursor-pointer hover:bg-neutral-100")}>
        <MoreHorizontal className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-40 rounded-xl border-none bg-white p-1 shadow-lg ring-0">
        <DropdownMenuItem onClick={() => actions.onEdit(session)} className={menuItemClass}>
          Edit session
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.onCancel(session)}
          className={cn(menuItemClass, "text-text-error")}
        >
          Cancel session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
