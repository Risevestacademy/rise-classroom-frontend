import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";

import { adminQueries } from "@/lib/admin";
import { mentorQueries } from "@/lib/mentors";
import {
  dehydrateServerQueries,
  prefetch,
  prefetchOrNotFound,
} from "@/lib/query.server";
import { MentorProfile } from "./MentorProfile";

type Props = { params: Promise<{ id: string }> };

/** The mentor, or the not-found page for an id that isn't one. */
async function loadMentor(id: string) {
  const mentor = await prefetchOrNotFound(adminQueries.user(id));
  if (mentor && mentor.role !== "MENTOR") notFound();
  return mentor;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mentor = await loadMentor((await params).id);
  return { title: mentor?.name ?? "Mentor" };
}

export default async function MentorProfilePage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={<MentorProfile id={id} loading />}>
      <LoadedMentorProfile id={id} />
    </Suspense>
  );
}

async function LoadedMentorProfile({ id }: { id: string }) {
  // The Overview and Students tabs both list the mentees.
  await Promise.all([loadMentor(id), prefetch(mentorQueries.mentees(id))]);

  return (
    <HydrationBoundary state={dehydrateServerQueries()}>
      <MentorProfile id={id} />
    </HydrationBoundary>
  );
}
