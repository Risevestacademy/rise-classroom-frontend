"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  CircleCheck,
  ClipboardList,
  FileText,
  Link2,
  MessageSquareText,
  PenLine,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  submissionTypes,
  type SubmissionStatus,
  type SubmissionType,
} from "@/features/curriculum/types";
import type { WeeklyTask, WeeklyTaskStatus } from "@/lib/instructor";
import { studentQueries } from "@/lib/student";
import {
  assignmentHref,
  studentAssignmentQueries,
  type StudentSubmission,
} from "@/lib/student-assignments";

type TabKey = "todo" | "submitted" | "reviewed" | "missed";

/* One line in the table: a weekly task, or a curriculum assignment the student has started. */
type Row = {
  key: string;
  title: string;
  context: string | null;
  submitAs: SubmissionType;
  dueAt: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  isLate: boolean;
  grade: number | null;
  /* Set for curriculum assignments, which have a page; weekly tasks don't yet. */
  href: string | null;
  submissionStatus: SubmissionStatus | null;
};

type TabSetup = {
  label: string;
  statuses: WeeklyTaskStatus[];
  /* Curriculum submission statuses that belong in this tab. */
  submissionStatuses: SubmissionStatus[];
  /** Ends the "4 assignments …" line above the table. */
  countLabel: string;
  /** Heading of the third column; its cell is rendered by `renderTabCell`. */
  column: string;
  sort: (a: Row, b: Row) => number;
  empty: {
    icon: LucideIcon;
    tone: "brand" | "success";
    title: string;
    description: string;
  };
};

const byDueDate = (a: Row, b: Row) =>
  (a.dueAt ?? "￿").localeCompare(b.dueAt ?? "￿");
const newest = (key: "dueAt" | "submittedAt" | "reviewedAt") =>
  (a: Row, b: Row) =>
    (b[key] ?? "").localeCompare(a[key] ?? "");

