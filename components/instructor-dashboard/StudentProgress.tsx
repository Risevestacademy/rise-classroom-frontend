"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProgressStudent = {
  id: string;
  name: string;
  email: string;
  progress: number;
  grade: number;
  attendance: number;
  overdueLessons: number;
  progressChange: string;
  attendanceDetail: string;
  riskReason: string;
  inactiveDays?: number;
  moduleProgress: number[];
};

type LessonStatus = "Completed" | "Overdue" | "Not started";
type Lesson = {
  module: string;
  title: string;
  date: string;
  status: LessonStatus;
};

const moduleNames = [
  "Introduction",
  "User Research",
  "Design Thinking",
  "UI Design",
];

const students: ProgressStudent[] = [
  {
    id: "tunde",
    name: "Tunde Adeyemi",
    email: "tunde.adeyemi@example.com",
    progress: 42,
    grade: 81,
    attendance: 90,
    overdueLessons: 3,
    progressChange: "On track · +6% this week",
    attendanceDetail: "Last 5 live sessions",
    riskReason: "9 days inactive · 2 overdue",
    inactiveDays: 9,
    moduleProgress: [96, 58, 24, 0],
  },
  {
    id: "david",
    name: "David Ibrahim",
    email: "david.ibrahim@example.com",
    progress: 36,
    grade: 68,
    attendance: 72,
    overdueLessons: 4,
    progressChange: "Behind schedule",
    attendanceDetail: "Missed 2 of the last 5 sessions",
    riskReason: "Overdue assignments",
    moduleProgress: [80, 46, 18, 0],
  },
  {
    id: "fatima",
    name: "Fatima Bello",
    email: "fatima.bello@example.com",
    progress: 51,
    grade: 74,
    attendance: 78,
    overdueLessons: 1,
    progressChange: "Progress behind schedule",
    attendanceDetail: "Missed 1 of the last 5 sessions",
    riskReason: "Progress behind schedule",
    moduleProgress: [100, 72, 36, 0],
  },
  {
    id: "amara",
    name: "Amara Okafor",
    email: "amara.okafor@example.com",
    progress: 64,
    grade: 86,
    attendance: 94,
    overdueLessons: 0,
    progressChange: "On track · +9% this week",
    attendanceDetail: "Last 5 live sessions",
    riskReason: "On track",
    moduleProgress: [100, 88, 52, 16],
  },
  {
    id: "chidi",
    name: "Chidi Nwosu",
    email: "chidi.nwosu@example.com",
    progress: 28,
    grade: 62,
    attendance: 60,
    overdueLessons: 5,
    progressChange: "Needs support",
    attendanceDetail: "Missed 3 of the last 5 sessions",
    riskReason: "Inactive and overdue",
    inactiveDays: 12,
    moduleProgress: [66, 32, 12, 0],
  },
];

const lessons: Lesson[] = [
  { module: "Introduction", title: "Welcome to Product Design", date: "Aug 11", status: "Completed" },
  { module: "Introduction", title: "Design process overview", date: "Aug 13", status: "Completed" },
  { module: "User Research", title: "Interviewing users", date: "Aug 20", status: "Completed" },
  { module: "User Research", title: "Synthesis and affinity mapping", date: "Due Aug 28", status: "Overdue" },
  { module: "Design Thinking", title: "Defining the problem", date: "Due Sep 4", status: "Overdue" },
  { module: "Design Thinking", title: "Ideation methods", date: "Due Sep 11", status: "Not started" },
  { module: "UI Design", title: "Visual hierarchy", date: "Due Sep 18", status: "Not started" },
  { module: "UI Design", title: "Color and typography", date: "Due Sep 21", status: "Not started" },
  { module: "UI Design", title: "Building a design system", date: "Due Sep 23", status: "Not started" },
  { module: "UI Design", title: "Prototyping interactions", date: "Due Sep 25", status: "Not started" },
  { module: "UI Design", title: "Usability testing", date: "Due Sep 26", status: "Not started" },
  { module: "UI Design", title: "Final project review", date: "Due Sep 28", status: "Not started" },
];

const weeks = ["Aug 3", "Aug 10", "Aug 17", "Aug 24", "Aug 31", "Sep 7", "Sep 14", "Sep 21", "Sep 28"];
const trackProgress = [0, 7, 15, 23, 32, 40, 51, 61, 68];
const studentProgress: Record<string, number[]> = {
  tunde: [0, 5, 11, 18, 25, 32, 39, 45, 50],
  david: [0, 4, 9, 14, 20, 25, 30, 34, 36],
  fatima: [0, 8, 16, 25, 34, 40, 45, 49, 51],
  amara: [0, 10, 20, 30, 40, 49, 56, 61, 64],
  chidi: [0, 4, 8, 12, 17, 21, 24, 26, 28],
};

