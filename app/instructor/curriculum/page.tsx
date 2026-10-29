"use client";

import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BookOpen, FileEdit, GraduationCap } from "lucide-react";
import { Search } from "@/assets/icons";

import { instructorQueries } from "@/lib/instructor";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BADGE_BASE = "rounded-full px-2.5 py-0.5 text-xs font-medium border-0";

const GREEN = "bg-emerald-100/80 text-emerald-700 hover:bg-emerald-100";
const NEUTRAL = "bg-surface-default-badge text-text-default-badge";
const AMBER = "bg-surface-warning-badge text-text-warning";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ONGOING: { label: "Active", className: GREEN },
  COMPLETED: { label: "Completed", className: NEUTRAL },
};

const PUBLISH_BADGE: Record<string, { label: string; className: string }> = {
  PUBLISHED: { label: "Published", className: GREEN },
  DRAFT: { label: "Draft", className: AMBER },
};

const badgeFor = (
  map: Record<string, { label: string; className: string }>,
  value: string
) => map[value] ?? { label: value, className: NEUTRAL };

export default function ListCurriculums() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  const myTracks = useQuery(instructorQueries.myTracks());
  const tracks = myTracks.data ?? [];

  const curriculumsQuery = useQuery(instructorQueries.allCurriculums());
  const curriculumsData = curriculumsQuery.data ?? [];

  const filteredCurriculums = curriculumsData.filter((curr) =>
    curr.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <InstructorNavbar breadcrumb={["Teaching", { label: "Curriculum", href: "/instructor/curriculum" }]} />
      <main className="flex flex-col min-h-screen bg-neutral-100 p-6 space-y-6">

        {/* Header Section */}
        <div className="flex justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
              Curriculum
            </h1>
            <p className="text-sm font-normal text-neutral-500 mt-0.5">
              Manage learning content, modules, lessons and assignments across your assigned tracks and cohorts
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search curriculum"
              leadingIcon={null}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none px-5"
            />
          </div>
        </div>

        {/* Curriculums List Cards */}
        <div className="space-y-4">
          {curriculumsQuery.isPending ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="bg-white border-none ring-0 shadow-xs rounded-2xl p-5 animate-pulse">
                <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-3 w-full md:w-auto">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-200 shrink-0" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-40 h-5 bg-neutral-200 rounded-md" />
                          <div className="w-16 h-5 bg-neutral-200 rounded-full" />
                          <div className="w-14 h-5 bg-neutral-200 rounded-full" />
                        </div>
                        <div className="w-28 h-3.5 bg-neutral-200 rounded" />
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-1 pl-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-neutral-200" />
                        <div className="space-y-1">
                          <div className="w-16 h-2.5 bg-neutral-200 rounded" />
                          <div className="w-6 h-3 bg-neutral-200 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-neutral-200" />
                        <div className="space-y-1">
                          <div className="w-16 h-2.5 bg-neutral-200 rounded" />
                          <div className="w-6 h-3 bg-neutral-200 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-neutral-200" />
                        <div className="space-y-1">
                          <div className="w-16 h-2.5 bg-neutral-200 rounded" />
                          <div className="w-6 h-3 bg-neutral-200 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                    <div className="w-28 h-9 bg-neutral-200 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredCurriculums.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xs text-center">
              <BookOpen className="h-10 w-10 text-neutral-300 mb-3" />
              <h3 className="text-base font-semibold text-neutral-800">No curriculums found</h3>
              <p className="text-xs text-neutral-500 mt-1">There are no curriculums available matching your search criteria.</p>
            </div>
          ) : (
            filteredCurriculums.map((curr) => {
              const status = badgeFor(STATUS_BADGE, curr.status);
              const publish = badgeFor(PUBLISH_BADGE, curr.publishStatus);
              const trackName = tracks.find(
                (assignment) => assignment.trackId === curr.trackId
              )?.track.name;

              return (
                <Card key={curr.id} className="bg-white border-none ring-0 shadow-xs rounded-2xl p-5 hover:border-neutral-300 transition-all">
                  <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

                    {/* Left Info */}
                    <div className="space-y-3 w-full md:w-auto">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-purple-700">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-neutral-900">
                              {curr.title}
                            </h3>
                            <Badge
                              variant="light"
                              className={`${BADGE_BASE} ${status.className}`}
                            >
                              {status.label}
                            </Badge>
                            <Badge
                              variant="light"
                              className={`${BADGE_BASE} ${publish.className}`}
                            >
                              {publish.label}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-neutral-500 mt-0.5">
                            {trackName ?? "Track"} {curr.cohort ? `· ${curr.cohort.name}` : "· Track-wide"}
                          </p>
                        </div>
                      </div>

                      {/* Metrics Row */}
                      <div className="flex items-center gap-6 pt-1 pl-1">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-indigo-900">
                            <BookOpen size={14} />
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-neutral-400">Total modules</p>
                            <p className="text-xs font-bold text-neutral-800">{curr.totalModules ?? 0}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-900">
                            <GraduationCap size={14} />
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-neutral-400">Total Lessons</p>
                            <p className="text-xs font-bold text-neutral-800">{curr.totalLessons ?? 0}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-900">
                            <FileEdit size={14} />
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-neutral-400">Total Assignments</p>
                            <p className="text-xs font-bold text-neutral-900">{curr.totalAssignments ?? 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center justify-end w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                      <Button
                        onClick={() => router.push(`/instructor/curriculum/${curr.id}`)}
                        variant="secondary"
                        className="border-neutral-200 text-neutral-800 hover:bg-neutral-50 rounded-xl px-4 py-2 text-xs font-medium shadow-xs"
                      >
                        View curriculum
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

      </main>
    </>
  );
}