import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  QueryClient,
  dehydrate,
  type FetchQueryOptions,
  type QueryKey,
} from "@tanstack/react-query";

import { ApiError, setServerCookieReader } from "@/lib/api";

setServerCookieReader(async () => {
  try {
    return (await headers()).get("cookie");
  } catch {
    // Outside a request (e.g. at build time) there are no cookies to send.
    return null;
  }
});

/**
 * One query client per request, shared by `generateMetadata` and the page,
 * so a record they both need is fetched once.
 */
export const getServerQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        // A failed server fetch isn't retried; the browser loads it instead.
        queries: { retry: false, staleTime: 60_000 },
      },
    }),
);

/**
 * Loads a query on the server. Returns the data, or `undefined` when the API
 * is slow or failing, so the page falls back to loading it in the browser.
 * A 404 (or 400 for a malformed id) shows the not-found page.
 */
export async function prefetchOrNotFound<
  TData,
  TKey extends QueryKey,
>(options: FetchQueryOptions<TData, Error, TData, TKey>) {
  try {
    return await getServerQueryClient().fetchQuery(options);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400)
    ) {
      notFound();
    }
    return undefined;
  }
}

/** Loads a query the page can do without; a failure is left to the browser. */
export function prefetch<TData, TKey extends QueryKey>(
  options: FetchQueryOptions<TData, Error, TData, TKey>,
) {
  return getServerQueryClient().prefetchQuery(options);
}

/** The loaded queries, for the page's `<HydrationBoundary>`. */
export function dehydrateServerQueries() {
  return dehydrate(getServerQueryClient());
}
