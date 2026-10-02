import { queryOptions } from "@tanstack/react-query";

import { getSession } from "@/lib/auth";

export const sessionQuery = () =>
  queryOptions({
    queryKey: ["auth", "session"] as const,
    queryFn: getSession,
    staleTime: 5 * 60_000,
    retry: false,
  });
