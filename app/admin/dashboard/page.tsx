import { Suspense } from "react";
import { cookies } from "next/headers";
import { HydrationBoundary } from "@tanstack/react-query";

import { adminQueries } from "@/lib/admin";
import { cohortQueries } from "@/lib/cohorts";
import {
  dehydrateServerQueries,
  getServerQueryClient,
  prefetch,
} from "@/lib/query.server";
import { pickCohort, SELECTED_COHORT_COOKIE } from "@/lib/selected-cohort-pick";
import { AdminDashboard } from "./AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboard loading />}>
      <LoadedDashboard />
    </Suspense>
  );
}

async function LoadedDashboard() {
  const [cookieStore, cohorts] = await Promise.all([
    cookies(),
    // Already loaded by the admin layout, so this reads the cache.
    getServerQueryClient()
      .fetchQuery(adminQueries.cohorts())
      .catch(() => undefined),
  ]);
  const cohortId = cohorts
    ? pickCohort(cohorts, cookieStore.get(SELECTED_COHORT_COOKIE)?.value ?? "")?.id
    : undefined;

  // Same queries, with the same cohort, as the dashboard asks for.
  await Promise.all([
    prefetch(adminQueries.tracks("ACTIVE")),
    cohorts &&
      prefetch(
        adminQueries.userCount({ role: "STUDENT", status: "ACTIVE", cohortId }),
      ),
    cohortId && prefetch(cohortQueries.trackIds(cohortId)),
  ]);

  return (
    <HydrationBoundary state={dehydrateServerQueries()}>
      <AdminDashboard />
    </HydrationBoundary>
  );
}
