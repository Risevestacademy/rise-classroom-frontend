"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  ClipboardList,
  ClipboardCheck,
  AlertTriangle,
  Layers,
  ArrowUpRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { instructorQueries, type WeeklyTaskStatus } from "@/lib/instructor";
import { sessionQuery } from "@/lib/session-query";

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

const taskStatusBadge: Record<
  WeeklyTaskStatus,
  "success" | "warning" | "error" | "info" | "neutral"
> = {
  PENDING: "neutral",
  IN_PROGRESS: "info",
  SUBMITTED: "warning",
  REVIEWED: "success",
  OVERDUE: "error",
};

function formatDueDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function InstructorDashboardPage() {
  const session = useQuery(sessionQuery());
  const myTracks = useQuery(instructorQueries.myTracks());

  const assignments = myTracks.data ?? [];
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Default to the first assignment once it arrives, without stranding the
  // selection if the instructor's assignments change.
  const selected =
    assignments.find((assignment) => assignment.id === selectedId) ??
    assignments[0];

  const scope = selected
    ? { trackId: selected.trackId, cohortId: selected.cohortId }
    : {};

  const students = useQuery(instructorQueries.students(scope));
  const awaitingReview = useQuery(
    instructorQueries.weeklyTaskCount({ ...scope, status: "SUBMITTED" })
  );
  const overdue = useQuery(
    instructorQueries.weeklyTaskCount({ ...scope, status: "OVERDUE" })
  );
  const reviewed = useQuery(
    instructorQueries.weeklyTaskCount({ ...scope, status: "REVIEWED" })
  );
  const recentTasks = useQuery(
    instructorQueries.weeklyTasks({ ...scope, limit: 6 })
  );

  const instructorName = session.data?.user.firstName ?? "Instructor";
  const studentCount = students.data?.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {session.isPending ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              `${greeting()}, ${instructorName}`
            )}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {selected
              ? `${selected.track.name}${selected.cohort ? ` · ${selected.cohort.name}` : ""}`
              : "Here's what's happening in your tracks"}
          </p>
        </div>

        {myTracks.isPending ? (
          <Skeleton className="h-10 w-48" />
        ) : (
          assignments.length > 1 && (
            <select
              aria-label="Select track"
              value={selected?.id ?? ""}
              onChange={(event) => setSelectedId(event.target.value)}
              className="h-10 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700"
            >
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.track.name}
                  {assignment.cohort ? ` · ${assignment.cohort.name}` : ""}
                </option>
              ))}
            </select>
          )
        )}
      </div>

      {!myTracks.isPending && assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white py-16 text-center">
          <Layers className="h-12 w-12 text-neutral-300" />
          <p className="font-semibold text-neutral-900">
            No tracks assigned yet
          </p>
          <p className="max-w-80 text-sm text-neutral-500">
            Once an admin assigns you to a track and cohort, your students and
            their weekly tasks will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Students"
              value={studentCount}
              isPending={myTracks.isPending || students.isPending}
              isError={students.isError}
              description="In this track and cohort"
              icon={Users}
              iconWrapperClassName="bg-primary-50 text-primary-500"
            />
            <MetricCard
              title="Awaiting Review"
              value={awaitingReview.data}
              isPending={myTracks.isPending || awaitingReview.isPending}
              isError={awaitingReview.isError}
              description="Submitted tasks you haven't graded"
              icon={ClipboardList}
              iconWrapperClassName="bg-semantic-surface-warning-badge text-semantic-text-warning"
            />
            <MetricCard
              title="Reviewed"
              value={reviewed.data}
              isPending={myTracks.isPending || reviewed.isPending}
              isError={reviewed.isError}
              description="Tasks you've given feedback on"
              icon={ClipboardCheck}
              iconWrapperClassName="bg-semantic-surface-success-badge text-semantic-text-success"
            />
            <MetricCard
              title="Overdue"
              value={overdue.data}
              isPending={myTracks.isPending || overdue.isPending}
              isError={overdue.isError}
              description="Past the due date, not submitted"
              icon={AlertTriangle}
              iconWrapperClassName="bg-semantic-surface-error-badge text-semantic-text-error"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DashboardCard
              title="Weekly Tasks"
              subtitle="The most recent tasks in this cohort"
              action={
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-medium text-primary-500"
                >
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              }
            >
              {myTracks.isPending || recentTasks.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : recentTasks.isError ? (
                <EmptyPanel message="Couldn't load weekly tasks." />
              ) : (recentTasks.data?.items.length ?? 0) === 0 ? (
                <EmptyPanel message="No weekly tasks have been set for this cohort yet." />
              ) : (
                <ul className="space-y-3">
                  {recentTasks.data?.items.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {task.title}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Due {formatDueDate(task.dueDate)}
                          {task.isLate && " · submitted late"}
                        </p>
                      </div>
                      <Badge
                        status={taskStatusBadge[task.status]}
                        variant="light"
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>

            <DashboardCard
              title="Students"
              subtitle="Everyone you're teaching in this cohort"
              action={
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-medium text-primary-500"
                >
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              }
            >
              {myTracks.isPending || students.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : students.isError ? (
                <EmptyPanel message="Couldn't load your students." />
              ) : (students.data?.length ?? 0) === 0 ? (
                <EmptyPanel message="No students are enrolled in this track and cohort yet." />
              ) : (
                <ul className="divide-y divide-neutral-200">
                  {students.data?.slice(0, 6).map((student) => (
                    <li
                      key={student.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-500">
                        {initials(student.user.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {student.user.name}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {student.user.email}
                        </p>
                      </div>
                      {student.user.onboardingStatus === "INVITED" && (
                        <Badge status="warning" variant="light">
                          Invited
                        </Badge>
                      )}
                      {student.user.status === "SUSPENDED" && (
                        <Badge status="error" variant="light">
                          Suspended
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
          </div>
        </>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-10 text-center">
      <p className="max-w-72 text-sm text-neutral-500">{message}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  isPending,
  isError,
  description,
  icon: Icon,
  iconWrapperClassName,
}: {
  title: string;
  value?: number;
  isPending: boolean;
  isError: boolean;
  description: string;
  icon: React.ElementType;
  iconWrapperClassName: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-300 bg-white p-5">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          iconWrapperClassName
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-neutral-500">{title}</p>
        {isPending ? (
          <Skeleton className="mt-1 h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold text-neutral-900">
            {isError ? "—" : (value ?? 0)}
          </p>
        )}
      </div>
      {isPending ? (
        <Skeleton className="h-4 w-full" />
      ) : (
        <p className="line-clamp-2 text-sm text-neutral-500">
          {isError ? "Couldn't load this figure." : description}
        </p>
      )}
    </div>
  );
}

function DashboardCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col rounded-xl border border-neutral-300 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="mt-6 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
