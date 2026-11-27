"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Teacher, Track as TrackIcon, UserMultiple } from "@/assets/icons";
import {
  HeaderStat,
  staffColumns,
  studentAccountFilters,
} from "@/app/admin/cohorts/[id]/CohortDetail";
import { AdminTopNav } from "@/components/AdminTopNav";
import { CohortEmptyState } from "@/components/cohorts/CohortEmptyState";
import { CohortPeopleTable, StatusPill } from "@/components/cohorts/CohortPeopleTable";
import { PeopleTableSkeleton } from "@/components/cohorts/CohortSkeletons";
import { CohortStudentsTable } from "@/components/cohorts/CohortStudentsTable";
import { CohortTabs } from "@/components/cohorts/CohortTabs";
import { EditTrackForm } from "@/components/EditTrackDialog";
import { InviteInstructorDialog } from "@/components/InviteInstructorDialog";
import { InviteStudentDialog } from "@/components/InviteStudentDialog";
import { PersonAvatar } from "@/components/PersonAvatar";
import { useTrackStats } from "@/components/tracks/use-track-stats";
import { UserRowActions } from "@/components/UserRowActions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SuccessToast } from "@/components/ui/toast";
import { adminQueries, getTrackErrorMessage, type Track } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { cohortLabel, cohortQueries, type CohortStudent } from "@/lib/cohorts";
import { useSelectedCohort } from "@/lib/selected-cohort";
import type { StudentTrackProgress } from "@/lib/tracks";
import { useTabParam } from "@/lib/use-tab-param";

const tabs = [
  { value: "students", label: "Students" },
  { value: "instructors", label: "Instructors" },
  { value: "progress", label: "Progress" },
  { value: "settings", label: "Settings" },
] as const;

type Tab = (typeof tabs)[number]["value"];

const instructorColumns = staffColumns.filter((column) => column.header !== "Track");

const cardClass = "rounded-xl bg-white p-6 shadow-[0_2px_4px_rgb(17_24_25/0.06)]";

/**
 * A track's page, laid out like a cohort's. Everything on it counts the
 * cohort picked in the top bar. With `loading` it only shows the skeleton,
 * while the server loads the track.
 */
