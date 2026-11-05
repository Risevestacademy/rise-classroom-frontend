import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";

import { adminQueries } from "@/lib/admin";
import { instructorStudentQueries } from "@/lib/instructors";
import {
  dehydrateServerQueries,
  prefetch,
  prefetchOrNotFound,
} from "@/lib/query.server";
import { MentorProfile } from "@/app/admin/mentors/[id]/MentorProfile";

type Props = { params: Promise<{ id: string }> };

/** The instructor, or the not-found page for an id that isn't one. */
async function loadInstructor(id: string) {
  const instructor = await prefetchOrNotFound(adminQueries.user(id));
  if (instructor && instructor.role !== "INSTRUCTOR") notFound();
  return instructor;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const instructor = await loadInstructor((await params).id);
  return { title: instructor?.name ?? "Instructor" };
}

export default async function InstructorProfilePage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={<MentorProfile id={id} role="INSTRUCTOR" loading />}>
      <LoadedInstructorProfile id={id} />
    </Suspense>
  );
}

async function LoadedInstructorProfile({ id }: { id: string }) {
  const instructor = await loadInstructor(id);
  // The Overview and Students tabs both list the instructor's students.
  if (instructor) {
    await Promise.all(instructorStudentQueries(instructor).map(prefetch));
  }

  return (
    <HydrationBoundary state={dehydrateServerQueries()}>
      <MentorProfile id={id} role="INSTRUCTOR" />
    </HydrationBoundary>
  );
}
