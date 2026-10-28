"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { AdminTopNav } from "@/components/AdminTopNav";
import { ModuleForm } from "@/components/curriculum/ModuleForm";
import { ApiError } from "@/lib/api";
import { createModule, curriculumKeys, curriculumQueries } from "@/lib/curriculum.api";
import type { SaveModuleInput } from "@/lib/curriculum.types";

export default function NewModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const curriculumQuery = useQuery(curriculumQueries.detail(id));
  const modulesQuery = useQuery(curriculumQueries.modules(id));

  const createMutation = useMutation({
    mutationFn: (input: SaveModuleInput) => createModule(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.modules(id) });
      router.push(`/admin/curriculum/${id}?tab=modules`);
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
  const backHref = `/admin/curriculum/${id}?tab=modules`;

  return (
    <>
      <AdminTopNav
        breadcrumb={[
          "Academy",
          { label: "Curriculum", href: "/admin/curriculum" },
          { label: curriculum?.title ?? "…", href: `/admin/curriculum/${id}` },
          { label: "Add Module", href: `/admin/curriculum/${id}/modules/new` },
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
