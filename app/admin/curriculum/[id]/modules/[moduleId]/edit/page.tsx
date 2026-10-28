"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { AdminTopNav } from "@/components/AdminTopNav";
import { ModuleForm } from "@/components/curriculum/ModuleForm";
import { ApiError } from "@/lib/api";
import { curriculumKeys, curriculumQueries, updateModule } from "@/lib/curriculum.api";
import type { SaveModuleInput } from "@/lib/curriculum.types";

export default function EditModulePage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const { id, moduleId } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const curriculumQuery = useQuery(curriculumQueries.detail(id));
  const modulesQuery = useQuery(curriculumQueries.modules(id));
  const moduleQuery = useQuery(curriculumQueries.module(moduleId));

  const updateMutation = useMutation({
    mutationFn: (input: SaveModuleInput) => updateModule(moduleId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.modules(id) });
      queryClient.invalidateQueries({
        queryKey: curriculumKeys.module(moduleId),
      });
      router.push(`/admin/curriculum/${id}/modules/${moduleId}`);
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
  const detailHref = `/admin/curriculum/${id}/modules/${moduleId}`;

  return (
    <>
      <AdminTopNav
        breadcrumb={[
          "Academy",
          { label: "Curriculum", href: "/admin/curriculum" },
          { label: curriculum?.title ?? "…", href: `/admin/curriculum/${id}` },
          {
            label: `Module ${position || "…"}`,
            href: `/admin/curriculum/${id}/modules/${moduleId}`,
          },
          {
            label: "Edit",
            href: `/admin/curriculum/${id}/modules/${moduleId}/edit`,
          },
        ]}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Link
          href={`/admin/curriculum/${id}?tab=modules`}
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
