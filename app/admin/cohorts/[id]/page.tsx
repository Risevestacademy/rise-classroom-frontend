import { Suspense } from "react";
import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";

import { adminQueries } from "@/lib/admin";
import { cohortQueries } from "@/lib/cohorts";
import {
  dehydrateServerQueries,
  prefetch,
  prefetchOrNotFound,
} from "@/lib/query.server";
import { CohortDetail } from "./CohortDetail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cohort = await prefetchOrNotFound(cohortQueries.detail((await params).id));
  return { title: cohort?.name ?? "Cohort" };
}

export default async function CohortDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={<CohortDetail id={id} loading />}>
      <LoadedCohortDetail id={id} />
    </Suspense>
  );
}

async function LoadedCohortDetail({ id }: { id: string }) {
  await Promise.all([
    prefetchOrNotFound(cohortQueries.detail(id)),
    // The Settings tab's form.
    prefetch(adminQueries.cohort(id)),
  ]);

  return (
    <HydrationBoundary state={dehydrateServerQueries()}>
      <CohortDetail id={id} />
    </HydrationBoundary>
  );
}
