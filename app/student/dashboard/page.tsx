"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Calendar,
  ArrowRight,
  ClipboardList,
  Radar,
  BookOpen,
} from "lucide-react";

import { ApiError } from "@/lib/api";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionQuery } from "@/lib/session-query";
import { studentQueries } from "@/lib/student";
import type { WeeklyTaskStatus } from "@/lib/instructor";

const taskStatus: Record<
  WeeklyTaskStatus,
  { label: string; badge: "success" | "warning" | "error" | "info" | "neutral" }
> = {
  PENDING: { label: "Not started", badge: "neutral" },
  IN_PROGRESS: { label: "In progress", badge: "info" },
  SUBMITTED: { label: "Submitted", badge: "warning" },
  REVIEWED: { label: "Reviewed", badge: "success" },
  OVERDUE: { label: "Overdue", badge: "error" },
};

function formatDue(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-neutral-200 p-4">
      {children}
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) {
  return (
    <Panel>
      <div className="flex items-start gap-3 py-2">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" />
        <div>
          <p className="text-sm font-semibold text-neutral-900">{title}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{message}</p>
        </div>
      </div>
    </Panel>
  );
}

export default function StudentDashboardPage() {
  const session = useQuery(sessionQuery());
  const progress = useQuery(studentQueries.progress());
  const tasks = useQuery(studentQueries.weeklyTasks({ week: "current", limit: 3 }));

  const user = session.data?.user;

  // A 404 here just means the student isn't enrolled on a track yet.
  const notEnrolled =
    progress.error instanceof ApiError && progress.error.status === 404;

  // Prefer the track they're still working through over a finished one.
  const enrollment =
    progress.data?.find((item) => !item.trackComplete) ?? progress.data?.[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            user={{
              name: user?.name ?? "Account",
              avatar: user?.image ?? "/default-avatar.png",
            }}
            isLoading={session.isPending}
          />
          <div>
            {session.isPending ? (
              <>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-neutral-900">
                  {user?.displayName ?? user?.name ?? "Student"}
                </p>
                {progress.isPending ? (
                  <Skeleton className="mt-1.5 h-3 w-24" />
                ) : (
                  enrollment && (
                    <p className="text-sm font-medium text-primary-500">
                      {enrollment.track.name}
                    </p>
                  )
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Calendar"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 text-neutral-500 hover:text-neutral-700"
          >
            <Calendar className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 text-neutral-500 hover:text-neutral-700"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            Continue Learning
          </h2>

          {progress.isPending ? (
            <Panel>
              <Skeleton className="h-[90px] w-full rounded-lg" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-2 w-full rounded-full" />
            </Panel>
          ) : notEnrolled || (!progress.isError && !enrollment) ? (
            <EmptyPanel
              icon={BookOpen}
              title="You're not enrolled on a track yet"
              message="Once your program admin enrolls you, your lessons will show up here."
            />
          ) : progress.isError || !enrollment ? (
            <EmptyPanel
              icon={BookOpen}
              title="Couldn't load your progress"
              message={progress.error?.message ?? "Please try again shortly."}
            />
          ) : (
            <Panel>
              <div className="relative h-[90px] overflow-hidden rounded-lg bg-[#E8F5F6] p-4">
                <span className="absolute top-3 left-6 h-12 w-12 rounded-full bg-primary-200/60" />
                <span className="absolute -top-4 left-14 h-16 w-16 rounded-full bg-primary-300/50" />
                <span className="absolute right-6 bottom-0 h-14 w-14 rounded-full bg-primary-300/40" />
                <p className="relative text-lg font-bold text-neutral-900">
                  {enrollment.track.name}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {enrollment.trackComplete
                    ? "Track complete 🎉"
                    : (enrollment.currentLesson?.title ??
                      "Your first lesson is waiting")}
                </p>
                <p className="text-xs text-neutral-500">
                  {enrollment.currentTopic?.title ?? enrollment.track.description}
                  {" · "}
                  {enrollment.progress.completedLessons} of{" "}
                  {enrollment.progress.totalLessons} lessons
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-2 flex-1 rounded-full bg-neutral-300">
                  <div
                    className="h-2 rounded-full bg-semantic-text-success"
                    style={{ width: `${enrollment.progress.percentage}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs font-medium text-neutral-700">
                  {enrollment.progress.percentage}% Complete
                </span>
                <button
                  type="button"
                  aria-label="Continue lesson"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Panel>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            Due This Week
          </h2>

          {tasks.isPending ? (
            <Panel>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </Panel>
          ) : tasks.isError ? (
            <EmptyPanel
              icon={ClipboardList}
              title="Couldn't load your tasks"
              message={tasks.error.message}
            />
          ) : (tasks.data?.items.length ?? 0) === 0 ? (
            <EmptyPanel
              icon={ClipboardList}
              title="Nothing due this week"
              message="Weekly tasks from your instructor will appear here."
            />
          ) : (
            <Panel>
              <ul className="flex flex-col divide-y divide-neutral-300">
                {tasks.data?.items.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        Due {formatDue(task.dueDate)}
                        {task.topic?.title && ` · ${task.topic.title}`}
                      </p>
                    </div>
                    <Badge
                      variant="light"
                      status={taskStatus[task.status].badge}
                    >
                      {taskStatus[task.status].label}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Your Week
        </h2>

        <Link
          href="/student/control-tower"
          className="flex items-center justify-between gap-4 rounded-lg border border-neutral-300 bg-white p-4 hover:bg-neutral-200/60"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F5F6] text-primary-500">
              <Radar className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Control Tower
              </p>
              <p className="text-xs text-neutral-500">
                Set your goals, track your progress, and reflect on your
                week.
              </p>
            </div>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>
    </div>
  );
}
