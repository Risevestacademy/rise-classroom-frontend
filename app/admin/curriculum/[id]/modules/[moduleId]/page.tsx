import { Suspense } from "react";
import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";

import { curriculumApis } from "@/features/curriculum/api";
import { ModuleDetailScreen } from "@/features/curriculum/screens/ModuleDetailScreen";
import {
  dehydrateServerQueries,
  prefetch,
  prefetchOrNotFound,
} from "@/lib/query.server";

const { queries } = curriculumApis.admin;

type Props = { params: Promise<{ id: string; moduleId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await prefetchOrNotFound(queries.module((await params).moduleId));
  return { title: found?.title ?? "Module" };
}

export default async function ModuleDetailPage({ params }: Props) {
  const { id, moduleId } = await params;

  return (
    <Suspense fallback={<ModuleDetailScreen id={id} moduleId={moduleId} loading />}>
      <LoadedModule id={id} moduleId={moduleId} />
    </Suspense>
  );
}

async function LoadedModule({ id, moduleId }: { id: string; moduleId: string }) {
  await Promise.all([
    prefetchOrNotFound(queries.module(moduleId)),
    prefetchOrNotFound(queries.detail(id)),
    prefetch(queries.modules(id)),
  ]);

  return (
    <HydrationBoundary state={dehydrateServerQueries()}>
      <ModuleDetailScreen id={id} moduleId={moduleId} />
    </HydrationBoundary>
  );
}
