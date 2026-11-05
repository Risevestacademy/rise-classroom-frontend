import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";

import { adminQueries } from "@/lib/admin";
import {
  dehydrateServerQueries,
  prefetchOrNotFound,
} from "@/lib/query.server";
import { StudentProfile } from "./StudentProfile";

type Props = { params: Promise<{ id: string }> };

/** The student, or the not-found page for an id that isn't one. */
async function loadStudent(id: string) {
  const student = await prefetchOrNotFound(adminQueries.user(id));
  if (student && student.role !== "STUDENT") notFound();
  return student;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const student = await loadStudent((await params).id);
  return { title: student?.name ?? "Student" };
}

export default async function StudentProfilePage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={<StudentProfile id={id} loading />}>
      <LoadedStudentProfile id={id} />
    </Suspense>
  );
}

async function LoadedStudentProfile({ id }: { id: string }) {
  await loadStudent(id);

  return (
    <HydrationBoundary state={dehydrateServerQueries()}>
      <StudentProfile id={id} />
    </HydrationBoundary>
  );
}
