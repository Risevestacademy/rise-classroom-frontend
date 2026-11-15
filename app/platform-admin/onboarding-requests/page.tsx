import { Suspense } from "react";
import { HydrationBoundary } from "@tanstack/react-query";

import { platformQueries } from "@/lib/platform";
import { dehydrateServerQueries, prefetch } from "@/lib/query.server";
import { OnboardingRequests, OnboardingRequestsLoading } from "./OnboardingRequests";

export default function OnboardingRequestsPage() {
  return (
    <Suspense fallback={<OnboardingRequestsLoading />}>
      <LoadedRequests />
    </Suspense>
  );
}

async function LoadedRequests() {
  await Promise.all([
    prefetch(platformQueries.academies()),
    prefetch(platformQueries.applications()),
  ]);

  return (
    <HydrationBoundary state={dehydrateServerQueries()}>
      <OnboardingRequests />
    </HydrationBoundary>
  );
}
