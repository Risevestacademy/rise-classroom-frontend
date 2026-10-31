"use client";

import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ChevronRight, UserRound } from "lucide-react";

import { AppTopNav } from "@/components/AppTopNav";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Card, CardHeader } from "@/components/student-profile/shared";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  controlTowerQueries,
  formatWeekRange,
  latestWeek as latestOf,
  summarizeKpis,
  type Mentee,
  type WeeklyMetric,
  type WeeklyMetricStatus,
} from "@/lib/control-tower";

/* What the mentor needs to know about a mentee's latest week. */
const latestWeek: Record<
  WeeklyMetricStatus,
  { label: string; status: "neutral" | "info" | "warning" | "success" }
> = {
  DRAFT: { label: "Writing this week", status: "neutral" },
  SUBMITTED: { label: "Waiting for review", status: "warning" },
  REVIEWED: { label: "Reviewed", status: "success" },
  COMPLETED: { label: "Completed", status: "success" },
};

function menteeHref(studentProfileId: string) {
  return `/mentor/students/${studentProfileId}`;
}

export default function MentorStudentsPage() {
  const menteesQuery = useQuery(controlTowerQueries.mentees());
  /* Each mentee's weeks, to show and sort by their latest one (a mentor has at most 4). */
  const weekQueries = useQueries({
    queries: (menteesQuery.data ?? []).map((mentee) =>
      controlTowerQueries.weeklyMetrics(mentee.student.id),
    ),
  });
  const latestById = new Map(
    (menteesQuery.data ?? []).map((mentee, index) => [
      mentee.student.id,
      latestOf(weekQueries[index]?.data),
    ]),
  );
  const isWaiting = (mentee: Mentee) =>
    latestById.get(mentee.student.id)?.status === "SUBMITTED";
  /* Mentees whose week is waiting for review come first. */
  const mentees = [...(menteesQuery.data ?? [])].sort(
    (a, b) =>
      Number(isWaiting(b)) - Number(isWaiting(a)) ||
      a.student.user.name.localeCompare(b.student.user.name),
  );
  const waiting = mentees.filter(isWaiting).length;

  return (
    <>
      <AppTopNav
        basePath="/mentor"
        breadcrumb={["Overview", { label: "My students", href: "/mentor/students" }]}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
          <div>
            <h1 className="text-2xl leading-8 font-semibold text-text-primary">
              My students
            </h1>
            <p className="mt-1 font-work text-sm text-text-secondary">
              Review your mentees&apos; weekly check-ins and follow their goals.
            </p>
          </div>

          <Card>
            <CardHeader
              title={menteesQuery.isSuccess ? `${mentees.length} mentees` : "Mentees"}
              subtitle={
                waiting > 0
                  ? `${waiting} check-in${waiting === 1 ? "" : "s"} waiting for your review`
                  : undefined
              }
            />

            {menteesQuery.isPending ? (
              <ul className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-6 w-32 rounded-full" />
                  </li>
                ))}
              </ul>
            ) : menteesQuery.isError ? (
              <p role="alert" className="font-work text-sm text-text-error">
                Couldn&apos;t load your mentees. {menteesQuery.error.message}
              </p>
            ) : mentees.length === 0 ? (
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-neutral-350" />
                <p className="font-work text-sm text-text-secondary">
                  You haven&apos;t been assigned any mentees yet. A program admin
                  pairs you with students from the Mentors page.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-border-default">
                {mentees.map((mentee, index) => (
                  <MenteeRow
                    key={mentee.id}
                    mentee={mentee}
                    latest={latestById.get(mentee.student.id)}
                    weeksPending={weekQueries[index]?.isPending ?? true}
                  />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}

function MenteeRow({
  mentee,
  latest,
  weeksPending,
}: {
  mentee: Mentee;
  latest: WeeklyMetric | undefined;
  weeksPending: boolean;
}) {
  const { student } = mentee;
  const kpisQuery = useQuery(controlTowerQueries.kpis(student.id));
  const goalsQuery = useQuery(controlTowerQueries.goals(student.id));
  const kpiSummary = kpisQuery.data ? summarizeKpis(kpisQuery.data) : undefined;
  const week = latest ? latestWeek[latest.status] : null;
  const activeGoals = (goalsQuery.data ?? []).filter((goal) => goal.status === "ACTIVE").length;

  return (
    <li className="relative flex min-h-[68px] flex-wrap items-center justify-between gap-4 py-3 pl-3 has-[a:hover]:bg-surface-background">
      <div className="flex min-w-0 items-center gap-3">
        <PersonAvatar name={student.user.name} colorKey={student.id} size={40} />
        <div className="min-w-0">
          {/* The link stretches over the whole row. */}
          <Link
            href={menteeHref(student.id)}
            className="truncate text-base font-medium text-text-primary after:absolute after:inset-0"
          >
            {student.user.name}
          </Link>
          <p className="truncate font-work text-sm text-text-secondary">
            {[student.user.email, student.cohort?.name].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-6 sm:gap-10">
        <div className="flex flex-col items-start gap-1">
          {weeksPending ? (
            <Skeleton className="h-6 w-32 rounded-full" />
          ) : week ? (
            <Badge variant="light" status={week.status} className="font-medium">
              {week.label}
            </Badge>
          ) : (
            <Badge variant="light" status="neutral" className="font-medium">
              No check-ins yet
            </Badge>
          )}
          {latest && (
            <span className="font-work text-[13px]/[18px] text-text-muted">
              {formatWeekRange(latest.weekStart, latest.weekEnd)}
            </span>
          )}
        </div>
        <div className="hidden w-[120px] flex-col sm:flex">
          <p className="text-lg/6 font-semibold text-text-primary">
            {kpiSummary && kpiSummary.totalCount > 0 ? `${kpiSummary.achievementRate}%` : "--"}
          </p>
          <p className="font-work text-[13px]/[18px] text-text-muted">
            KPIs achieved · {activeGoals} goal{activeGoals === 1 ? "" : "s"}
          </p>
        </div>
        <ChevronRight aria-hidden className="h-4 w-4 text-text-muted" />
      </div>
    </li>
  );
}
