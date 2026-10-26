"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  CircleCheck,
  ClipboardList,
  FileText,
  Link2,
  MessageSquareText,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WeeklyTask, WeeklyTaskStatus } from "@/lib/instructor";
import { studentQueries } from "@/lib/student";

type TabKey = "todo" | "submitted" | "reviewed" | "missed";

type TabSetup = {
  label: string;
  statuses: WeeklyTaskStatus[];
  /** Ends the "4 assignments …" line above the table. */
  countLabel: string;
  /** Heading of the third column; its cell is rendered by `renderTabCell`. */
  column: string;
  sort: (a: WeeklyTask, b: WeeklyTask) => number;
  empty: {
    icon: LucideIcon;
    tone: "brand" | "success";
    title: string;
    description: string;
  };
};

const byDueDate = (a: WeeklyTask, b: WeeklyTask) =>
  a.dueDate.localeCompare(b.dueDate);
const newest = (key: "dueDate" | "submittedAt" | "reviewedAt") =>
  (a: WeeklyTask, b: WeeklyTask) =>
    (b[key] ?? "").localeCompare(a[key] ?? "");

// The API's statuses grouped into the design's four tabs.
const tabConfig: Record<TabKey, TabSetup> = {
  todo: {
    label: "To do",
    statuses: ["PENDING", "IN_PROGRESS"],
    countLabel: "to do",
    column: "Deadline",
    sort: byDueDate,
    empty: {
      icon: CircleCheck,
      tone: "success",
      title: "You’re all caught up",
      description:
        "You have no assignments due right now. New ones will appear here after your next class.",
    },
  },
  submitted: {
    label: "Submitted",
    statuses: ["SUBMITTED"],
    countLabel: "submitted",
    column: "Submitted",
    sort: newest("submittedAt"),
    empty: {
      icon: Upload,
      tone: "brand",
      title: "Nothing waiting for review",
      description:
        "Assignments you’ve submitted will appear here until your instructor reviews them.",
    },
  },
  reviewed: {
    label: "Reviewed",
    statuses: ["REVIEWED"],
    countLabel: "reviewed",
    column: "Result",
    sort: newest("reviewedAt"),
    empty: {
      icon: MessageSquareText,
      tone: "brand",
      title: "No reviewed assignments yet",
      description:
        "Once your instructor reviews your work, your results and feedback will appear here.",
    },
  },
  missed: {
    label: "Missed",
    statuses: ["OVERDUE"],
    countLabel: "missed",
    column: "Closed",
    sort: newest("dueDate"),
    empty: {
      icon: CircleCheck,
      tone: "success",
      title: "No missed assignments",
      description: "Great job keeping up with your deadlines.",
    },
  },
};

const tabKeys = Object.keys(tabConfig) as TabKey[];

function isTabKey(value: unknown): value is TabKey {
  return typeof value === "string" && value in tabConfig;
}

// The API returns at most 100 tasks per request.
const pageSize = 100;

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDateTime(value: string | null | undefined) {
  return value ? dateTimeFormat.format(new Date(value)) : "—";
}

/** Whole calendar days from today until `value` (negative once it's passed). */
function daysUntil(value: string) {
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round(
    (startOfDay(new Date(value)) - startOfDay(new Date())) / 86_400_000,
  );
}

function dueBadge(task: WeeklyTask) {
  if (new Date(task.dueDate).getTime() < Date.now()) {
    return { label: "Overdue", status: "error" as const };
  }
  const days = daysUntil(task.dueDate);
  if (days <= 0) return { label: "Due today", status: "warning" as const };
  if (days === 1) return { label: "Due tomorrow", status: "warning" as const };
  return { label: `${days} days left`, status: "warning" as const };
}

