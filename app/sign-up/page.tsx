"use client";

import { useState } from "react";
import Link from "next/link";
import { Field } from "@base-ui/react/field";
import { z } from "zod";

import { Logo } from "@/assets/logo";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectInput } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  learnerCounts,
  learningSpaceTypes,
  submitSignUpApplication,
  type LearnerCount,
  type LearningSpaceType,
} from "@/lib/sign-up";

const emailSchema = z.string().trim().email();

// The design's 44px pill: Label/Large text, and a lavender fill while disabled.
const buttonClass =
  "w-full cursor-pointer rounded-full text-base disabled:bg-interactive-primary-disabled disabled:text-text-disabled disabled:opacity-100";

const inputClass = "font-work text-sm";

export default function SignUpPage() {
  const [step, setStep] = useState<"you" | "space" | "submitted">("you");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const [academyName, setAcademyName] = useState("");
  const [website, setWebsite] = useState("");
  const [learningSpaceType, setLearningSpaceType] = useState<
    LearningSpaceType | ""
  >("");
  const [learnerCount, setLearnerCount] = useState<LearnerCount | "">("");
  const [submitting, setSubmitting] = useState(false);

  function handleContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailSchema.safeParse(email).success) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setStep("space");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!learningSpaceType || !learnerCount) return;

    setSubmitting(true);
    try {
      await submitSignUpApplication({
        fullName: fullName.trim(),
        email: email.trim(),
        academyName: academyName.trim(),
        website: website.trim(),
        learningSpaceType,
        learnerCount,
      });
      setStep("submitted");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "submitted") {
    return (
      <AuthShell panel="plain">
        <div className="flex flex-col items-center text-center">
          <SuccessMark />
          <h1 className="mt-4 text-2xl/8 font-semibold text-text-primary">
            Application submitted
          </h1>
          <p className="mt-1 max-w-[336px] font-work text-sm text-text-secondary">
            Thanks for your interest in Rise Classroom! We&apos;ll review your
            application and be in touch soon.
          </p>
          <Button
            variant="primary"
            size="lg"
            className={cn(buttonClass, "mt-11")}
            nativeButton={false}
            render={<Link href="/" />}
          >
            Back to homepage
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell panel="plain">
      <div>
        <div className="flex justify-center">
          <Logo variant="teal" size="lg" />
        </div>
        <StepBar current={step === "you" ? 1 : 2} />

        {step === "you" ? (
          <form onSubmit={handleContinue} noValidate>
            <FormIntro
              title="Let’s get to know you."
              subtitle="Tell us about yourself and your academy. We’ll review your request and help you get started."
            />
            <div className="mt-8 flex flex-col gap-4">
              <SignUpField label="Full Name" required>
                <Input
                  size="medium"
                  leadingIcon={null}
                  className={inputClass}
                  placeholder="Placeholder text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setFullName(event.target.value)
                  }
                />
              </SignUpField>
              <SignUpField
                label="Email address"
                required
                hint="We’ll use this email to contact you about your application."
                error={emailError}
              >
                <Input
                  type="email"
                  size="medium"
                  leadingIcon={null}
                  className={inputClass}
                  placeholder="rise@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(event.target.value);
                    setEmailError(null);
                  }}
                />
              </SignUpField>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!fullName.trim() || !email.trim()}
              className={cn(buttonClass, "mt-11")}
            >
              Continue
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <FormIntro
              title="Tell us about your learning space."
              subtitle="Tell us about your learning space before we set up your account."
            />
            <div className="mt-8 flex flex-col gap-4">
              <SignUpField label="Academy name" required>
                <Input
                  size="medium"
                  leadingIcon={null}
                  className={inputClass}
                  placeholder="e.g Bright Future Academy"
                  autoComplete="organization"
                  value={academyName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setAcademyName(event.target.value)
                  }
                />
              </SignUpField>
              <SignUpField label="Website">
                <Input
                  type="website"
                  size="medium"
                  aria-label="Website"
                  placeholder="youracademy.com"
                  className="font-work"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </SignUpField>
              <SignUpField label="What best describes your learning space?" required>
                <SelectInput
                  value={learningSpaceType}
                  onChange={setLearningSpaceType}
                  options={[...learningSpaceTypes]}
                  placeholder="Select type"
                  className="h-11 px-3 font-work"
                />
              </SignUpField>
              <SignUpField label="Estimated number of learners" required>
                <SelectInput
                  value={learnerCount}
                  onChange={setLearnerCount}
                  options={[...learnerCounts]}
                  placeholder="Select learner count"
                  className="h-11 px-3 font-work"
                />
              </SignUpField>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={
                !academyName.trim() ||
                !learningSpaceType ||
                !learnerCount ||
                submitting
              }
              className={cn(buttonClass, "mt-11")}
            >
              Submit application
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}

/** Two segments: the first fills on step 1, both on step 2. */
function StepBar({ current }: { current: 1 | 2 }) {
  return (
    <div
      role="progressbar"
      aria-label="Sign-up progress"
      aria-valuemin={1}
      aria-valuemax={2}
      aria-valuenow={current}
      className="mt-[68px] flex gap-2"
    >
      {[1, 2].map((segment) => (
        <span
          key={segment}
          className={cn(
            "h-1 flex-1 rounded-full",
            segment <= current ? "bg-border-focus" : "bg-border-strong",
          )}
        />
      ))}
    </div>
  );
}

function FormIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-[30px] flex flex-col gap-2">
      <h1 className="text-2xl/8 font-semibold text-text-primary">{title}</h1>
      <p className="font-work text-sm text-text-secondary">{subtitle}</p>
    </div>
  );
}

function SignUpField({
  label,
  required = false,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <Field.Root invalid={Boolean(error)} className="flex flex-col gap-1">
      <Label
        required={required}
        icon={false}
        className="leading-5 text-text-primary [&>span]:text-xs [&>span]:leading-4"
      >
        {label}
      </Label>
      {children}
      {error ? (
        <p className="font-work text-[13px]/[18px] text-text-error">{error}</p>
      ) : (
        hint && (
          <Field.Description className="py-0.5 font-work text-[13px]/[18px] text-text-secondary">
            {hint}
          </Field.Description>
        )
      )}
    </Field.Root>
  );
}

/** The 120px check from the design: a navy disc on a pale green halo. */
function SuccessMark() {
  return (
    <svg
      aria-hidden
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      className="shrink-0"
    >
      <circle cx="60" cy="60" r="60" className="fill-surface-success-badge" />
      <circle cx="60" cy="60" r="40" className="fill-brand-primary" />
      <path
        d="M74 51L55.4375 70L47 61.3636"
        strokeWidth="7.11"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-border-default"
      />
    </svg>
  );
}
