"use client";

import * as React from "react";
import Image from "next/image";

import { Filter, MoreHorizontal, Search01 } from "@/assets/icons";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Person } from "@/app/admin/cohorts/cohort-data";
import { cn } from "@/lib/utils";

export type PeopleColumn<T> = {
  header: string;
  /** Tailwind width class for the column. */
  width: string;
  cell: (row: T) => React.ReactNode;
};

const initialsTone: Record<NonNullable<Person["tone"]>, string> = {
  warning: "bg-surface-warning-badge text-text-warning",
  info: "bg-info-surface text-text-info",
  success: "bg-success-surface text-text-success",
  accent: "bg-[#eddeff] text-[#7e22ce]",
  error: "bg-surface-error-badge text-text-error",
};

/** The searchable people table used by the Students, Instructors and Mentors tabs. */
export function CohortPeopleTable<T extends Person>({
  title,
  personHeader,
  rows,
  columns,
  actionHeader,
}: {
  title: string;
  personHeader: string;
  rows: T[];
  columns: PeopleColumn<T>[];
  actionHeader?: string;
}) {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Set<number>>(new Set());

  const query = search.trim().toLowerCase();
  const visible = rows
    .map((row, index) => ({ row, index }))
    .filter(
      ({ row }) =>
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query),
    );
  const allSelected =
    visible.length > 0 && visible.every(({ index }) => selected.has(index));

  function toggle(index: number, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(index);
      else next.delete(index);
      return next;
    });
  }

  // `relative` keeps the absolutely positioned sr-only labels and checkbox
  // inputs inside the scroll area; without it they widen the whole page on
  // mobile.
  return (
    <section className="relative mt-6 overflow-x-auto">
      <div className="min-w-[960px]">
        <div className="flex h-16 items-center justify-between bg-white px-6">
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <div className="flex items-center gap-3">
            <label className="flex h-9 w-[281px] items-center gap-2 rounded-lg border border-neutral-200 px-2.5 text-text-muted">
              <Search01 className="size-5 shrink-0" />
              <span className="sr-only">Search by name or email</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                className="w-full bg-transparent font-work text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </label>
            <button
              type="button"
              className="flex h-10 items-center gap-1 rounded-lg border border-neutral-200 px-2 font-work text-sm text-text-muted"
            >
              <Filter className="size-4" />
              Filter
            </button>
          </div>
        </div>

        <table className="w-full table-fixed text-left">
          <thead className="bg-neutral-100 text-sm font-medium text-text-primary uppercase">
            <tr className="h-11">
              <th className="w-[69px] border-r border-neutral-200 pl-3.5">
                <Checkbox
                  aria-label="Select all"
                  checked={allSelected}
                  onCheckedChange={(checked) =>
                    visible.forEach(({ index }) => toggle(index, checked))
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
            {visible.map(({ row, index }) => (
              <tr key={index} className="h-[85px] border-b border-neutral-200">
                <td className="pl-3.5">
                  <Checkbox
                    aria-label={`Select ${row.name}`}
                    checked={selected.has(index)}
                    onCheckedChange={(checked) => toggle(index, checked)}
                    className="size-4"
                  />
                </td>
                <td className="px-3">
                  <div className="flex items-center gap-3">
                    <PersonAvatar person={row} />
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
                <td className="px-3">
                  <button
                    type="button"
                    aria-label={`${row.name} options`}
                    className="flex size-8 items-center justify-center text-text-primary"
                  >
                    <MoreHorizontal className="size-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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

function PersonAvatar({ person }: { person: Person }) {
  if (person.avatar) {
    return (
      <Image
        src={person.avatar}
        alt=""
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-full"
      />
    );
  }
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full font-work text-lg",
        initialsTone[person.tone ?? "info"],
      )}
    >
      {person.initials}
    </span>
  );
}
