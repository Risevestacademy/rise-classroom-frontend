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
import { noFilters, type CalendarFilters } from "@/lib/calendar";

const contentTypes = [
  {
    kind: "event",
    label: "Events",
    hint: "Scheduled classes, meetings and other events",
  },
  { kind: "task", label: "Tasks", hint: "Assignments, deadlines and to-dos" },
] as const;

export function CalendarFilterDialog({
  open,
  onOpenChange,
  value,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: CalendarFilters;
  onApply: (filters: CalendarFilters) => void;
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
  initial: CalendarFilters;
  onApply: (filters: CalendarFilters) => void;
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
      <CalendarDialogHeader title="Filter calender" />

      <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        <FilterSection
          title="Content type"
          description="Choose what to display on the calender"
        >
          {contentTypes.map(({ kind, label, hint }) => (
            <FilterOption
              key={kind}
              name="kind"
              label={label}
              hint={hint}
              checked={filters.kinds.includes(kind)}
              onCheckedChange={(checked) =>
                setFilters((f) => ({
                  ...f,
                  kinds: toggle(f.kinds, kind, checked),
                }))
              }
            />
          ))}
        </FilterSection>

        <FilterSection
          title="Track"
          description="Select one or more tracks"
        >
          {tracksQuery.isPending ? (
            <p className="font-work text-sm text-text-muted">
              Loading tracks…
            </p>
          ) : (
            tracksQuery.data?.map((track) => (
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
            ))
          )}
        </FilterSection>
      </div>

      <CalendarDialogActions submitLabel="Apply filters" className="pt-6">
        <button
          type="button"
          onClick={() => setFilters(noFilters)}
          className="mr-auto rounded-lg px-1.5 py-1 text-base text-text-primary hover:bg-neutral-100"
        >
          Clear all
        </button>
      </CalendarDialogActions>
    </form>
  );
}
