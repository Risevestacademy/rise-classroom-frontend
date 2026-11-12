import { Suspense } from "react";
import { HydrationBoundary } from "@tanstack/react-query";

import { platformQueries } from "@/lib/platform";
import { dehydrateServerQueries, prefetch } from "@/lib/query.server";
import { Academies, AcademiesLoading } from "./Academies";

export default function PlatformAdminAcademiesPage() {
  return (
    <Suspense fallback={<AcademiesLoading />}>
      <LoadedAcademies />
    </Suspense>
  );
}

async function LoadedAcademies() {
  await prefetch(platformQueries.academies());

  return (
    <HydrationBoundary state={dehydrateServerQueries()}>
      <Academies />
    </HydrationBoundary>
  );
}
