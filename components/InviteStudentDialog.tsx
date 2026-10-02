"use client";

import * as React from "react";
import Image from "next/image";
import { z } from "zod";
import {
  Plus,
  UserPlus,
  Upload,
  CloudUpload,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  CircleCheck,
  CircleAlert,
  Loader,
  FileText,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/field";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Student } from "@/app/admin/students/data";
import {
  getOnboardErrorMessage,
  getProgramOptionsErrorMessage,
  listCohorts,
  listTracks,
  onboardUser,
  type Cohort,
  type Track,
} from "@/lib/admin";

const maxFileSize = 10 * 1024 * 1024;
const defaultCohort = "Cohort 2026";

const inviteDetailsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please input valid email address."),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
});

type InviteDetails = z.infer<typeof inviteDetailsSchema>;
type InviteDetailsErrors = Partial<Record<keyof InviteDetails, string>>;

type ProgramOptions =
  | { status: "loading" }
  | { status: "ready"; cohorts: Cohort[]; tracks: Track[] }
  | { status: "error"; message: string };

const bulkPreview: Pick<Student, "name" | "email" | "track">[] = [
  { name: "Esther Howard", email: "esther.howard@rise.edu", track: "Design" },
  { name: "Albert Flores", email: "albert.flores@rise.edu", track: "Frontend" },
  { name: "Jenny Wilson", email: "jenny.wilson@rise.edu", track: "Backend" },
  {
    name: "Ronald Richards",
    email: "ronald.richards@rise.edu",
    track: "Mobile Engineering",
  },
  { name: "Savannah Nguyen", email: "savannah.n@rise.edu", track: "Design" },
  { name: "Kristin Watson", email: "kristin.w@rise.edu", track: "Frontend" },
];

type Step =
  | "choice"
  | "single-form"
  | "single-program"
  | "single-review"
  | "single-success"
  | "bulk-upload"
  | "bulk-review"
  | "bulk-confirm"
  | "bulk-success";

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; file: File; progress: number }
  | { status: "completed"; file: File }
  | { status: "failed"; file: File; reason: string };

const stepWidth: Record<Step, string> = {
  choice: "w-[648px]",
  "single-form": "w-[648px]",
  "single-program": "w-[648px]",
  "single-review": "w-[620px]",
  "single-success": "w-[560px]",
  "bulk-upload": "w-[648px]",
  "bulk-review": "w-[696px]",
  "bulk-confirm": "w-[620px]",
  "bulk-success": "w-[560px]",
};

function selectAllRows() {
  return bulkPreview.map(() => true);
}

