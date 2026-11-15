"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/ui/select";
import {
  learnerCounts,
  learningSpaceTypes,
  type MoreInfoAnswer,
  type MoreInfoApplication,
} from "@/lib/sign-up";

export type MoreInfoValues = Omit<MoreInfoAnswer, "token">;

/* The API's limit for an answer. */
const responseLimit = 2000;

const inputClass = "font-work text-sm";

function initialValues(application: MoreInfoApplication): MoreInfoValues {
  return {
    response: "",
    fullName: application.fullName,
    academyName: application.academyName,
    /* The field shows the address without its `https://`. */
    website: (application.website ?? "").replace(/^https?:\/\//, ""),
    learningSpaceType: application.learningSpaceType,
    learnerCount: application.estimatedLearners,
  };
}

/* The platform admin's question, a place to answer it, and the application's
   details in case the answer is a correction to one of them. */
export function MoreInfoForm({
  application,
  isSubmitting,
  error,
  validate,
  onSubmit,
}: {
  application: MoreInfoApplication;
  isSubmitting: boolean;
  /* Why the last attempt to send the answer failed. */
  error: string | null;
  /* Returns what's wrong with the values, or null. */
  validate: (values: MoreInfoValues) => string | null;
  onSubmit: (values: MoreInfoValues) => void;
}): React.JSX.Element {
  const [values, setValues] = React.useState(() => initialValues(application));
  const [problem, setProblem] = React.useState<string | null>(null);

  const set = (patch: Partial<MoreInfoValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setProblem(null);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = validate(values);
    setProblem(invalid);
    if (invalid) return;
    onSubmit({
      ...values,
      response: values.response.trim(),
      fullName: values.fullName.trim(),
      academyName: values.academyName.trim(),
      website: values.website.trim(),
    });
  };

  const canSubmit =
    values.response.trim() && values.fullName.trim() && values.academyName.trim();

  return (
    <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-4">
      <div className="rounded-xl border border-brand-100 bg-surface-brand p-4">
        <p className="font-work text-xs text-text-secondary">Our question</p>
        <p className="mt-1 font-work text-sm break-words whitespace-pre-wrap text-text-primary">
          {application.infoRequest?.message}
        </p>
      </div>

      <FormField label="Your answer">
        <textarea
          aria-label="Your answer"
          value={values.response}
          maxLength={responseLimit}
          onChange={(event) => set({ response: event.target.value })}
          className="min-h-28 w-full resize-y rounded-lg border border-neutral-200 p-3 font-work text-sm text-text-primary outline-none focus:border-brand-primary"
        />
      </FormField>

      <p className="mt-2 font-work text-sm text-text-secondary">
        Your application for {application.email}. Change anything that needs
        correcting.
      </p>
      <FormField label="Full Name">
        <Input
          size="medium"
          leadingIcon={null}
          aria-label="Full Name"
          className={inputClass}
          autoComplete="name"
          value={values.fullName}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            set({ fullName: event.target.value })
          }
        />
      </FormField>
      <FormField label="Academy name">
        <Input
          size="medium"
          leadingIcon={null}
          aria-label="Academy name"
          className={inputClass}
          autoComplete="organization"
          value={values.academyName}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            set({ academyName: event.target.value })
          }
        />
      </FormField>
      <FormField label="Website">
        <Input
          type="website"
          size="medium"
          aria-label="Website"
          placeholder="youracademy.com"
          className="font-work"
          value={values.website}
          onChange={(event) => set({ website: event.target.value })}
        />
      </FormField>
      <FormField label="What best describes your learning space?">
        <SelectInput
          aria-label="Learning space type"
          value={values.learningSpaceType}
          onChange={(learningSpaceType) => set({ learningSpaceType })}
          options={[...learningSpaceTypes]}
          className="h-11 px-3 font-work"
        />
      </FormField>
      <FormField label="Estimated number of learners">
        <SelectInput
          aria-label="Estimated number of learners"
          value={values.learnerCount}
          onChange={(learnerCount) => set({ learnerCount })}
          options={[...learnerCounts]}
          className="h-11 px-3 font-work"
        />
      </FormField>

      {(problem ?? error) && (
        <p role="alert" className="font-work text-[13px]/[18px] text-text-error">
          {problem ?? error}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={!canSubmit || isSubmitting}
        className="mt-4 w-full cursor-pointer rounded-full text-base"
      >
        {isSubmitting ? "Sending…" : "Send answer"}
      </Button>
    </form>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span aria-hidden className="text-sm leading-5 text-text-primary">
        {label}
      </span>
      {children}
    </div>
  );
}
