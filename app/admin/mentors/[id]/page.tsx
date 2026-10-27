"use client";

import * as React from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import {
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
import { MentorActionsMenu } from "@/components/MentorActionsMenu";
import { StatCard } from "@/components/StatCard";
import { ActivityCard } from "@/components/student-profile/ActivityTab";
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
import { adminQueries, assignmentsFor, type AdminUser } from "@/lib/admin";
import { toMentor, type Mentor, type MentorStatus } from "@/lib/mentors";
import { cn } from "@/lib/utils";
import {
  assignedStudents,
  attentionThreshold,
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

function isTab(value: string | undefined): value is Tab {
  return tabs.some((tab) => tab.value === value);
}

const statusBadge: Record<
  MentorStatus,
  { label: string; status: "success" | "warning" | "neutral" }
> = {
  active: { label: "Active", status: "success" },
  pending: { label: "Pending", status: "warning" },
  inactive: { label: "Inactive", status: "neutral" },
};

const studentStatusPill = {
  active: { label: "Active", status: "success" },
  pending: { label: "Pending", status: "warning" },
  inactive: { label: "Inactive", status: "error" },
} as const;

// The design's neutral badge is the default badge surface and text.
const neutralBadge = "bg-surface-default-badge text-text-default-badge";

function needsAttention(student: AssignedStudent) {
  return student.progress < attentionThreshold;
}

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function MentorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = React.use(params);
  const { tab: tabParam } = React.use(searchParams);
  const tab: Tab = isTab(tabParam) ? tabParam : "overview";
  const router = useRouter();
  const mentorQuery = useQuery(adminQueries.user(id));

  // A missing user, or a user who isn't a mentor, gets the normal 404 page.
  const isNotFound =
    (mentorQuery.error instanceof ApiError &&
      mentorQuery.error.status === 404) ||
    (mentorQuery.data !== undefined && mentorQuery.data.role !== "MENTOR");
  if (isNotFound) notFound();

  const mentor = mentorQuery.data ? toMentor(mentorQuery.data) : undefined;

  return (
    <>
      <AdminTopNav
        breadcrumb={[
          "People",
          { label: "Mentors", href: "/admin/mentors" },
          ...(mentor
            ? [{ label: mentor.name, href: `/admin/mentors/${id}` }]
            : []),
        ]}
      />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Mentor Profile
        </h1>

        {/* The Overview has its own profile card; the other tabs lead with
          this summary. */}
        {mentor && tab !== "overview" && <MentorSummary mentor={mentor} />}

        <CohortTabs
          label="Mentor profile sections"
          tabs={tabs}
          value={tab}
          onChange={(next) =>
            router.replace(`/admin/mentors/${id}?tab=${next}`, {
              scroll: false,
            })
          }
          className="mt-6 shadow-[0_1px_3px_rgb(0_0_0/0.15)]"
        />

        <div className="mt-6">
          {mentorQuery.isPending && <OverviewSkeleton />}

          {mentorQuery.isError && (
            <CohortEmptyState
              icon={UserCircle}
              title="Couldn't load this mentor"
              description={mentorQuery.error.message}
            />
          )}

          {mentor && tab === "overview" && <OverviewTab mentor={mentor} />}
          {mentor && tab === "students" && <StudentsTab />}
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
    <div className="mt-6 flex w-fit max-w-full items-center gap-3 rounded-lg bg-surface-default px-3 py-6 shadow-[0_1px_3px_rgb(0_0_0/0.25)]">
      <PersonAvatar name={mentor.name} colorKey={mentor.id} size={60} />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="truncate text-lg/6 font-semibold text-text-primary">
          {mentor.name}
        </p>
        <MentorBadges mentor={mentor} />
      </div>
    </div>
  );
}

function OverviewTab({ mentor }: { mentor: Mentor }) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,657fr)_minmax(0,463fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <ProfileCard mentor={mentor} />
        <AssignedStudentsCard />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <UpcomingSessionsCard />
        <Card className="gap-4">
          <CardHeader title="Recent Activities" />
          {/* The Overview shows the two most recent days. */}
          <ActivityTimeline groups={mentorActivity(mentor.name).slice(0, 2)} />
        </Card>
      </div>
    </div>
  );
}

