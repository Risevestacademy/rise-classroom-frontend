"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  Upload,
  ArrowRight,
  ChevronDown,
  Check,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
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
  adminQueries,
  inviteUser,
  inviteUsersBulk,
  type InviteUserInput,
} from "@/lib/admin";

/** One row parsed out of an uploaded CSV. */
type CsvRow = {
  firstName: string;
  lastName: string;
  email: string;
};

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

const STEP_WIDTH: Partial<Record<Step, string>> = {
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

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Reads `firstName,lastName,email` rows out of a CSV. Columns are matched by
 * header name where a header is present, falling back to column order. A
 * single `name` column is split on the first space.
 */
export function parseInstructorCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return { rows: [], skipped: 0 };

  const cells = (line: string) =>
    line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));

  const first = cells(lines[0]).map((cell) => cell.toLowerCase());
  const hasHeader = first.some((cell) => cell.includes("email"));

  const indexOf = (...names: string[]) =>
    first.findIndex((cell) => names.includes(cell));

  const emailAt = hasHeader ? indexOf("email", "email address") : 2;
  const firstAt = hasHeader ? indexOf("firstname", "first name", "first") : 0;
  const lastAt = hasHeader ? indexOf("lastname", "last name", "last") : 1;
  const nameAt = hasHeader ? indexOf("name", "full name") : -1;

  const rows: CsvRow[] = [];
  let skipped = 0;

  for (const line of lines.slice(hasHeader ? 1 : 0)) {
    const parts = cells(line);
    const email = (emailAt >= 0 ? parts[emailAt] : "") ?? "";

    if (!email.includes("@")) {
      skipped += 1;
      continue;
    }

    let firstName = (firstAt >= 0 ? parts[firstAt] : "") ?? "";
    let lastName = (lastAt >= 0 ? parts[lastAt] : "") ?? "";

    if (!firstName && nameAt >= 0) {
      const [head, ...tail] = (parts[nameAt] ?? "").split(" ");
      firstName = head ?? "";
      lastName = tail.join(" ");
    }

    // The API requires both names, so fall back to the email local part.
    if (!firstName) firstName = email.split("@")[0];
    if (!lastName) lastName = firstName;

    rows.push({ firstName, lastName, email });
  }

  return { rows, skipped };
}

