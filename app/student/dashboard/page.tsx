"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ClipboardList, Play, StickyNote, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionQuery } from "@/lib/session-query";
import { studentQueries } from "@/lib/student";
import type { WeeklyTaskStatus } from "@/lib/instructor";
import {
  getSampleActivity,
  getSampleEvents,
  type SampleActivity,
} from "@/lib/dashboard-sample-data";

type BadgeStatus = "success" | "warning" | "error" | "info" | "neutral";
type Tone = BadgeStatus | "brand";

// The lesson route doesn't exist yet; send "Resume" to the My learning page.
const RESUME_HREF = "/student/my-learning";

const taskStatus: Record<
  WeeklyTaskStatus,
  { label: string; tone: BadgeStatus }
> = {
  PENDING: { label: "Not started", tone: "neutral" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  SUBMITTED: { label: "Submitted", tone: "warning" },
  REVIEWED: { label: "Reviewed", tone: "success" },
  OVERDUE: { label: "Overdue", tone: "error" },
};

const tileTone: Record<Tone, string> = {
  success: "bg-surface-success-badge text-text-success",
  info: "bg-surface-info-badge text-text-info",
  brand: "bg-surface-brand text-brand-primary",
  warning: "bg-surface-warning-badge text-text-warning",
  error: "bg-surface-error-badge text-text-error",
  neutral: "bg-neutral-100 text-neutral-500",
};

const eventAccent = {
  success: "bg-text-success",
  warning: "bg-text-warning",
  brand: "bg-brand-primary",
} as const;

const activityIcon: Record<
  SampleActivity["kind"],
  { icon: React.ElementType; tone: Tone }
> = {
  recording: { icon: Video, tone: "success" },
  assignment: { icon: ClipboardList, tone: "brand" },
  note: { icon: StickyNote, tone: "info" },
  event: { icon: Video, tone: "success" },
};

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});
const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});
const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "always" });

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function isToday(value: string | Date) {
  return new Date(value).toDateString() === new Date().toDateString();
}

function timeAgo(minutes: number) {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return relativeFormat.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return relativeFormat.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 7) return relativeFormat.format(-days, "day");
  return relativeFormat.format(-Math.floor(days / 7), "week");
}

function getTaskBadge(task: { status: WeeklyTaskStatus; dueDate: string }): {
  label: string;
  tone: BadgeStatus;
} {
  const isOpen = task.status === "PENDING" || task.status === "IN_PROGRESS";
  if (isOpen && isToday(task.dueDate)) {
    return { label: "Due today", tone: "error" };
  }
  return taskStatus[task.status];
}

function IconTile({
  icon: Icon,
  tone,
}: {
  icon: React.ElementType;
  tone: Tone;
}) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        tileTone[tone],
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white px-6 pt-8 pb-6 shadow-sm">
      <h2 className="text-xl font-medium text-neutral-800">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-neutral-350" />
      <div>
        <p className="text-sm font-semibold text-neutral-800">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-400">{message}</p>
      </div>
    </div>
  );
}

function DarkMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/10 p-4">
      <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-brand-200">{message}</p>
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const session = useQuery(sessionQuery());
  const progress = useQuery(studentQueries.progress());
  const tasks = useQuery(
    studentQueries.weeklyTasks({ week: "current", limit: 3 }),
  );

  // Sample data: there are no event or activity endpoints yet.
  const events = useMemo(() => getSampleEvents(), []);
  const activity = useMemo(() => getSampleActivity(), []);

  const user = session.data?.user;
  const firstName = (user?.displayName ?? user?.name ?? "").split(" ")[0];

  // A 404 here just means the student isn't enrolled on a track yet.
  const notEnrolled =
    progress.error instanceof ApiError && progress.error.status === 404;

  // Prefer the track they're still working through over a finished one.
  const enrollment =
    progress.data?.find((item) => !item.trackComplete) ?? progress.data?.[0];

  const percentage = enrollment
    ? Math.min(100, Math.max(0, enrollment.progress.percentage))
    : 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        {session.isPending ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-medium text-neutral-800">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
        )}
        <p className="mt-1 text-sm text-neutral-500">
          Here&apos;s what&apos;s happening in your learning journey
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <section className="rounded-3xl bg-brand-primary px-6 pt-8 pb-8 text-white">
            <h2 className="text-xl font-medium">Continue Learning</h2>

            {progress.isPending ? (
              <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <Skeleton className="aspect-[2/1] w-full rounded-2xl bg-white/10" />
                <div className="flex flex-col justify-center gap-3">
                  <Skeleton className="h-3 w-28 bg-white/10" />
                  <Skeleton className="h-5 w-40 bg-white/10" />
                  <Skeleton className="h-2 w-full bg-white/10" />
                  <Skeleton className="h-10 w-36 bg-white/10" />
                </div>
              </div>
            ) : notEnrolled || (!progress.isError && !enrollment) ? (
              <DarkMessage
                title="You're not enrolled on a track yet"
                message="Once your program admin enrolls you, your lessons will show up here."
              />
            ) : progress.isError || !enrollment ? (
              <DarkMessage
                title="Couldn't load your progress"
                message={progress.error?.message ?? "Please try again shortly."}
              />
            ) : (
              <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <Link
                  href={RESUME_HREF}
                  aria-label="Resume lesson"
                  className="group relative block aspect-[2/1] overflow-hidden rounded-2xl bg-brand-100"
                >
                  <span className="absolute -top-6 -left-6 h-28 w-28 rounded-full bg-brand-primary/90" />
                  <span className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-brand-300" />
                  <span className="absolute -bottom-10 left-8 h-36 w-36 rounded-full bg-brand-400" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800/70 text-white transition-transform group-hover:scale-105">
                      <Play className="h-5 w-5 fill-current" />
                    </span>
                  </span>
                </Link>

                <div className="flex min-w-0 flex-col">
                  <p className="text-sm text-brand-200">
                    {enrollment.progress.completedLessons} of{" "}
                    {enrollment.progress.totalLessons} lessons completed
                  </p>
                  <p className="mt-6 text-sm text-brand-200">
                    {enrollment.currentTopic?.title ?? enrollment.track.name}
                  </p>
                  <p className="mt-1 text-xl font-medium">
                    {enrollment.trackComplete
                      ? "Track complete 🎉"
                      : (enrollment.currentLesson?.title ??
                        "Your first lesson is waiting")}
                  </p>

                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                    className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brand-100"
                  >
                    <div
                      className="h-full rounded-full bg-brand-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-brand-200">
                    {percentage}% complete
                  </p>

                  <div className="mt-auto pt-4">
                    <Link
                      href={RESUME_HREF}
                      className="inline-flex h-10 items-center rounded-lg bg-brand-300 px-5 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-200"
                    >
                      {enrollment.trackComplete ? "Review track" : "Resume learning"}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </section>

          <Card title="Recent Activity">
            <ul className="divide-y divide-neutral-200">
              {activity.map((item) => {
                const { icon, tone } = activityIcon[item.kind];
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 py-3"
                  >
                    <IconTile icon={icon} tone={tone} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-800">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-400">
                        {item.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {timeAgo(item.minutesAgo)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <section>
            <h2 className="mb-6 text-xl font-medium text-neutral-800">
              Upcoming Event
            </h2>
            <ul className="flex flex-col gap-3">
              {events.map((event) => (
                <li
                  key={event.id}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl p-4",
                    event.live ? "bg-neutral-100 shadow-sm" : "bg-white",
                  )}
                >
                  <div className="w-16 shrink-0">
                    <p className="text-lg font-semibold text-neutral-800">
                      {dayFormat.format(event.startsAt)}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {timeFormat.format(event.startsAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "h-10 w-[3px] shrink-0 rounded-full",
                      eventAccent[event.accent],
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-400">{event.kind}</p>
                    <p className="truncate text-base font-medium text-neutral-800">
                      {event.title}
                    </p>
                  </div>
                  {event.live && (
                    <Badge variant="light" status="info">
                      Now
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-neutral-200" />

          <Card title="Upcoming deadlines">
            {tasks.isPending ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tasks.isError ? (
              <EmptyState
                icon={ClipboardList}
                title="Couldn't load your tasks"
                message={tasks.error.message}
              />
            ) : (tasks.data?.items.length ?? 0) === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Nothing due this week"
                message="Weekly tasks from your instructor will appear here."
              />
            ) : (
              <ul className="divide-y divide-neutral-200">
                {tasks.data?.items.map((task) => {
                  const badge = getTaskBadge(task);
                  return (
                    <li
                      key={task.id}
                      className="flex items-center gap-4 py-3"
                    >
                      <IconTile icon={ClipboardList} tone={badge.tone} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-800">
                          {task.title}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-400">
                          Weekly task · {dayFormat.format(new Date(task.dueDate))}
                        </p>
                      </div>
                      <Badge variant="light" status={badge.tone}>
                        {badge.label}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}