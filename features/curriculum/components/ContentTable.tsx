"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { Filter, MoreHorizontal } from "lucide-react";
import { cn } from "cn";

import { Search } from "@/assets/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ModuleStatus } from "@/features/curriculum/types";

export type StatusFilter = ModuleStatus | "ALL";

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All statuses", value: "ALL" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Draft", value: "DRAFT" },
];

const menuItemClass =
  "flex cursor-pointer rounded-md px-3 py-2 text-neutral-700 outline-none data-highlighted:bg-neutral-100";

/** Heading, search box and status filter shared by the curriculum content tables. */
export function TableToolbar({
  title,
  description,
  searchPlaceholder,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: {
  title: string;
  description: string;
  searchPlaceholder: string;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-xl font-bold text-neutral-800">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex h-11 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-neutral-400 sm:w-80">
          <Search />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
        </div>
        <Menu.Root>
          <Menu.Trigger
            render={
              <Button
                variant="secondary"
                size="lg"
                className={cn(
                  "border-neutral-200",
                  statusFilter !== "ALL" &&
                    "border-brand-primary text-brand-primary",
                )}
              />
            }
          >
            <Filter className="h-4 w-4" />
            Filters
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner align="end" sideOffset={6} className="z-50">
              <Menu.Popup className="w-44 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none">
                {statusFilters.map((option) => (
                  <Menu.Item
                    key={option.value}
                    onClick={() => onStatusFilterChange(option.value)}
                    className={cn(
                      menuItemClass,
                      statusFilter === option.value &&
                        "font-medium text-brand-primary",
                    )}
                  >
                    {option.label}
                  </Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </div>
  );
}

/** The "…" menu on each row: view, toggle publish state, delete. */
export function RowActionsMenu({
  label,
  status,
  onView,
  onToggleStatus,
  onDelete,
}: {
  label: string;
  status: ModuleStatus;
  onView: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`${label} actions`}
        className="rounded-md p-1 text-neutral-800 hover:bg-neutral-100"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className="z-50">
          <Menu.Popup className="w-44 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none">
            <Menu.Item onClick={onView} className={menuItemClass}>
              View details
            </Menu.Item>
            <Menu.Item onClick={onToggleStatus} className={menuItemClass}>
              {status === "PUBLISHED" ? "Move to draft" : "Publish"}
            </Menu.Item>
            <Menu.Item
              onClick={onDelete}
              className="flex cursor-pointer rounded-md px-3 py-2 text-text-error outline-none data-highlighted:bg-surface-error-badge"
            >
              Delete
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Checkbox selection state for a table's visible rows. */
export function useRowSelection(visibleIds: string[]) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id));

  return {
    isSelected: (id: string) => selectedIds.has(id),
    allSelected,
    someSelected: someSelected && !allSelected,
    toggleAll: () =>
      setSelectedIds(allSelected ? new Set() : new Set(visibleIds)),
    toggle: (id: string) =>
      setSelectedIds((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
  };
}

export function StatusBadge({ status }: { status: ModuleStatus }) {
  return (
    <Badge
      variant="light"
      status={status === "PUBLISHED" ? "success" : "neutral"}
    >
      {status === "PUBLISHED" ? "Published" : "Draft"}
    </Badge>
  );
}