function chartDataFor(student?: ProgressStudent) {
  const values = student ? studentProgress[student.id] : trackProgress;
  return weeks.map((date, index) => ({ date, progress: values[index] }));
}

function statusStyle(status: LessonStatus) {
  if (status === "Completed") return "success" as const;
  if (status === "Overdue") return "error" as const;
  return "info" as const;
}

export type StudentProgressView = "overview" | "lessons" | "attention";

export function StudentProgress({
  view = "overview",
}: {
  view?: StudentProgressView;
}) {
  return (
    <React.Suspense fallback={<ProgressPageFallback view={view} />}>
      <StudentProgressContent view={view} />
    </React.Suspense>
  );
}

function StudentProgressContent({ view }: { view: StudentProgressView }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedStudentId = searchParams.get("student") ?? "";
  const selectedStudent = students.find((student) => student.id === selectedStudentId);

  function openStudent(studentId?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (studentId) params.set("student", studentId);
    else params.delete("student");
    const query = params.toString();
    router.push(
      `/instructor/student-progress${query ? `?${query}` : ""}`,
      { scroll: false },
    );
  }

  const selectedCrumb = selectedStudent
    ? [{ label: selectedStudent.name, href: `/instructor/student-progress?student=${selectedStudent.id}` }]
    : [];
  const breadcrumb = [
    "Insights",
    { label: "Student Progress", href: "/instructor/student-progress" },
    ...selectedCrumb,
  ];

  return (
    <>
      <InstructorNavbar breadcrumb={breadcrumb} />
      {view === "lessons" ? (
        <LessonsPage
          student={selectedStudent ?? students[0]}
          onBack={() =>
            router.push(
              `/instructor/student-progress?student=${(selectedStudent ?? students[0]).id}`,
            )
          }
        />
      ) : view === "attention" ? (
        <AttentionPage
          onOpenStudent={(student) =>
            router.push(`/instructor/student-progress?student=${student.id}`)
          }
        />
      ) : (
        <StudentProgressOverview
          student={selectedStudent}
          onSelectStudent={(studentId) => openStudent(studentId || undefined)}
          onSeeLessons={() =>
            router.push(
              `/instructor/student-progress/lessons?student=${(selectedStudent ?? students[0]).id}`,
            )
          }
          onViewAll={() => router.push("/instructor/student-progress/attention")}
        />
      )}
    </>
  );
}

