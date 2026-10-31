"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Magnet } from "lucide-react";

import {
  UserMultiple,
  ListView,
  AlertCircle,
  ArrowDown01,
  ArrowRight01,
  ArrowRight02,
  ArrowUpRight01,
  Calendar03,
  Chatting01,
  File02,
  Radial,
  VideoReplay,
} from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import { trackStyles } from "@/components/cohorts/CohortOverview";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Skeleton } from "@/components/ui/skeleton";
import { adminQueries } from "@/lib/admin";
import {
  adminDashboardQueries,
  dashboardMock,
  type ActivityKind,
} from "@/lib/admin-dashboard";
import { cohortQueries, trackKeyFor } from "@/lib/cohorts";
import { daysLeftIn, weekRangeFor } from "@/lib/control-tower";
import { useSelectedCohort } from "@/lib/selected-cohort";
import { sessionQuery } from "@/lib/session-query";
import { cn, greeting } from "@/lib/utils";
import type { TrackKey } from "@/app/admin/cohorts/cohort-data";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";

const cardClass =
  "rounded-xl bg-surface-default shadow-[0_1px_3px_0_rgb(0_0_0/0.15)]";

const activityIcons: Record<ActivityKind, React.ComponentType<{ className?: string }>> = {
  assignment: File02,
  lesson: VideoReplay,
  mentorship: Chatting01,
  controlTower: Radial,
};

/** Tile and text colours per track, as used on the dashboard. */
const trackTones: Record<TrackKey, { tile: string; text: string; bar: string }> = {
  design: { tile: "bg-surface-brand", text: "text-text-success", bar: "bg-brand-primary" },
  frontend: { tile: "bg-surface-brand", text: "text-text-info", bar: "bg-text-info" },
  backend: { tile: "bg-[#fdeafc]", text: "text-[#960b93]", bar: "bg-[#960b93]" },
  mobile: { tile: "bg-[#fdeafc]", text: "text-[#960b93]", bar: "bg-[#960b93]" },
};

/** Track Health keeps the brand colour for design, unlike the activity badges. */
const healthIconTones: Record<TrackKey, string> = {
  design: "text-brand-primary",
  frontend: "text-text-info",
  backend: "text-[#960b93]",
  mobile: "text-[#960b93]",
};

const dateTones = [
  "bg-surface-brand text-text-success",
  "bg-surface-brand text-text-info",
  "bg-[#fdeafc] text-[#960b93]",
];

