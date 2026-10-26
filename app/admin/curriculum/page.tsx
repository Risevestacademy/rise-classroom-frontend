"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu } from "@base-ui/react/menu";
import { Filter, MoreVertical, Network, Plus } from "lucide-react";
import { cn } from "cn";

import { Search } from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import { CurriculumFilterDialog } from "@/components/curriculum/CurriculumFilterDialog";
import { CurriculumStats } from "@/components/curriculum/CurriculumStats";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { SuccessToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  trackDetails,
  curriculumKeys,
  curriculumQueries,
  deleteCurriculum,
  noCurriculumFilters,
  type Curriculum,
  type CurriculumFilters,
} from "@/lib/curriculum";
import { useSelectedCohort } from "@/lib/selected-cohort";

export default function CurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created: createdTitle } = React.use(searchParams);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] =
    React.useState<CurriculumFilters>(noCurriculumFilters);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const { cohortId, isReady } = useSelectedCohort();
  const curriculaQuery = useQuery({
    ...curriculumQueries.list(filters, cohortId),
    enabled: isReady,
  });
  const [search, setSearch] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<Curriculum | null>(
    null,
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCurriculum(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.list() });
      setDeleteTarget(null);
    },
  });

  const dismissToast = React.useCallback(
    () => router.replace("/admin/curriculum", { scroll: false }),
    [router],
  );

  const curricula = curriculaQuery.data ?? [];
  const query = search.trim().toLowerCase();
  const filtered = curricula.filter((curriculum) =>
    curriculum.title.toLowerCase().includes(query),
  );
  // Filters can empty the list too; that isn't "no curriculum yet".
  const showEmptyState =
    curriculaQuery.isSuccess &&
    curricula.length === 0 &&
    filters.trackIds.length === 0 &&
    filters.statuses.length === 0;

  return (
    <>
      <AdminTopNav breadcrumb={["Academy", { label: "Curriculum", href: "/admin/curriculum" }]} />
      <main className="flex min-w-0 flex-1 flex-col p-4 sm:p-6 bg-neutral-50 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Curriculum</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage learning content, modules, lessons and assignments
            </p>
          </div>
          {!showEmptyState && <CreateCurriculumButton />}
        </div>

        {curriculaQuery.isError ? (
          <p className="py-20 text-center text-sm text-neutral-400">
            {curriculaQuery.error.message}
          </p>
        ) : showEmptyState ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
            <Network
              className="h-14 w-14 text-brand-primary"
              strokeWidth={1.5}
            />
            <p className="mt-2 text-xl font-bold text-neutral-800">
              No Curriculum yet
            </p>
            <p className="max-w-96 text-sm text-neutral-500">
              Create your first curriculum to start building modules, lessons,
              assignments and resources.
            </p>
            <div className="mt-3">
              <CreateCurriculumButton />
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex flex-col gap-3 rounded-xl bg-white p-4 sm:flex-row sm:justify-end">
              <div className="flex h-11 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-neutral-400 sm:w-80">
                <Search />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search curriculum"
                  className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
                />
              </div>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setFilterOpen(true)}
                className="border-neutral-200"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {curriculaQuery.isPending ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-xl bg-white p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-5 w-56" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="mt-5 ml-14 h-10 w-96 max-w-[70%]" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <p className="rounded-xl bg-white px-5 py-10 text-center text-sm text-neutral-400">
                {query ? (
                  <>No curriculum matches &ldquo;{search}&rdquo;.</>
                ) : (
                  "No curriculum matches the selected filters."
                )}
              </p>
            ) : (
              filtered.map((curriculum) => {
                const track = trackDetails(curriculum.track.name);
                return (
                  <div key={curriculum.id} className="rounded-xl bg-white p-5">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          track.iconClassName,
                        )}
                      >
                        <track.icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-bold text-neutral-800">
                            {curriculum.title}
                          </p>
                          <Badge variant="light" status="success">
                            {curriculum.status}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-neutral-500">
                          {track.label} · {curriculum.cohort}
                        </p>
                      </div>

                      <Menu.Root>
                        <Menu.Trigger
                          aria-label="Curriculum actions"
                          className="rounded-md p-1 text-neutral-600 hover:bg-neutral-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Menu.Trigger>
                        <Menu.Portal>
                          <Menu.Positioner
                            align="end"
                            sideOffset={6}
                            className="z-50"
                          >
                            <Menu.Popup className="w-44 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none">
                              <Menu.Item
                                render={
                                  <Link
                                    href={`/admin/curriculum/${curriculum.id}`}
                                  />
                                }
                                className="flex cursor-pointer rounded-md px-3 py-2 text-neutral-700 outline-none data-highlighted:bg-neutral-100"
                              >
                                View curriculum
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => setDeleteTarget(curriculum)}
                                className="flex cursor-pointer rounded-md px-3 py-2 text-text-error outline-none data-highlighted:bg-surface-error-badge"
                              >
                                Delete curriculum
                              </Menu.Item>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.Root>
                    </div>

                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:pl-14">
                      <CurriculumStats
                        totalModules={curriculum.totalModules}
                        totalLessons={curriculum.totalLessons}
                        totalAssignments={curriculum.totalAssignments}
                      />
                      <Button
                        variant="secondary"
                        size="lg"
                        nativeButton={false}
                        render={
                          <Link href={`/admin/curriculum/${curriculum.id}`} />
                        }
                        className="border-neutral-200 text-brand-primary"
                      >
                        View curriculum
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      <CurriculumFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={filters}
        onApply={setFilters}
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.title ?? ""}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />

      {createdTitle && (
        <SuccessToast
          title="New Curriculum created"
          message={
            <>
              &ldquo;{createdTitle}&rdquo; has been successfully created and
              added to curriculum
            </>
          }
          onDismiss={dismissToast}
        />
      )}
    </>
  );
}

function CreateCurriculumButton() {
  return (
    <Button
      size="lg"
      nativeButton={false}
      render={<Link href="/admin/curriculum/create" />}
    >
      <Plus className="h-4 w-4" />
      Create curriculum
    </Button>
  );
}
