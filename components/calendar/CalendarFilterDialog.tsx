"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import {
  CalendarDialogActions,
  CalendarDialogHeader,
} from "@/components/calendar/CalendarDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

function toggle<T>(list: T[], value: T, checked: boolean) {
  return checked ? [...list, value] : list.filter((item) => item !== value);
}

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

function FilterSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="py-5.5">
      <legend className="text-lg leading-7 font-medium text-text-primary">
        {title}
      </legend>
      <p className="text-sm leading-5 text-text-secondary">{description}</p>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </fieldset>
  );
}

function FilterOption({
  name,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  name: string;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    // A named Checkbox positions its hidden input absolutely; `relative` keeps
    // it here, so focusing it on click doesn't scroll the dialog to the top.
    <label className="relative flex cursor-pointer items-start gap-3.5">
      <Checkbox
        name={name}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-1 border-[1.5px] border-neutral-600"
      />
      <span className="flex flex-col">
        <span className="text-base leading-6 text-text-primary">{label}</span>
        {hint && (
          <span className="font-work text-sm leading-5 text-text-muted">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}
