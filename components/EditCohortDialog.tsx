"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CohortFormFields,
  CohortStatusSelect,
  ErrorNote,
  toDateInputValue,
  validateCohortForm,
  type CohortFormErrors,
  type CohortFormValues,
} from "@/components/CohortFormFields";
import {
  adminKeys,
  adminQueries,
  getCohortErrorMessage,
  updateCohort,
  type Cohort,
  type CohortStatus,
  type UpdateCohortInput,
} from "@/lib/admin";
import { ApiError } from "@/lib/api";

function getLoadErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status >= 500) {
    return "We couldn't load this cohort. Please try again.";
  }
  return getCohortErrorMessage(error);
}

export function EditCohortDialog({
  cohortId,
  cohortName,
}: {
  cohortId: string;
  cohortName: string;
}) {
  const [open, setOpen] = React.useState(false);

  const cohortQuery = useQuery({
    ...adminQueries.cohort(cohortId),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label={`Edit ${cohortName}`}
        onClick={() => setOpen(true)}
        className="text-neutral-400 hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      <DialogContent className="w-130">
        <DialogHeader>
          <DialogTitle>Edit cohort</DialogTitle>
          <DialogDescription>
            Update the cohort&apos;s details or change its status
          </DialogDescription>
        </DialogHeader>

        {cohortQuery.isPending && <FormSkeleton />}

        {cohortQuery.isError && (
          <ErrorNote>{getLoadErrorMessage(cohortQuery.error)}</ErrorNote>
        )}

        {cohortQuery.data && (
          <EditCohortForm
            key={cohortQuery.data.updatedAt}
            cohort={cohortQuery.data}
            onDone={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditCohortForm({
  cohort,
  onDone,
}: {
  cohort: Cohort;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();

  const initialValues: CohortFormValues = {
    name: cohort.name,
    year: cohort.year,
    startDate: toDateInputValue(cohort.startDate),
    endDate: toDateInputValue(cohort.endDate),
  };

  const [values, setValues] = React.useState(initialValues);
  const [status, setStatus] = React.useState<CohortStatus>(cohort.status);
  const [errors, setErrors] = React.useState<CohortFormErrors>({});

  const updateCohortMutation = useMutation({
    mutationFn: (input: UpdateCohortInput) => updateCohort(cohort.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.allCohorts() });
      onDone();
    },
  });

  const changes: UpdateCohortInput = {};
  if (values.name.trim() !== initialValues.name) {
    changes.name = values.name.trim();
  }
  if (values.year.trim() !== initialValues.year) {
    changes.year = values.year.trim();
  }
  if (values.startDate !== initialValues.startDate) {
    changes.startDate = values.startDate;
  }
  if (values.endDate !== initialValues.endDate) {
    changes.endDate = values.endDate;
  }
  if (status !== cohort.status) {
    changes.status = status;
  }
  const hasChanges = Object.keys(changes).length > 0;

  function handleChange(field: keyof CohortFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSave() {
    const fieldErrors = validateCohortForm(values);
    if (fieldErrors) {
      setErrors(fieldErrors);
      return;
    }
    updateCohortMutation.mutate(changes);
  }

  return (
    <>
      <div className="mt-6 flex flex-col gap-6">
        <CohortFormFields
          values={values}
          errors={errors}
          onChange={handleChange}
        />
        <CohortStatusSelect value={status} onChange={setStatus} />
      </div>

      {updateCohortMutation.error && (
        <ErrorNote>
          {getCohortErrorMessage(updateCohortMutation.error)}
        </ErrorNote>
      )}

      <DialogFooter className="sm:justify-end">
        <Button
          variant="secondary"
          size="medium"
          disabled={updateCohortMutation.isPending}
          onClick={onDone}
        >
          Cancel
        </Button>
        <Button
          size="medium"
          disabled={!hasChanges || updateCohortMutation.isPending}
          onClick={handleSave}
        >
          {updateCohortMutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </>
  );
}

function FormSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
    </div>
  );
}
