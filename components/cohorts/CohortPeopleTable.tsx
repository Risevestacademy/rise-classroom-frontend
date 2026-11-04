"use client";

import * as React from "react";

import { Filter, MoreHorizontal, Search01 } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";
import { PeopleRowsSkeleton } from "@/components/cohorts/CohortSkeletons";
import {
  matchesPeopleFilters,
  PeopleFilterDialog,
  type PeopleFilter,
  type PeopleFilterValues,
} from "@/components/cohorts/PeopleFilterDialog";
import type { Person } from "@/app/admin/cohorts/cohort-data";
import { cn } from "@/lib/utils";

export type PeopleColumn<T> = {
  header: string;
  /** Tailwind width class for the column. */
  width: string;
  cell: (row: T) => React.ReactNode;
};

type PeopleTableColumns<T> = {
  title: string;
  personHeader: string;
  columns: PeopleColumn<T>[];
  actionHeader?: string;
  filters?: PeopleFilter<T>[];
  /** The menu in each row's last cell. */
  rowActions?: (row: T) => React.ReactNode;
};

/**
 * The table the Students, Instructors and Mentors tabs share. Whoever renders it
 * owns the search, filters and page, as some lists come from the API a page at
 * a time and others are already in memory.
 */
export function PeopleTableView<T extends Person & { id: string }>({
  title,
  personHeader,
  columns,
  actionHeader,
  filters = [],
  rowActions,
  rows,
  loading = false,
  error,
  search,
  onSearchChange,
  filterValues,
  onFilterValuesChange,
  singleSelectFilters = false,
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  paginationDisabled = false,
}: PeopleTableColumns<T> & {
  rows: T[];
  loading?: boolean;
  error?: string;
  search: string;
  onSearchChange: (search: string) => void;
  filterValues: PeopleFilterValues;
  onFilterValuesChange: (values: PeopleFilterValues) => void;
  singleSelectFilters?: boolean;
  page: number;
  totalPages: number;
  /** Rows across every page, after search and filters. */
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  paginationDisabled?: boolean;
}) {
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const allSelected =
    rows.length > 0 && rows.every((row) => selected.has(row.id));

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <section className="relative mt-6">
      {/* Outside the scroll area so it stays screen-width on mobile, and
          sticky so search and filter stay in reach while scrolling. */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-white px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        <div className="flex items-center gap-3">
          <label className="relative flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-200 px-2.5 text-text-muted sm:w-[281px] sm:flex-none">
            <Search01 className="size-5 shrink-0" />
            <span className="sr-only">Search by name or email</span>
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by name or email"
              className="w-full min-w-0 bg-transparent font-work text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </label>
          <button
            type="button"
            onClick={() => filters.length > 0 && setFilterOpen(true)}
            className="flex h-10 shrink-0 items-center gap-1 rounded-lg border border-neutral-200 px-2 font-work text-sm text-text-muted"
          >
            <Filter className="size-4" />
            Filter
          </button>
        </div>
      </div>

      {/* `relative` keeps the absolutely positioned sr-only labels and
          checkbox inputs inside the scroll area; without it they widen the
          whole page on mobile. */}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[960px] table-fixed text-left">
          <thead className="bg-neutral-100 text-sm font-medium text-text-primary uppercase">
            <tr className="h-11">
              <th className="w-[69px] border-r border-neutral-200 pl-3.5">
                <Checkbox
                  aria-label="Select all"
                  checked={allSelected}
                  onCheckedChange={(checked) =>
                    rows.forEach((row) => toggle(row.id, checked))
                  }
                  className="size-4"
                />
              </th>
              <th className="w-[319px] border-r border-neutral-200 px-3 font-medium">
                {personHeader}
              </th>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={cn(
                    "border-r border-neutral-200 px-3 font-medium last:border-r-0",
                    column.width,
                  )}
                >
                  {column.header}
                </th>
              ))}
              <th className="w-[82px] px-3 font-medium">
                {actionHeader ?? <MoreHorizontal className="size-5" />}
                {!actionHeader && <span className="sr-only">Actions</span>}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && <PeopleRowsSkeleton columns={columns.length} />}
            {rows.map((row) => (
              <tr key={row.id} className="h-[85px] border-b border-neutral-200">
                <td className="pl-3.5">
                  <Checkbox
                    aria-label={`Select ${row.name}`}
                    checked={selected.has(row.id)}
                    onCheckedChange={(checked) => toggle(row.id, checked)}
                    className="size-4"
                  />
                </td>
                <td className="px-3">
                  <div className="flex items-center gap-3">
                    <PersonAvatar
                      name={row.name}
                      src={row.avatar}
                      colorKey={row.id}
                      size={44}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {row.name}
                      </p>
                      <p className="mt-1 truncate font-work text-sm text-text-secondary">
                        {row.email}
                      </p>
                    </div>
                  </div>
                </td>
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className="px-3 font-work text-sm text-text-primary"
                  >
                    {column.cell(row)}
                  </td>
                ))}
                <td className="px-3">{rowActions?.(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && (
        <p className="bg-white px-6 py-10 text-center font-work text-sm text-text-muted">
          {error ?? "No one matches your search or filters."}
        </p>
      )}

      {rows.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          disabled={paginationDisabled}
          className="mt-4"
        />
      )}

      <PeopleFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        value={filterValues}
        singleSelect={singleSelectFilters}
        onApply={onFilterValuesChange}
      />
    </section>
  );
}

/** For lists the API returns whole: searches, filters and pages them here. */
export function CohortPeopleTable<T extends Person & { id: string }>({
  rows,
  filters = [],
  ...table
}: PeopleTableColumns<T> & { rows: T[] }) {
  const [search, setSearch] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<PeopleFilterValues>(
    {},
  );
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const query = search.trim().toLowerCase();
  const visible = rows.filter(
    (row) =>
      (row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query)) &&
      matchesPeopleFilters(row, filters, filterValues),
  );
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  return (
    <PeopleTableView
      {...table}
      filters={filters}
      rows={visible.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
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
      page={currentPage}
      totalPages={totalPages}
      totalItems={visible.length}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
    />
  );
}

export function StatusPill({
  status,
  children,
}: {
  status: "success" | "warning" | "error";
  children: React.ReactNode;
}) {
  return (
    <Badge variant="light" status={status} className="font-medium">
      {children}
    </Badge>
  );
}
