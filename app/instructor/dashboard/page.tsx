"use client";


import {
  ArrowRight,
  Calendar,
  ChevronDown,
  FileClock,
  HelpCircle,
  Layers,
  Users,
  Video,
} from "lucide-react";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";

import { Skeleton } from "@/components/ui/skeleton";
import { instructorQueries } from "@/lib/instructor";
import { sessionQuery } from "@/lib/session-query";
import { cn } from "@/lib/utils";
import { useQueries, useQuery } from "@tanstack/react-query";

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardOverview() {
  const session = useQuery(sessionQuery());
  const myTracks = useQuery(instructorQueries.myTracks());

  const assignments = myTracks.data ?? [];
  const selected = assignments[0];
  const hasScope = Boolean(selected);

  const scope = selected
    ? { trackId: selected.trackId, cohortId: selected.cohortId }
    : {};

  const studentLists = useQueries({
    queries: assignments.map((a) =>
      instructorQueries.students({ cohortId: a.cohortId, trackId: a.trackId })
    ),
  });

  const awaitingReview = useQuery({
    ...instructorQueries.weeklyTaskCount({ ...scope, status: "SUBMITTED" }),
    enabled: hasScope,
  });
  const pendingTasks = useQuery({
    ...instructorQueries.weeklyTaskCount({ ...scope, status: "PENDING" }),
    enabled: hasScope,
  });
  const recentTasks = useQuery({
    ...instructorQueries.weeklyTasks({ ...scope, limit: 6 }),
    enabled: hasScope,
  });

  const instructorName = session.data?.user?.firstName ?? "Instructor";

  const metrics = [
    {
      label: "Pending reviews",
      value: awaitingReview.data,
      isLoading: myTracks.isLoading || awaitingReview.isLoading,
      icon: Users,
      iconBg: "bg-surface-info-badge",
      iconColor: "text-icon-info",
    },
    {
      label: "Upcoming content",
      value: pendingTasks.data,
      isLoading: myTracks.isLoading || pendingTasks.isLoading,
      icon: Layers,
      iconBg: "bg-surface-success-badge",
      iconColor: "text-icon-success",
    },
    {
      label: "Student questions",
      value: 0,
      isLoading: false,
      icon: HelpCircle,
      iconBg: "bg-surface-brand",
      iconColor: "text-icon-brand",
    },
    {
      label: "Live sessions today",
      value: 0,
      isLoading: false,
      icon: Video,
      iconBg: "bg-surface-error-badge",
      iconColor: "text-icon-error",
    },
  ];

  const tracks = assignments.map((assignment, i) => ({
    id: assignment.id,
    title: assignment.track?.name ?? "Assigned Track",
    studentsCount: studentLists[i]?.data?.length ?? 0,
    studentsLoading: studentLists[i]?.isLoading ?? false,
    modulesCount: 0,
    progressPercent: 0,
    nextModule: "None scheduled",
  }));

  const recentActivities =
    recentTasks.data?.items?.map((task) => ({
      title: task.title,
      meta: `${selected?.track?.name ?? "Track"} • Due ${new Date(
        task.dueDate
      ).toLocaleDateString()}`,
      badge: task.status,
      badgeStyle:
        task.status === "SUBMITTED"
          ? "bg-surface-warning-badge text-text-warning border-border-warning"
          : task.status === "REVIEWED"
            ? "bg-surface-success-badge text-text-success border-border-success"
            : "bg-surface-info-badge text-text-info border-border-info",
    })) ?? [];

  const upcomingItems: Array<{
    type: string;
    title: string;
    course: string;
    badge: string;
    badgeStyle: string;
  }> = [];

  return (
    <>
      <InstructorNavbar />
      <main className="flex flex-col bg-neutral-100 p-6 space-y-6">
        <div id="heading" className="flex flex-row w-full items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">
              {session.isLoading ? (
                <Skeleton className="h-8 w-56 bg-neutral-200" />
              ) : (
                `${greeting()}, ${instructorName}`
              )}
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Here&apos;s what&apos;s happening in your tracks today.
            </p>
          </div>

          <button className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-xs hover:bg-neutral-200">
            <Calendar className="h-3.5 w-3.5 text-neutral-500" />
            <span>This week</span>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
          </button>
        </div>

        <div id="cards" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="flex items-start gap-3 rounded-xl border border-neutral-300 bg-neutral-50 h-[84px] p-4 shadow-xs"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    metric.iconBg
                  )}
                >
                  <Icon className={cn("h-4 w-4", metric.iconColor)} />
                </div>
                <div className="flex flex-col w-full">
                  <span className="text-xs font-medium text-neutral-600">
                    {metric.label}
                  </span>
                  {metric.isLoading ? (
                    <Skeleton className="h-6 w-12 mt-1 bg-neutral-200" />
                  ) : (
                    <span className="text-xl font-bold text-neutral-800 mt-1">
                      {metric.value ?? 0}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-neutral-300 bg-neutral-50 p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-base font-bold text-neutral-800">My Tracks</h2>
            <p className="text-xs text-neutral-500">
              Overall progress across the tracks you teach
            </p>
          </div>

          {myTracks.isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-neutral-300 p-5 space-y-4 bg-white"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40 bg-neutral-200" />
                    <Skeleton className="h-3 w-32 bg-neutral-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-2 w-full rounded-full bg-neutral-200" />
                    <Skeleton className="h-3 w-20 bg-neutral-200" />
                  </div>
                  <Skeleton className="h-3 w-36 bg-neutral-200" />
                </div>
              ))}
            </div>
          ) : tracks.length > 0 ? (
            <div className="space-y-4">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="rounded-xl border border-neutral-300 p-5 space-y-4 bg-white"
                >
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800">
                      {track.title}
                    </h3>
                    <div className="text-xs text-neutral-500 mt-1">
                      {track.studentsLoading ? (
                        <Skeleton className="h-3 w-24 inline-block bg-neutral-200" />
                      ) : (
                        `${track.studentsCount} students`
                      )}{" "}
                      • {track.modulesCount} modules
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-primary"
                        style={{ width: `${track.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-800">
                        {track.progressPercent}% complete
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600">
                    <span className="font-medium text-neutral-800">Next:</span>{" "}
                    {track.nextModule}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-brand mb-3">
                <FileClock className="h-7 w-7 text-icon-brand" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-800">
                No tracks assigned yet
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs mt-1">
                Once an admin assigns you a track, it will show up here.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-300 bg-neutral-50 p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-error-badge text-icon-error">
                <Video className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-800">Upcoming</h2>
                <p className="text-xs text-neutral-500">
                  Items that may need your attention
                </p>
              </div>
            </div>

            {upcomingItems.length > 0 ? (
              <div className="divide-y divide-neutral-200">
                {upcomingItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-neutral-800">
                        {item.type} <span className="font-normal text-neutral-400">•</span> {item.title}
                      </p>
                      <p className="text-xs text-neutral-500">{item.course}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-medium shrink-0",
                        item.badgeStyle
                      )}
                    >
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-brand mb-3">
                  <FileClock className="h-7 w-7 text-icon-brand" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-800">
                  Nothing coming up
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mt-1">
                  Deadlines, content to publish and live sessions appear here.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-300 bg-neutral-50 p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-800">
                  Recent Activities
                </h2>
                <p className="text-xs text-neutral-500">What&apos;s coming up next</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-semibold text-text-brand hover:text-brand-primary-hover hover:underline">
                <span>Schedule an activity</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {myTracks.isLoading || recentTasks.isLoading ? (
              <div className="divide-y divide-neutral-200">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-48 bg-neutral-200" />
                      <Skeleton className="h-3 w-32 bg-neutral-200" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded-full bg-neutral-200 shrink-0" />
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="divide-y divide-neutral-200">
                {recentActivities.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-neutral-800">
                        {act.title}
                      </p>
                      <p className="text-xs text-neutral-500">{act.meta}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-medium shrink-0",
                        act.badgeStyle
                      )}
                    >
                      {act.badge}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-brand mb-3">
                  <Calendar className="h-7 w-7 text-icon-brand" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-800">
                  No activity yet
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mt-1">
                  Submissions, questions and new students appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}