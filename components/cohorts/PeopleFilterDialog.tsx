"use client";

import * as React from "react";

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

/** One section of the people filter, e.g. "Track" or "Account status". */
export type PeopleFilter<T> = {
  key: string;
  title: string;
  description?: string;
  allLabel: string;
  options: { value: string; label: string }[];
  /** The option values a row has; it matches when any of them is selected. */
  values: (row: T) => string[];
};

/** Selected option values per filter key. A missing or empty list means "all". */
export type PeopleFilterValues = Record<string, string[]>;

export function matchesPeopleFilters<T>(
  row: T,
  filters: PeopleFilter<T>[],
  selected: PeopleFilterValues,
) {
  return filters.every((filter) => {
    const picked = selected[filter.key] ?? [];
    return (
      picked.length === 0 ||
      filter.values(row).some((value) => picked.includes(value))
    );
  });
}

export function PeopleFilterDialog<T>({
  open,
  onOpenChange,
  filters,
  value,
  singleSelect = false,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PeopleFilter<T>[];
  value: PeopleFilterValues;
  /** Allow at most one option per section, for APIs that take one value. */
  singleSelect?: boolean;
  onApply: (value: PeopleFilterValues) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="w-[410px] rounded-3xl border-0 px-6 pt-4 pb-6 sm:px-6 sm:pt-4 sm:pb-6"
      >
        {open && (
          <FilterForm
            filters={filters}
            initial={value}
            singleSelect={singleSelect}
            onApply={(next) => {
              onApply(next);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FilterForm<T>({
  filters,
  initial,
  singleSelect,
  onApply,
}: {
  filters: PeopleFilter<T>[];
  initial: PeopleFilterValues;
  singleSelect: boolean;
  onApply: (value: PeopleFilterValues) => void;
}) {
  const [selected, setSelected] = React.useState(initial);

  function set(key: string, values: string[]) {
    setSelected((current) => ({ ...current, [key]: values }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(selected);
      }}
    >
      <CalendarDialogHeader title="Filters" />

      <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        {filters.map((filter) => {
          const picked = selected[filter.key] ?? [];
          return (
            <FilterSection
              key={filter.key}
              title={filter.title}
              description={filter.description}
            >
              {/* "All" is an empty list, so picking it clears the others. */}
              <FilterOption
                name={filter.key}
                label={filter.allLabel}
                checked={picked.length === 0}
                onCheckedChange={(checked) => checked && set(filter.key, [])}
              />
              {filter.options.map((option) => (
                <FilterOption
                  key={option.value}
                  name={filter.key}
                  label={option.label}
                  checked={picked.includes(option.value)}
                  onCheckedChange={(checked) =>
                    set(
                      filter.key,
                      singleSelect
                        ? checked
                          ? [option.value]
                          : []
                        : toggle(picked, option.value, checked),
                    )
                  }
                />
              ))}
            </FilterSection>
          );
        })}
      </div>

      <CalendarDialogActions submitLabel="Apply filters" className="pt-6">
        <button
          type="button"
          onClick={() => setSelected({})}
          className="mr-auto rounded-lg px-1.5 py-1 text-base text-text-primary hover:bg-neutral-100"
        >
          Clear all
        </button>
      </CalendarDialogActions>
    </form>
  );
}