/** "Due today" on the last day of the week, counting down before that. */
function checkInDue(now = new Date()) {
  const days = daysLeftIn(weekRangeFor(now).weekEnd, now);
  if (days <= 1) return "Due today";
  if (days === 2) return "Due tomorrow";
  return `Due in ${days - 1} days`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const session = useQuery(sessionQuery());
  const { cohortId, isReady } = useSelectedCohort();
  const participants = useQuery({
    ...adminQueries.userCount({ role: "STUDENT", status: "ACTIVE", cohortId }),
    enabled: isReady,
  });
  const allActiveTracks = useQuery(adminQueries.tracks("ACTIVE"));
  // The API can't filter tracks by cohort, so this works out which ones it runs.
  const cohortTracks = useQuery({
    ...cohortQueries.trackIds(cohortId ?? ""),
    enabled: Boolean(cohortId),
  });
  const activeTracks = {
    isPending:
      allActiveTracks.isPending ||
      !isReady ||
      (Boolean(cohortId) && cohortTracks.isPending),
    isError: allActiveTracks.isError || cohortTracks.isError,
  };
  const controlTower = useQuery({
    ...adminDashboardQueries.controlTower(cohortId),
    enabled: isReady,
  });

  const tracks = (allActiveTracks.data ?? []).filter(
    (track) => !cohortId || (cohortTracks.data ?? []).includes(track.id),
  );
  const adminName = session.data?.user.firstName ?? "Admin";

  const overview = controlTower.data?.overview;
  const missingCheckIns = overview
    ? Math.max(0, overview.totalStudents - overview.metricsSubmittedThisWeek)
    : 0;

  return (
    <>
      <AdminTopNav />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {/* Capped so cards don't stretch apart on wide screens. */}
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl leading-8 font-semibold text-text-primary">
                {session.isPending ? (
                  <Skeleton className="h-8 w-64" />
                ) : (
                  `${greeting()}, ${adminName}`
                )}
              </h1>
              <p className="mt-1 font-work text-sm text-text-secondary">
                Here&apos;s what&apos;s happening across your program
              </p>
            </div>
            {/* PENDING-BACKEND: nothing on the dashboard can be filtered by date yet. */}
            {/* <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg border border-border-default bg-surface-default px-4 text-sm font-medium text-text-primary"
            >
              <Calendar03 className="size-5" />
              This week
              <ArrowDown01 className="size-5" />
            </button> */}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Participants"
              value={participants.data}
              isPending={participants.isPending}
              isError={participants.isError}
              description="Total active participants"
              icon={UserMultiple}
              iconClassName="bg-surface-brand text-text-info"
            />
            <MetricCard
              title="Active Tracks"
              value={tracks.length}
              isPending={activeTracks.isPending}
              isError={activeTracks.isError}
              description={"Active learning tracks"}
              icon={ListView}
              iconClassName="bg-surface-brand text-text-success"
            />
            {/* PENDING-BACKEND: no engagement data yet. */}
            <MetricCard
              title="Engagement"
              value={`${dashboardMock.engagement}%`}
              description="This week"
              icon={Magnet}
              iconClassName="bg-[#fdeafc] text-[#960b93]"
            />
            {/* PENDING-BACKEND: no at-risk data yet. */}
            <MetricCard
              title="At Risk"
              value={dashboardMock.atRisk.total}
              description="Students needing attention"
              icon={AlertCircle}
              iconClassName="bg-surface-brand text-text-error"
              footer={
                <span className="mt-1 flex items-center gap-1 font-work text-xs text-text-error">
                  <ArrowUpRight01 className="size-4" />
                  {dashboardMock.atRisk.newThisWeek} new this week
                </span>
              }
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[657fr_463fr]">
              <section className={cn(cardClass, "flex flex-col gap-6 p-6")}>
                <CardHeader
                  title="Program Health"
                  subtitle="Overall program health across all tracks"
                />

                <div className="flex flex-col items-center gap-12 md:flex-row md:items-start">
                  {/* PENDING-BACKEND: no health score yet. */}
                  <CircularProgress
                    value={dashboardMock.programHealth}
                    size={180}
                    strokeWidth={14}
                    trackClassName="text-surface-subtle"
                    progressClassName="text-icon-brand"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[32px] leading-10 font-semibold text-text-primary">
                        {dashboardMock.programHealth}%
                      </span>
                      <span className="font-work text-sm text-text-secondary">
                        Overall health
                      </span>
                    </div>
                  </CircularProgress>

                  <div className="w-full flex-1">
                    <h3 className="text-lg leading-6 font-semibold text-text-primary">
                      Track Health
                    </h3>
                    <div className="mt-4 flex flex-col gap-2">
                      {activeTracks.isPending ? (
                        Array.from({ length: 4 }).map((_, index) => (
                          <Skeleton key={index} className="h-8 w-full" />
                        ))
                      ) : tracks.length === 0 ? (
                        <p className="font-work text-sm text-text-muted">
                          No active tracks to report on yet.
                        </p>
                      ) : (
                        tracks.map((track, index) => {
                          const key = trackKeyFor(track.name, index);
                          const Icon = trackStyles[key].icon;
                          // PENDING-BACKEND: no per-track health yet.
                          const health = dashboardMock.trackHealth[key];
                          return (
                            <div key={track.id} className="flex h-8 items-center gap-3">
                              <span
                                className={cn(
                                  "flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-brand",
                                  healthIconTones[key],
                                )}
                              >
                                <Icon className="size-5" />
                              </span>
                              <span className="w-28 shrink-0 truncate font-work text-sm font-medium text-text-primary sm:w-[133px]">
                                {track.name}
                              </span>
                              <div className="h-2 flex-1 rounded-full bg-brand-100">
                                <div
                                  className={cn("h-2 rounded-full", trackTones[key].bar)}
                                  style={{ width: `${health}%` }}
                                />
                              </div>
                              <span className="w-[30px] shrink-0 text-right font-work text-sm font-medium text-text-primary">
                                {health}%
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex justify-end">
                  <Button onClick={() => {router.push("/admin/report")}} variant="tertiary" size="sm">
                    View detailed progress
                    <ArrowRight02 className="size-4" />
                  </Button>
                </div>
              </section>

              <section className={cn(cardClass, "flex flex-col gap-6 p-6 xl:min-h-[390px]")}>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-brand text-text-error">
                    <AlertCircle className="size-5" />
                  </span>
                  <CardHeader
                    title="Attention Required"
                    subtitle="Items that may need your attention"
                  />
                </div>

                <ul className="flex flex-col [&>li:last-child>a]:border-b-0">
                  {/* PENDING-BACKEND: no at-risk data yet. */}
                  <AttentionRow
                    href="/admin/students"
                    icon={UserMultiple}
                    iconClassName="text-text-error"
                    title="Student at risk"
                    subtitle={`${dashboardMock.atRisk.newThisWeek} new this week`}
                  />
                  {controlTower.isPending ? (
                    <li className="py-3">
                      <Skeleton className="h-12 w-full" />
                    </li>
                  ) : (
                    <AttentionRow
                      href="/admin/students"
                      icon={Calendar03}
                      iconClassName="text-text-warning"
                      title={
                        controlTower.isError
                          ? "Couldn't load this week's check ins"
                          : missingCheckIns === 0
                            ? "Everyone has completed this week's check in"
                            : `${missingCheckIns} ${
                                missingCheckIns === 1 ? "student hasn't" : "students haven't"
                              } completed this week's check in`
                      }
                      subtitle={checkInDue()}
                    />
                  )}
                  {/* PENDING-BACKEND: admins can't list submissions awaiting grading. */}
                  <AttentionRow
                    href="/admin/curriculum"
                    icon={File02}
                    iconClassName="text-text-info"
                    title={`${dashboardMock.assignmentsAwaitingGrading} assignments awaiting grading`}
                    subtitle="Across all tracks"
                  />
                </ul>

                <div className="mt-auto flex justify-end">
                  <Button onClick={() => {router.push("/admin/reports")}} variant="tertiary" size="sm">
                    View all
                    <ArrowRight02 className="size-4" />
                  </Button>
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[621fr_499fr]">
              {/* PENDING-BACKEND: no activity feed yet. */}
              <section className={cn(cardClass, "flex flex-col gap-3 p-6")}>
                <CardHeader
                  title="Recent Activity"
                  subtitle="Whats happening across your program"
                  action={<Button onClick={() => {router.push("/admin/activity-log")}} variant="tertiary" size="sm">
                    View all
                    <ArrowRight02 className="size-4" />
                  </Button>}
                />
                <ul className="flex flex-col gap-1">
                  {dashboardMock.recentActivity.map((item) => {
                    const Icon = activityIcons[item.kind];
                    const tone = trackTones[item.track.key];
                    return (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 border-b border-border-default p-2 last:border-b-0"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg",
                              tone.tile,
                              tone.text,
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div className="flex min-w-0 flex-col gap-1">
                            <p className="truncate font-work text-sm text-text-primary">
                              {item.message}
                            </p>
                            <p className="font-work text-xs text-text-secondary">
                              {item.time}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "hidden h-6 shrink-0 items-center rounded-full px-1.5 text-xs font-medium sm:flex",
                            tone.tile,
                            tone.text,
                          )}
                        >
                          {item.track.name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* PENDING-BACKEND: no events or calendar yet. */}
              <section className={cn(cardClass, "flex flex-col gap-3 p-6")}>
                <CardHeader
                  title="Upcoming Activites"
                  subtitle="What's coming up next"
                  action={<Button onClick={() => {router.push("/admin/calendar")}} variant="tertiary" size="sm">
                    View Calendar
                    <ArrowRight02 className="size-4" />
                  </Button>}
                />
                <ul className="flex flex-col gap-2">
                  {dashboardMock.upcoming.map((item, index) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 border-b border-border-default p-2 last:border-b-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex h-12 w-[51px] shrink-0 flex-col items-center justify-center rounded-lg",
                            dateTones[index % dateTones.length],
                          )}
                        >
                          <span className="font-work text-sm font-medium">{item.month}</span>
                          <span className="text-lg leading-6 font-semibold">{item.day}</span>
                        </span>
                        <div className="flex min-w-0 flex-col gap-1">
                          <p className="truncate font-work text-sm text-text-primary">
                            {item.title}
                          </p>
                          <p className="font-work text-[13px] leading-[18px] text-text-secondary">
                            {item.scope}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 font-work text-[13px] leading-[18px] text-text-muted">
                        {item.when}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function AttentionRow({
  href,
  icon: Icon,
  iconClassName,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  title: string;
  subtitle: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-4 border-b border-border-default px-4 py-3 hover:bg-neutral-50"
      >
        <span className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-brand",
              iconClassName,
            )}
          >
            <Icon className="size-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-work text-sm text-text-primary">{title}</span>
            <span className="font-work text-xs text-text-secondary">
              {subtitle}
            </span>
          </span>
        </span>
        <ArrowRight01 className="size-5 shrink-0 text-icon-primary" />
      </Link>
    </li>
  );
}

function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl leading-7 font-semibold text-text-primary">{title}</h2>
        <p className="font-work text-sm text-text-secondary">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
