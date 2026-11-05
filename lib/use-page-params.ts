"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { pageSizes } from "@/components/ui/pagination";

function positiveInt(value: string | null) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

/**
 * A list's page and page size, kept in `?page=` and `?size=` so they survive
 * a reload and coming back to the list. The URL changes in place, without a
 * server render or a new history entry.
 */
export function usePageParams() {
  const searchParams = useSearchParams();
  const [page, setPage] = React.useState(
    () => positiveInt(searchParams.get("page")) ?? 1,
  );
  const [pageSize, setPageSize] = React.useState(() => {
    const size = positiveInt(searchParams.get("size"));
    return size && pageSizes.includes(size) ? size : pageSizes[0];
  });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    if (pageSize !== pageSizes[0]) params.set("size", String(pageSize));
    else params.delete("size");

    const query = params.toString();
    if (query !== window.location.search.slice(1)) {
      window.history.replaceState(
        null,
        "",
        query ? `?${query}` : window.location.pathname,
      );
    }
  }, [page, pageSize]);

  return { page, setPage, pageSize, setPageSize };
}
