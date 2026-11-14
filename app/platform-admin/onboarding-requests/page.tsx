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
  await prefetch(platformQueries.academies());

  return (
    <HydrationBoundary state={dehydrateServerQueries()}>
      <OnboardingRequests />
    </HydrationBoundary>
  );
}
