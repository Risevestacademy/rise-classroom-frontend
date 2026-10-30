"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileEdit, GraduationCap } from "lucide-react";

import { Search } from "@/assets/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/features/curriculum/components/ContentTable";
import { useCurriculumScope } from "@/features/curriculum/scope";
import type { Curriculum } from "@/features/curriculum/types";

/* Lists the curricula on the instructor's tracks, so one teaching several can pick which to open. */
export default function InstructorCurriculumPage() {
  const { api, TopNav, breadcrumbRoot } = useCurriculumScope();
  const curriculaQuery = useQuery(api.queries.list());
  const [search, setSearch] = React.useState("");

  const curricula = curriculaQuery.data ?? [];
  const query = search.trim().toLowerCase();
  const matches = curricula.filter((curriculum) =>
    curriculum.title.toLowerCase().includes(query),
  );

  return (
    <>
      <TopNav breadcrumb={breadcrumbRoot} />
      <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Curriculum</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage learning content, modules, lessons and assignments across
            your assigned tracks and cohorts
          </p>
        </div>

        {curriculaQuery.isError ? (
          <p className="py-10 text-center text-sm text-text-error">
            {curriculaQuery.error.message}
          </p>
        ) : curriculaQuery.isSuccess && curricula.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No curriculum yet"
            description="You'll see your curriculum here once an admin assigns you to a track that has one."
          />
        ) : (
          <>
            <div className="flex h-11 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-neutral-400">
              <Search />
              <input
                type="search"
                aria-label="Search curriculum"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search curriculum"
                className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-4">
              {curriculaQuery.isPending ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-32 w-full rounded-2xl" />
                ))
              ) : matches.length === 0 ? (
                <p className="rounded-2xl bg-white p-12 text-center text-sm text-neutral-500 shadow-xs">
                  No curriculum matches &ldquo;{search.trim()}&rdquo;.
                </p>
              ) : (
                matches.map((curriculum) => (
                  <CurriculumCard key={curriculum.id} curriculum={curriculum} />
                ))
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function CurriculumCard({ curriculum }: { curriculum: Curriculum }) {
  const { paths } = useCurriculumScope();

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-xs md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-brand text-brand-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-neutral-800">{curriculum.title}</h2>
              <Badge
                variant="light"
                status={curriculum.status === "Active" ? "success" : "neutral"}
              >
                {curriculum.status}
              </Badge>
              <StatusBadge status={curriculum.publishStatus} />
            </div>
            <p className="mt-0.5 text-xs text-neutral-500">
              {curriculum.track.name} · {curriculum.cohort}
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap items-center gap-6 pl-1">
          <Metric icon={BookOpen} label="Total modules" value={curriculum.totalModules} />
          <Metric icon={GraduationCap} label="Total lessons" value={curriculum.totalLessons} />
          <Metric icon={FileEdit} label="Total assignments" value={curriculum.totalAssignments} />
        </dl>
      </div>

      <Button
        variant="secondary"
        size="medium"
        nativeButton={false}
        render={<Link href={paths.detail(curriculum.id)} />}
        className="shrink-0 border-neutral-200 text-neutral-800"
      >
        View curriculum
      </Button>
    </article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <dt className="text-[11px] text-neutral-400">{label}</dt>
        <dd className="text-xs font-bold text-neutral-800">{value}</dd>
      </div>
    </div>
  );
}
