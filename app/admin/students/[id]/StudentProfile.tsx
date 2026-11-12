"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Code, PenLine, Smartphone } from "lucide-react";
import { UserMoreActions } from "@/components/student-profile/UserMoreAction";
import {
  Calendar03,
  Call02,
  File01,
  Location01,
  Mail02,
  Search01,
  UserCircle,
} from "@/assets/icons";
import { cn } from "@/lib/utils";
import { AdminTopNav } from "@/components/AdminTopNav";
import { CohortEmptyState } from "@/components/cohorts/CohortEmptyState";
import { CohortTabs } from "@/components/cohorts/CohortTabs";
import { PersonAvatar } from "@/components/PersonAvatar";
import { ActivityTab } from "@/components/student-profile/ActivityTab";
import { AddNoteDialog } from "@/components/student-profile/AddNoteDialog";
import { AssignmentsTab } from "@/components/student-profile/AssignmentsTab";
import { AttendanceTab } from "@/components/student-profile/AttendanceTab";
import { ControlTowerTab } from "@/components/student-profile/ControlTowerTab";
import { MentorshipTab } from "@/components/student-profile/MentorshipTab";
import { NotesTab } from "@/components/student-profile/NotesTab";
import { ProgressTab } from "@/components/student-profile/ProgressTab";
import {
  ActivityTabSkeleton,
  AssignmentsTabSkeleton,
  AttendanceTabSkeleton,
  ControlTowerTabSkeleton,
  MentorshipTabSkeleton,
  NotesTabSkeleton,
  ProfileSummarySkeleton,
  ProgressTabSkeleton,
  StudentOverviewSkeleton,
} from "@/components/student-profile/skeletons";
import {
  ActivityTimeline,
  AttendanceGrid,
  BrandBadge,
  Card,
  CardHeader,
  CardSelect,
  DetailItem,
  GroupLabel,
  IconBox,
  MessageButton,
  ProgressBar,
  attendanceCell,
  attendanceLabels,
} from "@/components/student-profile/shared";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { ApiError } from "@/lib/api";
import {
  adminQueries,
  assignmentsFor,
  nameWithDisplayName,
  type AdminUser,
} from "@/lib/admin";
import { useTabParam } from "@/lib/use-tab-param";
import { getStudentStatus } from "../student-display";
import {
  activityGroups,
  attendanceMonth,
  deadlines,
  moduleFilters,
  moduleProgress,
  notes,
  overallProgress,
} from "./overview-data";

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "progress", label: "Progress" },
  { value: "control-tower", label: "Control Tower" },
  { value: "activity", label: "Activity" },
  { value: "attendance", label: "Attendance" },
  { value: "assignments", label: "Assignments" },
  { value: "mentorship", label: "Mentorship" },
  { value: "notes", label: "Notes" },
] as const;

type Tab = (typeof tabs)[number]["value"];

const moduleTones = {
  brand: {
    icon: PenLine,
    box: "bg-surface-brand text-icon-brand",
    bar: "bg-interactive-primary-default",
  },
  info: {
    icon: Code,
    box: "bg-surface-info-badge text-icon-info",
    bar: "bg-icon-info",
  },
  success: {
    icon: Search01,
    box: "bg-surface-success-badge text-icon-success",
    bar: "bg-[#960b93]",
  },
  accent: {
    icon: Smartphone,
    box: "bg-[#fdeafc] text-[#960b93]",
    bar: "bg-[#960b93]",
  },
} as const;

const deadlineTones = {
  error: { box: "bg-surface-brand text-icon-error", badge: "text-text-error" },
  warning: { box: "bg-surface-brand text-icon-warning", badge: "text-text-warning" },
  neutral: { box: "bg-surface-subtle text-icon-muted", badge: "text-text-info" },
} as const;

/** The Overview's badges all sit on the brand surface, coloured by text only. */
const badgeText = {
  success: "text-text-success",
  warning: "text-text-warning",
  error: "text-text-error",
  info: "text-text-info",
  neutral: "text-text-default-badge",
} as const;

// The Overview card marks absences in brand surface rather than error.
const overviewCells = { ...attendanceCell, absent: "bg-surface-brand" };


function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The student profile. The server loads the student first; with `loading`
 * it only shows the skeleton, for while that happens.
 */
