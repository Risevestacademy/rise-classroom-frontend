import { Suspense } from "react";
import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";

import { curriculumApis } from "@/features/curriculum/api";
import { CurriculumDetailScreen } from "@/features/curriculum/screens/CurriculumDetailScreen";
import {
  dehydrateServerQueries,
  prefetch,
  prefetchOrNotFound,
} from "@/lib/query.server";

const { queries } = curriculumApis.admin;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const curriculum = await prefetchOrNotFound(queries.detail((await params).id));
  return { title: curriculum?.title ?? "Curriculum" };
}

export default async function CurriculumDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={<CurriculumDetailScreen id={id} loading />}>
      <LoadedCurriculum id={id} />
    </Suspense>
  );
}

async function LoadedCurriculum({ id }: { id: string }) {
  await Promise.all([
    prefetchOrNotFound(queries.detail(id)),
    // Modules also back the Assignments and Resources tabs.
    prefetch(queries.modules(id)),
    prefetch(queries.notes(id)),
  ]);

  return (
    <HydrationBoundary state={dehydrateServerQueries()}>
      <CurriculumDetailScreen id={id} />
    </HydrationBoundary>
  );
}
