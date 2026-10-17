"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useQueries } from "@tanstack/react-query";
import { ChevronDown, Calendar, FileClock } from "lucide-react";
import { Search } from "@/assets/icons";
import { instructorQueries } from "@/lib/instructor";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyTracks() {
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = React.useState("");

  const myTracks = useQuery(instructorQueries.myTracks());
  const assignments = myTracks.data ?? [];

  const studentLists = useQueries({
    queries: assignments.map((a) =>
      instructorQueries.students({ cohortId: a.cohortId, trackId: a.trackId })
    ),
  });

  const tracks = assignments.map((assignment, i) => ({
    id: assignment.id,
    title: assignment.track?.name ?? "Assigned Track",
    studentsCount: studentLists[i]?.data?.length ?? 0,
    studentsLoading: studentLists[i]?.isLoading ?? false,
    modulesCount: 0,
    progressPercent: 0,
    nextModule: "None scheduled",
  }));

  const filteredTracks = tracks.filter((track) =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col bg-neutral-100 h-full p-6 space-y-6">
      <div id="heading" className="flex flex-row w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">
            View Tracks
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            View and manage the tracks you&apos;re assigned to
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-xs hover:bg-neutral-200">
          <Calendar className="h-3.5 w-3.5 text-neutral-500" />
          <span>This week</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      </div>

      <div className="flex flex-row h-10 items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 text-neutral-400 md:flex md:w-48 lg:w-64">
        <Search />
        <input
          type="search"
          placeholder="Search tracks"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
        />
      </div>

      {myTracks.isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-neutral-300 p-5 space-y-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-40 bg-neutral-200" />
                <Skeleton className="h-3 w-32 bg-neutral-200" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-2 w-full rounded-full bg-neutral-200" />
                <Skeleton className="h-3 w-20 bg-neutral-200" />
              </div>
              <Skeleton className="h-3 w-36 bg-neutral-200" />
            </div>
          ))}
        </div>
      ) : filteredTracks.length > 0 ? (
        <div className="space-y-4">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              onClick={() => router.push(`${pathname}/details?id=${track.id}`)}
              className="bg-white rounded-xl border border-neutral-300 p-5 space-y-4 cursor-pointer hover:border-neutral-400 transition-colors"
            >
              <div>
                <h3 className="text-sm font-bold text-neutral-800">
                  {track.title}
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  {track.studentsLoading ? (
                    <Skeleton className="h-3 w-24 inline-block bg-neutral-200" />
                  ) : (
                    `${track.studentsCount} students`
                  )}{" "}
                  • {track.modulesCount} modules
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-primary"
                    style={{ width: `${track.progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-800">
                    {track.progressPercent}% complete
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-600">
                <span className="font-medium text-neutral-800">Next:</span>{" "}
                {track.nextModule}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-neutral-300 bg-neutral-50 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-brand mb-3">
            <FileClock className="h-7 w-7 text-icon-brand" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-800">
            {searchQuery ? "No tracks found" : "No tracks assigned yet"}
          </h3>
          <p className="text-xs text-neutral-500 max-w-xs mt-1">
            {searchQuery
              ? `No tracks matching "${searchQuery}". Try searching for another keyword.`
              : "Once an admin assigns you a track, it will show up here."}
          </p>
        </div>
      )}
    </div>
  );
}