export default function StudentAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = React.use(searchParams);
  const activeTab: TabKey = isTabKey(tab) ? tab : "todo";
  const setup = tabConfig[activeTab];
  const router = useRouter();

  // One request per status in the active tab ("To do" covers two).
  const statusQueries = useQueries({
    queries: setup.statuses.map((status) =>
      studentQueries.weeklyTasks({ status, limit: pageSize }),
    ),
  });
  // Only `total` is read, to tell "no tasks ever" apart from "none left to do".
  const anyTasksQuery = useQuery(studentQueries.weeklyTasks({ limit: 1 }));

  const isPending = statusQueries.some((q) => q.isPending);
  const error = statusQueries.find((q) => q.error)?.error;
  const tasks = statusQueries
    .flatMap((q) => q.data?.items ?? [])
    .sort(setup.sort);
  const total = statusQueries.reduce((sum, q) => sum + (q.data?.total ?? 0), 0);
  const hasNoTasksAtAll =
    activeTab === "todo" && anyTasksQuery.data?.total === 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Assignments</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Assignments from all your lessons
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          router.replace(`/student/assignments?tab=${value}`, { scroll: false })
        }
      >
        <TabsList className="gap-2 bg-transparent p-0 group-data-horizontal/tabs:h-auto">
          {tabKeys.map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="h-9 flex-none rounded-full bg-white px-4 font-normal text-neutral-700 shadow-xs data-active:bg-brand-primary data-active:text-white data-active:shadow-none"
            >
              {tabConfig[key].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? (
        <div className="rounded-2xl bg-neutral-100 px-6 py-16 text-center text-sm text-neutral-500">
          We couldn&apos;t load your assignments. {error.message}
        </div>
      ) : !isPending && tasks.length === 0 ? (
        <div className="rounded-2xl bg-neutral-100 px-6">
          {hasNoTasksAtAll ? (
            <EmptyState
              icon={ClipboardList}
              tone="brand"
              title="No assignments yet"
              description="Your instructor will share assignments after your first live class. They’ll show up here."
              action={
                <Button
                  variant="secondary"
                  size="medium"
                  disabled
                  title="The class schedule isn't available yet"
                  className="border-neutral-200 text-neutral-800"
                >
                  View schedule
                </Button>
              }
            />
          ) : (
            <EmptyState {...setup.empty} />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-neutral-500">
            {isPending ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              `${total} assignment${total === 1 ? "" : "s"} ${setup.countLabel}`
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="bg-neutral-100 text-xs text-neutral-500">
                <tr>
                  <th className="rounded-l-xl px-6 py-4 font-normal">
                    Assignment
                  </th>
                  <th className="px-4 py-4 font-normal">Submit as</th>
                  <th className="px-4 py-4 font-normal">{setup.column}</th>
                  <th className="px-4 py-4 font-normal">Status</th>
                  <th className="w-12 rounded-r-xl px-4 py-4">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isPending
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <tr key={index} className="border-b border-neutral-200">
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-44" />
                          <Skeleton className="mt-2 h-3 w-24" />
                        </td>
                        <td className="px-4 py-4">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-4 py-4">
                          <Skeleton className="h-4 w-28" />
                        </td>
                        <td className="px-4 py-4">
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </td>
                        <td />
                      </tr>
                    ))
                  : tasks.map((task) => (
                      <tr key={task.id} className="border-b border-neutral-200">
                        <td className="px-6 py-4">
                          <p className="font-medium text-neutral-800">
                            {task.title}
                          </p>
                          {task.topic?.title && (
                            <p className="mt-0.5 text-xs text-neutral-500">
                              {task.topic.title}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {/* The API only accepts a link as a submission. */}
                          <span className="flex items-center gap-1.5 text-neutral-600">
                            <Link2 className="h-4 w-4" />
                            Link
                          </span>
                        </td>
                        <td className="px-4 py-4 text-neutral-600">
                          {renderTabCell(activeTab, task)}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadges tab={activeTab} task={task} />
                        </td>
                        <td className="px-4 py-4 text-neutral-500">
                          <ChevronRight aria-hidden className="h-4 w-4" />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {total > tasks.length && !isPending && (
            <p className="text-xs text-neutral-500">
              Showing the first {tasks.length} of {total}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function renderTabCell(tab: TabKey, task: WeeklyTask) {
  switch (tab) {
    case "todo":
    case "missed":
      return formatDateTime(task.dueDate);
    case "submitted":
      return formatDateTime(task.submittedAt);
    case "reviewed":
      return (
        <span
          title="Grades aren't available from the API yet"
          className="text-neutral-400"
        >
          —
        </span>
      );
  }
}

const tabBadges: Record<
  Exclude<TabKey, "todo">,
  { label: string; status: "info" | "success" | "error" }
> = {
  submitted: { label: "Submitted", status: "info" },
  reviewed: { label: "Reviewed", status: "success" },
  missed: { label: "Missed", status: "error" },
};

function StatusBadges({ tab, task }: { tab: TabKey; task: WeeklyTask }) {
  const badge = tab === "todo" ? dueBadge(task) : tabBadges[tab];

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Badge variant="light" status={badge.status}>
        <FileText />
        {badge.label}
      </Badge>
      {tab === "submitted" && task.isLate && (
        <Badge variant="light" status="warning">
          Late
        </Badge>
      )}
    </span>
  );
}
