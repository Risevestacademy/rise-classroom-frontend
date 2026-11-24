"use client";

import * as React from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { ApiErrorToasts, toastForApiError } from "@/components/ApiErrorToasts";
import { ApiError } from "@/lib/api";

const SESSION_KEY = ["auth", "session"];

function makeQueryClient() {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      // A 401 mid-visit means the session expired or was revoked. Re-check it,
      // and <AuthGuard> sends the user to sign-in once it comes back empty.
      onError: (error, query) => {
        if (
          error instanceof ApiError &&
          error.status === 401 &&
          query.queryKey[0] !== SESSION_KEY[0]
        ) {
          client.invalidateQueries({ queryKey: SESSION_KEY });
        }
        // Rate limits and time-outs get the design's toast, with a retry.
        toastForApiError(error, () => client.refetchQueries({ queryKey: query.queryKey }));
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, _context, mutation) => {
        toastForApiError(error, () => {
          mutation.execute(variables).catch(() => {});
        });
      },
    }),
    defaultOptions: {
      queries: {
        // Dashboard figures don't need to be re-fetched on every mount or tab
        // focus — a minute of staleness is fine and keeps navigation instant.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Auth and client errors won't fix themselves on a retry.
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });

  return client;
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // On the server every request gets its own client; in the browser we keep one
  // so the cache survives client-side navigation.
  if (typeof window === "undefined") return makeQueryClient();

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ApiErrorToasts />
    </QueryClientProvider>
  );
}
