"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Calendar,
  FileClock,
  BookOpen,
  ClipboardList,
  Users,
  BarChart3,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import {
  instructorQueries,
  type InstructorTrack,
  type WeeklyTaskStatus,
} from "@/lib/instructor";
import { Skeleton } from "@/components/ui/skeleton";

const BADGE_BASE =
  "rounded-full border px-2.5 py-0.5 text-[10px] font-medium shrink-0";

const BADGE = {
  default: "bg-surface-default-badge text-text-default-badge border-border-default-badge",
  info: "bg-surface-info-badge text-text-info border-border-info",
  warning: "bg-surface-warning-badge text-text-warning border-border-warning",
  success: "bg-surface-success-badge text-text-success border-border-success",
  error: "bg-surface-error-badge text-text-error border-border-error",
};

const TASK_BADGE: Record<WeeklyTaskStatus, string> = {
  PENDING: BADGE.default,
  IN_PROGRESS: BADGE.info,
  SUBMITTED: BADGE.warning,
  REVIEWED: BADGE.success,
  OVERDUE: BADGE.error,
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-neutral-200 bg-white text-center shadow-xs">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-brand mb-3">
        <Icon className="h-7 w-7 text-icon-brand" />
      </div>
      <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      <p className="text-xs text-neutral-500 max-w-xs mt-1">{description}</p>
    </div>
  );
}

