"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Delete02 } from "@/assets/icons";
import { CohortStatusDialog } from "@/components/cohorts/CohortActionsMenu";
import { CohortForm } from "@/components/cohorts/CohortForm";
import {
  adminQueries,
  getCohortErrorMessage,
  getProgramOptionsErrorMessage,
} from "@/lib/admin";
import {
  cohortFormValues,
  cohortKeys,
  updateCohortFromForm,
  type CreateCohortFormInput,
} from "@/lib/cohorts";

type Toast = { title: string; message: string };

const statusOptions = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "terminated", label: "Terminated" },
] as const;

/**
 * The cohort's Settings tab: its details stay read-only until "Edit
 * settings" (in the tab row) turns `editing` on.
 */
export function CohortSettings({
  cohortId,
  editing,
  onEditingChange,
  onToast,
}: {
  cohortId: string;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onToast: (toast: Toast) => void;
}) {
  const queryClient = useQueryClient();
  const cohortQuery = useQuery(adminQueries.cohort(cohortId));
  const cohort = cohortQuery.data;
  const [terminating, setTerminating] = React.useState(false);

  const updateMutation = useMutation({
    mutationFn: (input: CreateCohortFormInput) =>
      updateCohortFromForm(cohortId, input),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: cohortKeys.all() });
      onEditingChange(false);
      onToast({
        title: "Cohort updated",
        message: `“${data.name}” has been successfully updated`,
      });
    },
  });

  if (cohortQuery.isError) {
    return (
      <p className="mt-5 font-work text-sm text-text-error">
        {getProgramOptionsErrorMessage(cohortQuery.error)}
      </p>
    );
  }
  if (!cohort) return null;

  const values = cohortFormValues(cohort);
  const terminated = values.status === "terminated";

  return (
    <>
      <CohortForm
        // A new key resets the fields: leaving edit mode drops unsaved
        // changes, and fresh data shows the saved values.
        key={editing ? "editing" : `saved-${cohortQuery.dataUpdatedAt}`}
        initialValues={values}
        statusOptions={[...statusOptions]}
        statusHint="Choose whether the cohort is upcoming, active or completed"
        submitLabel="Save changes"
        pendingLabel="Saving…"
        isPending={updateMutation.isPending}
        error={
          updateMutation.isError
            ? getCohortErrorMessage(updateMutation.error)
            : undefined
        }
        readOnly={!editing}
        inlineSubmit
        className="mt-5 xl:gap-6"
        onSubmit={(input) => updateMutation.mutate(input)}
        aside={
          <aside className="rounded-xl bg-surface-error-badge p-5 shadow-[0_2px_4px_rgb(17_24_25/0.06)] xl:w-[418px] xl:shrink-0">
            <p className="flex items-center gap-3 text-sm font-medium text-text-primary">
              <TerminateIcon />
              Terminate Cohort
            </p>
            <div className="mt-2.5 flex flex-col gap-3 pl-8 font-work text-[13px] leading-[18px]">
              {/* Copy kept from the design; the API ends the cohort rather
                  than deleting it. */}
              <p className="text-text-secondary">
                Permanently delete this cohort and all its data.
              </p>
              <p className="text-text-error">
                This action cannot be undone. All cohort dta, including
                students, progress and activity will be permanently deleted.
              </p>
            </div>
            <button
              type="button"
              disabled={terminated}
              onClick={() => setTerminating(true)}
              className="mt-3 ml-8 inline-flex h-10 items-center gap-2 rounded-lg bg-interactive-destructive-default px-4 text-sm font-medium text-white hover:bg-interactive-destructive-hover disabled:bg-interactive-destructive-disabled"
            >
              <Delete02 className="size-5" />
              {terminated ? "Cohort terminated" : "Terminate cohort"}
            </button>
          </aside>
        }
      />

      <CohortStatusDialog
        cohort={cohort}
        action={terminating ? "terminate" : null}
        onClose={() => setTerminating(false)}
        onStatusChanged={onToast}
      />
    </>
  );
}

function TerminateIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5 shrink-0" aria-hidden>
      <circle cx="10" cy="10" r="9" className="fill-text-error" />
      <path
        d="M10 9v5"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="10" cy="6.3" r="1" fill="white" />
    </svg>
  );
}
