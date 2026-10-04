"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Users,
  Layers,
  GraduationCap,
  MailWarning,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminTopNav } from "@/components/AdminTopNav";
import { adminQueries } from "@/lib/admin";
import { sessionQuery } from "@/lib/session-query";

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function AdminDashboardPage() {
  const session = useQuery(sessionQuery());

  const activeStudents = useQuery(
    adminQueries.userCount({ role: "STUDENT", status: "ACTIVE" })
  );
  const onboardedStudents = useQuery(
    adminQueries.userCount({
      role: "STUDENT",
      onboardingStatus: "COMPLETED",
    })
  );
  const instructors = useQuery(
    adminQueries.userCount({ role: "INSTRUCTOR", status: "ACTIVE" })
  );
  const pendingInvites = useQuery(
    adminQueries.userCount({ onboardingStatus: "INVITED" })
  );
  const suspended = useQuery(adminQueries.userCount({ status: "SUSPENDED" }));
  const activeTracks = useQuery(adminQueries.tracks("ACTIVE"));

  const tracks = activeTracks.data ?? [];

  // One cheap count per track, each cached under its own key.
  const trackCounts = useQueries({
    queries: tracks.map((track) =>
      adminQueries.userCount({ role: "STUDENT", trackId: track.id })
    ),
  });

  const adminName = session.data?.user.firstName ?? "Admin";

  const onboardedShare =
    activeStudents.data && activeStudents.data > 0 && onboardedStudents.data !== undefined
      ? Math.round((onboardedStudents.data / activeStudents.data) * 100)
      : 0;

  const attentionItems = [
    {
      label: "Invites not yet accepted",
      count: pendingInvites.data ?? 0,
      href: "/admin/instructors",
      icon: MailWarning,
      className: "bg-surface-warning-badge text-text-warning",
    },
    {
      label: "Suspended accounts",
      count: suspended.data ?? 0,
      href: "/admin/instructors",
      icon: AlertCircle,
      className: "bg-surface-error-badge text-text-error",
    },
  ].filter((item) => item.count > 0);

  const attentionPending = pendingInvites.isPending || suspended.isPending;

  return (
    <>
      <AdminTopNav />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">
                {session.isPending ? (
                  <Skeleton className="h-8 w-64" />
                ) : (
                  `${greeting()}, ${adminName}`
                )}
              </h1>
              <p className="mt-1 text-sm text-neutral-400">
                Here&apos;s what&apos;s happening across your program
              </p>
            </div>
            <WeekFilter />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Participants"
              value={activeStudents.data}
              isPending={activeStudents.isPending}
              isError={activeStudents.isError}
              description="Total active participants"
              icon={Users}
              iconWrapperClassName="bg-surface-brand text-brand-primary"
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
              icon={Layers}
              iconWrapperClassName="bg-surface-success-badge text-text-success"
            />
            <MetricCard
              title="Instructors"
              value={instructors.data}
              isPending={instructors.isPending}
              isError={instructors.isError}
              description="Active across all tracks"
              icon={GraduationCap}
              iconWrapperClassName="bg-[#FDEAFC] text-[#960B93]"
            />
            <MetricCard
              title="Pending Invites"
              value={pendingInvites.data}
              isPending={pendingInvites.isPending}
              isError={pendingInvites.isError}
              description="Invited but not yet onboarded"
              icon={MailWarning}
              iconWrapperClassName="bg-surface-error-badge text-text-error"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DashboardCard
              title="Onboarding Progress"
              subtitle="How far participants have got through onboarding"
              action={<WeekFilter />}
            >
              <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
                {onboardedStudents.isPending || activeStudents.isPending ? (
                  <Skeleton className="h-[168px] w-[168px] shrink-0 rounded-full" />
                ) : (
                  <CircularProgress value={onboardedShare}>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold text-neutral-800">
                        {onboardedShare}%
                      </span>
                      <span className="text-xs text-neutral-400">
                        Onboarded
                      </span>
                    </div>
                  </CircularProgress>
                )}

                <div className="flex-1 space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-800">
                    Participants per Track
                  </h3>

                  {activeTracks.isPending ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Skeleton className="h-4 w-20 sm:w-36" />
                        <Skeleton className="h-2 flex-1" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))
                  ) : tracks.length === 0 ? (
                    <p className="text-sm text-neutral-400">
                      No active tracks to report on yet.
                    </p>
                  ) : (
                    <TrackBars
                      tracks={tracks}
                      counts={trackCounts.map((query) => ({
                        value: query.data,
                        isPending: query.isPending,
                      }))}
                    />
                  )}
                </div>
              </div>

              <button
                type="button"
                className="mt-6 flex items-center gap-1 text-sm font-medium text-brand-primary"
              >
                View detailed progress
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </DashboardCard>

            <DashboardCard
              title="Attention Required"
              subtitle="Items that may need your attention"
            >
              {attentionPending ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ) : attentionItems.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-success-badge text-text-success">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="font-semibold text-neutral-800">
                    All caught up!
                  </p>
                  <p className="max-w-64 text-sm text-neutral-400">
                    There are no pending items that need your attention right
                    now.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {attentionItems.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center gap-3 rounded-lg border border-neutral-100 px-4 py-3"
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          item.className
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-800">
                          {item.count} {item.label}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-300" />
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DashboardCard
              title="Recent Activity"
              subtitle="What's happening across your program"
            >
              <EmptyPanel message="An activity feed will appear here once the API exposes one." />
            </DashboardCard>

            <DashboardCard
              title="Upcoming Activities"
              subtitle="What's coming up next"
            >
              <EmptyPanel message="Scheduled sessions will appear here once the API exposes them." />
            </DashboardCard>
          </div>
        </div>
      </main>
    </>
  );
}