function getCsvError(file: File) {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return "Only CSV files are supported";
  }
  if (file.size > maxFileSize) {
    return "File is larger than 10 MB";
  }
  return null;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function InviteStudentDialog({
  onInvited,
}: {
  onInvited: (students: Omit<Student, "id">[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("choice");

  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [detailsErrors, setDetailsErrors] = React.useState<InviteDetailsErrors>(
    {},
  );

  const [programOptions, setProgramOptions] = React.useState<ProgramOptions>({
    status: "loading",
  });
  const [cohortId, setCohortId] = React.useState("");
  const [trackId, setTrackId] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [emailSent, setEmailSent] = React.useState(true);

  const [upload, setUpload] = React.useState<UploadState>({ status: "idle" });
  const [selectedRows, setSelectedRows] =
    React.useState<boolean[]>(selectAllRows);

  const uploadTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stopUploadTimer = React.useCallback(() => {
    if (uploadTimer.current) clearInterval(uploadTimer.current);
    uploadTimer.current = null;
  }, []);

  React.useEffect(() => stopUploadTimer, [stopUploadTimer]);

  function reset() {
    stopUploadTimer();
    setStep("choice");
    setEmail("");
    setFirstName("");
    setLastName("");
    setDetailsErrors({});
    setCohortId("");
    setTrackId("");
    setSubmitting(false);
    setSubmitError(null);
    setEmailSent(true);
    setUpload({ status: "idle" });
    setSelectedRows(selectAllRows());
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function loadProgramOptions() {
    setProgramOptions({ status: "loading" });

    try {
      const [cohorts, tracks] = await Promise.all([
        listCohorts({ status: "ONGOING" }),
        listTracks({ status: "ACTIVE" }),
      ]);

      setProgramOptions({ status: "ready", cohorts, tracks });
      setCohortId((current) => current || cohorts[0]?.id || "");
      setTrackId((current) => current || tracks[0]?.id || "");
    } catch (error) {
      setProgramOptions({
        status: "error",
        message: getProgramOptionsErrorMessage(error),
      });
    }
  }

  function handleOpen() {
    setOpen(true);
    loadProgramOptions();
  }

  function handleDetailsNext() {
    const result = inviteDetailsSchema.safeParse({
      email,
      firstName,
      lastName,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setDetailsErrors({
        email: fieldErrors.email?.[0],
        firstName: fieldErrors.firstName?.[0],
        lastName: fieldErrors.lastName?.[0],
      });
      return;
    }

    setDetailsErrors({});
    setStep("single-program");
  }

  async function handleSendInvite() {
    if (!selectedCohort || !selectedTrack) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      const result = await onboardUser({
        cohortId: selectedCohort.id,
        trackId: selectedTrack.id,
        role: "STUDENT",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });

      onInvited([
        {
          name: result.user.name,
          email: result.user.email,
          track: selectedTrack.name,
          cohort: selectedCohort.name,
          status: "Pending",
          joined: "--",
        },
      ]);
      setEmailSent(result.emailSent);
      setStep("single-success");
    } catch (error) {
      setSubmitError(getOnboardErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function handleFile(file: File) {
    stopUploadTimer();

    const error = getCsvError(file);
    if (error) {
      setUpload({ status: "failed", file, reason: error });
      return;
    }

    setUpload({ status: "uploading", file, progress: 0 });
    uploadTimer.current = setInterval(() => {
      setUpload((current) => {
        if (current.status !== "uploading") return current;
        const progress = Math.min(current.progress + 20, 100);
        if (progress === 100) {
          stopUploadTimer();
          return { status: "completed", file: current.file };
        }
        return { ...current, progress };
      });
    }, 250);
  }

  function handleRemoveFile() {
    stopUploadTimer();
    setUpload({ status: "idle" });
  }

  const fullName = `${firstName.trim()} ${lastName.trim()}`;
  const selectedCohort =
    programOptions.status === "ready"
      ? programOptions.cohorts.find((cohort) => cohort.id === cohortId)
      : undefined;
  const selectedTrack =
    programOptions.status === "ready"
      ? programOptions.tracks.find((track) => track.id === trackId)
      : undefined;
  const selectedCount = selectedRows.filter(Boolean).length;
  const tracksSummary = React.useMemo(() => {
    const counts = new Map<string, number>();
    bulkPreview.forEach((row, index) => {
      if (!selectedRows[index]) return;
      counts.set(row.track, (counts.get(row.track) ?? 0) + 1);
    });
    return Array.from(counts.entries());
  }, [selectedRows]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button size="medium" onClick={handleOpen} className="gap-2">
        <Plus className="h-4 w-4" />
        Invite students
      </Button>

      <DialogContent className={stepWidth[step]}>
        {step === "choice" && (
          <ChoiceStep
            onSingle={() => setStep("single-form")}
            onBulk={() => setStep("bulk-upload")}
          />
        )}

        {step === "single-form" && (
          <SingleFormStep
            email={email}
            firstName={firstName}
            lastName={lastName}
            errors={detailsErrors}
            onEmailChange={(value) => {
              setEmail(value);
              setDetailsErrors((prev) => ({ ...prev, email: undefined }));
            }}
            onFirstNameChange={(value) => {
              setFirstName(value);
              setDetailsErrors((prev) => ({ ...prev, firstName: undefined }));
            }}
            onLastNameChange={(value) => {
              setLastName(value);
              setDetailsErrors((prev) => ({ ...prev, lastName: undefined }));
            }}
            onCancel={() => handleOpenChange(false)}
            onNext={handleDetailsNext}
          />
        )}

        {step === "single-program" && (
          <ProgramDetailsStep
            options={programOptions}
            cohortId={cohortId}
            trackId={trackId}
            onCohortChange={setCohortId}
            onTrackChange={setTrackId}
            onRetry={loadProgramOptions}
            onCancel={() => handleOpenChange(false)}
            onNext={() => setStep("single-review")}
          />
        )}

        {step === "single-review" && (
          <SingleReviewStep
            name={fullName}
            email={email.trim()}
            cohort={selectedCohort?.name ?? ""}
            track={selectedTrack?.name ?? ""}
            submitting={submitting}
            error={submitError}
            onBack={() => {
              setSubmitError(null);
              setStep("single-program");
            }}
            onSend={handleSendInvite}
          />
        )}

        {step === "single-success" && (
          <SuccessStep
            title={emailSent ? "Invitation sent!" : "Student added"}
            message={
              emailSent
                ? `${fullName} has been invited to join Rise Classroom. They will receive an email with instructions to create their account.`
                : `${fullName} was added, but the invitation email failed to send. They won't get their onboarding link until the invite is resent.`
            }
            onInviteAnother={reset}
            onViewStudents={() => handleOpenChange(false)}
          />
        )}

        {step === "bulk-upload" && (
          <BulkUploadStep
            upload={upload}
            onFile={handleFile}
            onRemoveFile={handleRemoveFile}
            onCancel={() => handleOpenChange(false)}
            onNext={() => setStep("bulk-review")}
          />
        )}

        {step === "bulk-review" && (
          <BulkReviewStep
            selectedRows={selectedRows}
            onToggleRow={(index) =>
              setSelectedRows((rows) =>
                rows.map((value, i) => (i === index ? !value : value)),
              )
            }
            onToggleAll={(checked) =>
              setSelectedRows(bulkPreview.map(() => checked))
            }
            selectedCount={selectedCount}
            onCancel={() => handleOpenChange(false)}
            onNext={() => setStep("bulk-confirm")}
          />
        )}

        {step === "bulk-confirm" && (
          <BulkConfirmStep
            selectedCount={selectedCount}
            tracksSummary={tracksSummary}
            onCancel={() => handleOpenChange(false)}
            onSend={() => {
              onInvited(
                bulkPreview
                  .filter((_, index) => selectedRows[index])
                  .map((row) => ({
                    ...row,
                    cohort: defaultCohort,
                    status: "Pending",
                    joined: "--",
                  })),
              );
              setStep("bulk-success");
            }}
          />
        )}

        {step === "bulk-success" && (
          <SuccessStep
            title="Invitation sent!"
            message={`${selectedCount} students have been invited to join Rise Classroom. They will receive an email with instructions to create their account.`}
            onInviteAnother={reset}
            onViewStudents={() => handleOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChoiceCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  iconClassName: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-xl border border-neutral-300 p-5 text-left hover:border-primary-500"
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          iconClassName,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-semibold text-neutral-900">{title}</span>
      <span className="flex w-full items-end justify-between gap-4 text-sm text-neutral-500">
        {description}
        <ArrowRight className="h-4 w-4 shrink-0 text-neutral-900" />
      </span>
    </button>
  );
}

function ChoiceStep({
  onSingle,
  onBulk,
}: {
  onSingle: () => void;
  onBulk: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Invite Students</DialogTitle>
        <DialogDescription>
          How would you like to invite students
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ChoiceCard
          icon={UserPlus}
          iconClassName="bg-semantic-surface-success-badge text-semantic-text-success"
          title="Invite Individually"
          description="Add one student at a time"
          onClick={onSingle}
        />
        <ChoiceCard
          icon={Upload}
          iconClassName="bg-semantic-surface-info-badge text-semantic-text-info"
          title="Upload CSV"
          description="Invite multiple students at once"
          onClick={onBulk}
        />
      </div>

      <div className="-mb-4 mt-6 flex flex-col-reverse items-center gap-4 sm:-mb-6 sm:flex-row sm:items-end sm:justify-between">
        <Image
          src="/invite-students.png"
          alt="Student working on a laptop"
          width={259}
          height={150}
          className="h-auto w-56 sm:w-64"
        />
        <p className="text-center text-sm text-neutral-500 sm:mb-6 sm:max-w-64 sm:text-left">
          Students will receive an email invitation to join Rise Classroom and
          complete their profile.
        </p>
      </div>
    </>
  );
}

function SingleFormStep({
  email,
  firstName,
  lastName,
  errors,
  onEmailChange,
  onFirstNameChange,
  onLastNameChange,
  onCancel,
  onNext,
}: {
  email: string;
  firstName: string;
  lastName: string;
  errors: InviteDetailsErrors;
  onEmailChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onCancel: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Invite a student</DialogTitle>
        <DialogDescription>Enter the students information</DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col gap-6">
        <FormField
          label="Email Address"
          required
          invalid={Boolean(errors.email)}
          error={errors.email}
          inputProps={{
            type: "email",
            placeholder: "rise@email.com",
            value: email,
            onChange: (e) => onEmailChange(e.target.value),
          }}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="First name"
            required
            invalid={Boolean(errors.firstName)}
            error={errors.firstName}
            inputProps={{
              placeholder: "e.g Sarah",
              value: firstName,
              onChange: (e) => onFirstNameChange(e.target.value),
              leadingIcon: null,
            }}
          />
          <FormField
            label="Last name"
            required
            invalid={Boolean(errors.lastName)}
            error={errors.lastName}
            inputProps={{
              placeholder: "e.g Johnson",
              value: lastName,
              onChange: (e) => onLastNameChange(e.target.value),
              leadingIcon: null,
            }}
          />
        </div>
      </div>

      <DialogFooter className="sm:justify-end">
        <Button variant="secondary" size="medium" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="medium" onClick={onNext}>
          Next
        </Button>
      </DialogFooter>
    </>
  );
}

function SimpleSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const id = React.useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-900">
        {label}
        <span className="text-semantic-text-error"> *</span>
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-lg border border-neutral-300 bg-transparent px-3 pr-9 text-sm text-neutral-900 outline-none focus:border-primary-500"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      </div>
    </div>
  );
}

function ProgramDetailsStep({
  options,
  cohortId,
  trackId,
  onCohortChange,
  onTrackChange,
  onRetry,
  onCancel,
  onNext,
}: {
  options: ProgramOptions;
  cohortId: string;
  trackId: string;
  onCohortChange: (value: string) => void;
  onTrackChange: (value: string) => void;
  onRetry: () => void;
  onCancel: () => void;
  onNext: () => void;
}) {
  const canContinue =
    options.status === "ready" && Boolean(cohortId) && Boolean(trackId);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Program details</DialogTitle>
        <DialogDescription>
          Assign the student to a cohort and track
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col gap-6">
        {options.status === "loading" && (
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader className="h-4 w-4 animate-spin text-primary-500" />
            Loading cohorts and tracks...
          </p>
        )}

        {options.status === "error" && (
          <div className="flex flex-col items-start gap-3">
            <ErrorMessage message={options.message} />
            <Button variant="secondary" size="medium" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}

        {options.status === "ready" && (
          <>
            {options.cohorts.length > 0 ? (
              <SimpleSelect
                label="Cohort"
                value={cohortId}
                options={options.cohorts.map((cohort) => ({
                  value: cohort.id,
                  label: cohort.name,
                }))}
                onChange={onCohortChange}
              />
            ) : (
              <ErrorMessage message="There are no ongoing cohorts. Create one before inviting students." />
            )}

            {options.tracks.length > 0 ? (
              <SimpleSelect
                label="Track"
                value={trackId}
                options={options.tracks.map((track) => ({
                  value: track.id,
                  label: track.name,
                }))}
                onChange={onTrackChange}
              />
            ) : (
              <ErrorMessage message="There are no active tracks. Create one before inviting students." />
            )}
          </>
        )}
      </div>

      <DialogFooter className="sm:justify-end">
        <Button variant="secondary" size="medium" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="medium" disabled={!canContinue} onClick={onNext}>
          Next
        </Button>
      </DialogFooter>
    </>
  );
}

function SingleReviewStep({
  name,
  email,
  cohort,
  track,
  submitting,
  error,
  onBack,
  onSend,
}: {
  name: string;
  email: string;
  cohort: string;
  track: string;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSend: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Review invitation</DialogTitle>
        <DialogDescription>
          Check the details before sending the invitation
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 rounded-xl border border-neutral-300 p-5">
        <div className="flex items-center gap-3 pb-6">
          <InitialsAvatar
            name={name}
            className="h-12 w-12 bg-semantic-surface-warning-badge text-base text-semantic-text-warning"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-neutral-900">{name}</p>
            <p className="truncate text-sm text-neutral-500">{email}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Cohort:</span>
          <span className="font-medium text-neutral-900">{cohort}</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-neutral-500">Track:</span>
          <span className="font-medium text-neutral-900">{track}</span>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorMessage message={error} />
        </div>
      )}

      <DialogFooter className="sm:justify-end">
        <Button
          variant="secondary"
          size="medium"
          disabled={submitting}
          onClick={onBack}
        >
          Back
        </Button>
        <Button size="medium" disabled={submitting} onClick={onSend}>
          {submitting && <Loader className="h-4 w-4 animate-spin" />}
          {submitting ? "Sending..." : "Send Invitation"}
        </Button>
      </DialogFooter>
    </>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-semantic-border-error bg-semantic-surface-error-badge px-4 py-3 text-sm text-semantic-text-error"
    >
      {message}
    </p>
  );
}

function SuccessStep({
  title,
  message,
  onInviteAnother,
  onViewStudents,
}: {
  title: string;
  message: string;
  onInviteAnother: () => void;
  onViewStudents: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-semantic-surface-success-badge">
        <CheckCircle2 className="h-10 w-10 text-semantic-text-success" />
      </span>
      <h2 className="mt-6 text-xl font-bold text-neutral-900">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">{message}</p>

      <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center">
        <Button
          size="medium"
          onClick={onInviteAnother}
          className="w-full sm:w-auto"
        >
          Invite another student
        </Button>
        <Button
          variant="secondary"
          size="medium"
          onClick={onViewStudents}
          className="w-full sm:w-auto"
        >
          View students
        </Button>
      </div>
    </div>
  );
}

function BulkUploadStep({
  upload,
  onFile,
  onRemoveFile,
  onCancel,
  onNext,
}: {
  upload: UploadState;
  onFile: (file: File) => void;
  onRemoveFile: () => void;
  onCancel: () => void;
  onNext: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload student CSV</DialogTitle>
        <DialogDescription>
          Upload a CSV file with student details
          <br />
          we&apos;ll help you assign them to a cohort and track.
        </DialogDescription>
      </DialogHeader>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleInputChange}
      />

      {upload.status === "idle" ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center",
            dragging
              ? "border-primary-500 bg-primary-50"
              : "border-neutral-300",
          )}
        >
          <CloudUpload className="h-6 w-6 text-neutral-500" />
          <p className="mt-2 font-medium text-neutral-900">
            Choose a file or drag & drop it here.
          </p>
          <p className="text-xs text-neutral-500">
            CSV format only, up to 10 MB.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 border-neutral-300"
            onClick={() => inputRef.current?.click()}
          >
            Browse File
          </Button>
        </div>
      ) : (
        <FileCard
          upload={upload}
          onRemove={onRemoveFile}
          onRetry={() => inputRef.current?.click()}
        />
      )}

      <DialogFooter className="sm:justify-end">
        <Button variant="secondary" size="medium" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="medium"
          disabled={upload.status !== "completed"}
          onClick={onNext}
        >
          Next
        </Button>
      </DialogFooter>
    </>
  );
}

function FileCard({
  upload,
  onRemove,
  onRetry,
}: {
  upload: Exclude<UploadState, { status: "idle" }>;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const total = formatSize(upload.file.size);

  return (
    <div className="mt-6 rounded-xl border border-neutral-300 p-4">
      <div className="flex items-start gap-3">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center text-neutral-400">
          <FileText className="h-9 w-9" strokeWidth={1.25} />
          <span className="absolute bottom-0.5 -left-1 rounded bg-semantic-text-error px-1 text-[9px] font-bold text-neutral-50">
            CSV
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-900">
            {upload.file.name}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
            {upload.status === "uploading" && (
              <>
                {formatSize((upload.file.size * upload.progress) / 100)} of{" "}
                {total} ·
                <Loader className="h-3.5 w-3.5 animate-spin text-primary-500" />
                <span className="text-neutral-900">Uploading...</span>
              </>
            )}
            {upload.status === "completed" && (
              <>
                {total} of {total} ·
                <CircleCheck className="h-3.5 w-3.5 text-semantic-text-success" />
                <span className="text-neutral-900">Completed</span>
              </>
            )}
            {upload.status === "failed" && (
              <>
                0 KB of {total} ·
                <CircleAlert className="h-3.5 w-3.5 text-semantic-text-error" />
                <span className="text-neutral-900">Failed</span>
              </>
            )}
          </p>
          {upload.status === "failed" && (
            <>
              <p className="mt-1 text-xs text-neutral-500">{upload.reason}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 text-xs font-medium text-semantic-text-error underline"
              >
                Try Again
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Remove file"
          onClick={onRemove}
          className="text-neutral-500 hover:text-neutral-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {upload.status === "uploading" && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-primary-50">
          <div
            className="h-full rounded-full bg-primary-500 transition-[width] duration-200"
            style={{ width: `${upload.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function BulkReviewStep({
  selectedRows,
  onToggleRow,
  onToggleAll,
  selectedCount,
  onCancel,
  onNext,
}: {
  selectedRows: boolean[];
  onToggleRow: (index: number) => void;
  onToggleAll: (checked: boolean) => void;
  selectedCount: number;
  onCancel: () => void;
  onNext: () => void;
}) {
  const allSelected = selectedCount === bulkPreview.length;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Review students</DialogTitle>
        <DialogDescription>
          We found {bulkPreview.length} students in your file.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-neutral-200 text-xs tracking-wider text-neutral-500 uppercase">
            <tr>
              <th className="w-10 rounded-l-lg px-4 py-3">
                <Checkbox
                  aria-label="Select all students"
                  checked={allSelected}
                  indeterminate={selectedCount > 0 && !allSelected}
                  onCheckedChange={() => onToggleAll(!allSelected)}
                />
              </th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Email Address</th>
              <th className="rounded-r-lg px-4 py-3 font-medium">Track</th>
            </tr>
          </thead>
          <tbody>
            {bulkPreview.map((row, index) => (
              <tr key={row.email} className="border-b border-neutral-200">
                <td className="px-4 py-3">
                  <Checkbox
                    aria-label={`Select ${row.name}`}
                    checked={selectedRows[index]}
                    onCheckedChange={() => onToggleRow(index)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={row.name} className="h-8 w-8" />
                    <span className="font-medium text-neutral-900">
                      {row.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-700">{row.email}</td>
                <td className="px-4 py-3 text-neutral-700">{row.track}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DialogFooter className="justify-between">
        <span className="text-sm text-neutral-500">
          {selectedCount} selected
        </span>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="medium" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="medium" disabled={selectedCount === 0} onClick={onNext}>
            Next
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

function BulkConfirmStep({
  selectedCount,
  tracksSummary,
  onCancel,
  onSend,
}: {
  selectedCount: number;
  tracksSummary: [string, number][];
  onCancel: () => void;
  onSend: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Confirm and send</DialogTitle>
        <DialogDescription>
          You&apos;re about to send track invitations to{" "}
          <span className="font-semibold text-neutral-900">
            {selectedCount} selected students.
          </span>
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6">
        <p className="mb-2 flex items-center gap-2 text-sm text-neutral-500">
          <Users className="h-4 w-4" />
          Selected Students by Track
        </p>
        {tracksSummary.map(([track, count]) => (
          <div
            key={track}
            className="flex items-center justify-between border-b border-neutral-200 py-3 text-sm"
          >
            <span className="text-neutral-900">{track}</span>
            <span className="text-neutral-500">
              {count} student{count > 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>

      <DialogFooter className="sm:justify-end">
        <Button variant="secondary" size="medium" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="medium" onClick={onSend}>
          Send invitation
        </Button>
      </DialogFooter>
    </>
  );
}
