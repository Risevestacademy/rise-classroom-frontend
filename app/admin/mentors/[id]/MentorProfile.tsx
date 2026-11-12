"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu } from "@base-ui/react/menu";

import {
  Add01,
  Calendar03,
  Call02,
  Filter,
  Location01,
  Mail02,
  MoreHorizontal,
  Search01,
  UserCircle,
} from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import { CohortEmptyState } from "@/components/cohorts/CohortEmptyState";
import { StatusPill } from "@/components/cohorts/CohortPeopleTable";
import { CohortTabs } from "@/components/cohorts/CohortTabs";
import {
  matchesPeopleFilters,
  PeopleFilterDialog,
  type PeopleFilter,
  type PeopleFilterValues,
} from "@/components/cohorts/PeopleFilterDialog";
import { PersonAvatar } from "@/components/PersonAvatar";
import { PeopleSelectionBar } from "@/components/PeopleSelectionBar";
import {
  actionsMenuItemClass,
  actionsMenuPopupClass,
  MentorActionsMenu,
} from "@/components/MentorActionsMenu";
import {
  AssignStudentsDialog,
  ReassignStudentDialog,
} from "@/components/MentorAssignmentDialogs";
import {
  progressLabel,
  progressTone,
  StudentName,
  StudentsProgressCard,
  studentStatusPill,
  UpcomingSessionsCard,
} from "@/components/MentorOverviewCards";
import { StatCard } from "@/components/StatCard";
import { ActivityCard } from "@/components/student-profile/ActivityTab";
import {
  ActivityCardSkeleton,
  MenteeTableRowsSkeleton,
  MentorOverviewSkeleton,
  ProfileSummarySkeleton,
} from "@/components/student-profile/skeletons";
import {
  ActivityTimeline,
  Card,
  CardHeader,
  DetailItem,
  MessageButton,
  ProgressBar,
} from "@/components/student-profile/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { instructorStudentsQuery, toTaughtStudents } from "@/lib/instructors";
import {
  adminQueries,
  assignmentsFor,
  nameWithDisplayName,
  type AdminUser,
} from "@/lib/admin";
import {
  assignMentor,
  mentorQueries,
  toAssignedStudent,
  toMentor,
  type Mentor,
  type MentorStatus,
} from "@/lib/mentors";
import { useRowSelection } from "@/lib/use-row-selection";
import { useTabParam } from "@/lib/use-tab-param";
import { cn } from "@/lib/utils";
import {
  instructorRecentActivity,
  mentorActivity,
  mentorActivityFilters,
  upcomingSessions,
  type AssignedStudent,
} from "./profile-data";

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "students", label: "Students" },
  { value: "activity", label: "Activity" },
] as const;

type Tab = (typeof tabs)[number]["value"];

const statusBadge: Record<
  MentorStatus,
  { label: string; status: "success" | "warning" | "neutral" }
> = {
  active: { label: "Active", status: "success" },
  pending: { label: "Pending", status: "warning" },
  inactive: { label: "Inactive", status: "neutral" },
};

// The design's neutral badge is the default badge surface and text.
const neutralBadge = "bg-surface-default-badge text-text-default-badge";

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export type StaffRole = "MENTOR" | "INSTRUCTOR";

const roleCopy = {
  MENTOR: { label: "Mentor", path: "/admin/mentors" },
  INSTRUCTOR: { label: "Instructor", path: "/admin/instructors" },
} satisfies Record<StaffRole, { label: string; path: string }>;

/**
 * The mentor or instructor profile. The server loads the person first; with
 * `loading` it only shows the skeleton, for while that happens.
 */
