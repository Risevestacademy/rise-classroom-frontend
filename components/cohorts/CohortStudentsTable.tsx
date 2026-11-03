"use client";

import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  PeopleTableView,
  type PeopleColumn,
} from "@/components/cohorts/CohortPeopleTable";
import type {
  PeopleFilter,
  PeopleFilterValues,
} from "@/components/cohorts/PeopleFilterDialog";
import { adminQueries, toUserFilters } from "@/lib/admin";
import { toCohortStudent, type CohortStudent } from "@/lib/cohorts";
import { useDebounced } from "@/lib/use-debounced";

/** A cohort's Students tab: search, filters and pages all come from the API. */
export function CohortStudentsTable({
  cohortId,
  title,
  columns,
  filters,
}: {
  cohortId: string;
  title: string;
  columns: PeopleColumn<CohortStudent>[];
  /** Keys match the `/admin/users` query params they set. */
  filters: PeopleFilter<CohortStudent>[];
}) {
  const [search, setSearch] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<PeopleFilterValues>(
    {},
  );
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const debouncedSearch = useDebounced(search);

  const studentsQuery = useQuery({
    ...adminQueries.users({
      role: "STUDENT",
      cohortId,
      ...toUserFilters(filterValues),
      search: debouncedSearch || undefined,
      page,
      limit: pageSize,
    }),
    // Keeps the rows and pagination on screen while the next page loads.
    placeholderData: keepPreviousData,
  });
  const totalPages = studentsQuery.data?.totalPages ?? 1;

  // Removing the last row of the last page leaves this page empty.
  if (totalPages > 0 && page > totalPages) setPage(totalPages);

  return (
    <PeopleTableView
      title={title}
      personHeader="Student"
      columns={columns}
      filters={filters}
      rows={(studentsQuery.data?.items ?? []).map((user) =>
        toCohortStudent(user, cohortId),
      )}
      loading={studentsQuery.isPending}
      error={
        studentsQuery.isError
          ? `Couldn't load students. ${studentsQuery.error.message}`
          : undefined
      }
      search={search}
      onSearchChange={(next) => {
        setSearch(next);
        setPage(1);
      }}
      filterValues={filterValues}
      onFilterValuesChange={(next) => {
        setFilterValues(next);
        setPage(1);
      }}
      singleSelectFilters
      page={page}
      totalPages={totalPages}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
      paginationDisabled={studentsQuery.isFetching}
    />
  );
}
