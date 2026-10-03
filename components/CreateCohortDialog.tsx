"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Layers, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  ErrorNote,
  emptyCohortForm,
  formatCohortDate,
  validateCohortForm,
  type CohortFormErrors,
  type CohortFormValues,
} from "@/components/CohortFormFields";
import {
  adminKeys,
  createCohort,
  getCohortErrorMessage,
  type CreateCohortInput,
} from "@/lib/admin";

type Step = "basics" | "review" | "success";

export function CreateCohortDialog() {
  const queryClient = useQueryClient();

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("basics");
  const [values, setValues] = React.useState<CohortFormValues>(emptyCohortForm);
  const [errors, setErrors] = React.useState<CohortFormErrors>({});

  const createCohortMutation = useMutation({
    mutationFn: (input: CreateCohortInput) => createCohort(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.allCohorts() });
      setStep("success");
    },
  });

  function reset() {
    setStep("basics");
    setValues(emptyCohortForm);
    setErrors({});
    createCohortMutation.reset();
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function handleChange(field: keyof CohortFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleNext() {
    const fieldErrors = validateCohortForm(values);
    if (fieldErrors) {
      setErrors(fieldErrors);
      return;
    }
    setStep("review");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create cohort
      </Button>

      <DialogContent className="w-[520px]">
        {step === "basics" && (
          <>
            <DialogHeader>
              <DialogTitle>Basic Information</DialogTitle>
              <DialogDescription>
                Name the cohort and set when it runs
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6">
              <CohortFormFields
                values={values}
                errors={errors}
                onChange={handleChange}
              />
            </div>

            <DialogFooter className="sm:justify-end">
              <Button
                variant="secondary"
                size="medium"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button size="medium" onClick={handleNext}>
                Next
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "review" && (
          <ReviewStep
            values={values}
            isSending={createCohortMutation.isPending}
            error={
              createCohortMutation.error
                ? getCohortErrorMessage(createCohortMutation.error)
                : null
            }
            onBack={() => {
              createCohortMutation.reset();
              setStep("basics");
            }}
            onCreate={() =>
              createCohortMutation.mutate({
                name: values.name.trim(),
                year: values.year.trim(),
                startDate: values.startDate,
                endDate: values.endDate,
              })
            }
          />
        )}

        {step === "success" && (
          <SuccessStep
            name={values.name.trim()}
            onCreateAnother={reset}
            onViewCohorts={() => handleOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewStep({
  values,
  isSending,
  error,
  onBack,
  onCreate,
}: {
  values: CohortFormValues;
  isSending: boolean;
  error: string | null;
  onBack: () => void;
  onCreate: () => void;
}) {
  const rows = [
    { label: "Year", value: values.year },
    { label: "Start date", value: formatCohortDate(values.startDate) },
    { label: "End date", value: formatCohortDate(values.endDate) },
    { label: "Status", value: "Ongoing" },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Review cohort</DialogTitle>
        <DialogDescription>
          Please review your cohort details before creating it
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 rounded-xl border border-neutral-300 p-5">
        <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <Layers className="h-5 w-5" />
          </span>
          <p className="truncate font-semibold text-neutral-900">
            {values.name.trim()}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-neutral-500">{row.label}:</span>
              <span className="font-medium text-neutral-900">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        New cohorts start as ongoing, so you can invite students and instructors
        right away.
      </p>

      {error && <ErrorNote>{error}</ErrorNote>}

      <DialogFooter className="sm:justify-end">
        <Button
          variant="secondary"
          size="medium"
          disabled={isSending}
          onClick={onBack}
        >
          Back
        </Button>
        <Button size="medium" disabled={isSending} onClick={onCreate}>
          {isSending ? "Creating…" : "Create cohort"}
        </Button>
      </DialogFooter>
    </>
  );
}

function SuccessStep({
  name,
  onCreateAnother,
  onViewCohorts,
}: {
  name: string;
  onCreateAnother: () => void;
  onViewCohorts: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-semantic-surface-success-badge">
        <CheckCircle2 className="h-10 w-10 text-semantic-text-success" />
      </span>
      <h2 className="mt-6 text-xl font-bold text-neutral-900">
        Cohort created successfully
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        {name} has been added to your program. You can now invite students and
        instructors to it.
      </p>

      <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center">
        <Button
          variant="secondary"
          size="medium"
          onClick={onCreateAnother}
          className="w-full sm:w-auto"
        >
          Create another cohort
        </Button>
        <Button
          size="medium"
          onClick={onViewCohorts}
          className="w-full sm:w-auto"
        >
          View cohorts
        </Button>
      </div>
    </div>
  );
}