export function MentorProfile({
  id,
  role = "MENTOR",
  loading = false,
}: {
  id: string;
  role?: StaffRole;
  loading?: boolean;
}) {
  const [tab, setTab] = useTabParam(tabs);
  const mentorQuery = useQuery({ ...adminQueries.user(id), enabled: !loading });
  const [assignOpen, setAssignOpen] = React.useState(false);
  const copy = roleCopy[role];

  // A missing user, or a user with another role, gets the normal 404 page.
  const isNotFound =
    (mentorQuery.error instanceof ApiError &&
      mentorQuery.error.status === 404) ||
    (mentorQuery.data !== undefined && mentorQuery.data.role !== role);
  if (isNotFound) notFound();

  const mentor = mentorQuery.data ? toMentor(mentorQuery.data) : undefined;

  return (
    <>
      <AdminTopNav
        breadcrumb={[
          "People",
          { label: `${copy.label}s`, href: copy.path },
          ...(mentor
            ? [{ label: mentor.name, href: `${copy.path}/${id}` }]
            : []),
        ]}
      />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          {copy.label} Profile
        </h1>

        {/* The Overview has its own profile card; the other tabs lead with
          this summary. */}
        {mentor && tab !== "overview" && <MentorSummary mentor={mentor} />}
        {mentorQuery.isPending && tab !== "overview" && (
          <ProfileSummarySkeleton />
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <CohortTabs
            label={`${copy.label} profile sections`}
            tabs={tabs}
            value={tab}
            onChange={setTab}
            className="shadow-[0_1px_3px_rgb(0_0_0/0.15)]"
          />
          {mentor && role === "MENTOR" && tab === "students" && (
            <Button variant="primary" size="medium" onClick={() => setAssignOpen(true)}>
              <Add01 className="size-5" />
              Assign student
            </Button>
          )}
        </div>

        <div className="mt-6">
          {mentorQuery.isPending && <TabSkeleton tab={tab} />}

          {mentorQuery.isError && (
            <CohortEmptyState
              icon={UserCircle}
              title={`Couldn't load this ${copy.label.toLowerCase()}`}
              description={mentorQuery.error.message}
            />
          )}

          {mentor && tab === "overview" && <OverviewTab mentor={mentor} onTabChange={setTab} />}
          {mentor && tab === "students" && <StudentsTab mentor={mentor} />}
          {mentor && tab === "activity" && (
            <ActivityCard
              subtitle={`Recent activity and mentoring history for ${mentor.name}.`}
              filters={mentorActivityFilters}
              groups={mentorActivity(mentor.name)}
              className="max-w-[730px]"
            />
          )}
        </div>
      </main>

      {mentor && role === "MENTOR" && (
        <AssignStudentsDialog
          mentor={mentor.user}
          open={assignOpen}
          onOpenChange={setAssignOpen}
        />
      )}
    </>
  );
}

/** Track, status and cohort, as light badges. */
function MentorBadges({ mentor }: { mentor: Mentor }) {
  const { tracks, cohorts } = assignmentsFor(mentor.user);
  const status = statusBadge[mentor.status];

  return (
    <div className="flex flex-wrap gap-2">
      {tracks.map((track) => (
        <Badge key={track} variant="light" status="info" size="lg">
          {track}
        </Badge>
      ))}
      <Badge
        variant="light"
        status={status.status}
        size="lg"
        className={cn(status.status === "neutral" && neutralBadge)}
      >
        {status.label}
      </Badge>
      {cohorts.map((cohort) => (
        <Badge key={cohort} variant="light" size="lg" className={neutralBadge}>
          {cohort}
        </Badge>
      ))}
    </div>
  );
}

/** The compact profile shown above the tabs on every tab but the Overview. */
function MentorSummary({ mentor }: { mentor: Mentor }) {
  return (
    <div className="mt-6 flex w-full sm:w-fit max-w-full items-center gap-3 rounded-lg bg-surface-default px-3 py-6 shadow-[0_1px_3px_rgb(0_0_0/0.25)]">
      <PersonAvatar
        name={mentor.name}
        src={mentor.user.image}
        colorKey={mentor.id}
        size={60}
      />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="truncate text-lg/6 font-semibold text-text-primary">
          {nameWithDisplayName(mentor.user)}
        </p>
        <MentorBadges mentor={mentor} />
      </div>
    </div>
  );
}

/** A mentor's mentees, or the students on an instructor's cohort tracks. */
function useMentees(mentor: Mentor) {
  const isMentor = mentor.user.role === "MENTOR";
  const mentees = useQuery({
    ...mentorQueries.mentees(mentor.id),
    enabled: isMentor,
  });
  const taught = useQuery({
    ...instructorStudentsQuery(mentor.id),
    enabled: !isMentor,
  });

  const query = isMentor ? mentees : taught;
  const students = isMentor
    ? (mentees.data ?? []).map(toAssignedStudent)
    : toTaughtStudents(taught.data ?? []);
  return {
    students,
    total: students.length,
    isPending: query.isPending,
    error: query.error,
  };
}

/** Why the students list is empty: it failed, or there are none. */
function menteesMessage(query: ReturnType<typeof useMentees>) {
  if (query.error) return `Couldn't load students. ${query.error.message}`;
  return "No students assigned yet.";
}

function OverviewTab({
  mentor,
  onTabChange,
}: {
  mentor: Mentor;
  onTabChange: (tab: Tab) => void;
}) {
  const router = useRouter();
  const mentees = useMentees(mentor);
  const isMentor = mentor.user.role === "MENTOR";

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,657fr)_minmax(0,463fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <ProfileCard mentor={mentor} />
        <StudentsProgressCard
          title={
            isMentor || mentees.isPending
              ? "Assigned students"
              : `Assigned students (${mentees.total})`
          }
          students={mentees.students.slice(0, 5)}
          studentHref={(student) => `/admin/students/${student.id}`}
          emptyMessage={menteesMessage(mentees)}
          loading={mentees.isPending}
          onViewAll={() => onTabChange("students")}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <UpcomingSessionsCard
          sessions={upcomingSessions}
          onViewAll={() => router.push("/admin/calendar")}
        />
        <Card className="gap-4">
          <CardHeader title="Recent Activities" />
          {/* The Overview shows the two most recent days. */}
          <ActivityTimeline
            groups={
              isMentor
                ? mentorActivity(mentor.name).slice(0, 2)
                : instructorRecentActivity
            }
          />
        </Card>
      </div>
    </div>
  );
}

function ProfileCard({ mentor }: { mentor: Mentor }) {
  const user: AdminUser = mentor.user;

  // PENDING-BACKEND: the API has no job title for a mentor.
  const details = [
    { icon: Call02, value: user.phoneNumber || "--" },
    {
      icon: Calendar03,
      value: user.onboardedAt
        ? `Joined ${formatLongDate(user.onboardedAt)}`
        : `Invited ${formatLongDate(user.createdAt)}`,
    },
    { icon: Mail02, value: user.email },
    { icon: Location01, value: user.location || "--" },
  ];

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar
            name={mentor.name}
            src={mentor.user.image}
            colorKey={mentor.id}
            size={80}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="truncate text-2xl font-semibold text-text-primary">
              {nameWithDisplayName(mentor.user)}
            </p>
            <p className="truncate font-work text-sm text-text-secondary">--</p>
            <MentorBadges mentor={mentor} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <MessageButton email={user.email} />
          <MentorActionsMenu mentor={mentor} placement="profile" />
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

const studentFilters: PeopleFilter<AssignedStudent>[] = [
  {
    key: "status",
    title: "Status",
    allLabel: "All",
    options: [
      { value: "active", label: "Active" },
      { value: "pending", label: "Pending" },
      { value: "inactive", label: "Inactive" },
    ],
    values: (student) => [student.status],
  },
];

const headerCell =
  "border-r border-border-default px-2.5 font-work text-sm font-medium tracking-[-0.01em]";

function StudentsTab({ mentor }: { mentor: Mentor }) {
  const queryClient = useQueryClient();
  const mentees = useMentees(mentor);
  const isMentor = mentor.user.role === "MENTOR";
  const assignedStudents = mentees.students;
  const [search, setSearch] = React.useState("");
  const [reassigning, setReassigning] = React.useState<AssignedStudent | null>(
    null,
  );
  const [filterValues, setFilterValues] = React.useState<PeopleFilterValues>(
    {},
  );
  const [filterOpen, setFilterOpen] = React.useState(false);
  const selection = useRowSelection((student: AssignedStudent) => student.email);

  const query = search.trim().toLowerCase();
  const rows = assignedStudents.filter(
    (student) =>
      (student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)) &&
      matchesPeopleFilters(student, studentFilters, filterValues),
  );
  const headerCheckbox = selection.headerState(rows);

  const stats = [
    { title: "Total students", value: mentees.total },
    {
      title: "Active students",
      value: assignedStudents.filter((student) => student.status === "active")
        .length,
    },
    // PENDING-BACKEND: needing attention is based on progress, which the API
    // doesn't have yet.
    { title: "Students needing attention", value: "--" },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(3,minmax(0,272px))]">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            loading={mentees.isPending}
          />
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-xl bg-surface-default">
        <div className="flex items-center justify-end gap-3 px-4 py-3 sm:px-6">
          <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border-default p-2.5 text-text-muted sm:w-[281px] sm:flex-none">
            <Search01 className="size-4 shrink-0" />
            <span className="sr-only">Search by name or email</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className="w-full min-w-0 bg-transparent font-work text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </label>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex h-10 shrink-0 items-center gap-1 rounded-lg border border-border-default bg-surface-default px-2 py-1 font-work text-sm text-text-muted"
          >
            <Filter className="size-4" />
            Filter
          </button>
        </div>

        {/* `relative` keeps the absolutely positioned checkbox inputs inside the
          scroll area; without it they widen the whole page on mobile. */}
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed text-left">
            <thead className="bg-surface-subtle text-text-primary">
              <tr className="h-11">
                <th className="w-[69px] border-r border-border-default pl-3">
                  <Checkbox
                    aria-label="Select all students"
                    {...headerCheckbox}
                    onCheckedChange={() => selection.toggleAll(rows)}
                    className="size-4 border-icon-secondary"
                  />
                </th>
                <th className={cn(headerCell, "w-[431px] px-3")}>Student</th>
                <th className={cn(headerCell, "w-[160px]")}>Status</th>
                <th className={cn(headerCell, "w-[420px]")}>
                  Overall progress
                </th>
                <th className="w-[56px] px-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {mentees.isPending && <MenteeTableRowsSkeleton />}
              {rows.map((student) => {
                const tone = progressTone(student);
                const pill = studentStatusPill[student.status];
                return (
                  <tr
                    key={student.email}
                    className="h-[69px] border-b border-border-default"
                  >
                    <td className="pl-3">
                      <Checkbox
                        aria-label={`Select ${student.name}`}
                        checked={selection.isSelected(student)}
                        onCheckedChange={(checked) =>
                          selection.toggle(student, checked)
                        }
                        className="size-4 border-icon-secondary"
                      />
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-3">
                        <PersonAvatar
                          name={student.name}
                          src={student.image}
                          colorKey={student.id}
                          size={40}
                        />
                        <div className="min-w-0">
                          <StudentName
                            student={student}
                            href={`/admin/students/${student.id}`}
                          />
                          <p className="truncate font-work text-sm text-text-secondary">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5">
                      <StatusPill status={pill.status}>{pill.label}</StatusPill>
                    </td>
                    <td className="px-2.5 py-3">
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "w-9 text-lg/6 font-semibold",
                            tone.text,
                          )}
                        >
                          {progressLabel(student)}
                        </span>
                        <ProgressBar
                          value={student.progress ?? 0}
                          fillClassName={tone.bar}
                          className="w-[150px]"
                        />
                      </div>
                    </td>
                    <td className="px-2.5">
                      <Menu.Root>
                        <Menu.Trigger
                          aria-label={`${student.name} actions`}
                          className="flex size-8 items-center justify-center text-text-primary"
                        >
                          <MoreHorizontal className="size-6" />
                        </Menu.Trigger>
                        <Menu.Portal>
                          <Menu.Positioner align="end" sideOffset={4} className="z-50">
                            <Menu.Popup className={actionsMenuPopupClass}>
                              {isMentor ? (
                                <Menu.Item
                                  onClick={() => setReassigning(student)}
                                  className={actionsMenuItemClass}
                                >
                                  Reassign student
                                </Menu.Item>
                              ) : (
                                <Menu.LinkItem
                                  render={
                                    <Link href={`/admin/students/${student.id}`} />
                                  }
                                  className={actionsMenuItemClass}
                                >
                                  View profile
                                </Menu.LinkItem>
                              )}
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.Root>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && !mentees.isPending && (
          <p className="px-6 py-10 text-center font-work text-sm text-text-muted">
            {assignedStudents.length > 0
              ? "No one matches your search or filters."
              : menteesMessage(mentees)}
          </p>
        )}

        <PeopleFilterDialog
          open={filterOpen}
          onOpenChange={setFilterOpen}
          filters={studentFilters}
          value={filterValues}
          onApply={setFilterValues}
        />

        {reassigning && (
          <ReassignStudentDialog
            student={reassigning}
            currentMentor={{ id: mentor.id, name: mentor.name }}
            open
            onOpenChange={(open) => !open && setReassigning(null)}
            // Assigning a new mentor replaces the current one.
            onReassign={async (mentorId) => {
              await assignMentor({ mentorId, studentUserId: reassigning.id });
              await queryClient.invalidateQueries({
                queryKey: ["admin", "users"],
              });
            }}
          />
        )}
      </section>

      <PeopleSelectionBar
        items={selection.items}
        noun={{ singular: "student", plural: "students" }}
        onClear={selection.clear}
        exportFileName={`${mentor.name} students`}
        exportColumns={[
          { header: "Name", value: (student) => student.name },
          { header: "Email", value: (student) => student.email },
          { header: "Status", value: (student) => studentStatusPill[student.status].label },
          { header: "Overall progress", value: (student) => progressLabel(student) },
        ]}
      />
    </>
  );
}

/** What each tab looks like while the mentor loads. */
function TabSkeleton({ tab }: { tab: Tab }) {
  switch (tab) {
    case "overview":
      return <MentorOverviewSkeleton />;
    case "students":
      return <StudentsTabSkeleton />;
    case "activity":
      return <ActivityCardSkeleton className="max-w-[730px]" />;
  }
}

function StudentsTabSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(3,minmax(0,272px))]">
        {["Total students", "Active students", "Students needing attention"].map(
          (title) => (
            <StatCard key={title} title={title} value={null} loading />
          ),
        )}
      </div>
      <section className="mt-6 overflow-hidden rounded-xl bg-surface-default">
        <div className="flex items-center justify-end gap-3 px-4 py-3 sm:px-6">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-lg sm:w-[281px] sm:flex-none" />
          <Skeleton className="h-10 w-20 shrink-0 rounded-lg" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed">
            <thead className="bg-surface-subtle">
              <tr className="h-11">
                <th className="w-[69px]" />
                <th className="w-[431px]" />
                <th className="w-[160px]" />
                <th className="w-[420px]" />
                <th className="w-[56px]" />
              </tr>
            </thead>
            <tbody>
              <MenteeTableRowsSkeleton />
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
