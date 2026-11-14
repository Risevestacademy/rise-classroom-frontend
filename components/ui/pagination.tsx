"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { SelectInput } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const pageSizes = [10, 20, 50];
const pageSizeOptions = pageSizes.map((size) => ({
  value: String(size),
  label: String(size),
}));

/** "1 2 3 … 8 9 10": three pages from the current one, then the last three. */
function visiblePages(page: number, totalPages: number) {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const start = Math.min(Math.max(page - 1, 1), totalPages - 5);
  const first = [start, start + 1, start + 2];
  const last = [totalPages - 2, totalPages - 1, totalPages];
  return start + 3 < last[0] ? [...first, null, ...last] : [...first, ...last];
}

/**
 * Hidden while everything fits on the smallest page, so a short list doesn't
 * show "Page 1 of 1".
 */
export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  className,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  function commitPage(input: HTMLInputElement) {
    const next = Number(input.value);
    if (Number.isInteger(next) && next >= 1 && next <= totalPages) {
      if (next !== page) onPageChange(next);
    } else {
      input.value = String(page);
    }
  }

  if (totalItems <= pageSizes[0]) return null;

  const atStart = page <= 1 || disabled;
  const atEnd = page >= totalPages || disabled;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex min-h-[73px] flex-wrap items-center justify-between gap-y-3 rounded-[19px] border-[1.5px] border-border-default bg-surface-default py-3 pr-[23px] pl-[22px] text-base/6 text-text-primary",
        className,
      )}
    >
      <div className="flex items-center">
        <div className="flex items-center gap-[9px] pr-[18px]">
          <label htmlFor="pagination-page">Page</label>
          <input
            key={page}
            id="pagination-page"
            inputMode="numeric"
            defaultValue={page}
            disabled={disabled}
            onBlur={(event) => commitPage(event.target)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitPage(event.currentTarget);
            }}
            className="h-[39px] w-[38px] rounded-lg border-[1.5px] border-border-default bg-surface-background text-center outline-none focus-visible:border-border-focus"
          />
          <span>of {totalPages}</span>
        </div>
        <div className="flex items-center gap-2.5 pl-4">
          <span>Rows per page</span>
          <SelectInput
            aria-label="Rows per page"
            value={String(pageSize)}
            onChange={(size) => onPageSizeChange(Number(size))}
            options={pageSizeOptions}
            disabled={disabled}
            className="h-[39px] w-[69px] cursor-pointer border-[1.5px] bg-surface-background py-2 pr-2 pl-2.5 font-lato text-base/6"
          />
        </div>
      </div>

      <div className="flex items-center gap-[9px]">
        <PageButton label="First page" disabled={atStart} onClick={() => onPageChange(1)}>
          <ChevronsLeft />
        </PageButton>
        <PageButton label="Previous page" disabled={atStart} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft />
        </PageButton>
        <ul className="hidden items-center gap-px px-2 md:flex">
          {visiblePages(page, totalPages).map((item, index) => (
            <li key={item ?? `gap-${index}`}>
              {item === null ? (
                <span className="flex h-[39px] w-10 items-center justify-center text-text-secondary">
                  ...
                </span>
              ) : (
                <button
                  type="button"
                  aria-current={item === page ? "page" : undefined}
                  disabled={disabled}
                  onClick={() => onPageChange(item)}
                  className={cn(
                    "flex h-[39px] w-10 cursor-pointer items-center justify-center rounded-md disabled:cursor-not-allowed",
                    item === page
                      ? "bg-surface-subtle text-text-primary"
                      : "bg-surface-default text-text-secondary hover:bg-surface-subtle",
                  )}
                >
                  {item}
                </button>
              )}
            </li>
          ))}
        </ul>
        <PageButton label="Next page" disabled={atEnd} onClick={() => onPageChange(page + 1)}>
          <ChevronRight />
        </PageButton>
        <PageButton label="Last page" disabled={atEnd} onClick={() => onPageChange(totalPages)}>
          <ChevronsRight />
        </PageButton>
      </div>
    </nav>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-[39px] cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-border-default bg-surface-default text-icon-primary hover:bg-surface-subtle disabled:cursor-not-allowed disabled:hover:bg-surface-default [&>svg]:size-6 [&>svg]:stroke-[1.5] disabled:[&>svg]:opacity-[0.43]"
    >
      {children}
    </button>
  );
}
