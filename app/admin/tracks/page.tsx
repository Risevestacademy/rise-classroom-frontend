"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Hash, ChevronDown } from "lucide-react";

import { AdminTopNav } from "@/components/AdminTopNav";
import { CreateTrackDialog } from "@/components/CreateTrackDialog";
import { EditTrackDialog } from "@/components/EditTrackDialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminQueries, type TrackStatus } from "@/lib/admin";

const STATUS_FILTERS: { label: string; value: TrackStatus | undefined }[] = [
  { label: "All statuses", value: undefined },
  { label: "Active", value: "ACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TracksPage() {
  const [statusFilter, setStatusFilter] = React.useState<
    TrackStatus | undefined
  >(undefined);

  const tracksQuery = useQuery(adminQueries.tracks(statusFilter));
  const allTracksQuery = useQuery(adminQueries.tracks());

  const tracks = tracksQuery.data ?? [];
  const allTracks = allTracksQuery.data ?? [];
  const activeCount = allTracks.filter((t) => t.status === "ACTIVE").length;
  const suspendedCount = allTracks.filter(
    (t) => t.status === "SUSPENDED",
  ).length;

  const showEmptyState =
    !tracksQuery.isPending && allTracks.length === 0 && !statusFilter;

  return (
    <>
      <AdminTopNav breadcrumb={["Academy", "Tracks"]} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {tracksQuery.isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <Hash className="h-12 w-12 text-neutral-200" />
            <p className="font-semibold text-neutral-800">
              Couldn&apos;t load tracks
            </p>
            <p className="max-w-80 text-sm text-neutral-400">
              {tracksQuery.error.message}
            </p>
          </div>
        ) : showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <Hash className="h-12 w-12 text-neutral-200" />
            <p className="font-semibold text-neutral-800">
              No tracks created yet.
            </p>
            <p className="max-w-80 text-sm text-neutral-400">
              You haven&apos;t created any learning tracks yet. Set up your
              first track to start organizing your program, adding instructors
              and inviting students.
            </p>
            <div className="mt-2">
              <CreateTrackDialog />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">Tracks</h1>
                <p className="mt-1 text-sm text-neutral-400">
                  Create and manage learning tracks. Each track groups modules,
                  lessons, assignments and participants around a specific
                  learning path.
                </p>
              </div>
              <CreateTrackDialog />
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white">
              <div className="flex flex-col gap-4 border-b border-neutral-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {allTracksQuery.isPending ? (
                    <>
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="mt-2 h-4 w-32" />
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-neutral-800">
                        {allTracks.length} Track
                        {allTracks.length === 1 ? "" : "s"}
                      </p>
                      <p className="text-sm text-neutral-400">
                        {activeCount} Active · {suspendedCount} Suspended
                      </p>
                    </>
                  )}
                </div>

                <div className="relative">
                  <select
                    value={statusFilter ?? ""}
                    onChange={(event) =>
                      setStatusFilter(
                        (event.target.value || undefined) as
                          TrackStatus | undefined,
                      )
                    }
                    className="h-10 w-full appearance-none rounded-lg border border-neutral-200 bg-transparent py-2 pr-9 pl-3 text-sm font-medium text-neutral-600 outline-none focus:border-brand-primary sm:w-44"
                  >
                    {STATUS_FILTERS.map((option) => (
                      <option key={option.label} value={option.value ?? ""}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-160 text-left text-sm">
                  <thead className="text-xs tracking-wider text-neutral-400 uppercase">
                    <tr>
                      <th className="px-5 py-3">Track</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Created</th>
                      <th className="w-12 px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracksQuery.isPending ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="border-t border-neutral-100">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-9 w-9 rounded-full" />
                              <div className="flex flex-col gap-1.5">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-44" />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </td>
                          <td className="px-5 py-4">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="px-5 py-4">
                            <Skeleton className="h-4 w-4" />
                          </td>
                        </tr>
                      ))
                    ) : tracks.length === 0 ? (
                      <tr className="border-t border-neutral-100">
                        <td
                          colSpan={4}
                          className="px-5 py-10 text-center text-sm text-neutral-400"
                        >
                          No tracks match this filter.
                        </td>
                      </tr>
                    ) : (
                      tracks.map((track) => (
                        <tr
                          key={track.id}
                          className="border-t border-neutral-100"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-brand text-brand-primary">
                                <Hash className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium text-neutral-800">
                                  {track.name}
                                </p>
                                <p className="truncate text-xs text-neutral-400">
                                  {track.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              status={
                                track.status === "ACTIVE" ? "success" : "error"
                              }
                            >
                              {track.status === "ACTIVE"
                                ? "Active"
                                : "Suspended"}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-neutral-400">
                            {formatDate(track.createdAt)}
                          </td>
                          <td className="px-5 py-4">
                            <EditTrackDialog
                              trackId={track.id}
                              trackName={track.name}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
