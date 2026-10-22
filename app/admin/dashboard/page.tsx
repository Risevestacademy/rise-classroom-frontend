"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  ChevronRight,
  Magnet,
  MessagesSquare,
  MonitorPlay
} from "lucide-react";

import { 
  TowerControl, 
  UserMultiple, 
  ListView, 
  AlertCircle,
  Calendar03,
  File02
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
import { getTrackColor } from "@/lib/tracks";
import { trackKeyFor } from "@/lib/cohorts";
import { daysLeftIn, weekRangeFor } from "@/lib/control-tower";
import { sessionQuery } from "@/lib/session-query";
import { cn } from "@/lib/utils";
import type { TrackKey } from "@/app/admin/cohorts/cohort-data";
import { Button } from "@/components/ui/button";

const cardClass =
  "rounded-2xl border border-neutral-100 bg-white shadow-[0_2px_4px_rgb(17_24_25/0.06)]";


const activityIcons: Record<ActivityKind, React.ComponentType<{ className?: string }>> = {
  assignment: File02,
  lesson: MonitorPlay,
  mentorship: MessagesSquare,
  controlTower: TowerControl,
};

const dateTones = [
  "bg-success-surface text-text-success",
  "bg-info-surface text-text-info",
  "bg-[#fdeafc] text-[#960b93]",
];

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

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
  const participants = useQuery(
    adminQueries.userCount({ role: "STUDENT", status: "ACTIVE" }),
  );
  const activeTracks = useQuery(adminQueries.tracks("ACTIVE"));
  const controlTower = useQuery(adminDashboardQueries.controlTower());

  const tracks = activeTracks.data ?? [];
  const adminName = session.data?.user.firstName ?? "Admin";

  const overview = controlTower.data?.overview;
  const missingCheckIns = overview
    ? Math.max(0, overview.totalStudents - overview.metricsSubmittedThisWeek)
    : 0;

  return (
    <>
      <AdminTopNav />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800 sm:text-[28px]">
              {session.isPending ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                `${greeting()}, ${adminName}`
              )}
            </h1>
            <p className="mt-1 font-work text-neutral-500">
              Here&apos;s what&apos;s happening across your program
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Participants"
              value={participants.data}
              isPending={participants.isPending}
              isError={participants.isError}
              description="Total active participants"
              icon={UserMultiple}
              iconClassName="bg-info-surface text-text-info"
            />
            <MetricCard
              title="Active Tracks"
              value={tracks.length}
              isPending={activeTracks.isPending}
              isError={activeTracks.isError}
              description={
                tracks.length
                  ? tracks.map((track) => track.name).join(" · ")
                  : "No active tracks yet"
              }
              icon={ListView}
              iconClassName="bg-success-surface text-text-success"
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
              iconClassName="bg-surface-error-badge text-text-error"
              footer={
                <span className="mt-1 flex items-center gap-1 font-work text-sm text-text-error">
                  <ArrowUpRight className="size-4" />
                  {dashboardMock.atRisk.newThisWeek} new this week
                </span>
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[7fr_5fr]">
            <section className={cn(cardClass, "flex flex-col p-6 sm:p-8")}>
              <h2 className="text-xl font-bold text-neutral-800 sm:text-2xl">
                Program Health
              </h2>
              <p className="mt-1 font-work text-neutral-500">
                Overall program health across all tracks
              </p>

              <div className="mt-8 flex flex-col items-center gap-8 md:flex-row md:items-start">
                {/* PENDING-BACKEND: no health score yet. */}
                <CircularProgress
                  value={dashboardMock.programHealth}
                  size={176}
                  strokeWidth={14}
                  progressClassName="text-brand-primary"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-neutral-800">
                      {dashboardMock.programHealth}%
                    </span>
                    <span className="font-work text-sm text-neutral-500">
                      Overall health
                    </span>
                  </div>
                </CircularProgress>

                <div className="w-full flex-1">
                  <h3 className="text-lg font-semibold text-neutral-800">
                    Track Health
                  </h3>
                  <div className="mt-4 flex flex-col gap-4">
                    {activeTracks.isPending ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-8 w-full" />
                      ))
                    ) : tracks.length === 0 ? (
                      <p className="font-work text-sm text-neutral-400">
                        No active tracks to report on yet.
                      </p>
                    ) : (
                      tracks.map((track, index) => {
                        const key = trackKeyFor(track.name, index);
                        const style = trackStyles[key];
                        // PENDING-BACKEND: no per-track health yet.
                        const health = dashboardMock.trackHealth[key];
                        return (
                          <div key={track.id} className="flex items-center gap-3">
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                style.box,
                              )}
                            >
                              <style.icon className="size-4" />
                            </span>
                            <span className="w-28 shrink-0 truncate font-work text-neutral-800 sm:w-40">
                              {track.name}
                            </span>
                            <div className="h-2 flex-1 rounded-full bg-neutral-100">
                              <div
                                className={cn("h-2 rounded-full", style.bar)}
                                style={{ width: `${health}%` }}
                              />
                            </div>
                            <span className="w-10 shrink-0 text-right font-work text-sm text-neutral-800">
                              {health}%
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button onClick={() => {router.push("/admin/report")}} variant="tertiary" size="sm">
                  View detailed progress
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </section>

            <section className={cn(cardClass, "flex flex-col p-6 sm:p-8")}>
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-error-badge text-text-error">
                  <AlertCircle className="size-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-neutral-800 sm:text-2xl">
                    Attention Required
                  </h2>
                  <p className="mt-1 font-work text-neutral-500">
                    Items that may need your attention
                  </p>
                </div>
              </div>

              <ul className="mt-6 flex flex-col divide-y divide-neutral-200">
                {/* PENDING-BACKEND: no at-risk data yet. */}
                <AttentionRow
                  href="/admin/students"
                  icon={UserMultiple}
                  iconClassName="bg-surface-error-badge text-text-error"
                  title="Student at risk"
                  subtitle={`${dashboardMock.atRisk.newThisWeek} new this week`}
                />
                {controlTower.isPending ? (
                  <li className="py-4">
                    <Skeleton className="h-12 w-full" />
                  </li>
                ) : (
                  <AttentionRow
                    href="/admin/students"
                    icon={Calendar03}
                    iconClassName="bg-surface-warning-badge text-text-warning"
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
                  iconClassName="bg-info-surface text-text-info"
                  title={`${dashboardMock.assignmentsAwaitingGrading} assignments awaiting grading`}
                  subtitle="Across all tracks"
                />
              </ul>

              <div className="mt-auto flex justify-end pt-6">
                <Button onClick={() => {router.push("/admin/reports")}} variant="tertiary" size="sm">
                  View all
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* PENDING-BACKEND: no activity feed yet. */}
            <section className={cn(cardClass, "p-6 sm:p-8")}>
              <CardHeader
                title="Recent Activity"
                subtitle="Whats happening across your program"
                action={<Button onClick={() => {router.push("/admin/activity-log")}} variant="tertiary" size="sm">
                  View all
                  <ArrowRight className="size-4" />
                </Button>}
              />
              <ul className="mt-4 flex flex-col divide-y divide-neutral-200">
                {dashboardMock.recentActivity.map((item) => {
                  const Icon = activityIcons[item.kind];
                  const { backgroundColor, textColor } = getTrackColor(item.track.name);
                  return (
                    <li key={item.id} className="flex items-center gap-4 py-4">
                      <span
                        className= "flex size-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: backgroundColor, color: textColor }}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-work text-neutral-800">
                          {item.message}
                        </p>
                        <p className="mt-0.5 font-work text-sm text-neutral-500">
                          {item.time}
                        </p>
                      </div>
                      <span
                        className="hidden shrink-0 rounded-full px-2.5 py-1 text-sm sm:inline"
                        style={{ backgroundColor: backgroundColor, color: textColor }}
                      >
                        {item.track.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* PENDING-BACKEND: no events or calendar yet. */}
            <section className={cn(cardClass, "p-6 sm:p-8")}>
              <CardHeader
                title="Upcoming Activites"
                subtitle="What's coming up next"
                action={<Button onClick={() => {router.push("/admin/calendar")}} variant="tertiary" size="sm">
                  View Calender
                  <ArrowRight className="size-4" />
                </Button>}
              />
              <ul className="mt-4 flex flex-col divide-y divide-neutral-200">
                {dashboardMock.upcoming.map((item, index) => (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <span
                      className={cn(
                        "flex size-16 shrink-0 flex-col items-center justify-center rounded-lg",
                        dateTones[index % dateTones.length],
                      )}
                    >
                      <span className="text-sm font-medium">{item.month}</span>
                      <span className="text-xl leading-6 font-bold">{item.day}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-work text-neutral-800">
                        {item.title}
                      </p>
                      <p className="mt-0.5 font-work text-sm text-neutral-500">
                        {item.scope}
                      </p>
                    </div>
                    <span className="shrink-0 font-work text-sm text-neutral-500">
                      {item.when}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function MetricCard({
  title,
  value,
  isPending = false,
  isError = false,
  description,
  footer,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value?: number | string;
  isPending?: boolean;
  isError?: boolean;
  description: string;
  footer?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
}) {
  return (
    <div className={cn(cardClass, "flex gap-4 p-5")}>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          iconClassName,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-neutral-800">{title}</p>
        {isPending ? (
          <Skeleton className="mt-1 h-8 w-16" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-neutral-800">
            {isError ? "—" : (value ?? 0)}
          </p>
        )}
        {isPending ? (
          <Skeleton className="mt-3 h-4 w-full" />
        ) : (
          <p className="mt-3 font-work text-sm text-neutral-500">
            {isError ? "Couldn't load this figure." : description}
          </p>
        )}
        {footer}
      </div>
    </div>
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
        className="flex items-center gap-4 py-4 hover:bg-neutral-50"
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-work text-neutral-800">{title}</span>
          <span className="mt-0.5 block font-work text-sm text-neutral-500">
            {subtitle}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-neutral-800" />
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
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-neutral-800 sm:text-2xl">{title}</h2>
        <p className="mt-1 font-work text-neutral-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

