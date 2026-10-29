"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { ModuleForm } from "@/features/curriculum/components/ModuleForm";
import { ApiError } from "@/lib/api";
import { useCurriculumScope } from "@/features/curriculum/scope";
import type { SaveModuleInput } from "@/features/curriculum/types";

export function NewModuleScreen({ id }: { id: string }) {
  const { api, paths, TopNav, breadcrumbRoot } = useCurriculumScope();
  const router = useRouter();
  const queryClient = useQueryClient();
  const backHref = paths.detail(id, { tab: "modules" });
  const curriculumQuery = useQuery(api.queries.detail(id));
  const modulesQuery = useQuery(api.queries.modules(id));

  const createMutation = useMutation({
    mutationFn: (input: SaveModuleInput) => api.createModule(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: api.keys.modules(id) });
      router.push(backHref);
    },
  });

  if (
    curriculumQuery.error instanceof ApiError &&
    curriculumQuery.error.status === 404
  ) {
    notFound();
  }

  const curriculum = curriculumQuery.data;
  const existingCount = modulesQuery.data?.length ?? 0;

  return (
    <>
      <TopNav
        breadcrumb={[
          ...breadcrumbRoot,
          { label: curriculum?.title ?? "…", href: paths.detail(id) },
          { label: "Add Module", href: paths.newModule(id) },
        ]}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Modules
        </Link>

        {curriculum && modulesQuery.data && (
          <ModuleForm
            heading="Add Module"
            curriculum={curriculum}
            moduleTitle={`Module ${existingCount + 1}`}
            moduleCaption={`Added after the ${existingCount} existing module${existingCount === 1 ? "" : "s"}.`}
            submitLabel="Create Module"
            pendingLabel="Creating…"
            isPending={createMutation.isPending}
            errorMessage={createMutation.error?.message}
            cancelHref={backHref}
            onSubmit={(input) => createMutation.mutate(input)}
          />
        )}
      </main>
    </>
  );
}
