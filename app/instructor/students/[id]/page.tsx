"use client";

import { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Calendar03, Mail02, UserCircle } from "@/assets/icons";

import { DUMMY_STUDENTS } from "@/components/instructor-dashboard/data";
import { CohortEmptyState } from "@/components/cohorts/CohortEmptyState";
import { CohortTabs } from "@/components/cohorts/CohortTabs";
import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { PersonAvatar } from "@/components/PersonAvatar";
import { AddNoteDialog } from "@/components/student-profile/AddNoteDialog";
import { ActivityTab } from "@/components/student-profile/ActivityTab";
import { AssignmentsTab } from "@/components/student-profile/AssignmentsTab";
import { AttendanceTab } from "@/components/student-profile/AttendanceTab";
import { NotesTab } from "@/components/student-profile/NotesTab";
import {
  ActivityTimeline,
  BrandBadge,
  Card,
  CardHeader,
  DetailItem,
  MessageButton,
  ProgressBar,
} from "@/components/student-profile/shared";
import {
  deadlines,
  notes as overviewNotes,
} from "@/app/admin/students/[id]/overview-data";
import {
  instructorQueries,
  type InstructorStudent,
  type InstructorTrack,
} from "@/lib/instructor";

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "progress", label: "Progress" },
  { value: "activity", label: "Activity" },
  { value: "attendance", label: "Attendance" },
  { value: "assignments", label: "Assignments" },
  { value: "notes", label: "Notes" },
] as const;

type Tab = (typeof tabs)[number]["value"];

// The instructor API currently provides identity and enrollment only. Use the
// existing profile UI sample for the progress and activity details below.
const uiDummyStudent = DUMMY_STUDENTS[0];

type StudentEntry = {
  student: InstructorStudent;
  track: InstructorTrack;
};

export default function StudentsProfilePage() {
  const { id: studentId } = useParams<{ id: string }>();
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>("overview");

  const tracksQuery = useQuery(instructorQueries.myTracks());
  const tracks = tracksQuery.data ?? [];
  const studentQueries = useQueries({
    queries: tracks.map((track) =>
      instructorQueries.students({
        cohortId: track.cohortId,
        trackId: track.trackId,
      }),
    ),
  });

  const entries: StudentEntry[] = studentQueries.flatMap((query, index) => {
    const track = tracks[index];
    if (!track) return [];

    return (query.data ?? []).map((student) => ({ student, track }));
  });
  const memberships = entries.filter(
    ({ student }) => student.user.id === studentId,
  );
  const student = memberships[0]?.student;
  const trackNames = [...new Set(memberships.map(({ track }) => track.track.name))];
  const cohortNames = [
    ...new Set(
      memberships.flatMap(({ track }) => (track.cohort ? [track.cohort.name] : [])),
    ),
  ];

  const isLoading =
    tracksQuery.isLoading || studentQueries.some((query) => query.isLoading);
  const error =
    tracksQuery.error ?? studentQueries.find((query) => query.isError)?.error;
  const status = student
    ? student.user.status === "SUSPENDED"
      ? { label: "Suspended", className: "text-text-error" }
      : student.user.onboardingStatus === "INVITED"
        ? { label: "Pending", className: "text-text-warning" }
        : { label: "Active", className: "text-text-success" }
    : undefined;

  return (
    <>
      <InstructorNavbar
        breadcrumb={[
          "Teaching",
          { label: "Students", href: "/instructor/students" },
          {
            label: student?.user.name,
            href: pathname,
          },
        ]}
      />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Students Profile
        </h1>

        {student && tab !== "overview" && status && (
          <StudentSummary
            student={student}
            status={status}
            trackNames={trackNames}
            cohortNames={cohortNames}
          />
        )}

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CohortTabs
            label="Student profile sections"
            tabs={tabs}
            value={tab}
            onChange={setTab}
            className="shadow-[0_1px_3px_rgb(0_0_0/0.15)]"
          />
          {tab === "notes" && <AddNoteDialog />}
        </div>

        <div className="mt-6">
          {isLoading ? (
            <Card>
              <div className="h-20 animate-pulse rounded-lg bg-neutral-100" />
              <div className="h-10 animate-pulse rounded-lg bg-neutral-100" />
            </Card>
          ) : error ? (
            <CohortEmptyState
              icon={UserCircle}
              title="Couldn't load this student"
              description={error.message}
            />
          ) : !student || !status ? (
            <CohortEmptyState
              icon={UserCircle}
              title="Student not found"
              description="This student isn't assigned to any of your tracks."
            />
          ) : tab === "overview" ? (
            <Overview
              student={student}
              status={status}
              trackNames={trackNames}
              cohortNames={cohortNames}
            />
          ) : tab === "progress" ? (
            <DemoProgressTab
              trackName={trackNames[0]}
              cohortName={cohortNames[0]}
            />
          ) : tab === "activity" ? (
            <ActivityTab firstName={student.user.name.split(/\s+/)[0]} />
          ) : tab === "attendance" ? (
            <AttendanceTab firstName={student.user.name.split(/\s+/)[0]} />
          ) : tab === "assignments" ? (
            <AssignmentsTab firstName={student.user.name.split(/\s+/)[0]} />
          ) : (
            <NotesTab />
          )}
        </div>
      </main>
    </>
  );
}
function StudentSummary({
  student,
  status,
  trackNames,
  cohortNames,
}: {
  student: StudentEntry["student"];
  status: { label: string; className: string };
  trackNames: string[];
  cohortNames: string[];
}) {
  return (
    <div className="mt-6 flex w-full max-w-full items-center gap-3 rounded-lg bg-surface-default px-3 py-6 shadow-[0_1px_3px_rgb(0_0_0/0.25)] sm:w-fit">
      <PersonAvatar
        name={student.user.name}
        colorKey={student.user.id}
        size={60}
      />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="truncate text-lg/6 font-semibold text-text-primary">
          {student.user.name}
        </p>
        <ProfileBadges
          status={status}
          trackNames={trackNames}
          cohortNames={cohortNames}
        />
      </div>
    </div>
  );
}