function TrackBars({
  tracks,
  counts,
}: {
  tracks: { id: string; name: string }[];
  counts: { value?: number; isPending: boolean }[];
}) {
  const palette = [
    "text-brand-primary",
    "text-text-info",
    "text-[#960B93]",
    "text-[#7C3AED]",
  ];

  // Bars are scaled against the busiest track so the comparison stays readable
  // whatever the absolute headcounts are.
  const largest = Math.max(1, ...counts.map((count) => count.value ?? 0));

  return (
    <>
      {tracks.map((track, index) => {
        const count = counts[index];
        const className = palette[index % palette.length];

        return (
          <div key={track.id} className="flex items-center gap-2 sm:gap-3">
            <span className="w-20 shrink-0 truncate text-sm text-neutral-600 sm:w-36">
              {track.name}
            </span>
            {count?.isPending ? (
              <>
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-4 w-8 shrink-0" />
              </>
            ) : (
              <>
                <div className="h-2 flex-1 rounded-full bg-neutral-100">
                  <div
                    className={cn("h-2 rounded-full bg-current", className)}
                    style={{
                      width: `${((count?.value ?? 0) / largest) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-medium text-neutral-800">
                  {count?.value ?? 0}
                </span>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-10 text-center">
      <p className="max-w-72 text-sm text-neutral-400">{message}</p>
    </div>
  );
}

function WeekFilter() {
  return (
    <button
      type="button"
      className="flex h-10 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-600"
    >
      This week
      <ChevronDown className="h-4 w-4 text-neutral-400" />
    </button>
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
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          iconWrapperClassName
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-neutral-400">{title}</p>
        {isPending ? (
          <Skeleton className="mt-1 h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold text-neutral-800">
            {isError ? "—" : (value ?? 0)}
          </p>
        )}
      </div>
      {isPending ? (
        <Skeleton className="h-4 w-full" />
      ) : (
        <p className="line-clamp-2 text-sm text-neutral-400">
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
    <div className="flex flex-1 flex-col rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
          <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="mt-6 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
