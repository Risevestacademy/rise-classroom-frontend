"use client";

import * as React from "react";
import { notFound, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  Cohorts as CohortsIcon,
  Edit02,
  Mentor,
  Teacher,
  Track,
  UserMultiple,
} from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import { CohortEmptyState } from "@/components/cohorts/CohortEmptyState";
import { InviteInstructorDialog } from "@/components/InviteInstructorDialog";
import { InviteStudentDialog } from "@/components/InviteStudentDialog";
import { CohortOverview } from "@/components/cohorts/CohortOverview";
import {
  CohortPeopleTable,
  StatusPill,
} from "@/components/cohorts/CohortPeopleTable";
import { CohortSettings } from "@/components/cohorts/CohortSettings";
import { CohortStatusBadge } from "@/components/cohorts/CohortStatusBadge";
import type { PeopleFilter } from "@/components/cohorts/PeopleFilterDialog";
import { CohortTabs } from "@/components/cohorts/CohortTabs";
import { CohortTracks } from "@/components/cohorts/CohortTracks";
import { Skeleton } from "@/components/ui/skeleton";
import { SuccessToast } from "@/components/ui/toast";
import { getProgramOptionsErrorMessage } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import {
  cohortQueries,
  type CohortStaff,
  type CohortStudent,
  type CohortTrack,
} from "@/lib/cohorts";
import { cn } from "@/lib/utils";
import { studentStatusLabels, type StudentStatus } from "../cohort-data";

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "tracks", label: "Tracks" },
  { value: "students", label: "Students" },
  { value: "instructors", label: "Instructors" },
  { value: "mentors", label: "Mentors" },
  { value: "settings", label: "Settings" },
] as const;

type Tab = (typeof tabs)[number]["value"];

const studentStatusPill: Record<
  StudentStatus,
  "success" | "warning" | "error"
> = {
  onTrack: "success",
  atRisk: "warning",
  needsAttention: "error",
};

const staffColumns = [
  {
    header: "Track",
    width: "w-[210px]",
    cell: (row: CohortStaff) => row.track,
  },
  {
    header: "Students",
    width: "w-[160px]",
    cell: (row: CohortStaff) => `${row.students} students`,
  },
  {
    header: "Status",
    width: "w-[160px]",
    cell: (row: CohortStaff) =>
      row.accountStatus === null ? (
        "--"
      ) : row.accountStatus === "SUSPENDED" ? (
        <StatusPill status="error">Suspended</StatusPill>
      ) : (
        <StatusPill status="success">Active</StatusPill>
      ),
  },
  {
    header: "Last active",
    width: "w-[135px]",
    cell: (row: CohortStaff) => row.lastActive,
  },
];

const accountStatusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
];

function trackFilter<T>(
  tracks: CohortTrack[],
  values: (row: T) => string[],
): PeopleFilter<T> {
  return {
    key: "track",
    title: "Track",
    description: "Filter by the learning track they belong to.",
    allLabel: "All tracks",
    options: tracks.map((track) => ({ value: track.id, label: track.name })),
    values,
  };
}

function studentFilters(tracks: CohortTrack[]): PeopleFilter<CohortStudent>[] {
  return [
    trackFilter(tracks, (row) => row.trackIds),
    {
      key: "status",
      title: "Account status",
      description: "Find students whose account is active or suspended.",
      allLabel: "All",
      options: accountStatusOptions,
      values: (row) => [row.accountStatus],
    },
    {
      key: "onboarding",
      title: "Onboarding",
      description:
        "Find students who have joined or are yet to accept their invite.",
      allLabel: "All",
      options: [
        { value: "INVITED", label: "Invited" },
        { value: "COMPLETED", label: "Joined" },
      ],
      values: (row) => [row.onboardingStatus],
    },
  ];
}

function instructorFilters(tracks: CohortTrack[]): PeopleFilter<CohortStaff>[] {
  return [
    trackFilter(tracks, (row) => [row.trackId]),
    {
      key: "status",
      title: "Account status",
      description: "Find instructors whose account is active or suspended.",
      allLabel: "All",
      options: accountStatusOptions,
      values: (row) => (row.accountStatus ? [row.accountStatus] : []),
    },
  ];
}