function Overview({
  student,
  status,
  trackNames,
  cohortNames,
}: {
  student: StudentEntry["student"];
  status: { label: string; className: string };
  trackNames: string[];
  cohortNames: string[];
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,657fr)_minmax(0,463fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <PersonAvatar
                name={student.user.name}
                colorKey={student.user.id}
                size={80}
              />
              <div className="flex min-w-0 flex-col gap-2">
                <p className="truncate text-2xl font-semibold text-text-primary">
                  {student.user.name}
                </p>
                <ProfileBadges
                  status={status}
                  trackNames={trackNames}
                  cohortNames={cohortNames}
                />
              </div>
            </div>
            <MessageButton email={student.user.email} />
          </div>
          <div className="grid w-fit max-w-full grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-[auto_auto]">
            <DetailItem icon={Mail02}>{student.user.email}</DetailItem>
          </div>
        </Card>
        <ProgressOverviewCard trackName={trackNames[0]} />
        <DeadlinesCard />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <AttendanceOverviewCard />
        <ActivityOverviewCard />
        <NotesOverviewCard />
      </div>
    </div>
  );
}

function DemoProgressTab({
  trackName,
  cohortName,
}: {
  trackName?: string;
  cohortName?: string;
}) {
  const [selectedModule, setSelectedModule] = useState(
    uiDummyStudent.modules[0]?.name ?? "",
  );
  const currentModule =
    uiDummyStudent.modules.find((module) => module.name === selectedModule) ??
    uiDummyStudent.modules[0];

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,309fr)_minmax(0,811fr)]">
      <Card className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="truncate text-lg/6 font-semibold text-text-primary">
              {trackName} Track
            </h2>
            {cohortName && (
              <p className="truncate font-work text-[13px]/[18px] text-text-secondary">
                {cohortName}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-1 text-right">
            <p className="text-lg/6 font-semibold text-text-primary">
              {uiDummyStudent.progress}%
            </p>
            <p className="font-work text-[13px]/[18px] text-text-secondary">
              Overall progress
            </p>
          </div>
        </div>
        <ProgressBar value={uiDummyStudent.progress} />

        <ul className="flex flex-col">
          {uiDummyStudent.modules.map((module, index) => (
            <li key={module.name}>
              <button
                type="button"
                aria-pressed={module.name === currentModule?.name}
                onClick={() => setSelectedModule(module.name)}
                className={`flex w-full items-center justify-between gap-3 p-2 text-left ${
                  module.name === currentModule?.name
                    ? "rounded-lg bg-brand-100"
                    : "border-b border-border-default hover:bg-surface-background"
                }`}
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-base font-medium text-text-secondary">
                    Module {index + 1}
                  </span>
                  <span className="truncate font-work text-sm text-text-primary">
                    {module.name}
                  </span>
                </span>
                <span className="shrink-0 font-work text-sm font-medium text-text-primary">
                  {module.progress}%
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <Card className="gap-3">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 flex-col gap-3">
              <p className="font-work text-sm font-medium text-text-secondary">
                Module{" "}
                {uiDummyStudent.modules.findIndex(
                  (module) => module.name === currentModule?.name,
                ) + 1}
              </p>
              <h2 className="text-xl font-semibold text-text-primary">
                {currentModule?.name}
              </h2>
            </div>
            <div className="flex w-full shrink-0 items-center gap-3 md:w-[191px]">
              <span className="text-base font-medium text-black">
                {currentModule?.progress}%
              </span>
              <ProgressBar
                value={currentModule?.progress ?? 0}
                className="flex-1"
              />
            </div>
          </div>
        </Card>
        <Card className="gap-3">
          <CardHeader
            size="h4"
            title="Learning items"
            subtitle="Lessons, assignments and quizzes in this module."
          />
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {uiDummyStudent.assignmentsList.map((assignment) => (
              <li
                key={assignment.title}
                className="flex min-h-40 flex-col justify-between gap-4 rounded-xl bg-surface-subtle p-4"
              >
                <div>
                  <BrandBadge className="text-text-success">
                    {assignment.status}
                  </BrandBadge>
                  <p className="mt-3 text-lg/6 font-semibold text-text-primary">
                    {assignment.title}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {assignment.module}
                  </p>
                </div>
                <span className="font-work text-sm text-text-secondary">
                  {assignment.grade}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function ProgressOverviewCard({ trackName }: { trackName?: string }) {
  return (
    <Card>
      <CardHeader
        title="Current Progress"
        subtitle={`Progress across the ${trackName} curriculum`}
      />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-2xl font-semibold text-text-primary">
            {uiDummyStudent.progress}%
          </span>
          <span className="font-work text-sm text-text-secondary">
            Overall progress
          </span>
        </div>
        <ProgressBar value={uiDummyStudent.progress} />
        {uiDummyStudent.modules.slice(0, 4).map((module) => (
          <div key={module.name} className="flex items-center gap-3">
            <span className="min-w-0 flex-1 truncate font-work text-sm text-text-primary">
              {module.name}
            </span>
            <ProgressBar
              value={module.progress}
              className="w-24 shrink-0"
            />
            <span className="w-9 text-right font-work text-xs text-text-secondary">
              {module.progress}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DeadlinesCard() {
  return (
    <Card className="gap-4">
      <CardHeader title="Upcoming Deadlines" />
      <ul className="flex flex-col gap-4">
        {deadlines.map((deadline) => (
          <li key={deadline.title} className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="truncate font-medium text-text-primary">
                {deadline.title}
              </p>
              <p className="font-work text-sm text-text-secondary">
                {deadline.type}
              </p>
            </div>
            <span className="shrink-0 font-work text-xs text-text-secondary">
              {deadline.due}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AttendanceOverviewCard() {
  return (
    <Card className="gap-4">
      <CardHeader
        title="Live sessions attendance"
        subtitle="Attendance across scheduled live classes"
      />
      <div className="grid grid-cols-3 gap-3 rounded-lg bg-surface-subtle p-3 text-center">
        <OverviewMetric label="Attendance rate" value={uiDummyStudent.attendanceRate} />
        <OverviewMetric
          label="Attended"
          value={uiDummyStudent.attendanceList.filter(
            (session) => session.status === "Attended",
          ).length}
        />
        <OverviewMetric
          label="Absent"
          value={uiDummyStudent.attendanceList.filter(
            (session) => session.status === "Missed",
          ).length}
        />
      </div>
      <ul className="flex flex-col gap-3">
        {uiDummyStudent.attendanceList.slice(0, 2).map((session) => (
          <li key={session.title} className="flex items-center justify-between gap-3">
            <span className="truncate font-work text-sm text-text-primary">
              {session.title}
            </span>
            <span className="shrink-0 text-xs text-text-secondary">
              {session.status}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function OverviewMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-work text-xs text-text-secondary">{label}</span>
      <span className="font-semibold text-text-primary">{value}</span>
    </div>
  );
}

function ActivityOverviewCard() {
  return (
    <Card className="gap-4">
      <CardHeader title="Recent Activities" />
      <ActivityTimeline
        groups={uiDummyStudent.recentActivity.map((activity) => ({
          label: activity.date,
          items: [
            {
              time: activity.date,
              title: activity.title,
              detail: activity.detail,
            },
          ],
        }))}
      />
    </Card>
  );
}

function NotesOverviewCard() {
  const note = overviewNotes[0];

  return (
    <Card className="gap-3">
      <CardHeader title="Notes" />
      <div className="flex items-center gap-2 text-text-secondary">
        <Calendar03 className="size-4 shrink-0" />
        <span className="font-work text-xs">{note.date}</span>
      </div>
      <p className="font-work text-sm text-text-secondary">{note.body}</p>
      <p className="text-right font-work text-xs text-text-muted">
        {note.author}
      </p>
    </Card>
  );
}

function ProfileBadges({
  status,
  trackNames,
  cohortNames,
}: {
  status: { label: string; className: string };
  trackNames: string[];
  cohortNames: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {trackNames.map((track) => (
        <BrandBadge key={track} size="lg" className="text-text-info">
          {track}
        </BrandBadge>
      ))}
      <BrandBadge size="lg" className={status.className}>
        {status.label}
      </BrandBadge>
      {cohortNames.map((cohort) => (
        <BrandBadge key={cohort} size="lg" className="text-text-info">
          {cohort}
        </BrandBadge>
      ))}
    </div>
  );
}
