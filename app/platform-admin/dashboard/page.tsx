import { Suspense } from "react";
import { HydrationBoundary } from "@tanstack/react-query";

import { platformQueries } from "@/lib/platform";
import { dehydrateServerQueries, prefetch } from "@/lib/query.server";
import {
  PlatformAdminDashboard,
  PlatformAdminDashboardLoading,
} from "./PlatformAdminDashboard";

export default function PlatformAdminDashboardPage() {
  return (
    <Suspense fallback={<PlatformAdminDashboardLoading />}>
      <LoadedDashboard />
    </Suspense>
  );
}

async function LoadedDashboard() {
  await Promise.all([
    prefetch(platformQueries.academies()),
    prefetch(platformQueries.applications()),
  ]);

  return (
    <HydrationBoundary state={dehydrateServerQueries()}>
      <PlatformAdminDashboard />
    </HydrationBoundary>
  );
}
