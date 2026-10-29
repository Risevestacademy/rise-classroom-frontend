"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { useCurriculumScope } from "@/features/curriculum/scope";

/**
 * Instructors teach one curriculum per track, so the sidebar's "Curriculum"
 * link opens it directly instead of a list. PENDING-DESIGN: there's no picker
 * yet for an instructor assigned to more than one.
 */
export default function InstructorCurriculumPage() {
  const router = useRouter();
  const { api, paths, TopNav, breadcrumbRoot } = useCurriculumScope();
  const curriculaQuery = useQuery(api.queries.list());
  const first = curriculaQuery.data?.[0];

  React.useEffect(() => {
    if (first) router.replace(paths.detail(first.id));
  }, [first, router, paths]);

  return (
    <>
      <TopNav breadcrumb={breadcrumbRoot} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {curriculaQuery.isError && (
          <p className="py-10 text-center text-sm text-text-error">
            {curriculaQuery.error.message}
          </p>
        )}
        {curriculaQuery.isSuccess && !first && (
          <EmptyState
            icon={BookOpen}
            title="No curriculum yet"
            description="You'll see your curriculum here once an admin assigns you to a track that has one."
          />
        )}
      </main>
    </>
  );
}