export function TrackDetail({ id, loading = false }: { id: string; loading?: boolean }) {
  const [tab, setTab] = useTabParam(tabs);
  const trackQuery = useQuery({ ...adminQueries.track(id), enabled: !loading });
  const { cohort: pickedCohort, cohortId, cohortsQuery } = useSelectedCohort();
  const cohortQuery = useQuery({
    ...cohortQueries.detail(cohortId ?? ""),
    enabled: Boolean(cohortId) && !loading,
  });
  const stats = useTrackStats(id, cohortId, cohortQuery.data, { loadProgress: true });
  const [toast, setToast] = React.useState<string | null>(null);
  const dismissToast = React.useCallback(() => setToast(null), []);

  if (
    trackQuery.error instanceof ApiError &&
    (trackQuery.error.status === 404 || trackQuery.error.status === 400)
  ) {
    notFound();
  }

  const track = trackQuery.data;
  const breadcrumb = [
    "Academy",
    { label: "Tracks", href: "/admin/tracks" },
    ...(track ? [{ label: track.name, href: `/admin/tracks/${id}` }] : []),
  ];

  return (
    <>
      <AdminTopNav breadcrumb={breadcrumb} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        {trackQuery.isError ? (
          <p className="font-work text-sm text-text-error">
            {getTrackErrorMessage(trackQuery.error)}
          </p>
        ) : !track ? (
          <HeaderSkeleton />
        ) : (
          <>
            <div className="flex items-center gap-3.5">
              <h1 className="text-2xl font-semibold text-text-primary">{track.name}</h1>
              <Badge
                variant="light"
                status={track.status === "ACTIVE" ? "success" : "neutral"}
                className="font-work font-normal"
              >
                {track.status === "ACTIVE" ? "Active" : "Suspended"}
              </Badge>
            </div>
            {track.description && (
              <p className="mt-1 max-w-2xl font-work text-xs text-text-secondary">
                {track.description}
              </p>
            )}
            {pickedCohort && (
              <p className="mt-1 font-work text-xs text-text-secondary">
                Showing {cohortLabel(pickedCohort.name)}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-6">
              <HeaderStat
                icon={<UserMultiple className="size-5" />}
                iconClass="bg-brand-50 text-brand-primary"
                label="Total students"
                value={stats.studentCount ?? "--"}
              />
              <HeaderStat
                icon={<Teacher className="size-5" />}
                iconClass="bg-info-surface text-text-info"
                label="Instructors"
                value={stats.instructorCount ?? "--"}
              />
              <HeaderStat
                icon={<TrackIcon className="size-5" />}
                iconClass="bg-success-surface text-text-success"
                label="Average progress"
                value={typeof stats.progress === "number" ? `${stats.progress}%` : "--"}
              />
            </div>
          </>
        )}

        <CohortTabs
          label="Track sections"
          tabs={tabs}
          value={tab}
          onChange={(next: Tab) => setTab(next)}
          className="mt-[22px]"
        />

        {cohortsQuery.isError ? (
          <p className="mt-6 font-work text-sm text-text-error">
            {getTrackErrorMessage(cohortsQuery.error)}
          </p>
        ) : !cohortId ? (
          <CohortEmptyState
            icon={TrackIcon}
            title="No cohort to show"
            description="Tracks are shown per cohort. Create a cohort, or pick one in the menu at the top, to see who's on this track."
          />
        ) : (
          <>
            {tab === "students" && (
              <StudentsTab trackId={id} cohortId={cohortId} stats={stats} />
            )}
            {tab === "instructors" && (
              <InstructorsTab cohortId={cohortId} stats={stats} />
            )}
            {tab === "progress" && <ProgressTab stats={stats} />}
          </>
        )}
        {tab === "settings" &&
          (track ? (
            <SettingsTab track={track} onSaved={() => setToast(track.name)} />
          ) : (
            <Skeleton className="mt-6 h-72 w-full max-w-[694px] rounded-xl" />
          ))}
      </main>

      {toast && (
        <SuccessToast
          title="Track updated"
          message={`“${toast}” has been successfully updated`}
          onDismiss={dismissToast}
        />
      )}
    </>
  );
}

type Stats = ReturnType<typeof useTrackStats>;

function progressByUser(rows: StudentTrackProgress[] | undefined) {
  return new Map(rows?.map((row) => [row.userId, row]));
}

function StudentsTab({
  trackId,
  cohortId,
  stats,
}: {
  trackId: string;
  cohortId: string;
  stats: Stats;
}) {
  if (stats.studentCount === null) {
    return (
      <PeopleTableSkeleton
        personHeader="Student"
        headers={[
          { header: "Onboarding", width: "w-[150px]" },
          { header: "Progress", width: "w-[220px]" },
          { header: "Account", width: "w-[150px]" },
        ]}
      />
    );
  }
  if (stats.studentCount === 0) {
    return (
      <CohortEmptyState
        icon={UserMultiple}
        title="No student yet"
        description="Invite students onto this track. They'll appear here once they've been invited."
        action={<InviteStudentDialog defaultTrackId={trackId} />}
      />
    );
  }

  const progress = progressByUser(stats.progressRows);
  return (
    <CohortStudentsTable
      cohortId={cohortId}
      trackId={trackId}
      title={`${stats.studentCount} students`}
      filters={studentAccountFilters}
      columns={[
        {
          header: "Onboarding",
          width: "w-[150px]",
          cell: (row: CohortStudent) =>
            row.onboardingStatus === "INVITED" ? (
              <StatusPill status="warning">Invited</StatusPill>
            ) : (
              <StatusPill status="success">Joined</StatusPill>
            ),
        },
        {
          header: "Progress",
          width: "w-[220px]",
          cell: (row: CohortStudent) => {
            const item = progress.get(row.user.id);
            if (!item) return stats.progressRows ? "--" : <Skeleton className="h-4 w-24" />;
            if (item.unknown) return "--";
            return `${item.percentage}% · ${item.completedLessons} of ${item.totalLessons} lessons`;
          },
        },
        {
          header: "Account",
          width: "w-[150px]",
          cell: (row: CohortStudent) =>
            row.accountStatus === "SUSPENDED" ? (
              <StatusPill status="error">Suspended</StatusPill>
            ) : (
              <StatusPill status="success">Active</StatusPill>
            ),
        },
      ]}
    />
  );
}

function InstructorsTab({ cohortId, stats }: { cohortId: string; stats: Stats }) {
  if (stats.instructorCount === null) {
    return <PeopleTableSkeleton personHeader="Instructors" headers={instructorColumns} />;
  }
  if (stats.instructorCount === 0) {
    return (
      <CohortEmptyState
        icon={Teacher}
        title="No instructor yet"
        description="Invite an instructor to teach this track. They'll appear here once they've been assigned to it."
        action={<InviteInstructorDialog defaultCohortId={cohortId} />}
      />
    );
  }
  return (
    <CohortPeopleTable
      title={`${stats.instructorCount} Instructors`}
      noun={{ singular: "instructor", plural: "instructors" }}
      rowUser={(row) => row.user}
      personHeader="Instructors"
      rows={stats.instructors}
      columns={instructorColumns}
      actionHeader="Action"
      rowActions={(row) => row.user && <UserRowActions user={row.user} />}
    />
  );
}

function ProgressTab({ stats }: { stats: Stats }) {
  const rows = stats.progressRows?.filter((row) => !row.unknown);
  const unknown = (stats.progressRows?.length ?? 0) - (rows?.length ?? 0);
  const students = new Map(stats.students.map((student) => [student.user.id, student]));
  const sorted = [...(rows ?? [])].sort((a, b) => a.percentage - b.percentage);

  return (
    <div className="mt-6 flex flex-col gap-4 xl:max-w-[950px]">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryFigure
          label="Average progress"
          value={typeof stats.progress === "number" ? `${stats.progress}%` : null}
          note="Across the track's students"
        />
        <SummaryFigure
          label="Finished the track"
          value={rows ? rows.filter((row) => row.percentage >= 100).length : null}
          note="Every lesson completed"
        />
        <SummaryFigure
          label="Not started"
          value={rows ? rows.filter((row) => row.completedLessons === 0).length : null}
          note="No lessons completed yet"
        />
      </div>

      <section className={cardClass}>
        <h2 className="text-lg leading-6 font-semibold text-text-primary">Curriculum</h2>
        {stats.curriculum === undefined ? (
          <Skeleton className="mt-3 h-5 w-64" />
        ) : stats.curriculum === null ? (
          <p className="mt-1 font-work text-sm text-text-secondary">
            This track has no curriculum in this cohort yet.{" "}
            <Link href="/admin/curriculum" className="text-brand-primary underline">
              Go to Curriculum
            </Link>
          </p>
        ) : (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-work text-sm text-text-primary">{stats.curriculum.title}</p>
              <p className="mt-0.5 font-work text-xs text-text-secondary">
                {stats.curriculum.totalModules} modules · {stats.curriculum.totalLessons}{" "}
                lessons · {stats.curriculum.totalAssignments} assignments
              </p>
            </div>
            <Link
              href={`/admin/curriculum/${stats.curriculum.id}`}
              className="inline-flex h-10 items-center rounded-lg border border-neutral-200 px-4 text-sm font-medium text-text-primary hover:bg-neutral-50"
            >
              Open curriculum
            </Link>
          </div>
        )}
      </section>

      <section className={cardClass}>
        <h2 className="text-lg leading-6 font-semibold text-text-primary">Student progress</h2>
        <p className="mt-1 font-work text-sm text-text-secondary">
          Lowest first, so you can see who might need a hand.
          {unknown > 0 &&
            ` ${unknown} ${unknown === 1 ? "student's" : "students'"} progress couldn't be loaded, so they're not counted.`}
        </p>
        {stats.progress === undefined ? (
          <p className="mt-4 font-work text-sm text-text-error">
            Progress couldn&apos;t be loaded. Refresh the page to try again.
          </p>
        ) : !rows ? (
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-4 font-work text-sm text-text-secondary">
            No students on this track yet.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-neutral-100">
            {sorted.map((row) => {
              const student = students.get(row.userId);
              return (
                <li key={row.userId} className="flex flex-wrap items-center gap-4 py-3">
                  <PersonAvatar
                    name={student?.name ?? ""}
                    src={student?.avatar}
                    size={36}
                    colorKey={row.userId}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/students/${row.userId}`}
                      className="truncate text-sm font-medium text-text-primary hover:underline"
                    >
                      {student?.name ?? "Student"}
                    </Link>
                    <p className="font-work text-xs text-text-secondary">
                      {row.completedLessons} of {row.totalLessons} lessons
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-3 sm:w-56">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-100">
                      <div
                        className="h-full rounded-full bg-brand-primary"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-medium text-text-primary">
                      {row.percentage}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function SummaryFigure({
  label,
  value,
  note,
}: {
  label: string;
  value: number | string | null;
  note: string;
}) {
  return (
    <div className={cardClass}>
      <p className="font-work text-sm text-text-secondary">{label}</p>
      {value === null ? (
        <Skeleton className="mt-1 h-8 w-16" />
      ) : (
        <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
      )}
      <p className="mt-1 font-work text-xs text-text-secondary">{note}</p>
    </div>
  );
}

function SettingsTab({
  track,
  onSaved,
}: {
  track: Track;
  onSaved: () => void;
}) {
  // A new key puts back the saved values when changes are cancelled.
  const [resets, setResets] = React.useState(0);
  return (
    <section className={`${cardClass} mt-6 max-w-[694px]`}>
      <h2 className="mb-[18px] text-lg leading-6 font-semibold text-text-primary">
        Track details
      </h2>
      <EditTrackForm
        key={`${track.updatedAt}-${resets}`}
        track={track}
        inPage
        onDone={onSaved}
        onCancel={() => setResets((count) => count + 1)}
      />
    </section>
  );
}

function HeaderSkeleton() {
  return (
    <div aria-busy>
      <div className="flex items-center gap-3.5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-1.5 h-4 w-72" />
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
    </div>
  );
}
