"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { ModuleForm } from "@/features/curriculum/components/ModuleForm";
import { ApiError } from "@/lib/api";
import { useCurriculumScope } from "@/features/curriculum/scope";
import type { SaveModuleInput } from "@/features/curriculum/types";

export function EditModuleScreen({
  id,
  moduleId,
}: {
  id: string;
  moduleId: string;
}) {
  const { api, paths, TopNav, breadcrumbRoot } = useCurriculumScope();
  const router = useRouter();
  const queryClient = useQueryClient();
  const curriculumQuery = useQuery(api.queries.detail(id));
  const modulesQuery = useQuery(api.queries.modules(id));
  const moduleQuery = useQuery(api.queries.module(moduleId));

  const updateMutation = useMutation({
    mutationFn: (input: SaveModuleInput) => api.updateModule(moduleId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: api.keys.modules(id) });
      queryClient.invalidateQueries({
        queryKey: api.keys.module(moduleId),
      });
      router.push(paths.module(id, moduleId));
    },
  });

  const isNotFound = [curriculumQuery.error, moduleQuery.error].some(
    (error) => error instanceof ApiError && error.status === 404,
  );
  if (isNotFound) notFound();

  const curriculum = curriculumQuery.data;
  const curriculumModule = moduleQuery.data;
  const modules = modulesQuery.data ?? [];
  const position = modules.findIndex((m) => m.id === moduleId) + 1;
  const detailHref = paths.module(id, moduleId);

  return (
    <>
      <TopNav
        breadcrumb={[
          ...breadcrumbRoot,
          { label: curriculum?.title ?? "…", href: paths.detail(id) },
          { label: `Module ${position || "…"}`, href: detailHref },
          { label: "Edit", href: paths.editModule(id, moduleId) },
        ]}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Link
          href={paths.detail(id, { tab: "modules" })}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Modules
        </Link>

        {curriculum && curriculumModule && modulesQuery.data && (
          <ModuleForm
            heading="Edit Module"
            curriculum={curriculum}
            moduleTitle={`Module ${position}`}
            moduleCaption={`Position ${position} of ${modules.length} modules.`}
            initialModule={curriculumModule}
            submitLabel="Save changes"
            pendingLabel="Saving…"
            isPending={updateMutation.isPending}
            errorMessage={updateMutation.error?.message}
            cancelHref={detailHref}
            onSubmit={(input) => updateMutation.mutate(input)}
          />
        )}
      </main>
    </>
  );
}