function isTab(value: string | undefined): value is Tab {
  return tabs.some((tab) => tab.value === value);
}

export default function CohortDetailPage({
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
  const cohortQuery = useQuery(cohortQueries.detail(id));
  const cohort = cohortQuery.data;
  const [editingSettings, setEditingSettings] = React.useState(false);
  const [toast, setToast] = React.useState<{
    title: string;
    message: string;
  } | null>(null);
  const dismissToast = React.useCallback(() => setToast(null), []);
  const setTab = React.useCallback(
    (next: Tab) => {
      setEditingSettings(false);
      router.replace(`/admin/cohorts/${id}?tab=${next}`, { scroll: false });
    },
    [id, router],
  );

  if (
    cohortQuery.error instanceof ApiError &&
    (cohortQuery.error.status === 404 || cohortQuery.error.status === 400)
  ) {
    notFound();
  }

  if (!cohort) {
    return (
      <>
        <AdminTopNav breadcrumb={["Academy", { label: "Cohorts", href: "/admin/cohorts" }]} />
        <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
          {cohortQuery.isError ? (
            <p className="font-work text-sm text-text-error">
              {getProgramOptionsErrorMessage(cohortQuery.error)}
            </p>
          ) : (
            <CohortDetailSkeleton />
          )}
        </main>
      </>
    );
  }

  // The invite dialogs only offer ongoing cohorts, so ended ones get no action.
  const ended = cohort.status === "completed" || cohort.status === "terminated";

  return (
    <>
      <AdminTopNav breadcrumb={[
          "Academy",
          { label: "Cohorts", href: "/admin/cohorts" },
          { label: cohort.name, href: `/admin/cohorts/${id}` },
        ]} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3.5">
          <h1 className="text-2xl font-semibold text-text-primary">
            {cohort.name}
          </h1>
          <CohortStatusBadge status={cohort.status} size="sm" />
        </div>
        <p className="mt-1 font-work text-xs text-text-secondary">
          {cohort.startDate} - {cohort.endDate}
        </p>
        {(cohort.status === "upcoming" || cohort.status === "active") && (
          <p className="mt-1 font-work text-xs text-text-secondary">
            {cohort.status === "upcoming"
              ? `${cohort.daysToStart} days to kick off`
              : `${cohort?.daysLeft ?? new Date(cohort?.endDate).getTime() - new Date().getTime() / (1000 * 60 * 60 * 24)} days remaining`}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-6">
          <HeaderStat
            icon={<UserMultiple className="size-5" />}
            iconClass="bg-brand-50 text-brand-primary"
            label="Total students"
            value={cohort.students}
          />
          <HeaderStat
            icon={<Track className="size-5" />}
            iconClass="bg-info-surface text-text-info"
            label="Total tracks"
            value={cohort.tracks}
          />
          <HeaderStat
            icon={<Mentor className="size-5" />}
            iconClass="bg-success-surface text-text-success"
            label="Instructors & mentors"
            value={cohort.instructorsAndMentors}
          />
        </div>

        <div className="mt-[22px] flex flex-wrap items-center justify-between gap-4">
          <CohortTabs
            label="Cohort sections"
            tabs={tabs}
            value={tab}
            onChange={setTab}
          />
          {tab === "settings" && (
            <button
              type="button"
              aria-pressed={editingSettings}
              onClick={() => setEditingSettings((editing) => !editing)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-medium text-white hover:bg-interactive-primary-hover"
            >
              <Edit02 className="size-5" />
              {/* The design only shows the idle state; while editing the same
                  button cancels. */}
              {editingSettings ? "Cancel editing" : "Edit settings"}
            </button>
          )}
        </div>

        {tab === "overview" &&
          (cohort.students === 0 && cohort.tracks === 0 ? (
            <CohortEmptyState
              icon={CohortsIcon}
              title="Nothing to show yet"
              description={
                ended
                  ? "This cohort ended without any tracks or students."
                  : "This cohort has no tracks or students yet. Invite students to start seeing its progress here."
              }
              action={
                !ended && <InviteStudentDialog defaultCohortId={cohort.id} />
              }
            />
          ) : (
            <CohortOverview cohort={cohort} />
          ))}
        {tab === "tracks" &&
          (cohort.trackList.length === 0 ? (
            <CohortEmptyState
              icon={Track}
              title="No track yet"
              description={
                ended
                  ? "This cohort ended without any tracks."
                  : "Tracks show up here once an instructor is assigned to one or a student enrols on one in this cohort."
              }
              action={
                !ended && <InviteInstructorDialog defaultCohortId={cohort.id} />
              }
            />
          ) : (
            <CohortTracks tracks={cohort.trackList} />
          ))}
        {tab === "students" && cohort.studentList.length === 0 && (
          <CohortEmptyState
            icon={UserMultiple}
            title="No student yet"
            description={
              ended
                ? "This cohort ended without any students."
                : "Invite students to this cohort. They'll appear here once they've been invited."
            }
            action={
              !ended && <InviteStudentDialog defaultCohortId={cohort.id} />
            }
          />
        )}
        {tab === "students" && cohort.studentList.length > 0 && (
          <CohortPeopleTable
            title={`${cohort.students} students`}
            personHeader="Student"
            rows={cohort.studentList}
            filters={studentFilters(cohort.trackList)}
            columns={[
              { header: "Track", width: "w-[210px]", cell: (row) => row.track },
              {
                header: "Status",
                width: "w-[159px]",
                cell: (row) =>
                  row.status ? (
                    <StatusPill status={studentStatusPill[row.status]}>
                      {studentStatusLabels[row.status]}
                    </StatusPill>
                  ) : (
                    "--"
                  ),
              },
              {
                header: "Last active",
                width: "w-[297px]",
                cell: (row) => row.lastActive,
              },
            ]}
          />
        )}
        {tab === "instructors" &&
          (cohort.instructorList.length === 0 ? (
            <CohortEmptyState
              icon={Teacher}
              title="No instructor yet"
              description={
                ended
                  ? "This cohort ended without any instructors."
                  : "Invite instructors to this cohort. They'll appear here once they've been assigned a track."
              }
              action={
                !ended && <InviteInstructorDialog defaultCohortId={cohort.id} />
              }
            />
          ) : (
            <CohortPeopleTable
              title={`${cohort.instructorList.length} Instructors`}
              personHeader="Instructors"
              rows={cohort.instructorList}
              columns={staffColumns}
              filters={instructorFilters(cohort.trackList)}
              actionHeader="Action"
            />
          ))}
        {tab === "mentors" &&
          (cohort.mentorList.length === 0 ? (
            // PENDING-BACKEND: there's no mentor role yet, so there's no
            // invite action here.
            <CohortEmptyState
              icon={Mentor}
              title="No mentor yet"
              description="Mentors assigned to this cohort will appear here."
            />
          ) : (
            <CohortPeopleTable
              title={`${cohort.mentorList.length} Mentors`}
              // Header label kept from the design.
              personHeader="Instructors"
              rows={cohort.mentorList}
              columns={staffColumns}
              actionHeader="Action"
            />
          ))}
        {tab === "settings" && (
          <CohortSettings
            cohortId={cohort.id}
            editing={editingSettings}
            onEditingChange={setEditingSettings}
            onToast={setToast}
          />
        )}
      </main>

      {toast && (
        <SuccessToast
          title={toast.title}
          message={toast.message}
          onDismiss={dismissToast}
        />
      )}
    </>
  );
}

function HeaderStat({
  icon,
  iconClass,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          iconClass,
        )}
      >
        {icon}
      </span>
      <div>
        <p className="font-work text-sm text-text-secondary">{label}</p>
        <p className="mt-0.5 text-lg font-semibold text-text-primary">
          {value}
        </p>
      </div>
    </div>
  );
}

function CohortDetailSkeleton() {
  return (
    <div aria-busy>
      <div className="flex items-center gap-3.5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-1.5 h-4 w-40" />
      <Skeleton className="mt-1 h-4 w-28" />

      <div className="mt-6 flex flex-wrap gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-start gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-10" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-[22px] flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-24 rounded-lg" />
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl bg-white" />
        <Skeleton className="h-48 rounded-2xl bg-white" />
      </div>
    </div>
  );
}
