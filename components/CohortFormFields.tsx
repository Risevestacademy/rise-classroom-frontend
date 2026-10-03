"use client";

import * as React from "react";
import { z } from "zod";
import { AlertCircle, ChevronDown } from "lucide-react";

import { FormField } from "@/components/ui/field";
import type { CohortStatus } from "@/lib/admin";

export const cohortFormSchema = z
  .object({
    name: z.string().trim().min(1, "Cohort name is required."),
    year: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Enter a four-digit year, like 2026."),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string().min(1, "End date is required."),
  })
  .refine(
    (values) =>
      !values.startDate || !values.endDate || values.endDate > values.startDate,
    { message: "End date must be after the start date.", path: ["endDate"] },
  );

export type CohortFormValues = z.infer<typeof cohortFormSchema>;
export type CohortFormErrors = Partial<Record<keyof CohortFormValues, string>>;

export const emptyCohortForm: CohortFormValues = {
  name: "",
  year: "",
  startDate: "",
  endDate: "",
};

export const cohortStatusLabels: Record<CohortStatus, string> = {
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  TERMINATED: "Terminated",
};

export const cohortStatusBadge: Record<
  CohortStatus,
  "success" | "info" | "error"
> = {
  ONGOING: "success",
  COMPLETED: "info",
  TERMINATED: "error",
};

export function validateCohortForm(values: CohortFormValues) {
  const result = cohortFormSchema.safeParse(values);
  if (result.success) return null;

  const fieldErrors = result.error.flatten().fieldErrors;
  return {
    name: fieldErrors.name?.[0],
    year: fieldErrors.year?.[0],
    startDate: fieldErrors.startDate?.[0],
    endDate: fieldErrors.endDate?.[0],
  };
}

export function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

export function formatCohortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-4 flex items-start gap-2 rounded-lg border border-semantic-border-error bg-semantic-surface-error-badge px-4 py-3 text-sm text-semantic-text-error"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function CohortFormFields({
  values,
  errors,
  onChange,
}: {
  values: CohortFormValues;
  errors: CohortFormErrors;
  onChange: (field: keyof CohortFormValues, value: string) => void;
}) {
  function handleStartDateChange(value: string) {
    onChange("startDate", value);
    if (!values.year && value) onChange("year", value.slice(0, 4));
  }

  return (
    <div className="flex flex-col gap-6">
      <FormField
        label="Cohort name"
        required
        invalid={Boolean(errors.name)}
        error={errors.name}
        inputProps={{
          placeholder: "e.g Cohort 2026",
          value: values.name,
          onChange: (e) => onChange("name", e.target.value),
          leadingIcon: null,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Start date"
          required
          invalid={Boolean(errors.startDate)}
          error={errors.startDate}
          inputProps={{
            type: "date",
            value: values.startDate,
            onChange: (e) => handleStartDateChange(e.target.value),
          }}
        />
        <FormField
          label="End date"
          required
          invalid={Boolean(errors.endDate)}
          error={errors.endDate}
          inputProps={{
            type: "date",
            value: values.endDate,
            min: values.startDate || undefined,
            onChange: (e) => onChange("endDate", e.target.value),
          }}
        />
      </div>

      <FormField
        label="Year"
        required
        hint="The year this cohort belongs to. It fills in from the start date."
        invalid={Boolean(errors.year)}
        error={errors.year}
        inputProps={{
          inputMode: "numeric",
          maxLength: 4,
          placeholder: "e.g 2026",
          value: values.year,
          onChange: (e) => onChange("year", e.target.value),
          leadingIcon: null,
        }}
      />
    </div>
  );
}

export function CohortStatusSelect({
  value,
  onChange,
}: {
  value: CohortStatus;
  onChange: (value: CohortStatus) => void;
}) {
  const id = React.useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-900">
        Status
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as CohortStatus)}
          className="h-11 w-full appearance-none rounded-lg border border-neutral-300 bg-transparent px-3 pr-9 text-sm text-neutral-900 outline-none focus:border-primary-500"
        >
          {Object.entries(cohortStatusLabels).map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      </div>
      {value !== "ONGOING" && (
        <p className="text-xs text-neutral-500">
          Students and instructors can only be invited to ongoing cohorts.
        </p>
      )}
    </div>
  );
}
