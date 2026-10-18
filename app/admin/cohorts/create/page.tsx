"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { InformationCircle } from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import { CohortForm } from "@/components/cohorts/CohortForm";
import { getCohortErrorMessage } from "@/lib/admin";
import { cohortKeys, createCohortFromForm } from "@/lib/cohorts";

const statusOptions = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
] as const;

export default function CreateCohortPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: createCohortFromForm,
    onSuccess: (cohort) => {
      queryClient.invalidateQueries({ queryKey: cohortKeys.all() });
      router.push(`/admin/cohorts?created=${encodeURIComponent(cohort.name)}`);
    },
  });

  return (
    <>
      <AdminTopNav breadcrumb={[]} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <CohortForm
          title="Create cohort"
          subtitle="Set up a new cohort, assign tracks and invite students to join"
          initialValues={{
            name: "Cohort 2026",
            description: "",
            startDate: "",
            endDate: "",
            status: "upcoming",
          }}
          statusOptions={[...statusOptions]}
          statusHint="Choose whether the cohort is upcoming, active or completed"
          submitLabel="Create cohort"
          pendingLabel="Creating…"
          isPending={createMutation.isPending}
          error={
            createMutation.isError
              ? getCohortErrorMessage(createMutation.error)
              : undefined
          }
          onSubmit={(values) => createMutation.mutate(values)}
          aside={
            <aside className="rounded-xl bg-brand-50 p-5 shadow-[0_2px_4px_rgb(17_24_25/0.06)] xl:min-h-[148px] xl:w-[420px]">
              <p className="flex items-center gap-3 text-sm font-medium text-text-primary">
                <InformationCircle className="size-5 shrink-0" />
                What happens next?
              </p>
              <div className="mt-2.5 flex flex-col gap-2 pl-8 font-work text-[13px] leading-[18px] text-text-secondary">
                <p>
                  You can add tracks and add or invite students after creation.
                </p>
                <p>Instructors and mentors can be assigned later.</p>
              </div>
            </aside>
          }
        />
      </main>
    </>
  );
}
