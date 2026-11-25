"use client";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { StudentProgressOverview } from "@/components/instructor-dashboard/StudentProgress";
import StudentsTable from "@/components/instructor-dashboard/StudentsTable";
import { ExportStudentsModal } from "@/components/instructor-dashboard/ExportStudentsModal";
import { FilterStudentsModal } from "@/components/instructor-dashboard/FilterStudentsModal";
import { AssignmentsTable } from "@/components/instructor-dashboard/AssignmentsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  instructorQueries,
  toInstructorStudentListItems,
  type InstructorTrack,
  type WeeklyTaskStatus,
} from "@/lib/instructor";
import { curriculumApis } from "@/features/curriculum/api";
import { cn } from "@/lib/utils";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  FileClock,
  Download,
  Search,
  Filter,
  Plus,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

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

export default function TrackDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);

  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col bg-neutral-100 p-6 space-y-6">
          <Skeleton className="h-8 w-48 bg-neutral-200" />
        </div>
      }
    >
      <TrackDetailsContent trackId={resolvedParams.id} />
    </React.Suspense>
  );
}

function TrackDetailsContent({ trackId }: { trackId: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const [activeTab, setActiveTab] = React.useState("overview");
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("All");
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const trackQuery = useQuery({
    ...instructorQueries.myTracks(),
    select: (data: InstructorTrack[]) =>
      trackId
        ? data.find((track) => track.id === trackId)
        : data[0],
  });

  const selectedTrack = trackQuery.data;
  const hasScope = Boolean(selectedTrack);

  const [assignmentSearch, setAssignmentSearch] = React.useState("");
  const [assignmentStatusFilter, setAssignmentStatusFilter] =
    React.useState("All");

  const curriculumQuery = useQuery({
    ...curriculumApis.instructor.queries.list(
      {
        statuses: [],
        trackIds: selectedTrack ? [selectedTrack.trackId] : [],
      },
      selectedTrack?.cohortId,
    ),
    enabled: hasScope,
    select: (curricula) => curricula[0],
  });

  const trackCurriculaQuery = useQuery({
    ...curriculumApis.instructor.queries.list({
      statuses: [],
      trackIds: selectedTrack ? [selectedTrack.trackId] : [],
    }),
    enabled: hasScope,
  });

  const trackAssignmentQueries = useQueries({
    queries: (trackCurriculaQuery.data ?? []).map((curriculum) =>
      curriculumApis.instructor.queries.assignments(curriculum.id),
    ),
  });

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
  const trackName = selectedTrack?.track?.name;

  const modulesCount = 4;

  const cohort = selectedTrack?.cohort;
  const subtitle = [
    `${studentCount} students`,
    `${modulesCount} modules`,
    cohort
      ? `${formatDate(cohort.startDate)} - ${formatDate(cohort.endDate)}`
      : "Jan 5 – Dec 19, 2026",
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
    {
      name: "Completed",
      value: progressData.completed,
      color: "var(--color-brand-primary)",
    },
    {
      name: "Remaining",
      value: progressData.inProgress + progressData.notStarted,
      color: "var(--color-brand-100)",
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

  const allStudents = toInstructorStudentListItems(students);
  const filteredStudents = allStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModalFilter =
      statusFilter === "All" ? true : student.status === statusFilter;

    return matchesSearch && matchesModalFilter;
  }).sort((a, b) => a.name.localeCompare(b.name));
  const filteredAssignments = trackAssignmentQueries
    .flatMap((query) => query.data ?? [])
    .filter(({ assignment }) => {
      const matchesSearch = assignment.title
        .toLowerCase()
        .includes(assignmentSearch.trim().toLowerCase());

      const matchesStatus =
        assignmentStatusFilter === "All" ||
        assignment.status === assignmentStatusFilter;

      return matchesSearch && matchesStatus;
    });

  return (
    <>
      <InstructorNavbar
        breadcrumb={[
          "Program",
          { label: "My Tracks", href: "/instructor/my-tracks" },
          { label: `${trackName}`, href: pathname },
        ]}
      />

      <main className="flex flex-col h-full bg-neutral-100 p-6 space-y-6">
        <div
          id="heading"
          className="flex flex-row w-full items-center justify-between"
        >
          <div>
            {trackQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-48 bg-neutral-200" />
                <Skeleton className="h-4 w-64 bg-neutral-200" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                  {trackName}
                </h1>
                <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
              </>
            )}
          </div>

          {activeTab === "students" && (
            <Button
              onClick={() => setIsExportOpen(true)}
              className="bg-brand-primary text-white border-none rounded-xl px-4 py-2 text-xs font-medium flex items-center gap-2 shadow-xs cursor-pointer h-10 hover:bg-neutral-800"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          )}

          {activeTab === "assignments" && (
            <Button
              disabled={curriculumQuery.isLoading || !curriculumQuery.data}
              title={
                !curriculumQuery.data
                  ? "No curriculum is available for this track and cohort"
                  : undefined
              }
              onClick={() => {
                const curriculumId = curriculumQuery.data?.id;
                if (curriculumId) {
                  router.push(
                    `/instructor/curriculum/${curriculumId}/assignments/new`,
                  );
                }
              }}
              className="bg-brand-primary text-white border-none rounded-xl px-4 py-2 text-xs font-medium flex items-center gap-2 shadow-xs cursor-pointer h-10 hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              <span>
                {curriculumQuery.isLoading
                  ? "Loading curriculum…"
                  : curriculumQuery.data
                    ? "Add Assignment"
                    : "No curriculum"}
              </span>
            </Button>
          )}
        </div>

        <div>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-0"
          >

            <div
              className={cn(
                "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 w-full",
                (activeTab === "students" || activeTab === "assignments" || activeTab === "progress") &&
                "bg-white p-4 rounded-t-2xl border border-neutral-100 shadow-xs"
              )}
            >
              <TabsList
                className={cn(
                  "px-2 py-1 h-auto! rounded-lg gap-1 inline-flex shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)]",
                  activeTab === "students"
                    ? "bg-neutral-200/70"
                    : "bg-neutral-200"
                )}
              >
                <TabsTrigger
                  value="overview"
                  className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-active:text-neutral-900 data-active:shadow-xs"
                >
                  Overview
                </TabsTrigger>

                <TabsTrigger
                  value="curriculum"
                  className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-active:text-neutral-900 data-active:shadow-xs"
                >
                  Curriculum
                </TabsTrigger>

                <TabsTrigger
                  value="students"
                  className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-active:text-neutral-900 data-active:shadow-xs"
                >
                  Students
                </TabsTrigger>

                <TabsTrigger
                  value="assignments"
                  className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-active:text-neutral-900 data-active:shadow-xs"
                >
                  Assignments
                </TabsTrigger>

                <TabsTrigger
                  value="progress"
                  className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-neutral-600 data-active:bg-white data-active:text-neutral-900 data-active:shadow-xs"
                >
                  Progress
                </TabsTrigger>
              </TabsList>

              {(activeTab === "students" || activeTab === "assignments") && (
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-72 bg-white rounded-xl border-neutral-200 shadow-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />

                    <Input
                      placeholder={
                        activeTab === "students"
                          ? "Search by name or email"
                          : "Search assignments..."
                      }
                      value={
                        activeTab === "students"
                          ? searchQuery
                          : assignmentSearch
                      }
                      onChange={(e) => {
                        if (activeTab === "students") {
                          setSearchQuery(e.target.value);
                        } else {
                          setAssignmentSearch(e.target.value);
                        }
                      }}
                      className="pl-9 text-xs h-10 w-full"
                      leadingIcon={null}
                    />
                  </div>

                  {activeTab === "students" ? (
                    <Button
                      onClick={() => setIsFilterOpen(true)}
                      variant="secondary"
                      className={cn(
                        "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl px-4 py-2 h-10 text-xs font-medium flex items-center gap-2 shrink-0 shadow-xs cursor-pointer",
                        statusFilter !== "All" &&
                        "border-brand-primary text-brand-primary font-semibold"
                      )}
                    >
                      <Filter className="h-3.5 w-3.5" />
                      <span>Filter {statusFilter !== "All" ? "(1)" : ""}</span>
                    </Button>
                  ) : (
                    <select
                      value={assignmentStatusFilter}
                      onChange={(e) => setAssignmentStatusFilter(e.target.value)}
                      className={cn(
                        "h-10 rounded-xl border bg-white px-4 text-xs text-neutral-700 shadow-xs outline-none",
                        assignmentStatusFilter !== "All"
                          ? "border-brand-primary text-brand-primary font-semibold"
                          : "border-neutral-200"
                      )}
                    >
                      <option value="All">All statuses</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Overview */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Track Progress Card */}
                <div className="w-full rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs">
                  <h3 className="mb-4 text-base font-semibold text-neutral-800">
                    Track progress
                  </h3>

                  {trackQuery.isLoading ? (
                    <div className="flex items-center justify-start gap-8">
                      <div className="relative aspect-square w-full max-w-[200px] shrink-0 min-w-0 flex items-center justify-center">
                        <Skeleton className="h-[124px] w-[124px] rounded-full bg-neutral-200" />
                      </div>

                      <div className="flex flex-col space-y-3 w-full">
                        <Skeleton className="h-4 w-16 bg-neutral-200" />
                        <Skeleton className="h-4 w-16 bg-neutral-200" />
                        <Skeleton className="h-4 w-16 bg-neutral-200" />
                      </div>
                    </div>
                  ) : totalTasks > 0 ? (
                    <div className="flex items-center justify-start gap-8">
                      <div className="relative aspect-square w-full max-w-[200px] shrink-0 min-w-0">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                          minWidth={0}
                        >
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
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
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
                          <span className="font-semibold">
                            {progressData.completed}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 font-medium">
                          <span>In progress :</span>
                          <span className="font-semibold">
                            {progressData.inProgress}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 font-medium">
                          <span>Not started :</span>
                          <span className="font-semibold">
                            {progressData.notStarted}
                          </span>
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
                        Module activity and task completions will show progress
                        here.
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
                          <div className="space-y-2">
                            <Skeleton className="h-3.5 w-52 bg-neutral-200" />
                            <Skeleton className="h-3 w-32 bg-neutral-200" />
                          </div>

                          <Skeleton className="h-6 w-20 rounded-full bg-neutral-200 shrink-0" />
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
                              <span className="font-normal text-neutral-400">
                                •
                              </span>{" "}
                              {item.title}
                            </p>

                            <p className="text-xs text-neutral-500">
                              {item.course}
                            </p>
                          </div>

                          <span
                            className={cn(BADGE_BASE, item.badgeStyle)}
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
                        Deadlines, content to publish and live sessions appear
                        here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="curriculum" className="mt-6">
              {trackQuery.isLoading || curriculumQuery.isLoading ? (
                <div className="w-full rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-xl bg-neutral-200" />

                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48 bg-neutral-200" />
                        <Skeleton className="h-4 w-32 bg-neutral-200" />
                      </div>
                    </div>

                    <Skeleton className="h-6 w-16 rounded-full bg-neutral-200" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <Skeleton className="h-16 w-full rounded-xl bg-neutral-200" />
                    <Skeleton className="h-16 w-full rounded-xl bg-neutral-200" />
                    <Skeleton className="h-16 w-full rounded-xl bg-neutral-200" />
                  </div>
                </div>
              ) : curriculumQuery.data ? (
                <div className="w-full rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs flex flex-col space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-brand">
                        <BookOpen className="h-6 w-6 text-icon-brand" />
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-semibold text-neutral-900">
                            {curriculumQuery.data.title ??
                              `${trackName} Curriculum`}
                          </h3>

                          <span className={cn(BADGE_BASE, BADGE.success)}>
                            {curriculumQuery.data.status ?? "Active"}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-500 mt-0.5">
                          {trackName} {cohort ? `• ${cohort.name}` : ""}
                        </p>
                      </div>
                    </div>

                    <button className="text-neutral-400 hover:text-neutral-600">
                      <span className="sr-only">Open menu</span>

                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <circle cx="12" cy="6" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="18" r="1.5" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-6 sm:gap-10">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-brand">
                          <BookOpen className="h-5 w-5 text-icon-brand" />
                        </div>

                        <div>
                          <p className="text-[11px] font-medium text-neutral-500">
                            Total modules
                          </p>

                          <p className="text-lg font-bold text-neutral-900">
                            {curriculumQuery.data.totalModules}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-info-badge">
                          <ClipboardList className="h-5 w-5 text-text-info" />
                        </div>

                        <div>
                          <p className="text-[11px] font-medium text-neutral-500">
                            Total Lessons
                          </p>

                          <p className="text-lg font-bold text-neutral-900">
                            {curriculumQuery.data.totalLessons ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-success-badge">
                          <Calendar className="h-5 w-5 text-text-success" />
                        </div>

                        <div>
                          <p className="text-[11px] font-medium text-neutral-500">
                            Total Assignments
                          </p>

                          <p className="text-lg font-bold text-neutral-900">
                            {curriculumQuery.data.totalAssignments ?? 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        router.push(
                          `/instructor/curriculum/${curriculumQuery.data.id}`
                        )
                      }
                      className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 shadow-xs hover:bg-neutral-50"
                    >
                      View curriculum
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="No curriculum available"
                  description="Lessons, videos, and reading materials for this track will appear here once published."
                />
              )}
            </TabsContent>

            <TabsContent value="students" className="-mt-2">
              <div className="border-b border-neutral-200/80 overflow-hidden flex flex-col bg-white rounded-b-2xl shadow-xs">
                <StudentsTable
                  students={filteredStudents}
                  onSelectionChange={setSelectedStudentIds}
                  isLoading={trackQuery.isLoading || studentsQuery.isLoading}
                  errorMessage={
                    trackQuery.isError || studentsQuery.isError
                      ? "Unable to load students. Please try again."
                      : undefined
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="-mt-2">
              <div className="border-b border-neutral-200/80 overflow-hidden flex flex-col bg-white rounded-b-2xl shadow-xs">
                <AssignmentsTable
                  assignments={filteredAssignments}
                  isLoading={
                    trackQuery.isLoading ||
                    trackCurriculaQuery.isLoading ||
                    trackAssignmentQueries.some((query) => query.isLoading)
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="progress" className="mt-0">
              <StudentProgressOverview
                trackName={trackName ?? "Product Design"}
                trackSummary={`${studentCount} students · ${modulesCount} modules · ${
                  cohort
                    ? `${formatDate(cohort.startDate)} – ${formatDate(cohort.endDate)}`
                    : "Jan 5 – Dec 19, 2026"
                }`}
                showHeader={false}
                className="flex min-w-0 flex-col gap-6 rounded-b-2xl border border-neutral-100 border-t-0 p-4 shadow-xs sm:p-6"
                onSeeLessons={() =>
                  router.push("/instructor/student-progress/lessons?student=tunde")
                }
                onViewAll={() =>
                  router.push("/instructor/student-progress/attention")
                }
              />
            </TabsContent>

          </Tabs>
        </div>

        <FilterStudentsModal
          isOpen={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          currentStatusFilter={statusFilter}
          onApplyFilters={(newStatus) => {
            setStatusFilter(newStatus);
          }}
        />

        <ExportStudentsModal
          isOpen={isExportOpen}
          onOpenChange={setIsExportOpen}
          allStudents={allStudents}
          filteredStudents={filteredStudents}
          selectedStudentIds={selectedStudentIds}
        />
      </main>
    </>
  );
}
