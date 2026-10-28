"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import {
  CalendarDialogActions,
  CalendarDialogHeader,
} from "@/components/calendar/CalendarDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  FilterOption,
  FilterSection,
  toggle,
} from "@/components/ui/filter-fields";
import { adminQueries } from "@/lib/admin";
import {
  noCurriculumFilters,
  type CurriculumFilters,
  type ModuleStatus,
} from "@/lib/curriculum.types";

const statuses: { value: ModuleStatus; label: string }[] = [
  { value: "PUBLISHED", label: "Active" },
  { value: "DRAFT", label: "Draft" },
];

export function CurriculumFilterDialog({
  open,
  onOpenChange,
  value,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: CurriculumFilters;
  onApply: (filters: CurriculumFilters) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="w-[410px] rounded-3xl border-0 px-6 pt-4 pb-6 sm:px-6 sm:pt-4 sm:pb-6"
      >
        {open && (
          <FilterForm
            initial={value}
            onApply={(filters) => {
              onApply(filters);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FilterForm({
  initial,
  onApply,
}: {
  initial: CurriculumFilters;
  onApply: (filters: CurriculumFilters) => void;
}) {
  const [filters, setFilters] = React.useState(initial);
  const tracksQuery = useQuery(adminQueries.tracks("ACTIVE"));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(filters);
      }}
    >
      <CalendarDialogHeader title="Filters" />

      <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        <FilterSection
          title="Status"
          description="Find curricula based on whether they are currently usable or still being prepared"
        >
          {/* "All" is an empty list, so picking it clears the others. */}
          <FilterOption
            name="status"
            label="All"
            checked={filters.statuses.length === 0}
            onCheckedChange={(checked) =>
              checked && setFilters((f) => ({ ...f, statuses: [] }))
            }
          />
          {statuses.map(({ value, label }) => (
            <FilterOption
              key={value}
              name="status"
              label={label}
              checked={filters.statuses.includes(value)}
              onCheckedChange={(checked) =>
                setFilters((f) => ({
                  ...f,
                  statuses: toggle(f.statuses, value, checked),
                }))
              }
            />
          ))}
        </FilterSection>

        <FilterSection
          title="Track"
          description="Filter by the learning track a curriculum belongs to."
        >
          {tracksQuery.isPending ? (
            <p className="font-work text-sm text-text-muted">Loading tracks…</p>
          ) : (
            <>
              <FilterOption
                name="track"
                label="All tracks"
                checked={filters.trackIds.length === 0}
                onCheckedChange={(checked) =>
                  checked && setFilters((f) => ({ ...f, trackIds: [] }))
                }
              />
              {tracksQuery.data?.map((track) => (
                <FilterOption
                  key={track.id}
                  name="track"
                  label={track.name}
                  checked={filters.trackIds.includes(track.id)}
                  onCheckedChange={(checked) =>
                    setFilters((f) => ({
                      ...f,
                      trackIds: toggle(f.trackIds, track.id, checked),
                    }))
                  }
                />
              ))}
            </>
          )}
        </FilterSection>
      </div>

      <CalendarDialogActions submitLabel="Apply filters" className="pt-6">
        <button
          type="button"
          onClick={() => setFilters(noCurriculumFilters)}
          className="mr-auto rounded-lg px-1.5 py-1 text-base text-text-primary hover:bg-neutral-100"
        >
          Clear all
        </button>
      </CalendarDialogActions>
    </form>
  );
}
