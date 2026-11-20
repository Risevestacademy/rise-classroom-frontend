"use client";

import { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Call02, Calendar03, Location01, Mail02, UserCircle } from "@/assets/icons";

import { DUMMY_STUDENTS } from "@/components/instructor-dashboard/data";
import { CohortEmptyState } from "@/components/cohorts/CohortEmptyState";
import { CohortTabs } from "@/components/cohorts/CohortTabs";
import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { PersonAvatar } from "@/components/PersonAvatar";
import { AddNoteDialog } from "@/components/student-profile/AddNoteDialog";
import { ActivityTab } from "@/components/student-profile/ActivityTab";
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
import { curriculumApis } from "@/features/curriculum/api";
import {
  submissionBadges,
  type AssignmentSubmission,
  type CurriculumAssignment,
  type CurriculumModule,
} from "@/features/curriculum/types";
import {
  instructorQueries,
  type InstructorEnrollmentStudent,
  type InstructorStudent,
  type InstructorTrack,
} from "@/lib/instructor";
import { nameWithDisplayName } from "@/lib/admin";

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "progress", label: "Progress" },
  { value: "activity", label: "Activity" },
  { value: "attendance", label: "Attendance" },
  { value: "assignments", label: "Assignments" },
  { value: "notes", label: "Notes" },
] as const;

type Tab = (typeof tabs)[number]["value"];

// The API has aggregate enrollment progress but no per-module details or
// activity, attendance, or assignment records. Keep sample UI for those gaps.
const uiDummyStudent = DUMMY_STUDENTS[0];

type StudentEntry = {
  student: InstructorStudent;
  track: InstructorTrack;
};