export function InviteInstructorDialog() {
  const queryClient = useQueryClient();

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("choice");

  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");

  const [fileName, setFileName] = React.useState("");
  // Only the explicit choice is stored; the effective value falls back to the
  // first option, so there is no state to sync once the lists load.
  const [chosenCohortId, setChosenCohortId] = React.useState("");
  const [chosenTrackId, setChosenTrackId] = React.useState("");
  const [csvRows, setCsvRows] = React.useState<CsvRow[]>([]);
  const [csvSkipped, setCsvSkipped] = React.useState(0);
  const [csvError, setCsvError] = React.useState<string | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<boolean[]>([]);

  const cohortsQuery = useQuery({
    ...adminQueries.cohorts(),
    enabled: open,
  });
  const tracksQuery = useQuery({
    ...adminQueries.tracks("ACTIVE"),
    enabled: open,
  });

  const cohorts = React.useMemo(
    () => cohortsQuery.data ?? [],
    [cohortsQuery.data]
  );
  const tracks = React.useMemo(
    () => tracksQuery.data ?? [],
    [tracksQuery.data]
  );
  const programLoading = cohortsQuery.isPending || tracksQuery.isPending;

  // The API requires a real cohort and track id, so inviting is impossible
  // until the program has both.
  const missingProgram =
    !programLoading && (cohorts.length === 0 || tracks.length === 0);

  // Fall back to the first option rather than syncing state in an effect.
  const cohortId = chosenCohortId || cohorts[0]?.id || "";
  const trackId = chosenTrackId || tracks[0]?.id || "";

  function refreshInstructors() {
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  const singleInvite = useMutation({
    mutationFn: (input: InviteUserInput) => inviteUser(input),
    onSuccess: () => {
      refreshInstructors();
      setStep("single-success");
    },
  });

  const bulkInvite = useMutation({
    mutationFn: (users: InviteUserInput[]) => inviteUsersBulk(users),
    onSuccess: () => {
      refreshInstructors();
      setStep("bulk-success");
    },
  });

  function reset() {
    setStep("choice");
    setEmail("");
    setFirstName("");
    setLastName("");
    setFileName("");
    setCsvRows([]);
    setCsvSkipped(0);
    setCsvError(null);
    setSelectedRows([]);
    singleInvite.reset();
    bulkInvite.reset();
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setCsvError(null);

    try {
      const { rows, skipped } = parseInstructorCsv(await file.text());

      if (rows.length === 0) {
        setCsvError(
          "No rows with a valid email address were found in that file."
        );
        return;
      }

      setCsvRows(rows);
      setCsvSkipped(skipped);
      setSelectedRows(rows.map(() => true));
      setStep("bulk-review");
    } catch {
      setCsvError("That file couldn't be read. Please upload a CSV.");
    }
  }

  const selectedCount = selectedRows.filter(Boolean).length;
  const cohortName = cohorts.find((c) => c.id === cohortId)?.name ?? "";
  const trackName = tracks.find((t) => t.id === trackId)?.name ?? "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="h-4 w-4" />
        Invite Instructors
      </Button>

      <DialogContent className={STEP_WIDTH[step]}>
        {step === "choice" && (
          <ChoiceStep
            missingProgram={missingProgram}
            noCohorts={cohorts.length === 0}
            noTracks={tracks.length === 0}
            onSingle={() => setStep("single-form")}
            onBulk={() => setStep("bulk-upload")}
          />
        )}

        {step === "single-form" && (
          <SingleFormStep
            email={email}
            firstName={firstName}
            lastName={lastName}
            onEmailChange={setEmail}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onCancel={() => handleOpenChange(false)}
            onNext={() => setStep("single-program")}
          />
        )}

        {step === "single-program" && (
          <ProgramDetailsStep
            isLoading={programLoading}
            cohortId={cohortId}
            trackId={trackId}
            cohorts={cohorts}
            tracks={tracks}
            onCohortChange={setChosenCohortId}
            onTrackChange={setChosenTrackId}
            onCancel={() => handleOpenChange(false)}
            onNext={() => setStep("single-review")}
          />
        )}

        {step === "single-review" && (
          <SingleReviewStep
            name={`${firstName} ${lastName}`.trim() || email}
            email={email}
            cohort={cohortName}
            track={trackName}
            isSending={singleInvite.isPending}
            error={singleInvite.error?.message ?? null}
            onBack={() => setStep("single-program")}
            onSend={() =>
              singleInvite.mutate({
                cohortId,
                trackId,
                role: "INSTRUCTOR",
                firstName: firstName.trim() || email.split("@")[0],
                lastName: lastName.trim() || firstName.trim() || "Instructor",
                email: email.trim(),
              })
            }
          />
        )}

        {step === "single-success" && (
          <SuccessStep
            message={`${`${firstName} ${lastName}`.trim() || email} has been invited to join Rise Classroom. They will receive an email with instructions to create their account.`}
            onInviteAnother={reset}
            onViewInstructors={() => handleOpenChange(false)}
          />
        )}

        {step === "bulk-upload" && (
          <BulkUploadStep
            error={csvError}
            onCancel={() => handleOpenChange(false)}
            onFile={handleFile}
          />
        )}

        {step === "bulk-review" && (
          <BulkReviewStep
            rows={csvRows}
            skipped={csvSkipped}
            fileName={fileName}
            selectedRows={selectedRows}
            onToggleRow={(index) =>
              setSelectedRows((rows) =>
                rows.map((value, i) => (i === index ? !value : value))
              )
            }
            selectedCount={selectedCount}
            onCancel={() => handleOpenChange(false)}
            onNext={() => setStep("bulk-confirm")}
          />
        )}

        {step === "bulk-confirm" && (
          <BulkConfirmStep
            isLoading={programLoading}
            selectedCount={selectedCount}
            cohortId={cohortId}
            trackId={trackId}
            cohorts={cohorts}
            tracks={tracks}
            onCohortChange={setChosenCohortId}
            onTrackChange={setChosenTrackId}
            isSending={bulkInvite.isPending}
            error={bulkInvite.error?.message ?? null}
            onCancel={() => handleOpenChange(false)}
            onSend={() =>
              bulkInvite.mutate(
                csvRows
                  .filter((_, index) => selectedRows[index])
                  .map((row) => ({
                    ...row,
                    cohortId,
                    trackId,
                    role: "INSTRUCTOR" as const,
                  }))
              )
            }
          />
        )}

        {step === "bulk-success" && (
          <SuccessStep
            message={`${selectedCount} instructor${selectedCount === 1 ? "" : "s"} have been invited to join Rise Classroom. They will receive an email with instructions to create their account.`}
            onInviteAnother={reset}
            onViewInstructors={() => handleOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
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

function ChoiceStep({
  missingProgram,
  noCohorts,
  noTracks,
  onSingle,
  onBulk,
}: {
  missingProgram: boolean;
  noCohorts: boolean;
  noTracks: boolean;
  onSingle: () => void;
  onBulk: () => void;
}) {
  const missing = [noTracks && "an active track", noCohorts && "a cohort"]
    .filter(Boolean)
    .join(" and ");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Invite Instructors</DialogTitle>
        <DialogDescription>
          How would you like to invite instructors?
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onSingle}
          disabled={missingProgram}
          className="flex flex-col items-start gap-3 rounded-xl border border-neutral-300 p-5 text-left hover:border-primary-500 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-semantic-surface-success-badge text-semantic-text-success">
            <UserPlus className="h-5 w-5" />
          </span>
          <span className="flex w-full items-center justify-between font-semibold text-neutral-900">
            Invite Individually
            <ArrowRight className="h-4 w-4 text-neutral-400" />
          </span>
          <span className="text-sm text-neutral-500">
            Add one instructor at a time
          </span>
        </button>

        <button
          type="button"
          onClick={onBulk}
          disabled={missingProgram}
          className="flex flex-col items-start gap-3 rounded-xl border border-neutral-300 p-5 text-left hover:border-primary-500 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-semantic-surface-info-badge text-semantic-text-info">
            <Upload className="h-5 w-5" />
          </span>
          <span className="flex w-full items-center justify-between font-semibold text-neutral-900">
            Upload CSV
            <ArrowRight className="h-4 w-4 text-neutral-400" />
          </span>
          <span className="text-sm text-neutral-500">
            Invite multiple instructors at once
          </span>
        </button>
      </div>

      {missingProgram ? (
        <ErrorNote>
          Every invitation has to be assigned to a track and a cohort, and your
          program doesn&apos;t have {missing} yet. Create {missing} first, then
          come back here.
        </ErrorNote>
      ) : (
        <p className="mt-6 text-sm text-neutral-500">
          Instructors will receive an email invitation to join Rise Classroom
          and complete their profile.
        </p>
      )}
    </>
  );
}

function SingleFormStep({
  email,
  firstName,
  lastName,
  onEmailChange,
  onFirstNameChange,
  onLastNameChange,
  onCancel,
  onNext,
}: {
  email: string;
  firstName: string;
  lastName: string;
  onEmailChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onCancel: () => void;
  onNext: () => void;
}) {
  const canContinue = email.trim().includes("@");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Invite an Instructor</DialogTitle>
        <DialogDescription>Enter the instructors information</DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col gap-6">
        <FormField
          label="Email Address"
          required
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
            inputProps={{
              placeholder: "e.g Sarah",
              value: firstName,
              onChange: (e) => onFirstNameChange(e.target.value),
              leadingIcon: null,
            }}
          />
          <FormField
            label="Last name"
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
        <Button size="medium" disabled={!canContinue} onClick={onNext}>
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
  options: { id: string; name: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-900">
        {label}
        <span className="text-semantic-text-error"> *</span>
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-lg border border-neutral-300 bg-transparent px-3 pr-9 text-sm text-neutral-900 outline-none focus:border-primary-500"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      </div>
    </div>
  );
}

function ProgramSelects({
  isLoading,
  cohortId,
  trackId,
  cohorts,
  tracks,
  onCohortChange,
  onTrackChange,
}: {
  isLoading: boolean;
  cohortId: string;
  trackId: string;
  cohorts: { id: string; name: string }[];
  tracks: { id: string; name: string }[];
  onCohortChange: (value: string) => void;
  onTrackChange: (value: string) => void;
}) {
  if (isLoading) {
    return (
      <>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <SimpleSelect
        label="Cohort"
        value={cohortId}
        options={cohorts}
        onChange={onCohortChange}
      />
      <SimpleSelect
        label="Track"
        value={trackId}
        options={tracks}
        onChange={onTrackChange}
      />
    </>
  );
}

function ProgramDetailsStep({
  isLoading,
  cohortId,
  trackId,
  cohorts,
  tracks,
  onCohortChange,
  onTrackChange,
  onCancel,
  onNext,
}: {
  isLoading: boolean;
  cohortId: string;
  trackId: string;
  cohorts: { id: string; name: string }[];
  tracks: { id: string; name: string }[];
  onCohortChange: (value: string) => void;
  onTrackChange: (value: string) => void;
  onCancel: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Program details</DialogTitle>
        <DialogDescription>
          Assign the instructor to a cohort and track
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col gap-6">
        <ProgramSelects
          isLoading={isLoading}
          cohortId={cohortId}
          trackId={trackId}
          cohorts={cohorts}
          tracks={tracks}
          onCohortChange={onCohortChange}
          onTrackChange={onTrackChange}
        />
      </div>

      <DialogFooter className="sm:justify-end">
        <Button variant="secondary" size="medium" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="medium"
          disabled={isLoading || !cohortId || !trackId}
          onClick={onNext}
        >
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
  isSending,
  error,
  onBack,
  onSend,
}: {
  name: string;
  email: string;
  cohort: string;
  track: string;
  isSending: boolean;
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
        <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 font-semibold text-primary-500">
            {initials(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-neutral-900">{name}</p>
            <p className="truncate text-sm text-neutral-500">{email}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 text-sm">
          <span className="text-neutral-500">Cohort:</span>
          <span className="font-medium text-neutral-900">{cohort}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-neutral-500">Track:</span>
          <span className="font-medium text-neutral-900">{track}</span>
        </div>
      </div>

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
        <Button size="medium" disabled={isSending} onClick={onSend}>
          {isSending ? "Sending…" : "Send Invitation"}
        </Button>
      </DialogFooter>
    </>
  );
}

function SuccessStep({
  message,
  onInviteAnother,
  onViewInstructors,
}: {
  message: string;
  onInviteAnother: () => void;
  onViewInstructors: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-semantic-surface-success-badge">
        <CheckCircle2 className="h-10 w-10 text-semantic-text-success" />
      </span>
      <h2 className="mt-6 text-xl font-bold text-neutral-900">
        Invitation sent!
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">{message}</p>

      <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center">
        <Button
          size="medium"
          onClick={onInviteAnother}
          className="w-full sm:w-auto"
        >
          Invite another instructor
        </Button>
        <Button
          variant="secondary"
          size="medium"
          onClick={onViewInstructors}
          className="w-full sm:w-auto"
        >
          View instructors
        </Button>
      </div>
    </div>
  );
}

function BulkUploadStep({
  error,
  onCancel,
  onFile,
}: {
  error: string | null;
  onCancel: () => void;
  onFile: (file: File) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload Instructor CSV</DialogTitle>
        <DialogDescription>
          Upload a CSV with the columns <code>firstName</code>,{" "}
          <code>lastName</code> and <code>email</code>. We&apos;ll help you
          assign everyone to a cohort and track.
        </DialogDescription>
      </DialogHeader>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center",
          isDragging ? "border-primary-500 bg-primary-50" : "border-neutral-300"
        )}
      >
        <Upload className="h-6 w-6 text-neutral-400" />
        <p className="font-medium text-neutral-900">
          Choose a file or drag &amp; drop it here.
        </p>
        <p className="text-sm text-neutral-500">CSV format only, up to 10 MB.</p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = "";
          }}
        />

        <Button
          variant="secondary"
          size="medium"
          className="mt-2"
          onClick={() => inputRef.current?.click()}
        >
          Browse File
        </Button>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <DialogFooter className="sm:justify-end">
        <Button variant="secondary" size="medium" onClick={onCancel}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
}

function BulkReviewStep({
  rows,
  skipped,
  fileName,
  selectedRows,
  onToggleRow,
  selectedCount,
  onCancel,
  onNext,
}: {
  rows: CsvRow[];
  skipped: number;
  fileName: string;
  selectedRows: boolean[];
  onToggleRow: (index: number) => void;
  selectedCount: number;
  onCancel: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Review Instructors</DialogTitle>
        <DialogDescription>
          We found {rows.length} instructor{rows.length === 1 ? "" : "s"} in{" "}
          {fileName}
          {skipped > 0 &&
            ` · ${skipped} row${skipped === 1 ? "" : "s"} skipped (no valid email)`}
          .
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-300">
        <div className="max-h-80 overflow-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs tracking-wider text-neutral-500 uppercase">
              <tr>
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3">First name</th>
                <th className="px-4 py-3">Last name</th>
                <th className="px-4 py-3">Email Address</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${row.email}-${index}`}
                  className="border-t border-neutral-200"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      aria-label={`Include ${row.email}`}
                      onClick={() => onToggleRow(index)}
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
                        selectedRows[index]
                          ? "border-primary-500 bg-primary-500 text-white"
                          : "border-neutral-400"
                      )}
                    >
                      {selectedRows[index] && <Check className="h-3 w-3" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {row.firstName}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{row.lastName}</td>
                  <td className="px-4 py-3 text-neutral-500">{row.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  isLoading,
  selectedCount,
  cohortId,
  trackId,
  cohorts,
  tracks,
  onCohortChange,
  onTrackChange,
  isSending,
  error,
  onCancel,
  onSend,
}: {
  isLoading: boolean;
  selectedCount: number;
  cohortId: string;
  trackId: string;
  cohorts: { id: string; name: string }[];
  tracks: { id: string; name: string }[];
  onCohortChange: (value: string) => void;
  onTrackChange: (value: string) => void;
  isSending: boolean;
  error: string | null;
  onCancel: () => void;
  onSend: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Confirm and send</DialogTitle>
        <DialogDescription>
          You&apos;re about to invite {selectedCount} instructor
          {selectedCount === 1 ? "" : "s"}. Choose the cohort and track
          they&apos;ll all be assigned to.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col gap-6">
        <ProgramSelects
          isLoading={isLoading}
          cohortId={cohortId}
          trackId={trackId}
          cohorts={cohorts}
          tracks={tracks}
          onCohortChange={onCohortChange}
          onTrackChange={onTrackChange}
        />
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <DialogFooter className="sm:justify-end">
        <Button
          variant="secondary"
          size="medium"
          disabled={isSending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="medium"
          disabled={isSending || isLoading || !cohortId || !trackId}
          onClick={onSend}
        >
          {isSending ? "Sending…" : "Send Invitation"}
        </Button>
      </DialogFooter>
    </>
  );
}
