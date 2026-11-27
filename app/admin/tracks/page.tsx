"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Lesson, Mail02, Teacher, Track as TrackIcon } from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import { CohortTabs } from "@/components/cohorts/CohortTabs";
import { CreateTrackDialog } from "@/components/CreateTrackDialog";
import { EditTrackDialog } from "@/components/EditTrackDialog";
import { TrackCard } from "@/components/tracks/TrackCard";
import { useTrackStats } from "@/components/tracks/use-track-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { adminQueries, getTrackErrorMessage, type Track } from "@/lib/admin";
import { cohortQueries, trackKeyFor, type CohortDetail } from "@/lib/cohorts";
import { useSelectedCohort } from "@/lib/selected-cohort";

const filters = [
  { value: "all", label: "All tracks" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
] as const;

type Filter = (typeof filters)[number]["value"];

export default function TracksPage() {
  const [filter, setFilter] = React.useState<Filter>("all");
  const tracksQuery = useQuery(adminQueries.tracks());
  const { cohortId, isReady } = useSelectedCohort();
  // Who's on each track in the picked cohort; the cohort page loads the same.
  const cohortQuery = useQuery({
    ...cohortQueries.detail(cohortId ?? ""),
    enabled: Boolean(cohortId),
  });
  /* A new track has no instructor or student in any cohort yet, so it is shown under every cohort. Otherwise it disappears right after it is created. */
  const assignedTracksQuery = useQuery({
    ...cohortQueries.assignedTrackIds(),
    enabled: Boolean(cohortId),
  });

  const cohort = cohortQuery.data;
  const cohortTrackIds = new Set(cohort?.trackList.map((track) => track.id));
  const inCohort = (track: Track) =>
    !cohortId ||
    cohortTrackIds.has(track.id) ||
    !(assignedTracksQuery.data ?? []).includes(track.id);

  const pending =
    tracksQuery.isPending ||
    !isReady ||
    (Boolean(cohortId) && (cohortQuery.isPending || assignedTracksQuery.isPending));

  const allTracks = tracksQuery.data ?? [];
  const cohortTracks = allTracks.filter(inCohort);
  const visible =
    filter === "all" ? cohortTracks : cohortTracks.filter((track) => track.status === filter);

  return (
    <>
      <AdminTopNav breadcrumb={["Academy", { label: "Tracks", href: "/admin/tracks" }]} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        {tracksQuery.isSuccess && allTracks.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-text-primary">Tracks</h1>
                <p className="mt-1 font-work text-sm text-text-secondary">
                  Create and manage learning tracks. Each track groups modules, lessons,
                  assignments and participants around a specific learning path.
                </p>
              </div>
              <CreateTrackDialog />
            </div>

            <CohortTabs
              label="Filter tracks"
              tabs={filters}
              value={filter}
              onChange={setFilter}
              className="mt-6"
            />

            {tracksQuery.isError ? (
              <p className="mt-8 font-work text-sm text-text-error">
                {getTrackErrorMessage(tracksQuery.error)}
              </p>
            ) : pending ? (
              <TrackCardsSkeleton />
            ) : visible.length === 0 ? (
              <p className="mt-8 font-work text-sm text-text-secondary">
                No tracks match this filter.
              </p>
            ) : (
              <ul
                data-tour="tracks-list"
                className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
              >
                {visible.map((track, index) => (
                  <li key={track.id}>
                    <TrackCardItem
                      track={track}
                      index={index}
                      cohortId={cohortId}
                      cohort={cohort}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  );
}

function TrackCardItem({
  track,
  index,
  cohortId,
  cohort,
}: {
  track: Track;
  index: number;
  cohortId: string | undefined;
  cohort: CohortDetail | undefined;
}) {
  const stats = useTrackStats(track.id, cohortId, cohort);

  return (
    <TrackCard
      name={track.name}
      active={track.status === "ACTIVE"}
      students={stats.studentCount}
      progress={stats.progress}
      colorKey={trackKeyFor(track.name, index)}
      href={`/admin/tracks/${track.id}`}
      menu={<EditTrackDialog trackId={track.id} trackName={track.name} />}
      stats={[
        {
          icon: <Teacher className="size-6 text-text-primary" />,
          value: stats.instructorCount,
          label: stats.instructorCount === 1 ? "Instructor" : "Instructors",
          tone: "text-text-primary",
          labelTone: "text-text-secondary",
        },
        {
          icon: <Lesson className="size-6 text-text-primary" />,
          value: stats.lessons,
          label: stats.lessons === 1 ? "Lesson" : "Lessons",
          tone: "text-text-primary",
          labelTone: "text-text-secondary",
        },
        {
          icon: <Mail02 className="size-6 text-text-warning" />,
          value: stats.pendingInvites,
          label: "Pending invites",
          tone: "text-text-warning",
        },
      ]}
    />
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-4 pt-[231px] pb-16 text-center lg:-mr-8">
      <TrackIcon className="size-[84px] text-brand-primary" />
      <p className="mt-[17px] text-2xl font-semibold text-text-primary">No tracks yet</p>
      <p className="mt-0.5 max-w-[372px] font-work text-sm text-text-secondary">
        Set up your first track to start organizing your program, adding instructors and
        inviting students.
      </p>
      <div className="mt-[23px]">
        <CreateTrackDialog />
      </div>
    </div>
  );
}

function TrackCardsSkeleton() {
  return (
    <ul aria-busy className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <li
          key={index}
          className="rounded-3xl bg-white p-6 shadow-[0_2px_4px_rgb(17_24_25/0.06)]"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="size-4" />
          </div>
          <Skeleton className="mt-3 h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-20" />
          <div className="mt-4 flex gap-6">
            {Array.from({ length: 3 }).map((_, stat) => (
              <div key={stat} className="flex gap-3">
                <Skeleton className="size-6" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="mt-4 h-4 w-24" />
          <Skeleton className="mt-1 h-2 w-full rounded-full" />
        </li>
      ))}
    </ul>
  );
}
