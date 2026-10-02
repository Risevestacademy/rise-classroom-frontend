"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  Code2,
  FileText,
  Mail,
  MapPin,
  MessageSquareText,
  MoreVertical,
  NotebookPen,
  PenTool,
  Phone,
  Search,
  Smartphone,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { AdminTopNav } from "@/components/AdminTopNav";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/circular-progress";
import { statusBadge, type Student } from "../data";
import { useStudents } from "../StudentsContext";
import {
  activityGroups,
  attendanceMonth,
  deadlines,
  mentor,
  moduleProgress,
  notes,
  type AttendanceStatus,
} from "./overview-data";

const tabs = [
  "Overview",
  "Progress",
  "Activity",
  "Attendance",
  "Assignments",
  "Mentorship",
  "Notes",
] as const;

type Tab = (typeof tabs)[number];

const moduleTones = {
  primary: {
    icon: PenTool,
    tile: "bg-primary-50 text-primary-500",
    bar: "bg-primary-500",
  },
  info: {
    icon: Code2,
    tile: "bg-semantic-surface-info-badge text-semantic-text-info",
    bar: "bg-semantic-text-info",
  },
  success: {
    icon: Search,
    tile: "bg-semantic-surface-success-badge text-semantic-text-success",
    bar: "bg-[#960B93]",
  },
  accent: {
    icon: Smartphone,
    tile: "bg-[#FDEAFC] text-[#960B93]",
    bar: "bg-[#960B93]",
  },
} as const;

const deadlineTones = {
  error: {
    tile: "bg-semantic-surface-error-badge text-semantic-text-error",
    badge: "error",
  },
  warning: {
    tile: "bg-semantic-surface-warning-badge text-semantic-text-warning",
    badge: "warning",
  },
  neutral: { tile: "bg-neutral-200 text-neutral-500", badge: "neutral" },
} as const;

const activityKinds = {
  assignment: {
    icon: FileText,
    tile: "bg-semantic-surface-info-badge text-semantic-text-info",
  },
  lesson: {
    icon: NotebookPen,
    tile: "bg-semantic-surface-success-badge text-semantic-text-success",
  },
  session: {
    icon: Video,
    tile: "bg-semantic-surface-info-badge text-semantic-text-info",
  },
} as const;

const attendanceCell: Record<AttendanceStatus, string> = {
  attended: "bg-primary-500",
  absent: "bg-semantic-surface-error-badge",
  none: "bg-neutral-200",
};

function formatLongDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function StudentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { students } = useStudents();
  const [tab, setTab] = React.useState<Tab>("Overview");

  const student = students.find((student) => student.id === id);
  if (!student) notFound();

  return (
    <>
      <AdminTopNav breadcrumb={["People", "Students", student.name]} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4">
          <div className="max-w-full self-start overflow-x-auto rounded-xl border border-neutral-300 bg-white p-1.5">
            <div role="tablist" className="flex gap-1">
              {tabs.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={tab === item}
                  onClick={() => setTab(item)}
                  className={cn(
                    "h-8 shrink-0 rounded-lg px-3 text-sm font-medium whitespace-nowrap",
                    tab === item
                      ? "bg-primary-500 text-neutral-50"
                      : "text-neutral-700 hover:bg-neutral-200",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {tab === "Overview" ? (
            <OverviewTab student={student} />
          ) : (
            <Card className="items-center justify-center py-16 text-center">
              <p className="font-semibold text-neutral-900">{tab}</p>
              <p className="mt-1 text-sm text-neutral-500">
                {student.name}&apos;s {tab.toLowerCase()} will appear here.
              </p>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}

function OverviewTab({ student }: { student: Student }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <div className="flex min-w-0 flex-col gap-4 xl:col-span-3">
        <ProfileCard student={student} />
        <MentorCard />
        <ProgressCard track={student.track} />
        <DeadlinesCard />
      </div>
      <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
        <AttendanceCard />
        <ActivitiesCard />
        <NotesCard />
      </div>
    </div>
  );
}

function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-neutral-300 bg-white p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function OutlineButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 shrink-0 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-primary-500 hover:bg-neutral-100",
        className,
      )}
    >
      {children}
    </button>
  );
}

function DropdownButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700"
    >
      {label}
      <ChevronDown className="h-4 w-4 text-neutral-500" />
    </button>
  );
}

function IconTile({
  icon: Icon,
  className,
}: {
  icon: React.ElementType;
  className: string;
}) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
        className,
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

function ProfileCard({ student }: { student: Student }) {
  const details = [
    { icon: Phone, value: student.phone ?? "--" },
    {
      icon: CalendarDays,
      value:
        student.joined === "--"
          ? "Invitation pending"
          : `Joined ${formatLongDate(student.joined)}`,
    },
    { icon: Mail, value: student.email },
    { icon: MapPin, value: student.location ?? "--" },
  ];

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <InitialsAvatar name={student.name} className="h-20 w-20 text-2xl" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-neutral-900">
              {student.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="light" status="info" size="lg">
                {student.track}
              </Badge>
              <Badge
                variant="light"
                status={statusBadge[student.status]}
                size="lg"
              >
                {student.status}
              </Badge>
              <Badge variant="light" status="neutral" size="lg">
                {student.cohort}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <OutlineButton>
            <MessageSquareText className="h-4 w-4" />
            Message
          </OutlineButton>
          <button
            type="button"
            aria-label="More actions"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {details.map(({ icon: Icon, value }) => (
          <p
            key={value}
            className="flex min-w-0 items-center gap-3 text-sm text-neutral-700"
          >
            <Icon className="h-5 w-5 shrink-0 text-neutral-500" />
            <span className="truncate">{value}</span>
          </p>
        ))}
      </div>
    </Card>
  );
}

function MentorCard() {
  return (
    <Card>
      <CardHeader title="Mentor" />
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <InitialsAvatar name={mentor.name} className="h-14 w-14 text-base" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-neutral-900">
              {mentor.name}
            </p>
            <p className="truncate text-sm text-neutral-500">{mentor.role}</p>
          </div>
        </div>
        <OutlineButton>
          <MessageSquareText className="h-4 w-4" />
          <span className="hidden sm:inline">Message</span>
        </OutlineButton>
      </div>
      <div className="mt-5 flex items-start gap-3">
        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" />
        <div>
          <p className="text-sm text-neutral-900">Next session</p>
          <p className="text-sm text-neutral-500">{mentor.nextSession}</p>
        </div>
      </div>
    </Card>
  );
}