// The API's statuses grouped into the design's four tabs.
const tabConfig: Record<TabKey, TabSetup> = {
  todo: {
    label: "To do",
    statuses: ["PENDING", "IN_PROGRESS"],
    submissionStatuses: ["DRAFT", "CHANGES_REQUESTED"],
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
    submissionStatuses: ["SUBMITTED", "UNDER_REVIEW"],
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
    submissionStatuses: ["GRADED"],
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
    submissionStatuses: [],
    countLabel: "missed",
    column: "Closed",
    sort: newest("dueAt"),
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

function dueBadge(dueAt: string | null) {
  if (!dueAt) return { label: "No deadline", status: "neutral" as const };
  if (new Date(dueAt).getTime() < Date.now()) {
    return { label: "Overdue", status: "error" as const };
  }
  const days = daysUntil(dueAt);
  if (days <= 0) return { label: "Due today", status: "warning" as const };
  if (days === 1) return { label: "Due tomorrow", status: "warning" as const };
  return { label: `${days} days left`, status: "warning" as const };
}

function taskRow(task: WeeklyTask): Row {
  return {
    key: `task-${task.id}`,
    title: task.title,
    context: task.topic?.title ?? null,
    /* The weekly task API only accepts a link as a submission. */
    submitAs: "LINK",
    dueAt: task.dueDate,
    submittedAt: task.submittedAt ?? null,
    reviewedAt: task.reviewedAt ?? null,
    isLate: task.isLate,
    grade: null,
    href: null,
    submissionStatus: null,
  };
}

function submissionRow(submission: StudentSubmission): Row {
  return {
    key: `submission-${submission.id}`,
    title: submission.assignment?.title ?? "Assignment",
    context: "Lesson assignment",
    submitAs: submission.assignment?.submissionType ?? submission.submissionType,
    dueAt: submission.assignment?.dueAt ?? null,
    submittedAt: submission.submittedAt ?? null,
    reviewedAt: submission.reviewedAt ?? null,
    isLate: submission.isLate,
    grade: submission.grade ?? null,
    href: assignmentHref(submission.assignmentId),
    submissionStatus: submission.status,
  };
}

const submitAsIcons: Record<SubmissionType, LucideIcon> = {
  LINK: Link2,
  FILE_UPLOAD: Upload,
  TEXT: PenLine,
};

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

  /* Curriculum assignments the student has started, from every track they're on. */
  const progressQuery = useQuery(studentQueries.progress());
  const submissionQueries = useQueries({
    queries: (progressQuery.data ?? []).map((enrollment) =>
      studentAssignmentQueries.enrollmentSubmissions(enrollment.enrollmentId),
    ),
  });
  const submissions = submissionQueries.flatMap((q) => q.data?.items ?? []);

  const isPending =
    statusQueries.some((q) => q.isPending) ||
    progressQuery.isPending ||
    submissionQueries.some((q) => q.isPending);
  const error =
    statusQueries.find((q) => q.error)?.error ??
    submissionQueries.find((q) => q.error)?.error;
  const tabSubmissions = submissions.filter((submission) =>
    setup.submissionStatuses.includes(submission.status),
  );
  const rows = [
    ...statusQueries.flatMap((q) => (q.data?.items ?? []).map(taskRow)),
    ...tabSubmissions.map(submissionRow),
  ].sort(setup.sort);
  const taskTotal = statusQueries.reduce(
    (sum, q) => sum + (q.data?.total ?? 0),
    0,
  );
  const total = taskTotal + tabSubmissions.length;
  const loadedTasks = rows.length - tabSubmissions.length;
  const hasNoTasksAtAll =
    activeTab === "todo" &&
    anyTasksQuery.data?.total === 0 &&
    submissions.length === 0;

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
      ) : !isPending && rows.length === 0 ? (
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
                  : rows.map((row) => {
                      const SubmitIcon = submitAsIcons[row.submitAs];
                      return (
                        <tr
                          key={row.key}
                          className="relative border-b border-neutral-200 has-[a:hover]:bg-neutral-50"
                        >
                          <td className="px-6 py-4">
                            {row.href ? (
                              /* The link stretches over the whole row, so any cell opens it. */
                              <Link
                                href={row.href}
                                className="font-medium text-neutral-800 after:absolute after:inset-0"
                              >
                                {row.title}
                              </Link>
                            ) : (
                              <p className="font-medium text-neutral-800">
                                {row.title}
                              </p>
                            )}
                            {row.context && (
                              <p className="mt-0.5 text-xs text-neutral-500">
                                {row.context}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="flex items-center gap-1.5 text-neutral-600">
                              <SubmitIcon className="h-4 w-4" />
                              {submissionTypes[row.submitAs]}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-neutral-600">
                            {renderTabCell(activeTab, row)}
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadges tab={activeTab} row={row} />
                          </td>
                          <td className="px-4 py-4 text-neutral-500">
                            <ChevronRight aria-hidden className="h-4 w-4" />
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>

          {taskTotal > loadedTasks && !isPending && (
            <p className="text-xs text-neutral-500">
              Showing the first {loadedTasks} of {taskTotal} weekly tasks.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function renderTabCell(tab: TabKey, row: Row) {
  switch (tab) {
    case "todo":
    case "missed":
      return formatDateTime(row.dueAt);
    case "submitted":
      return formatDateTime(row.submittedAt);
    case "reviewed":
      return row.grade !== null ? (
        <span className="font-medium text-neutral-800">{row.grade}/100</span>
      ) : (
        <span
          title="Weekly task results aren't available from the API yet"
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

function rowBadge(tab: TabKey, row: Row) {
  if (row.submissionStatus === "CHANGES_REQUESTED") {
    return { label: "Changes requested", status: "error" as const };
  }
  if (row.submissionStatus === "UNDER_REVIEW") {
    return { label: "Under review", status: "warning" as const };
  }
  return tab === "todo" ? dueBadge(row.dueAt) : tabBadges[tab];
}

function StatusBadges({ tab, row }: { tab: TabKey; row: Row }) {
  const badge = rowBadge(tab, row);

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Badge variant="light" status={badge.status}>
        <FileText />
        {badge.label}
      </Badge>
      {(tab === "submitted" || tab === "reviewed") && row.isLate && (
        <Badge variant="light" status="warning">
          Late
        </Badge>
      )}
    </span>
  );
}