export function StudentProfile({
  id,
  loading = false,
}: {
  id: string;
  loading?: boolean;
}) {
  const [tab, setTab] = useTabParam(tabs);
  const studentQuery = useQuery({ ...adminQueries.user(id), enabled: !loading });

  // A missing user, or a user who isn't a student, gets the normal 404 page.
  const isNotFound =
    (studentQuery.error instanceof ApiError &&
      studentQuery.error.status === 404) ||
    (studentQuery.data !== undefined && studentQuery.data.role !== "STUDENT");
  if (isNotFound) notFound();

  const student = studentQuery.data;
  const name = student?.name ?? "";
  const firstName = student?.firstName || name.split(" ")[0];
  const assignments = student ? assignmentsFor(student) : undefined;
  const cohort = assignments?.cohorts[0];

  return (
    <>
      <AdminTopNav
        breadcrumb={
          [
            "People",
            { label: "Students", href: "/admin/students" },
            ...(student ? [{ label: name, href: `/admin/students/${id}` }] : []),
          ]
        }
      />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Students Profile
        </h1>

        {/* The Overview has its own profile card; every other tab leads
          with this summary. */}
        {student && tab !== "overview" && (
          <StudentSummary student={student} />
        )}
        {studentQuery.isPending && tab !== "overview" && (
          <ProfileSummarySkeleton />
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
          {studentQuery.isPending && <TabSkeleton tab={tab} />}

          {studentQuery.isError && (
            <CohortEmptyState
              icon={UserCircle}
              title="Couldn't load this student"
              description={studentQuery.error.message}
            />
          )}

          {student && tab === "overview" && (
            <OverviewTab student={student} onTabChange={setTab} />
          )}
          {student && tab === "progress" && (
            <ProgressTab track={assignments?.tracks[0]} cohort={cohort} />
          )}
          {student && tab === "control-tower" && (
            <ControlTowerTab firstName={firstName} cohort={cohort} />
          )}
          {student && tab === "activity" && (
            <ActivityTab firstName={firstName} />
          )}
          {student && tab === "attendance" && (
            <AttendanceTab firstName={firstName} />
          )}
          {student && tab === "assignments" && (
            <AssignmentsTab firstName={firstName} />
          )}
          {student && tab === "mentorship" && (
            <MentorshipTab
              student={{
                id: student.id,
                name,
                email: student.email,
                image: student.image,
              }}
              mentor={student.mentor}
              track={assignments?.tracks[0]}
              cohort={cohort}
            />
          )}
          {student && tab === "notes" && <NotesTab />}
        </div>
      </main>
    </>
  );
}

function OverviewTab({
  student,
  onTabChange,
}: {
  student: AdminUser;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,657fr)_minmax(0,463fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <ProfileCard student={student} />
        <MentorCard mentor={student.mentor} />
        <ProgressCard student={student} />
        <DeadlinesCard onTabChange={onTabChange} />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <AttendanceCard />
        <ActivitiesCard />
        <OverviewNotesCard onTabChange={onTabChange} />
      </div>
    </div>
  );
}

/** The compact profile shown above the tabs on every tab but the Overview. */
function StudentSummary({ student }: { student: AdminUser }) {
  const { tracks, cohorts } = assignmentsFor(student);
  const status = getStudentStatus(student);

  return (
    <div className="mt-6 flex w-full sm:w-fit max-w-full items-center gap-3 rounded-lg bg-surface-default px-3 py-6 shadow-[0_1px_3px_rgb(0_0_0/0.25)]">
      <PersonAvatar
        name={student.name}
        src={student.image}
        colorKey={student.id}
        size={60}
      />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="truncate text-lg/6 font-semibold text-text-primary">
          {nameWithDisplayName(student)}
        </p>
        <div className="flex flex-wrap gap-2">
          {tracks.map((track) => (
            <BrandBadge key={track} size="lg" className="text-text-info">
              {track}
            </BrandBadge>
          ))}
          <BrandBadge size="lg" className={badgeText[status.badge]}>
            {status.label}
          </BrandBadge>
          {cohorts.map((cohort) => (
            <BrandBadge key={cohort} size="lg" className="text-text-info">
              {cohort}
            </BrandBadge>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ student }: { student: AdminUser }) {
  const { tracks, cohorts } = assignmentsFor(student);
  const status = getStudentStatus(student);

  const details = [
    { icon: Call02, value: student.phoneNumber || "--" },
    {
      icon: Calendar03,
      value: student.onboardedAt
        ? `Joined ${formatLongDate(student.onboardedAt)}`
        : `Invited ${formatLongDate(student.createdAt)}`,
    },
    { icon: Mail02, value: student.email },
    { icon: Location01, value: student.location || "--" },
  ];

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar
            name={student.name}
            src={student.image}
            colorKey={student.id}
            size={80}
          />
          <div className="flex min-w-0 flex-col gap-2">
            <p className="truncate text-2xl font-semibold text-text-primary">
              {nameWithDisplayName(student)}
            </p>
            <div className="flex flex-wrap gap-2">
              {tracks.map((track) => (
                <BrandBadge key={track} size="lg" className="text-text-info">
                  {track}
                </BrandBadge>
              ))}
              <BrandBadge size="lg" className={badgeText[status.badge]}>
                {status.label}
              </BrandBadge>
              {cohorts.map((cohort) => (
                <BrandBadge key={cohort} size="lg" className="text-text-info">
                  {cohort}
                </BrandBadge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <MessageButton email={student.email} />
          <UserMoreActions user={student} />
        </div>
      </div>

      <div className="grid w-fit max-w-full grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-[auto_auto]">
        {details.map(({ icon, value }, index) => (
          <DetailItem key={index} icon={icon}>
            {value}
          </DetailItem>
        ))}
      </div>
    </Card>
  );
}

function MentorCard({ mentor }: { mentor: AdminUser["mentor"] }) {
  if (!mentor) {
    return (
      <Card className="gap-4">
        <CardHeader title="Mentor" />
        <p className="font-work text-sm text-text-muted">
          No mentor assigned yet.
        </p>
      </Card>
    );
  }

  const name = mentor.name;

  return (
    <Card className="gap-4">
      <CardHeader title="Mentor" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar
            name={name}
            src={mentor.image}
            colorKey={mentor.id}
            size={60}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              href={`/admin/mentors/${mentor.id}`}
              className="truncate text-lg/6 font-semibold text-text-primary hover:underline"
            >
              {name}
            </Link>
            {/* PENDING-BACKEND: the API has no job title for a mentor. */}
            <p className="truncate font-work text-sm text-text-secondary">
              --
            </p>
          </div>
        </div>
        <MessageButton email={mentor.email} />
      </div>
      <div className="flex items-start gap-2 p-2">
        <Calendar03 className="size-6 shrink-0 text-icon-secondary" />
        <div className="flex flex-col gap-1">
          <p className="font-work text-sm font-medium text-text-secondary">
            Next session
          </p>
          {/* PENDING-BACKEND: there are no mentorship sessions yet. */}
          <p className="font-work text-[13px]/[18px] text-text-secondary">
            --
          </p>
        </div>
      </div>
    </Card>
  );
}

function ProgressCard({ student }: { student: AdminUser }) {
  const { tracks } = assignmentsFor(student);
  // PENDING-BACKEND: there's no progress per module, so picking one doesn't
  // change the sample numbers below.
  const [module, setModule] =
    React.useState<(typeof moduleFilters)[number]["value"]>("all");
  const trackName = tracks[0] ?? "track";

  return (
    <Card>
      <CardHeader
        title="Current Progress"
        subtitle={`Progress across the ${trackName} track curriculum`}
        action={
          <CardSelect
            label="Module"
            value={module}
            options={moduleFilters}
            onChange={setModule}
          />
        }
      />

      <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-12">
        <CircularProgress
          value={overallProgress}
          size={180}
          strokeWidth={12}
          trackClassName="text-surface-subtle"
          progressClassName="text-icon-brand"
        >
          <div className="flex flex-col items-center">
            <span className="text-[32px]/10 font-semibold text-text-primary">
              {overallProgress}%
            </span>
            <span className="w-[68px] text-center font-work text-sm text-text-secondary">
              Overall progress
            </span>
          </div>
        </CircularProgress>

        <ul className="flex w-full min-w-0 flex-1 flex-col gap-2">
          {moduleProgress.map((item) => {
            const tone = moduleTones[item.tone];
            const Icon = tone.icon;
            return (
              <li
                key={item.label}
                className="grid grid-cols-[32px_minmax(0,1fr)_minmax(0,148px)_auto] items-center gap-3"
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    tone.box,
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="truncate font-work text-sm font-medium text-text-primary">
                  {item.label}
                </span>
                <ProgressBar value={item.value} fillClassName={tone.bar} />
                <span className="w-[29px] text-right font-work text-sm font-medium text-text-primary">
                  {item.value}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

/** One row in the deadlines, activities and notes lists. */
function ListItem({
  icon,
  iconClassName,
  title,
  detail,
  trailing,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  title: string;
  detail: string;
  trailing: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <IconBox icon={icon} className={iconClassName} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate font-work text-sm font-medium text-text-primary">
            {title}
          </p>
          <p className="truncate font-work text-[13px]/[18px] text-text-secondary">
            {detail}
          </p>
        </div>
      </div>
      {trailing}
    </li>
  );
}

function DeadlinesCard({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  return (
    <Card>
      <CardHeader
        title="Upcoming Deadlines"
        action={
          <Button onClick={() => onTabChange("assignments")} variant="tertiary" size="sm">
            View all
          </Button>
        }
      />
      <div className="flex flex-col gap-6">
        <GroupLabel>Today</GroupLabel>
        <ul className="flex flex-col gap-6">
          {deadlines.map((deadline) => {
            const tone = deadlineTones[deadline.tone];
            return (
              <ListItem
                key={deadline.title}
                icon={File01}
                iconClassName={tone.box}
                title={deadline.title}
                detail={deadline.type}
                trailing={
                  <BrandBadge className={tone.badge}>{deadline.due}</BrandBadge>
                }
              />
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

function AttendanceCard() {
  const { days, leadingBlanks, stats } = attendanceMonth;
  const [month, setMonth] = React.useState(attendanceMonth.value);

  const statItems = [
    { value: stats.rate, label: "Attendance rate" },
    { value: stats.attended, label: "Attended" },
    { value: stats.absent, label: "Absent" },
  ];

  return (
    <Card>
      <CardHeader
        title="Live sessions attendance"
        subtitle="Attendance across scheduled live classes"
        action={
          <CardSelect
            label="Month"
            value={month}
            options={[
              { value: attendanceMonth.value, label: attendanceMonth.label },
            ]}
            onChange={setMonth}
          />
        }
      />

      <div className="flex items-end justify-between gap-6">
        <AttendanceGrid
          size="small"
          monthLabel={attendanceMonth.label}
          leadingBlanks={leadingBlanks}
          days={days.map((status) => ({ status }))}
          cells={overviewCells}
        />

        <ul className="flex w-[88px] shrink-0 flex-col gap-2">
          {(
            Object.keys(attendanceLabels) as (keyof typeof attendanceLabels)[]
          ).map((status) => (
            <li
              key={status}
              className="flex items-center gap-2 font-work text-xs font-medium text-text-secondary"
            >
              <span
                className={cn("size-4 rounded-sm", overviewCells[status])}
              />
              {attendanceLabels[status]}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-3 rounded-lg border border-border-default p-3">
        {statItems.map((stat) => (
          <p
            key={stat.label}
            className="border-r border-border-default p-2.5 text-center text-sm font-medium text-text-primary last:border-r-0"
          >
            {stat.value}
            <br />
            {stat.label}
          </p>
        ))}
      </div>
    </Card>
  );
}

function ActivitiesCard() {
  return (
    <Card className="gap-4">
      <CardHeader title="Recent Activites" />
      <ActivityTimeline groups={activityGroups} />
    </Card>
  );
}

function OverviewNotesCard({
  onTabChange,
}: {
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <Card className="gap-4">
      <CardHeader
        title="Notes"
        action={
          <Button onClick={() => onTabChange("notes")} variant="tertiary" size="sm">
            View all
          </Button>
        }
      />
      <ul className="flex flex-col gap-4">
        {notes.map((note) => (
          <li key={note.date + note.body} className="flex flex-col gap-3">
            <p className="text-xs font-medium text-text-secondary">
              {note.date}
            </p>
            <div className="flex items-start justify-between gap-3">
              <div className="flex max-w-[316px] min-w-0 items-start gap-3">
                <IconBox
                  icon={File01}
                  className="bg-surface-subtle text-icon-secondary"
                />
                <p className="font-work text-[13px]/[18px] text-text-secondary">
                  {note.body}
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium text-text-muted">
                {note.author}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** What each tab looks like while the student loads. */
function TabSkeleton({ tab }: { tab: Tab }) {
  switch (tab) {
    case "overview":
      return <StudentOverviewSkeleton />;
    case "progress":
      return <ProgressTabSkeleton />;
    case "control-tower":
      return <ControlTowerTabSkeleton />;
    case "activity":
      return <ActivityTabSkeleton />;
    case "attendance":
      return <AttendanceTabSkeleton />;
    case "assignments":
      return <AssignmentsTabSkeleton />;
    case "mentorship":
      return <MentorshipTabSkeleton />;
    case "notes":
      return <NotesTabSkeleton />;
  }
}
