"use client";

import * as React from "react";
import { notFound, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AdminTopNav } from "@/components/AdminTopNav";
import { CohortForm } from "@/components/cohorts/CohortForm";
import {
  adminQueries,
  getCohortErrorMessage,
  getProgramOptionsErrorMessage,
} from "@/lib/admin";
import { ApiError } from "@/lib/api";
import {
  cohortFormValues,
  cohortKeys,
  updateCohortFromForm,
  type CreateCohortFormInput,
} from "@/lib/cohorts";

const statusOptions = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "terminated", label: "Terminated" },
] as const;

export default function EditCohortPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const cohortQuery = useQuery(adminQueries.cohort(id));
  const cohort = cohortQuery.data;

  const updateMutation = useMutation({
    mutationFn: (input: CreateCohortFormInput) =>
      updateCohortFromForm(id, input),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: cohortKeys.all() });
      router.push(`/admin/cohorts?updated=${encodeURIComponent(data.name)}`);
    },
  });

  if (
    cohortQuery.error instanceof ApiError &&
    (cohortQuery.error.status === 404 || cohortQuery.error.status === 400)
  ) {
    notFound();
  }

  return (
    <>
      <AdminTopNav breadcrumb={[]} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        {cohortQuery.isError && (
          <p className="font-work text-sm text-text-error">
            {getProgramOptionsErrorMessage(cohortQuery.error)}
          </p>
        )}
        {cohort && (
          <CohortForm
            title="Edit cohort"
            subtitle="Update the cohort's name, dates and status"
            initialValues={cohortFormValues(cohort)}
            statusOptions={[...statusOptions]}
            statusHint="Upcoming or active is decided by the start date"
            submitLabel="Save changes"
            pendingLabel="Saving…"
            isPending={updateMutation.isPending}
            error={
              updateMutation.isError
                ? getCohortErrorMessage(updateMutation.error)
                : undefined
            }
            onSubmit={(values) => updateMutation.mutate(values)}
          />
        )}
      </main>
    </>
  );
}
