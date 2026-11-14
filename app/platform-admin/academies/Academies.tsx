"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Filter, Search01 } from "@/assets/icons";
import {
  matchesPeopleFilters,
  PeopleFilterDialog,
  type PeopleFilter,
  type PeopleFilterValues,
} from "@/components/cohorts/PeopleFilterDialog";
import { AcademyActionsMenu } from "@/components/platform-admin/AcademyActionsMenu";
import {
  AcademyDetailsPanel,
  StatusBadge,
} from "@/components/platform-admin/AcademyDetailsPanel";
import { AllClearState } from "@/components/platform-admin/AllClearState";
import { PlatformTopNav } from "@/components/platform-admin/PlatformTopNav";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Pagination, pageSizes } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { shortDate } from "@/lib/calendar";
import { platformQueries, setupAdmin, type Academy } from "@/lib/platform";
import { usePageParams } from "@/lib/use-page-params";

const figure = (count: number) => count || "--";

const filters: PeopleFilter<Academy>[] = [
  {
    key: "status",
    title: "Status",
    description: "Find academies that are active or suspended.",
    allLabel: "All",
    options: [
      { value: "ACTIVE", label: "Active" },
      { value: "SUSPENDED", label: "Suspended" },
    ],
    values: (academy) => [academy.status],
  },
];

function matchesSearch(academy: Academy, query: string) {
  if (!query) return true;
  const admin = setupAdmin(academy);
  return [academy.name, admin?.email, admin && `${admin.firstName} ${admin.lastName}`]
    .some((value) => value?.toLowerCase().includes(query));
}

export function Academies() {
  const academiesQuery = useQuery(platformQueries.academies());
  const pagination = usePageParams();

  return (
    <AcademiesView
      academies={academiesQuery.data ?? []}
      isPending={academiesQuery.isPending}
      isError={academiesQuery.isError}
      onRetry={() => academiesQuery.refetch()}
      pagination={pagination}
    />
  );
}

/* Rendered outside the page's Suspense boundary */
const loadingPagination: PageState = {
  page: 1,
  setPage: () => {},
  pageSize: pageSizes[0],
  setPageSize: () => {},
};

export function AcademiesLoading() {
  return (
    <AcademiesView
      academies={[]}
      isPending
      isError={false}
      onRetry={() => {}}
      pagination={loadingPagination}
    />
  );
}

type PageState = ReturnType<typeof usePageParams>;

function AcademiesView({
  academies,
  isPending,
  isError,
  onRetry,
  pagination,
}: {
  academies: Academy[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  pagination: PageState;
}) {
  const [search, setSearch] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<PeopleFilterValues>({});
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { page, setPage, pageSize, setPageSize } = pagination;

  const listed = academies.filter(setupAdmin);
  const activeCount = listed.filter((academy) => academy.status === "ACTIVE").length;
  const query = search.trim().toLowerCase();
  const matching = listed.filter(
    (academy) =>
      matchesSearch(academy, query) && matchesPeopleFilters(academy, filters, filterValues),
  );
  const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = matching.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = listed.find((academy) => academy.id === selectedId) ?? null;
  const isEmpty = !isPending && !isError && listed.length === 0;
  const stat = (count: number) => (isError ? "—" : figure(count));

  return (
    <>
      <PlatformTopNav page="Academies" href="/platform-admin/academies" />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
          <div>
            <h1 className="text-2xl leading-8 font-semibold text-text-primary">Academies</h1>
            <p className="mt-1 font-work text-sm text-text-secondary">
              View and manage academies registered on Rise Classroom
            </p>
          </div>

          <div className="grid max-w-[900px] grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Total Academies" value={stat(listed.length)} loading={isPending} />
            <StatCard title="Active Academies" value={stat(activeCount)} loading={isPending} />
            <StatCard
              title="Suspended Academies"
              value={stat(listed.length - activeCount)}
              loading={isPending}
            />
          </div>

          {isEmpty ? (
            <AllClearState
              title="Nothing to see here yet!"
              description="Once an approved applicant completes their academy setup, their account will appear here. You can then view and manage academy access from this page."
            />
          ) : (
            <section className="rounded-xl bg-surface-default p-4 shadow-[0_1px_3px_0_rgb(0_0_0/0.15)] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">All academies</h2>
                  {isPending ? (
                    <Skeleton className="mt-1.5 h-4 w-24" />
                  ) : (
                    <p className="font-work text-sm text-text-secondary">
                      {listed.length} {listed.length === 1 ? "Academy" : "Academies"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-200 px-2.5 text-text-muted sm:w-[281px] sm:flex-none">
                    <Search01 className="size-5 shrink-0" />
                    <span className="sr-only">Search by name or email</span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                      placeholder="Search by name or email"
                      className="w-full min-w-0 bg-transparent font-work text-sm text-text-primary outline-none placeholder:text-text-muted"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(true)}
                    className="flex h-10 shrink-0 items-center gap-1 rounded-lg border border-neutral-200 px-2 font-work text-sm text-text-muted"
                  >
                    <Filter className="size-4" />
                    Filter
                  </button>
                </div>
              </div>

              <div className="relative mt-4 overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead className="bg-neutral-100 font-work text-sm text-text-primary">
                    <tr className="h-11">
                      <th className="border-r border-neutral-200 px-3 font-normal">Academy</th>
                      <th className="border-r border-neutral-200 px-3 font-normal">Super admin</th>
                      <th className="border-r border-neutral-200 px-3 font-normal">Email</th>
                      <th className="border-r border-neutral-200 px-3 font-normal">Status</th>
                      <th className="border-r border-neutral-200 px-3 font-normal">Created on</th>
                      <th className="w-14 px-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-work text-sm">
                    {isPending ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="h-[52px]">
                          {Array.from({ length: 6 }).map((_, cell) => (
                            <td key={cell} className="px-3">
                              <Skeleton className="h-4 w-full max-w-32" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : isError ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center">
                          <p className="text-text-secondary">We couldn&apos;t load the academies.</p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={onRetry}
                            className="mt-3 border-neutral-200 text-neutral-800"
                          >
                            Try again
                          </Button>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-text-muted">
                          No academies match your search.
                        </td>
                      </tr>
                    ) : (
                      rows.map((academy) => {
                        const admin = setupAdmin(academy);
                        return (
                          <tr key={academy.id} className="h-[52px]">
                            <td className="border-r border-neutral-200 px-3 text-base text-text-primary">
                              <button
                                type="button"
                                onClick={() => setSelectedId(academy.id)}
                                className="text-left hover:underline"
                              >
                                {academy.name}
                              </button>
                            </td>
                            <td className="border-r border-neutral-200 px-3 text-base text-text-secondary">
                              {admin?.firstName} {admin?.lastName}
                            </td>
                            <td className="border-r border-neutral-200 px-3 text-text-secondary">
                              {admin?.email}
                            </td>
                            <td className="border-r border-neutral-200 px-3">
                              <StatusBadge academy={academy} />
                            </td>
                            <td className="border-r border-neutral-200 px-3 text-text-secondary">
                              {shortDate(new Date(academy.createdAt))}
                            </td>
                            <td className="px-3">
                              <AcademyActionsMenu
                                academy={academy}
                                onView={() => setSelectedId(academy.id)}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {!isEmpty && matching.length > 0 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={matching.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </div>
      </main>

      <PeopleFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        value={filterValues}
        onApply={(next) => {
          setFilterValues(next);
          setPage(1);
        }}
      />

      <AcademyDetailsPanel academy={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