function ProfileCard({ mentor }: { mentor: Mentor }) {
  const user: AdminUser = mentor.user;

  // PENDING-BACKEND: the API has no job title, phone number or location for
  // a mentor.
  const details = [
    { icon: Call02, value: "--" },
    {
      icon: Calendar03,
      value: user.onboardedAt
        ? `Joined ${formatLongDate(user.onboardedAt)}`
        : `Invited ${formatLongDate(user.createdAt)}`,
    },
    { icon: Mail02, value: user.email },
    { icon: Location01, value: "--" },
  ];

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar name={mentor.name} colorKey={mentor.id} size={80} />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="truncate text-2xl font-semibold text-text-primary">
              {mentor.name}
            </p>
            <p className="truncate font-work text-sm text-text-secondary">--</p>
            <MentorBadges mentor={mentor} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <MessageButton />
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

/** A student's name, starred in red when they need attention. */
function StudentName({ student }: { student: AssignedStudent }) {
  return (
    <Link href={`/admin/students/${student.id}`} className="truncate text-base font-medium text-text-primary">
      {student.name}
      {needsAttention(student) && (
        <>
          {" "}
          <span aria-hidden className="text-text-error">
            *
          </span>
          <span className="sr-only">(needs attention)</span>
        </>
      )}
    </Link>
  );
}

function progressTone(student: AssignedStudent) {
  return needsAttention(student)
    ? { text: "text-text-error", bar: "bg-icon-error" }
    : { text: "text-text-primary", bar: "bg-interactive-primary-default" };
}

function AssignedStudentsCard() {
  return (
    <Card>
      <CardHeader
        title="Assigned students"
        action={
          <Button variant="tertiary" size="sm">
            View all
          </Button>
        }
      />
      <ul className="flex flex-col gap-3">
        {assignedStudents.map((student) => {
          const tone = progressTone(student);
          return (
            <li
              key={student.email}
              className="flex min-h-[68px] items-center justify-between gap-4 pl-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <PersonAvatar
                  name={student.name}
                  colorKey={student.id}
                  size={40}
                />
                <div className="min-w-0">
                  <StudentName student={student} />
                  <p className="truncate font-work text-sm text-text-secondary">
                    {student.email}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-6 sm:gap-20">
                <StatusPill status={studentStatusPill[student.status].status}>
                  {studentStatusPill[student.status].label}
                </StatusPill>
                <div className="flex w-[152px] flex-col gap-2">
                  <div>
                    <p className={cn("text-lg/6 font-semibold", tone.text)}>
                      {student.progress}%
                    </p>
                    <p className="font-work text-[13px]/[18px] text-text-muted">
                      Overall progress
                    </p>
                  </div>
                  <ProgressBar
                    value={student.progress}
                    fillClassName={tone.bar}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function UpcomingSessionsCard() {
  return (
    <Card className="gap-3">
      <CardHeader
        size="h4"
        title="Upcoming sessions"
        action={
          <Button variant="tertiary" size="sm">
            View all
          </Button>
        }
      />
      <ul className="flex flex-col gap-3">
        {upcomingSessions.map((session) => (
          <li
            key={session.date}
            className="flex items-center justify-between gap-3 border-b border-border-default py-3 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-info-badge text-icon-info">
                <Calendar03 className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="truncate font-work text-sm font-medium tracking-[-0.01em] text-text-primary">
                  {session.date}
                </p>
                <p className="font-work text-xs text-text-secondary">
                  {session.time}
                </p>
              </div>
            </div>
            <span className="shrink-0 font-work text-[13px]/[18px] text-text-secondary">
              {session.until}
            </span>
          </li>
        ))}
      </ul>
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

function StudentsTab() {
  const [search, setSearch] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<PeopleFilterValues>(
    {},
  );
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const query = search.trim().toLowerCase();
  const rows = assignedStudents.filter(
    (student) =>
      (student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)) &&
      matchesPeopleFilters(student, studentFilters, filterValues),
  );
  const allSelected =
    rows.length > 0 && rows.every((student) => selected.has(student.email));
  const someSelected = rows.some((student) => selected.has(student.email));

  const stats = [
    { title: "Total students", value: assignedStudents.length },
    {
      title: "Active students",
      value: assignedStudents.filter((student) => student.status === "active")
        .length,
    },
    {
      title: "Students needing attention",
      value: assignedStudents.filter(needsAttention).length,
    },
  ];

  function toggle(email: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(email);
      else next.delete(email);
      return next;
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(3,minmax(0,272px))]">
        {stats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} />
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
            <thead className="bg-surface-subtle text-text-primary uppercase">
              <tr className="h-11">
                <th className="w-[69px] border-r border-border-default pl-3">
                  <Checkbox
                    aria-label="Select all students"
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onCheckedChange={(checked) =>
                      rows.forEach((student) => toggle(student.email, checked))
                    }
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
                        checked={selected.has(student.email)}
                        onCheckedChange={(checked) =>
                          toggle(student.email, checked)
                        }
                        className="size-4 border-icon-secondary"
                      />
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-3">
                        <PersonAvatar
                          name={student.name}
                          colorKey={student.id}
                          size={40}
                        />
                        <div className="min-w-0">
                          <StudentName student={student} />
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
                          {student.progress}%
                        </span>
                        <ProgressBar
                          value={student.progress}
                          fillClassName={tone.bar}
                          className="w-[150px]"
                        />
                      </div>
                    </td>
                    <td className="px-2.5">
                      {/* The design has no menu for this button yet. */}
                      <button
                        type="button"
                        aria-label={`${student.name} actions`}
                        className="flex size-8 items-center justify-center text-text-primary"
                      >
                        <MoreHorizontal className="size-6" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="px-6 py-10 text-center font-work text-sm text-text-muted">
            No one matches your search or filters.
          </p>
        )}

        <PeopleFilterDialog
          open={filterOpen}
          onOpenChange={setFilterOpen}
          filters={studentFilters}
          value={filterValues}
          onApply={setFilterValues}
        />
      </section>
    </>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,657fr)_minmax(0,463fr)]">
      <Card>
        <div className="flex items-center gap-3">
          <Skeleton className="size-[80px] rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-7 w-64" />
          </div>
        </div>
        <Skeleton className="h-[88px] w-full max-w-md" />
      </Card>
      <Card>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-40 w-full" />
      </Card>
    </div>
  );
}