type InstructorStudentProfile = InstructorStudent &
  Omit<InstructorEnrollmentStudent, "user"> & {
    user: InstructorStudent["user"] & InstructorEnrollmentStudent["user"];
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
  const enrollmentStudentQuery = useQuery(
    instructorQueries.enrollmentStudent(student?.enrollmentId ?? ""),
  );
  const profileStudent: InstructorStudentProfile | undefined =
    student && enrollmentStudentQuery.data
      ? {
          ...student,
          ...enrollmentStudentQuery.data,
          user: {
            ...student.user,
            ...enrollmentStudentQuery.data.user,
            name:
              `${enrollmentStudentQuery.data.user.firstName} ${enrollmentStudentQuery.data.user.lastName}`.trim() ||
              student.user.name,
          },
        }
      : undefined;
  const curriculumQuery = useQuery({
    ...curriculumApis.instructor.queries.list(
      {
        statuses: ["PUBLISHED"],
        trackIds: profileStudent
          ? [profileStudent.enrollment.track.id]
          : [],
      },
      profileStudent?.enrollment.cohort.id,
    ),
    enabled: Boolean(profileStudent),
    select: (curricula) =>
      curricula.find((curriculum) => curriculum.publishStatus === "PUBLISHED") ??
      curricula[0],
  });
  const curriculumId = curriculumQuery.data?.id ?? "";
  const modulesQuery = useQuery({
    ...curriculumApis.instructor.queries.modules(curriculumId),
    enabled: Boolean(curriculumId),
  });
  const assignmentsQuery = useQuery({
    ...curriculumApis.instructor.queries.assignments(curriculumId),
    enabled: Boolean(curriculumId) && tab === "assignments",
  });
  const assignments = assignmentsQuery.data ?? [];
  const submissionQueries = useQueries({
    queries:
      tab === "assignments"
        ? assignments.map(({ assignment }) => ({
            ...curriculumApis.instructor.queries.submissions(assignment.id),
            select: (submissions: AssignmentSubmission[]) =>
              submissions.find(
                (submission) =>
                  submission.studentProfileId ===
                  profileStudent?.studentProfileId,
              ),
          }))
        : [],
  });
  const cohortNames = [
    ...new Set(
      [
        enrollmentStudentQuery.data?.enrollment.cohort.name,
        ...memberships.map(({ track }) => track.cohort?.name),
      ].filter((name): name is string => Boolean(name)),
    ),
  ];
  const trackNames = [
    ...new Set([
      enrollmentStudentQuery.data?.enrollment.track.name,
      ...memberships.map(({ track }) => track.track.name),
    ].filter((name): name is string => Boolean(name))),
  ];

  const isLoading =
    tracksQuery.isLoading ||
    studentQueries.some((query) => query.isLoading) ||
    enrollmentStudentQuery.isLoading;
  const error =
    tracksQuery.error ??
    studentQueries.find((query) => query.isError)?.error ??
    enrollmentStudentQuery.error;
  const status = profileStudent
    ? profileStudent.user.status === "SUSPENDED"
      ? { label: "Suspended", className: "text-text-error" }
      : profileStudent.user.onboardingStatus === "INVITED"
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
            label: profileStudent
              ? nameWithDisplayName(profileStudent.user)
              : studentId,
            href: pathname,
          },
        ]}
      />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Students Profile
        </h1>

        {profileStudent && tab !== "overview" && status && (
          <StudentSummary
            student={profileStudent}
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
          ) : !profileStudent || !status ? (
            <CohortEmptyState
              icon={UserCircle}
              title="Student not found"
              description="This student isn't assigned to any of your tracks."
            />
          ) : tab === "overview" ? (
            <Overview
              student={profileStudent}
              status={status}
              trackNames={trackNames}
              cohortNames={cohortNames}
              modules={modulesQuery.data ?? []}
              modulesLoading={
                curriculumQuery.isLoading || modulesQuery.isLoading
              }
              modulesError={curriculumQuery.error ?? modulesQuery.error}
              hasCurriculum={Boolean(curriculumId)}
            />
          ) : tab === "progress" ? (
            <StudentProgressTab
              student={profileStudent}
              modules={modulesQuery.data ?? []}
              isLoading={curriculumQuery.isLoading || modulesQuery.isLoading}
              error={curriculumQuery.error ?? modulesQuery.error}
              hasCurriculum={Boolean(curriculumId)}
            />
          ) : tab === "activity" ? (
            <ActivityTab firstName={profileStudent.user.name.split(/\s+/)[0]} />
          ) : tab === "attendance" ? (
            <AttendanceTab firstName={profileStudent.user.name.split(/\s+/)[0]} />
          ) : tab === "assignments" ? (
            <StudentAssignmentsTab
              assignments={assignments}
              submissions={submissionQueries.map((query) => query.data)}
              isLoading={
                curriculumQuery.isLoading ||
                assignmentsQuery.isLoading ||
                submissionQueries.some((query) => query.isLoading)
              }
              error={
                curriculumQuery.error ??
                assignmentsQuery.error ??
                submissionQueries.find((query) => query.isError)?.error
              }
              hasCurriculum={Boolean(curriculumId)}
            />
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
  student: InstructorStudentProfile;
  status: { label: string; className: string };
  trackNames: string[];
  cohortNames: string[];
}) {
  return (
    <div className="mt-6 flex w-full max-w-full items-center gap-3 rounded-lg bg-surface-default px-3 py-6 shadow-[0_1px_3px_rgb(0_0_0/0.25)] sm:w-fit">
      <PersonAvatar
        name={student.user.name}
        src={student.user.image}
        colorKey={student.user.id}
        size={60}
      />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="truncate text-lg/6 font-semibold text-text-primary">
          {nameWithDisplayName(student.user)}
        </p>
        <ProfileBadges
          status={status}
          trackNames={trackNames}
          cohortNames={cohortNames}
          riskStatus={student.riskStatus}
          enrollmentStatus={student.enrollment.status}
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
  modules,
  modulesLoading,
  modulesError,
  hasCurriculum,
}: {
  student: InstructorStudentProfile;
  status: { label: string; className: string };
  trackNames: string[];
  cohortNames: string[];
  modules: CurriculumModule[];
  modulesLoading: boolean;
  modulesError: Error | null | undefined;
  hasCurriculum: boolean;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,657fr)_minmax(0,463fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <PersonAvatar
                name={student.user.name}
                src={student.user.image}
                colorKey={student.user.id}
                size={80}
              />
              <div className="flex min-w-0 flex-col gap-2">
                <p className="truncate text-2xl font-semibold text-text-primary">
                  {nameWithDisplayName(student.user)}
                </p>
                <ProfileBadges
                  status={status}
                  trackNames={trackNames}
                  cohortNames={cohortNames}
                  riskStatus={student.riskStatus}
                  enrollmentStatus={student.enrollment.status}
                />
              </div>
            </div>
            <MessageButton email={student.user.email} />
          </div>
          <div className="grid w-fit max-w-full grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-[auto_auto]">
            {student.user.phoneNumber && (
              <DetailItem icon={Call02}>{student.user.phoneNumber}</DetailItem>
            )}
            <DetailItem icon={Calendar03}>
              {formatJoinedDate(student.enrollment.enrolledAt)}
            </DetailItem>
            <DetailItem icon={Mail02}>{student.user.email}</DetailItem>
            <DetailItem icon={Location01}>
              {student.user.location || "--"}
            </DetailItem>
            {student.user.description && (
              <p className="col-span-full px-2 font-work text-sm text-text-secondary">
                {student.user.description}
              </p>
            )}
          </div>
        </Card>
        <ProgressOverviewCard
          trackName={student.enrollment.track.name}
          student={student}
          modules={modules}
          modulesLoading={modulesLoading}
          modulesError={modulesError}
          hasCurriculum={hasCurriculum}
        />
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

function formatJoinedDate(value?: string | null) {
  if (!value) return "--";

  return `Joined ${new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

function StudentProgressTab({
  student,
  modules,
  isLoading,
  error,
  hasCurriculum,
}: {
  student: InstructorStudentProfile;
  modules: CurriculumModule[];
  isLoading: boolean;
  error: Error | null | undefined;
  hasCurriculum: boolean;
}) {
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const publishedModules = modules.filter(
    (module) => module.status === "PUBLISHED",
  );
  const currentModule =
    publishedModules.find((module) => module.id === selectedModuleId) ??
    publishedModules[0];

  if (isLoading) {
    return (
      <Card>
        <div className="h-20 animate-pulse rounded-lg bg-neutral-100" />
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <p role="alert" className="font-work text-sm text-text-error">
          Couldn&apos;t load curriculum: {error.message}
        </p>
      </Card>
    );
  }
  if (!hasCurriculum || publishedModules.length === 0) {
    return (
      <Card>
        <p className="font-work text-sm text-text-secondary">
          No published curriculum modules are available for this enrollment.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,309fr)_minmax(0,811fr)]">
      <Card className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="truncate text-lg/6 font-semibold text-text-primary">
              {student.enrollment.track.name} Track
            </h2>
            <p className="truncate font-work text-[13px]/[18px] text-text-secondary">
              {student.enrollment.cohort.name}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-1 text-right">
            <p className="text-lg/6 font-semibold text-text-primary">
              {student.progress.lessons.percentage}%
            </p>
            <p className="font-work text-[13px]/[18px] text-text-secondary">
              Overall progress
            </p>
          </div>
        </div>
        <ProgressBar value={student.progress.lessons.percentage} />

        <ul className="flex flex-col">
          {publishedModules.map((module, index) => (
            <li key={module.id}>
              <button
                type="button"
                aria-pressed={module.id === currentModule?.id}
                onClick={() => setSelectedModuleId(module.id)}
                className={`flex w-full items-center justify-between gap-3 p-2 text-left ${
                  module.id === currentModule?.id
                    ? "rounded-lg bg-brand-100"
                    : "border-b border-border-default hover:bg-surface-background"
                }`}
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-base font-medium text-text-secondary">
                    Module {index + 1}
                  </span>
                  <span className="truncate font-work text-sm text-text-primary">
                    {module.title}
                  </span>
                </span>
                <span className="shrink-0 font-work text-xs text-text-secondary">
                  {module.lessons.length} lessons
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
                {publishedModules.findIndex(
                  (module) => module.id === currentModule?.id,
                ) + 1}
              </p>
              <h2 className="text-xl font-semibold text-text-primary">
                {currentModule?.title}
              </h2>
              {currentModule?.description && (
                <p className="font-work text-sm text-text-secondary">
                  {currentModule.description}
                </p>
              )}
            </div>
          </div>
        </Card>
        <Card className="gap-3">
          <CardHeader
            size="h4"
            title="Lessons"
            subtitle={`Lessons included in ${currentModule?.title ?? "this module"}.`}
          />
          {currentModule?.lessons.length ? (
            <ol className="flex flex-col divide-y divide-border-default">
              {currentModule.lessons.map((lesson, index) => (
                <li
                  key={lesson.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="font-work text-sm text-text-secondary">
                    {index + 1}.
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">
                      {lesson.title}
                    </p>
                    {lesson.description && (
                      <p className="mt-1 font-work text-sm text-text-secondary">
                        {lesson.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="font-work text-sm text-text-secondary">
              No lessons are available in this module.
            </p>
          )}
        </Card>
        <Card className="gap-3">
          <CardHeader
            size="h4"
            title="Progress summary"
            subtitle="Completion data from this student's enrollment."
          />
          <ProgressCounts student={student} />
        </Card>
      </div>
    </div>
  );
}

function ProgressOverviewCard({
  trackName,
  student,
  modules,
  modulesLoading,
  modulesError,
  hasCurriculum,
}: {
  trackName: string;
  student: InstructorStudentProfile;
  modules: CurriculumModule[];
  modulesLoading: boolean;
  modulesError: Error | null | undefined;
  hasCurriculum: boolean;
}) {
  return (
    <Card>
      <CardHeader
        title="Current Progress"
        subtitle={`Progress across the ${trackName} curriculum`}
      />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-2xl font-semibold text-text-primary">
            {student.progress.lessons.percentage}%
          </span>
          <span className="font-work text-sm text-text-secondary">
            Overall progress
          </span>
        </div>
        <ProgressBar value={student.progress.lessons.percentage} />
        <p className="font-work text-sm text-text-secondary">
          {student.progress.lessons.completed} of {student.progress.lessons.total} lessons completed
        </p>
        {modulesLoading ? (
          <div className="h-10 animate-pulse rounded-lg bg-neutral-100" />
        ) : modulesError ? (
          <p role="alert" className="font-work text-sm text-text-error">
            Couldn&apos;t load curriculum: {modulesError.message}
          </p>
        ) : !hasCurriculum ? (
          <p className="font-work text-sm text-text-secondary">
            No published curriculum is available for this enrollment.
          </p>
        ) : (
          modules.filter((module) => module.status === "PUBLISHED").length ===
          0 ? (
            <p className="font-work text-sm text-text-secondary">
              No published modules are available for this curriculum.
            </p>
          ) : (
            modules
              .filter((module) => module.status === "PUBLISHED")
              .slice(0, 4)
              .map((module) => (
                <div key={module.id} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate font-work text-sm text-text-primary">
                    {module.title}
                  </span>
                  <span className="shrink-0 font-work text-xs text-text-secondary">
                    {module.lessons.length} lessons
                  </span>
                </div>
              ))
          )
        )}
      </div>
    </Card>
  );
}

function ProgressCounts({ student }: { student: InstructorStudentProfile }) {
  const { lessons, assignments, weeklyTasks } = student.progress;
  const metrics = [
    {
      label: "Lessons completed",
      value: `${lessons.completed}/${lessons.total}`,
    },
    {
      label: "Assignments submitted",
      value: `${assignments.submitted}/${assignments.total}`,
    },
    { label: "Assignments graded", value: assignments.graded },
    { label: "Assignments pending", value: assignments.pending },
    { label: "Assignments missed", value: assignments.missed },
    { label: "Assignments on hold", value: assignments.onHold },
    { label: "Weekly tasks", value: weeklyTasks.total },
    { label: "Tasks pending", value: weeklyTasks.pending },
    { label: "Tasks in progress", value: weeklyTasks.inProgress },
    { label: "Tasks submitted", value: weeklyTasks.submitted },
    { label: "Tasks reviewed", value: weeklyTasks.reviewed },
    { label: "Tasks overdue", value: weeklyTasks.overdue },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-lg bg-surface-subtle p-3">
          <dt className="font-work text-xs text-text-secondary">
            {metric.label}
          </dt>
          <dd className="mt-1 font-semibold text-text-primary">
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function StudentAssignmentsTab({
  assignments,
  submissions,
  isLoading,
  error,
  hasCurriculum,
}: {
  assignments: CurriculumAssignment[];
  submissions: (AssignmentSubmission | undefined)[];
  isLoading: boolean;
  error: Error | null | undefined;
  hasCurriculum: boolean;
}) {
  const rows = assignments.flatMap((item, index) =>
    item.assignment.status === "PUBLISHED"
      ? [{ ...item, submission: submissions[index] }]
      : [],
  );

  if (isLoading) {
    return (
      <Card>
        <div className="h-20 animate-pulse rounded-lg bg-neutral-100" />
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <p role="alert" className="font-work text-sm text-text-error">
          Couldn&apos;t load assignments: {error.message}
        </p>
      </Card>
    );
  }
  if (!hasCurriculum || rows.length === 0) {
    return (
      <Card>
        <p className="font-work text-sm text-text-secondary">
          No published assignments are available for this enrollment.
        </p>
      </Card>
    );
  }

  return (
    <Card className="gap-5">
      <CardHeader
        title="Assignments"
        subtitle="Assignments and submissions for this student."
      />
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] rounded-t-lg bg-surface-subtle px-3 py-3 font-work text-sm font-medium text-text-primary">
            <span>Assignment</span>
            <span>Module</span>
            <span>Due</span>
            <span>Status</span>
            <span>Grade</span>
          </div>
          <ul>
            {rows.map(({ assignment, module, submission }) => {
              const label = submission
                ? submissionBadges[submission.status].label
                : "Not submitted";
              const tone = submission
                ? submissionBadges[submission.status].status
                : "neutral";

              return (
                <li
                  key={assignment.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] items-center gap-2 border-b border-border-default px-3 py-4 font-work text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">
                      {assignment.title}
                    </p>
                    <p className="text-text-secondary">
                      {assignment.type} · {assignment.mode}
                    </p>
                  </div>
                  <span className="truncate text-text-secondary">
                    {module.title}
                  </span>
                  <span className="text-text-secondary">
                    {assignment.dueAt
                      ? new Date(assignment.dueAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )
                      : "--"}
                  </span>
                  <BrandBadge
                    className={
                      tone === "success"
                        ? "w-fit text-text-success"
                        : tone === "error"
                          ? "w-fit text-text-error"
                          : tone === "warning"
                            ? "w-fit text-text-warning"
                            : tone === "info"
                              ? "w-fit text-text-info"
                              : "w-fit text-text-secondary"
                    }
                  >
                    {label}
                  </BrandBadge>
                  <span className="text-text-secondary">
                    {submission?.score == null
                      ? "--"
                      : `${submission.score}/${assignment.maxPoints}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
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
  riskStatus,
  enrollmentStatus,
}: {
  status: { label: string; className: string };
  trackNames: string[];
  cohortNames: string[];
  riskStatus: string;
  enrollmentStatus: string;
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
      <BrandBadge size="lg" className="text-text-info">
        {formatStatusLabel(riskStatus)}
      </BrandBadge>
      <BrandBadge size="lg" className="text-text-info">
        {formatStatusLabel(enrollmentStatus)}
      </BrandBadge>
    </div>
  );
}

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
