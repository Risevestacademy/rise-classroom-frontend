"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FilterStudentsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatusFilter: string;
  currentSortBy: "name" | "progress" | "grade";
  onApplyFilters: (status: string, sort: "name" | "progress" | "grade") => void;
}

export function FilterStudentsModal({
  isOpen,
  onOpenChange,
  currentStatusFilter,
  currentSortBy,
  onApplyFilters,
}: FilterStudentsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 rounded-3xl border-none bg-white shadow-xl">
        {isOpen && (
          <FilterStudentsForm
            currentStatusFilter={currentStatusFilter}
            currentSortBy={currentSortBy}
            onApplyFilters={onApplyFilters}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FilterStudentsForm({
  currentStatusFilter,
  currentSortBy,
  onApplyFilters,
  onOpenChange,
}: Pick<
  FilterStudentsModalProps,
  "currentStatusFilter" | "currentSortBy" | "onApplyFilters" | "onOpenChange"
>) {
  const [statusFilter, setStatusFilter] = useState(currentStatusFilter);
  const [sortBy, setSortBy] = useState<"name" | "progress" | "grade">(currentSortBy);

  const handleApply = () => {
    onApplyFilters(statusFilter, sortBy);
    onOpenChange(false);
  };

  const handleReset = () => {
    setStatusFilter("All");
    setSortBy("name");
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-bold text-neutral-900">
          Filter & Sort Students
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5 pt-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-800">
            Filter by Status
          </label>
          <div className="grid grid-cols-4 gap-2">
            {["All", "Active", "Behind", "At risk"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  statusFilter === status
                    ? "bg-brand-primary text-white border-neutral-900"
                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-800">
            Sort by
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: "name", label: "Name" },
              { id: "progress", label: "Progress" },
              { id: "grade", label: "Grade" },
            ] as const).map((sort) => (
              <button
                key={sort.id}
                onClick={() => setSortBy(sort.id)}
                className={`py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  sortBy === sort.id
                    ? "bg-brand-primary text-white border-neutral-900"
                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleReset}
            className="text-xs text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
          >
            Reset filters
          </button>
          <Button
            onClick={handleApply}
            className="bg-brand-primary rounded-xl px-6 py-2.5 text-xs font-medium text-white hover:bg-neutral-800 shadow-xs cursor-pointer"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  );
}