"use client";

import * as React from "react";
import Link from "next/link";

import { ArrowDown01, ArrowLeft01, Calendar03 } from "@/assets/icons";
import { cn } from "@/lib/utils";
import type { CohortStatus } from "@/app/admin/cohorts/cohort-data";

export type CohortFormValues = {
  name: string;
  description: string;
  /** DD/MM/YYYY, as typed. */
  startDate: string;
  /** DD/MM/YYYY, as typed. */
  endDate: string;
  status: CohortStatus;
};

export type CohortFormSubmit = {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: CohortStatus;
};

const inputClass =
  "h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 font-work text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary read-only:bg-neutral-100 read-only:focus:border-neutral-200 disabled:bg-neutral-100 disabled:opacity-100";

/** Parses DD/MM/YYYY; returns undefined for anything else. */
function parseDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return undefined;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 ? date : undefined;
}

function durationLabel(start: string, end: string) {
  const from = parseDate(start);
  const to = parseDate(end);
  // The design shows a sample duration before any dates are entered.
  if (!from || !to || to < from) return "12 months";
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    (to.getDate() >= from.getDate() ? 1 : 0);
  return `${months} month${months === 1 ? "" : "s"}`;
}

/**
 * The create cohort screen and the cohort Settings tab share this layout.
 * Without a title the page heading and back link are left out, and
 * `inlineSubmit` puts a single submit button inside the card instead of
 * Cancel and submit below it.
 */
export function CohortForm({
  title,
  subtitle,
  initialValues,
  statusOptions,
  statusHint,
  submitLabel,
  pendingLabel,
  isPending,
  error,
  aside,
  readOnly = false,
  inlineSubmit = false,
  className,
  onSubmit,
}: {
  title?: string;
  subtitle?: string;
  initialValues: CohortFormValues;
  statusOptions: { value: CohortStatus; label: string }[];
  statusHint: string;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  error?: string;
  aside?: React.ReactNode;
  /** Shows the values without letting them be changed. */
  readOnly?: boolean;
  inlineSubmit?: boolean;
  className?: string;
  onSubmit: (values: CohortFormSubmit) => void;
}) {
  const [name, setName] = React.useState(initialValues.name);
  const [description, setDescription] = React.useState(
    initialValues.description,
  );
  const [startDate, setStartDate] = React.useState(initialValues.startDate);
  const [endDate, setEndDate] = React.useState(initialValues.endDate);
  const [status, setStatus] = React.useState(initialValues.status);

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const canSubmit =
    name.trim().length > 0 &&
    start !== undefined &&
    end !== undefined &&
    !readOnly &&
    !isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!start || !end || !canSubmit) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      startDate: start,
      endDate: end,
      status,
    });
  }

  const submitButton = (
    <button
      type="submit"
      disabled={!canSubmit}
      className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-medium text-white hover:bg-interactive-primary-hover disabled:bg-brand-200 disabled:text-[#a8b2b3]"
    >
      {isPending ? pendingLabel : submitLabel}
    </button>
  );

  return (
    <>
      {title && (
        <>
          <Link
            href="/admin/cohorts"
            className="inline-flex items-center gap-2 font-work text-sm text-brand-primary"
          >
            <ArrowLeft01 className="size-4" />
            Back to Cohort
          </Link>

          <h1 className="mt-5 text-2xl font-semibold text-text-primary">
            {title}
          </h1>
          <p className="mt-1 font-work text-sm text-text-secondary">
            {subtitle}
          </p>
        </>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn(
          "mt-6 flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-[22px]",
          className,
        )}
      >
        <div className="flex min-w-0 flex-col xl:w-[694px] xl:shrink-0">
          <section
            className={cn(
              "rounded-xl bg-white p-6 shadow-[0_2px_4px_rgb(17_24_25/0.06)]",
              !inlineSubmit && "pb-7",
            )}
          >
            <h2 className="text-lg leading-6 font-semibold text-text-primary">
              Basic Information
            </h2>

            <div className="mt-[18px] flex flex-col gap-[18px]">
              <Field label="Cohort name" htmlFor="cohort-name" required>
                <input
                  id="cohort-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  readOnly={readOnly}
                  className={inputClass}
                />
              </Field>

              <Field
                label="Description"
                htmlFor="cohort-description"
                hint="(Optional)"
              >
                <textarea
                  id="cohort-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  readOnly={readOnly}
                  placeholder="Add description here"
                  className={cn(inputClass, "h-[100px] resize-none py-2.5")}
                />
              </Field>

              <div className="grid gap-[18px] sm:grid-cols-3 sm:gap-2">
                <Field label="Start date" htmlFor="cohort-start" required>
                  <DateInput
                    id="cohort-start"
                    value={startDate}
                    onChange={setStartDate}
                    readOnly={readOnly}
                  />
                </Field>
                <Field label="End date" htmlFor="cohort-end" required>
                  <DateInput
                    id="cohort-end"
                    value={endDate}
                    onChange={setEndDate}
                    readOnly={readOnly}
                  />
                </Field>
                <Field label="Duration" htmlFor="cohort-duration">
                  <output
                    id="cohort-duration"
                    className="flex h-11 items-center rounded-lg bg-neutral-100 px-3 font-work text-sm text-text-secondary"
                  >
                    {durationLabel(startDate, endDate)}
                  </output>
                </Field>
              </div>

              <Field label="Cohort status" htmlFor="cohort-status" required>
                <div className="relative">
                  <select
                    id="cohort-status"
                    value={status}
                    disabled={readOnly}
                    onChange={(event) =>
                      setStatus(event.target.value as CohortStatus)
                    }
                    className={cn(inputClass, "appearance-none pr-10")}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ArrowDown01 className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-text-primary" />
                </div>
                <p className="font-work text-xs text-text-secondary">
                  {statusHint}
                </p>
              </Field>
            </div>

            {inlineSubmit && (
              <div className="mt-5 flex justify-end">{submitButton}</div>
            )}
          </section>

          {error && (
            <p className="mt-4 font-work text-sm text-text-error">{error}</p>
          )}

          {!inlineSubmit && (
            <div className="mt-8 flex justify-end gap-3">
              <Link
                href="/admin/cohorts"
                className="inline-flex h-10 items-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-text-primary"
              >
                Cancel
              </Link>
              {submitButton}
            </div>
          )}
        </div>

        {aside}
      </form>
    </>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-text-primary"
      >
        {label}
        {required && <span className="ml-1 text-text-error">*</span>}
        {hint && (
          <span className="ml-1 text-xs font-normal text-text-secondary">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function DateInput({
  id,
  value,
  onChange,
  readOnly,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="relative">
      <Calendar03 className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-secondary" />
      <input
        id={id}
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        className={cn(inputClass, "pl-10")}
      />
    </div>
  );
}
