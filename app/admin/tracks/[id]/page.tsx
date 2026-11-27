import { Suspense } from "react";
import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";

import { adminQueries } from "@/lib/admin";
import { dehydrateServerQueries, prefetchOrNotFound } from "@/lib/query.server";
import { TrackDetail } from "./TrackDetail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const track = await prefetchOrNotFound(adminQueries.track((await params).id));
  return { title: track?.name ?? "Track" };
}

export default async function TrackDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={<TrackDetail id={id} loading />}>
      <LoadedTrackDetail id={id} />
    </Suspense>
  );
}

async function LoadedTrackDetail({ id }: { id: string }) {
  await prefetchOrNotFound(adminQueries.track(id));

  return (
    <HydrationBoundary state={dehydrateServerQueries()}>
      <TrackDetail id={id} />
    </HydrationBoundary>
  );
}
