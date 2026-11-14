"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CardEmptyState,
  DashboardCard,
  IconTile,
  type Tone,
} from "@/components/student-dashboard/DashboardParts";
import { studentQueries } from "@/lib/student";
import { studentAssignmentQueries } from "@/lib/student-assignments";
import { upcomingDeadlines, type DeadlineState } from "@/lib/student-dashboard";
import { useStudentCurriculum } from "@/lib/student-lessons";

const stateMeta: Record<
  DeadlineState,
  { label: string; badge: "error" | "info" | "neutral"; tile: Tone }
> = {
  dueToday: { label: "Due today", badge: "error", tile: "error" },
  inProgress: { label: "In progress", badge: "info", tile: "info" },
  notStarted: { label: "Not started", badge: "neutral", tile: "success" },
};

const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/**
 * The next few things to hand in. Assignments open their page, the same one
 * the module page and the Assignments list link to.
 */
export function UpcomingDeadlinesCard({ className }: { className?: string }) {
  const curriculum = useStudentCurriculum();
  const enrollmentId = curriculum.enrollmentId ?? "";
  const submissions = useQuery({
    ...studentAssignmentQueries.enrollmentSubmissions(enrollmentId),
    enabled: enrollmentId.length > 0,
  });
  // Open tasks only; anything later than the first page isn't "upcoming" for a dashboard.
  const tasks = useQuery(studentQueries.weeklyTasks({ limit: 100 }));

  const isPending =
    curriculum.isPending || tasks.isPending || (enrollmentId !== "" && submissions.isPending);
  const failed = curriculum.error ?? submissions.error ?? tasks.error;

  return (
    <DashboardCard title="Upcoming deadlines" className={className}>
      {isPending ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : failed ? (
        <CardEmptyState
          icon={WifiOff}
          title="Couldn't load your deadlines"
          description="Check your internet connection and try again."
        />
      ) : (
        <DeadlineList
          deadlines={upcomingDeadlines(
            curriculum.topics,
            submissions.data?.items ?? [],
            tasks.data?.items ?? []
          )}
        />
      )}
    </DashboardCard>
  );
}

function DeadlineList({ deadlines }: { deadlines: ReturnType<typeof upcomingDeadlines> }) {
  if (deadlines.length === 0) {
    return (
      <CardEmptyState
        icon={ClipboardList}
        title="No deadlines yet"
        description="Assignment deadlines will show up here once they are assigned."
      />
    );
  }

  return (
    <ul className="divide-y divide-neutral-200">
      {deadlines.map((deadline) => {
        const meta = stateMeta[deadline.state];
        const body = (
          <>
            <IconTile icon={ClipboardList} tone={meta.tile} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-800">{deadline.title}</p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {deadline.kind} &middot; {dayFormat.format(new Date(deadline.dueAt))}
              </p>
            </div>
            <Badge variant="light" status={meta.badge}>
              {meta.label}
            </Badge>
          </>
        );

        return (
          <li key={deadline.key}>
            {deadline.href ? (
              <Link
                href={deadline.href}
                className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3 hover:bg-neutral-50"
              >
                {body}
              </Link>
            ) : (
              <div className="flex items-center gap-4 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