function ProgressCard({ track }: { track: string }) {
  return (
    <Card>
      <CardHeader
        title="Current Progress"
        subtitle={`Progress across the ${track} track curriculum`}
        action={<DropdownButton label="All modules" />}
      />
      <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-center">
        <div className="self-center">
          <CircularProgress
            value={84}
            size={180}
            strokeWidth={14}
            trackClassName="text-neutral-200"
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-neutral-900">84%</span>
              <span className="text-center text-sm text-neutral-500">
                Overall
                <br />
                progress
              </span>
            </div>
          </CircularProgress>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          {moduleProgress.map((module) => {
            const tone = moduleTones[module.tone];
            return (
              <div key={module.label} className="flex items-center gap-3">
                <IconTile
                  icon={tone.icon}
                  className={cn("h-8 w-8", tone.tile)}
                />
                <span className="w-28 shrink-0 truncate text-sm font-medium text-neutral-900">
                  {module.label}
                </span>
                <div className="h-2 flex-1 rounded-full bg-primary-50">
                  <div
                    className={cn("h-2 rounded-full", tone.bar)}
                    style={{ width: `${module.value}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-medium text-neutral-900">
                  {module.value}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function DeadlinesCard() {
  return (
    <Card>
      <CardHeader
        title="Upcoming Deadlines"
        action={<OutlineButton className="h-9">View all</OutlineButton>}
      />
      <p className="mt-4 text-xs font-medium text-neutral-900">Today</p>
      <ul className="mt-3 space-y-4">
        {deadlines.map((deadline) => {
          const tone = deadlineTones[deadline.tone];
          return (
            <li key={deadline.title} className="flex items-center gap-3">
              <IconTile icon={FileText} className={tone.tile} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {deadline.title}
                </p>
                <p className="text-sm text-neutral-500">{deadline.type}</p>
              </div>
              <Badge variant="light" status={tone.badge}>
                {deadline.due}
              </Badge>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function AttendanceCard() {
  const { days, leadingBlanks, label } = attendanceMonth;
  const attended = days.filter((day) => day === "attended").length;
  const absent = days.filter((day) => day === "absent").length;
  const rate =
    attended + absent > 0
      ? Math.round((attended / (attended + absent)) * 100)
      : 0;

  const stats = [
    { value: `${rate}%`, label: "Attendance rate" },
    { value: attended, label: "Attended" },
    { value: absent, label: "Absent" },
  ];

  const legend: { status: AttendanceStatus; label: string }[] = [
    { status: "attended", label: "Attended" },
    { status: "absent", label: "Absent" },
    { status: "none", label: "No session" },
  ];

  return (
    <Card>
      <CardHeader
        title="Live sessions attendance"
        subtitle="Attendance across scheduled live classes"
        action={<DropdownButton label={label} />}
      />

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid w-fit grid-cols-7 gap-1.5">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <span
              key={`${day}-${index}`}
              className="flex h-5 w-5 items-center justify-center text-xs text-neutral-500"
            >
              {day}
            </span>
          ))}
          {Array.from({ length: leadingBlanks }).map((_, index) => (
            <span key={`blank-${index}`} className="h-5 w-5" />
          ))}
          {days.map((status, index) => (
            <span
              key={index}
              title={`Sep ${index + 1}: ${status === "none" ? "No session" : status}`}
              className={cn("h-5 w-5 rounded", attendanceCell[status])}
            />
          ))}
        </div>

        <ul className="flex gap-4 sm:flex-col sm:gap-2">
          {legend.map((item) => (
            <li
              key={item.status}
              className="flex items-center gap-2 text-xs text-neutral-700"
            >
              <span
                className={cn(
                  "h-3.5 w-3.5 rounded",
                  attendanceCell[item.status],
                )}
              />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 grid grid-cols-3 divide-x divide-neutral-300 rounded-xl border border-neutral-300 py-4 text-center">
        {stats.map((stat) => (
          <div key={stat.label} className="px-2">
            <p className="text-sm font-medium text-neutral-900">{stat.value}</p>
            <p className="text-sm text-neutral-700">{stat.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActivitiesCard() {
  return (
    <Card>
      <CardHeader title="Recent Activites" />
      <div className="mt-4 space-y-4">
        {activityGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-medium text-neutral-900">
              {group.label}
            </p>
            <ul className="mt-3 space-y-4">
              {group.items.map((item) => {
                const kind = activityKinds[item.kind];
                return (
                  <li key={item.title} className="flex items-center gap-3">
                    <IconTile icon={kind.icon} className={kind.tile} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {item.title}
                      </p>
                      <p className="truncate text-sm text-neutral-500">
                        {item.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-neutral-700">
                      {item.time}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NotesCard() {
  return (
    <Card>
      <CardHeader
        title="Notes"
        action={<OutlineButton className="h-9">View all</OutlineButton>}
      />
      <ul className="mt-4 space-y-4">
        {notes.map((note) => (
          <li key={note.date + note.body}>
            <p className="text-xs text-neutral-700">{note.date}</p>
            <div className="mt-3 flex items-start gap-3">
              <IconTile
                icon={FileText}
                className="bg-neutral-200 text-neutral-700"
              />
              <p className="flex-1 text-sm text-neutral-700">{note.body}</p>
              <span className="shrink-0 text-xs text-neutral-500">
                {note.author}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