export function StudentProgressOverview({
  student,
  onSelectStudent,
  onSeeLessons,
  onViewAll,
  trackName = "Product Design",
  trackSummary = "50 students · 4 modules · Jan 5 – Dec 19, 2026",
  showHeader = true,
  className = "flex min-w-0 flex-1 flex-col gap-6 bg-neutral-50 p-4 sm:p-6 lg:p-8",
}: {
  student?: ProgressStudent;
  onSelectStudent?: (id: string) => void;
  onSeeLessons?: () => void;
  onViewAll?: () => void;
  trackName?: string;
  trackSummary?: string;
  showHeader?: boolean;
  className?: string;
}) {
  const modules = student
    ? student.moduleProgress
    : [96, 71, 38, 0];
  const attentionStudents = students.filter((person) =>
    ["tunde", "david", "fatima"].includes(person.id),
  );

  return (
    <main className={className}>
      {showHeader && (
        <header>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {student?.name ?? trackName}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {student
              ? `Individual student · ${trackName} · Joined Jan 5, 2026`
              : trackSummary}
          </p>
        </header>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          value={`${student?.progress ?? 68}%`}
          label={student ? "Overall progress" : "Average progress"}
          detail={student?.progressChange ?? "+8% this week"}
          detailTone="success"
        />
        <MetricCard
          value={`${student?.grade ?? 74}%`}
          label={student ? "Course grade" : "Average grade"}
          detail={student ? "Above class average" : "+2% this month"}
          detailTone="success"
        />
        <MetricCard
          value={`${student?.attendance ?? 82}%`}
          label="Attendance"
          detail={student?.attendanceDetail ?? "Last 5 live sessions"}
        />
        <MetricCard
          value={`${student?.overdueLessons ?? 3}`}
          label={student ? "Overdue lessons" : "Students at risk"}
          detail={student ? "Needs a follow up" : "Inactive or overdue"}
          alert
        />
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-xs sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-900">
            Average progress
          </h2>
          {onSelectStudent ? (
            <StudentPicker selected={student} onSelect={onSelectStudent} />
          ) : (
            <span className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-600">
              Whole track
            </span>
          )}
        </div>
        <ProgressChart student={student} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-4 shadow-xs sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-neutral-900">
              Progress by module
            </h2>
            <Button
              variant="secondary"
              size="sm"
              className="border-neutral-200 text-xs text-neutral-800"
              onClick={onSeeLessons}
            >
              See lessons
            </Button>
          </div>
          <div className="flex flex-col gap-5">
            {moduleNames.map((name, index) => (
              <div
                key={name}
                className="grid grid-cols-[minmax(96px,1fr)_minmax(80px,1.3fr)_36px] items-center gap-3 text-xs"
              >
                <span className="truncate text-neutral-600">{name}</span>
                <div
                  role="progressbar"
                  aria-label={`${name} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={modules[index]}
                  className="h-1.5 overflow-hidden rounded-full bg-indigo-50"
                >
                  <div
                    className="h-full rounded-full bg-indigo-950"
                    style={{ width: `${modules[index]}%` }}
                  />
                </div>
                <span className="text-right font-medium text-neutral-800">
                  {modules[index]}%
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-xs sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-900">
                Needs attention
              </h2>
              <Badge variant="light" status="error" size="sm">
                {attentionStudents.length}
              </Badge>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="border-neutral-200 text-xs text-neutral-800"
              onClick={onViewAll}
            >
              View all
            </Button>
          </div>
          <div className="divide-y divide-neutral-100">
            {attentionStudents.map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-3 py-3 first:pt-2 last:pb-0"
              >
                <PersonAvatar name={person.name} size={32} />
                <button
                  type="button"
                  onClick={() => onSelectStudent?.(person.id)}
                  disabled={!onSelectStudent}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-xs font-medium text-neutral-900">
                    {person.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-neutral-500">
                    {person.riskReason}
                  </span>
                </button>
                <Button
                  variant="secondary"
                  size="sm"
                  nativeButton={false}
                  render={<a href={`mailto:${person.email}`} />}
                  className="border-neutral-200 text-[11px] text-neutral-800"
                >
                  Send an email
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  value,
  label,
  detail,
  detailTone,
  alert = false,
}: {
  value: string;
  label: string;
  detail: string;
  detailTone?: "success";
  alert?: boolean;
}) {
  return (
    <section className="rounded-xl bg-white px-4 py-4 shadow-xs sm:px-5">
      <p className={`text-2xl font-semibold ${alert ? "text-red-600" : "text-neutral-900"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-[11px] ${detailTone ? "text-green-700" : "text-neutral-500"}`}>
        {detail}
      </p>
    </section>
  );
}

function ProgressChart({ student }: { student?: ProgressStudent }) {
  const data = chartDataFor(student);
  return (
    <div className="h-48 w-full sm:h-56" aria-label="Average progress over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7274e8" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#7274e8" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 10 }}
            interval={0}
            dy={8}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value: number) => `${value}%`}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 10 }}
            width={34}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, "Progress"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="progress"
            stroke="#171744"
            strokeWidth={1.5}
            fill="url(#progressFill)"
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function StudentPicker({
  selected,
  onSelect,
}: {
  selected?: ProgressStudent;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const options = students.filter((student) =>
    student.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 min-w-28 items-center justify-between gap-2 rounded-lg border border-neutral-300 bg-white px-2.5 text-xs text-neutral-600 hover:bg-neutral-50"
      >
        <span className="max-w-32 truncate">{selected?.name ?? "Whole track"}</span>
        <ChevronDown className="size-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-56 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
            <Input
              aria-label="Search students"
              autoFocus
              leadingIcon={null}
              size="small"
              placeholder="Search students"
              value={search}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(event.target.value)
              }
              className="pl-7"
            />
          </div>
          <div className="mt-1 max-h-52 overflow-y-auto" role="listbox">
            <button
              type="button"
              role="option"
              aria-selected={!selected}
              onClick={() => {
                onSelect("");
                setOpen(false);
                setSearch("");
              }}
              className="w-full rounded-md px-2 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-100"
            >
              Whole track
            </button>
            {options.map((student) => (
              <button
                key={student.id}
                type="button"
                role="option"
                aria-selected={selected?.id === student.id}
                onClick={() => {
                  onSelect(student.id);
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full rounded-md px-2 py-2 text-left text-xs text-neutral-700 hover:bg-indigo-50"
              >
                {student.name}
              </button>
            ))}
            {options.length === 0 && (
              <p className="px-2 py-3 text-xs text-neutral-500">
                No students found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LessonsPage({
  student,
  onBack,
}: {
  student: ProgressStudent;
  onBack: () => void;
}) {
  const [moduleFilter, setModuleFilter] = React.useState("All modules");
  const [statusFilter, setStatusFilter] = React.useState("Any status");
  const filtered = lessons.filter(
    (lesson) =>
      (moduleFilter === "All modules" || lesson.module === moduleFilter) &&
      (statusFilter === "Any status" || lesson.status === statusFilter),
  );

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-5 bg-neutral-50 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Lessons</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {student.name} · Product Design
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">All lessons</h2>
            <p className="mt-1 text-xs text-neutral-500">
              12 lessons · 5 completed · 2 overdue
            </p>
          </div>
          <div className="flex gap-2">
            <select
              aria-label="Filter by module"
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2.5 text-xs text-neutral-700 outline-none focus:border-indigo-500"
            >
              <option>All modules</option>
              {moduleNames.map((module) => (
                <option key={module}>{module}</option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2.5 text-xs text-neutral-700 outline-none focus:border-indigo-500"
            >
              <option>Any status</option>
              <option>Completed</option>
              <option>Overdue</option>
              <option>Not started</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {filtered.map((lesson) => (
            <div
              key={lesson.title}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-[11px] text-neutral-500">{lesson.module}</p>
                <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">
                  {lesson.title}
                </p>
              </div>
              <span className="hidden text-xs text-neutral-500 sm:block">
                {lesson.date}
              </span>
              <Badge variant="light" status={statusStyle(lesson.status)} size="sm">
                {lesson.status}
              </Badge>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-neutral-500">
              No lessons match these filters.
            </p>
          )}
        </div>
        <p className="pt-4 text-xs text-neutral-500">
          Showing {filtered.length} of 12 lessons
        </p>
      </section>
    </main>
  );
}

function AttentionPage({
  onOpenStudent,
}: {
  onOpenStudent: (student: ProgressStudent) => void;
}) {
  const atRisk = students.filter((student) =>
    ["tunde", "david", "fatima"].includes(student.id),
  );

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-5 bg-neutral-50 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Students needing attention
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {atRisk.length} students need follow-up across Product Design
        </p>
      </div>

      <section className="min-h-[420px] rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">
            At-risk students
          </h2>
          <span className="text-xs text-neutral-500">{atRisk.length} students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-neutral-50 text-[10px] uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="rounded-l-lg px-3 py-3 font-medium">Student</th>
                <th className="px-3 py-3 font-medium">Progress</th>
                <th className="px-3 py-3 font-medium">Reason</th>
                <th className="rounded-r-lg px-3 py-3 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {atRisk.map((student) => (
                <tr key={student.id}>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      onClick={() => onOpenStudent(student)}
                      className="flex items-center gap-3 text-left"
                    >
                      <PersonAvatar name={student.name} size={32} />
                      <span>
                        <span className="block font-medium text-neutral-900">
                          {student.name}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-neutral-500">
                          Product Design
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-4 font-medium text-neutral-900">
                    {student.progress}%
                  </td>
                  <td className="px-3 py-4 text-neutral-500">{student.riskReason}</td>
                  <td className="px-3 py-4 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      nativeButton={false}
                      render={<a href={`mailto:${student.email}`} />}
                      className="border-neutral-200 text-[11px] text-neutral-800"
                    >
                      Send an email
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-8 text-xs text-neutral-500">
          Showing all {atRisk.length} students needing attention
        </p>
      </section>
    </main>
  );
}

function ProgressPageFallback({ view }: { view: StudentProgressView }) {
  const title =
    view === "lessons"
      ? "Lessons"
      : view === "attention"
        ? "Students needing attention"
        : "Student Progress";
  return (
    <>
      <InstructorNavbar
        breadcrumb={[
          "Insights",
          { label: "Student Progress", href: "/instructor/student-progress" },
          ...(view === "overview" ? [] : [title]),
        ]}
      />
      <main className="flex-1 bg-neutral-50 p-6">
        <div className="h-8 w-56 animate-pulse rounded bg-neutral-200" />
        <div className="mt-6 h-32 animate-pulse rounded-2xl bg-neutral-200" />
      </main>
    </>
  );
}