export default function TrackDetails() {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("id");

  const trackQuery = useQuery({
    ...instructorQueries.myTracks(),
    select: (data: InstructorTrack[]) =>
      assignmentId
        ? data.find((assignment) => assignment.id === assignmentId)
        : data[0],
  });

  const selectedTrack = trackQuery.data;
  const hasScope = Boolean(selectedTrack);

  const scope = selectedTrack
    ? { trackId: selectedTrack.trackId, cohortId: selectedTrack.cohortId }
    : {};

  const studentsQuery = useQuery(
    instructorQueries.students({
      cohortId: selectedTrack?.cohortId ?? "",
      trackId: selectedTrack?.trackId ?? "",
    })
  );

  const tasksQuery = useQuery({
    ...instructorQueries.weeklyTasks({ ...scope, limit: 6 }),
    enabled: hasScope,
  });

  const students = studentsQuery.data ?? [];
  const studentCount = students.length;
  const trackName = selectedTrack?.track?.name ?? "Track Details";

  const modulesCount = 0;

  const cohort = selectedTrack?.cohort;
  const subtitle = [
    `${studentCount} students`,
    `${modulesCount} modules`,
    cohort ? `${formatDate(cohort.startDate)} - ${formatDate(cohort.endDate)}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const progressData = { completed: 0, inProgress: 0, notStarted: 0 };

  const totalTasks =
    progressData.completed + progressData.inProgress + progressData.notStarted;
  const percentage =
    totalTasks > 0
      ? Math.round((progressData.completed / totalTasks) * 100)
      : 0;

  const chartData = [
    { name: "Completed", value: progressData.completed, color: "#0D6D78" },
    {
      name: "Remaining",
      value: progressData.inProgress + progressData.notStarted,
      color: "#E8F5F6",
    },
  ];

  const upcomingItems =
    tasksQuery.data?.items?.map((task) => ({
      id: task.id,
      type: "Assignment deadline",
      title: task.title,
      course: trackName,
      badge: task.dueDate ? formatDate(task.dueDate) : "Pending",
      badgeStyle: TASK_BADGE[task.status],
    })) ?? [];

  const triggerClassName =
    "relative bg-transparent p-0 pb-3 text-base font-medium text-neutral-500 shadow-none transition-none hover:text-neutral-800 data-[state=active]:bg-transparent data-[state=active]:text-neutral-800 data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-primary after:opacity-0 data-[state=active]:after:opacity-100";

  return (
    <div className="flex flex-col bg-neutral-100 p-6 space-y-6">
      <div id="heading" className="flex flex-row w-full items-center justify-between">
        <div>
          {trackQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 bg-neutral-200" />
              <Skeleton className="h-4 w-64 bg-neutral-200" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">
                {trackName}
              </h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                {selectedTrack
                  ? subtitle
                  : "We couldn't find this track in your assignments."}
              </p>
            </>
          )}
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-xs hover:bg-neutral-200">
          <Calendar className="h-3.5 w-3.5 text-neutral-500" />
          <span>This week</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      </div>

      <div>
        <Tabs defaultValue="overview">
          <TabsList
            variant="line"
            className="h-auto gap-8 bg-transparent p-0 justify-start rounded-none"
          >
            <TabsTrigger value="overview" className={triggerClassName}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="content" className={triggerClassName}>
              Content
            </TabsTrigger>
            <TabsTrigger value="assignments" className={triggerClassName}>
              Assignments
            </TabsTrigger>
            <TabsTrigger value="students" className={triggerClassName}>
              Students
            </TabsTrigger>
            <TabsTrigger value="progress" className={triggerClassName}>
              Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Track Progress Card */}
              <div className="w-full rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs">
                <h3 className="mb-4 text-base font-semibold text-neutral-800">
                  Track progress
                </h3>

                {trackQuery.isLoading ? (
                  <div className="flex items-center gap-8">
                    <Skeleton className="h-32 w-32 rounded-full bg-neutral-200 shrink-0" />
                    <div className="space-y-3 w-full">
                      <Skeleton className="h-4 w-28 bg-neutral-200" />
                      <Skeleton className="h-4 w-28 bg-neutral-200" />
                      <Skeleton className="h-4 w-28 bg-neutral-200" />
                    </div>
                  </div>
                ) : totalTasks > 0 ? (
                  <div className="flex items-center justify-start gap-8">
                    <div className="relative aspect-square w-full max-w-[200px] shrink-0 min-w-0">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={62}
                            startAngle={0}
                            endAngle={-360}
                            dataKey="value"
                            stroke="none"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-text-brand">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2.5 text-xs text-text-brand">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>Completed :</span>
                        <span className="font-semibold">{progressData.completed}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>In progress :</span>
                        <span className="font-semibold">{progressData.inProgress}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>Not started :</span>
                        <span className="font-semibold">{progressData.notStarted}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-brand mb-2">
                      <FileClock className="h-6 w-6 text-icon-brand" />
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-800">
                      No progress recorded
                    </h3>
                    <p className="text-xs text-neutral-500 max-w-xs mt-1">
                      Module activity and task completions will show progress here.
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs">
                <h3 className="mb-4 text-base font-semibold text-neutral-800">
                  Upcoming tasks
                </h3>

                {trackQuery.isLoading || tasksQuery.isLoading ? (
                  <div className="divide-y divide-neutral-200">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                      >
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-48 bg-neutral-200" />
                          <Skeleton className="h-3 w-28 bg-neutral-200" />
                        </div>
                        <Skeleton className="h-5 w-16 rounded-full bg-neutral-200 shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : upcomingItems.length > 0 ? (
                  <div className="divide-y divide-neutral-200">
                    {upcomingItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-neutral-800">
                            {item.type}{" "}
                            <span className="font-normal text-neutral-400">•</span>{" "}
                            {item.title}
                          </p>
                          <p className="text-xs text-neutral-500">{item.course}</p>
                        </div>
                        <span className={cn(BADGE_BASE, item.badgeStyle)}>
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
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-8">
            <EmptyState
              icon={BookOpen}
              title="No course content available"
              description="Lessons, videos, and reading materials for this track will appear here once published."
            />
          </TabsContent>

          <TabsContent value="assignments" className="mt-8">
              <EmptyState
                icon={ClipboardList}
                title="No assignments created"
                description="Assignments and quizzes assigned to students in this track will show up here."
              />
          </TabsContent>

          <TabsContent value="students" className="mt-8">
              <EmptyState
                icon={Users}
                title="No enrolled students"
                description="When students are assigned to this track and cohort, you will see their roster here."
              />
          </TabsContent>

          <TabsContent value="progress" className="mt-8">
            <EmptyState
              icon={BarChart3}
              title="No progress data yet"
              description="Detailed metrics on student completion rates and submissions will display here."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}