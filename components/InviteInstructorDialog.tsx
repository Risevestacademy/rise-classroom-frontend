"use client";

import * as React from "react";
import {
  UserPlus,
  Upload,
  ArrowRight,
  ChevronDown,
  Check,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Instructor } from "@/app/admin/instructors/data";

const COHORTS = ["Cohort 2024", "Cohort 2025", "Cohort 2026", "Cohort 2027", "Cohort 2028"];
const TRACKS = ["Design", "Frontend", "Backend", "Mobile Engineering"];

const BULK_PREVIEW: Omit<Instructor, "id" | "status" | "joined" | "cohort">[] = [
  { name: "Tega Briggs", email: "tega.briggs@rise.edu", track: "Design" },
  { name: "Ifeoma Chukwu", email: "ifeoma.chukwu@rise.edu", track: "Frontend" },
  { name: "Wale Adeyemi", email: "wale.adeyemi@rise.edu", track: "Backend" },
  { name: "Ngozi Eze", email: "ngozi.eze@rise.edu", track: "Mobile Engineering" },
];

type Step =
  | "choice"
  | "single-form"
  | "single-program"
  | "single-review"
  | "single-success"
  | "bulk-upload"
  | "bulk-uploading"
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
  "bulk-uploading": "w-[648px]",
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

export function InviteInstructorDialog({
  onInvited,
}: {
  onInvited: (instructors: Omit<Instructor, "id">[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("choice");

  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [cohort, setCohort] = React.useState("Cohort 2026");
  const [track, setTrack] = React.useState("Design");

  const [fileName, setFileName] = React.useState("");
  const [selectedRows, setSelectedRows] = React.useState<boolean[]>(
    BULK_PREVIEW.map(() => true)
  );

  function reset() {
    setStep("choice");
    setEmail("");
    setFirstName("");
    setLastName("");
    setCohort("Cohort 2026");
    setTrack("Design");
    setFileName("");
    setSelectedRows(BULK_PREVIEW.map(() => true));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function handleBrowseFile() {
    setFileName("instructors.csv");
    setStep("bulk-uploading");
    setTimeout(() => setStep("bulk-review"), 900);
  }

  const selectedCount = selectedRows.filter(Boolean).length;
  const tracksSummary = React.useMemo(() => {
    const counts = new Map<string, number>();
    BULK_PREVIEW.forEach((row, index) => {
      if (!selectedRows[index]) return;
      counts.set(row.track, (counts.get(row.track) ?? 0) + 1);
    });
    return Array.from(counts.entries());
  }, [selectedRows]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="h-4 w-4" />
        Invite Instructors
      </Button>

      <DialogContent className={STEP_WIDTH[step]}>
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
            onEmailChange={setEmail}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onCancel={() => handleOpenChange(false)}
            onNext={() => setStep("single-program")}
          />
        )}

        {step === "single-program" && (
          <ProgramDetailsStep
            cohort={cohort}
            track={track}
            onCohortChange={setCohort}
            onTrackChange={setTrack}
            onCancel={() => handleOpenChange(false)}
            onNext={() => setStep("single-review")}
          />
        )}

        {step === "single-review" && (
          <SingleReviewStep
            name={`${firstName} ${lastName}`.trim() || "New Instructor"}
            email={email || "rise@email.com"}
            cohort={cohort}
            track={track}
            onBack={() => setStep("single-program")}
            onSend={() => {
              onInvited([
                {
                  name: `${firstName} ${lastName}`.trim() || "New Instructor",
                  email: email || "rise@email.com",
                  track,
                  cohort,
                  status: "Pending",
                  joined: "--",
                },
              ]);
              setStep("single-success");
            }}
          />
        )}

        {step === "single-success" && (
          <SuccessStep
            message={`${firstName || "The instructor"} ${lastName} has been invited to join Rise Classroom. They will receive an email with instructions to create their account.`}
            onInviteAnother={reset}
            onViewInstructors={() => handleOpenChange(false)}
          />
        )}

        {step === "bulk-upload" && (
          <BulkUploadStep
            onCancel={() => handleOpenChange(false)}
            onBrowseFile={handleBrowseFile}
          />
        )}

        {step === "bulk-uploading" && <BulkUploadingStep fileName={fileName} />}

        {step === "bulk-review" && (
          <BulkReviewStep
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
            selectedCount={selectedCount}
            tracksSummary={tracksSummary}
            onCancel={() => handleOpenChange(false)}
            onSend={() => {
              onInvited(
                BULK_PREVIEW.filter((_, index) => selectedRows[index]).map(
                  (row) => ({
                    ...row,
                    cohort: "Cohort 2026",
                    status: "Pending",
                    joined: "--",
                  })
                )
              );
              setStep("bulk-success");
            }}
          />
        )}

        {step === "bulk-success" && (
          <SuccessStep
            message={`${selectedCount} instructors have been invited to join Rise Classroom. They will receive an email with instructions to create their account.`}
            onInviteAnother={reset}
            onViewInstructors={() => handleOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
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
        <DialogTitle>Invite Instructors</DialogTitle>
        <DialogDescription>
          How would you like to invite instructors?
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onSingle}
          className="flex flex-col items-start gap-3 rounded-xl border border-neutral-300 p-5 text-left hover:border-primary-500"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-semantic-surface-success-badge text-semantic-text-success">
            <UserPlus className="h-5 w-5" />
          </span>
          <span className="flex items-center justify-between w-full font-semibold text-neutral-900">
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
          className="flex flex-col items-start gap-3 rounded-xl border border-neutral-300 p-5 text-left hover:border-primary-500"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-semantic-surface-info-badge text-semantic-text-info">
            <Upload className="h-5 w-5" />
          </span>
          <span className="flex items-center justify-between w-full font-semibold text-neutral-900">
            Upload CSV
            <ArrowRight className="h-4 w-4 text-neutral-400" />
          </span>
          <span className="text-sm text-neutral-500">
            Invite multiple instructors at once
          </span>
        </button>
      </div>

      <p className="mt-6 text-sm text-neutral-500">
        Instructors will receive an email invitation to join Rise Classroom
        and complete their profile.
      </p>
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
  const canContinue = email.trim().length > 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Invite an Instructor</DialogTitle>
        <DialogDescription>
          Enter the instructors information
        </DialogDescription>
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

        <div className="grid grid-cols-2 gap-4">
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

      <DialogFooter>
        <Button variant="secondary" size="medium" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="medium"
          disabled={!canContinue}
          onClick={onNext}
        >
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
  options: string[];
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
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      </div>
    </div>
  );
}

function ProgramDetailsStep({
  cohort,
  track,
  onCohortChange,
  onTrackChange,
  onCancel,
  onNext,
}: {
  cohort: string;
  track: string;
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
        <SimpleSelect
          label="Cohort"
          value={cohort}
          options={COHORTS}
          onChange={onCohortChange}
        />
        <SimpleSelect
          label="Track"
          value={track}
          options={TRACKS}
          onChange={onTrackChange}
        />
      </div>

      <DialogFooter>
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

function SingleReviewStep({
  name,
  email,
  cohort,
  track,
  onBack,
  onSend,
}: {
  name: string;
  email: string;
  cohort: string;
  track: string;
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
          <div>
            <p className="font-semibold text-neutral-900">{name}</p>
            <p className="text-sm text-neutral-500">{email}</p>
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

      <DialogFooter>
        <Button variant="secondary" size="medium" onClick={onBack}>
          Back
        </Button>
        <Button size="medium" onClick={onSend}>
          Send Invitation
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

      <div className="mt-6 flex items-center gap-3">
        <Button size="medium" onClick={onInviteAnother}>
          Invite another instructor
        </Button>
        <Button variant="secondary" size="medium" onClick={onViewInstructors}>
          View instructors
        </Button>
      </div>
    </div>
  );
}

function BulkUploadStep({
  onCancel,
  onBrowseFile,
}: {
  onCancel: () => void;
  onBrowseFile: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload Instructor CSV</DialogTitle>
        <DialogDescription>
          Upload a CSV file with instructors details, we&apos;ll help you
          assign them to a cohort and track.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 px-6 py-10 text-center">
        <Upload className="h-6 w-6 text-neutral-400" />
        <p className="font-medium text-neutral-900">
          Choose a file or drag & drop it here.
        </p>
        <p className="text-sm text-neutral-500">
          CSV format only, up to 10 MB.
        </p>
        <Button
          variant="secondary"
          size="medium"
          className="mt-2"
          onClick={onBrowseFile}
        >
          Browse File
        </Button>
      </div>

      <DialogFooter>
        <Button variant="secondary" size="medium" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="medium" disabled>
          Next
        </Button>
      </DialogFooter>
    </>
  );
}

function BulkUploadingStep({ fileName }: { fileName: string }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" />
          File Upload In Progress
        </DialogTitle>
      </DialogHeader>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-neutral-300 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-semantic-surface-error-badge text-semantic-text-error text-xs font-bold">
          CSV
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-900">{fileName}</p>
          <p className="text-xs text-neutral-500">Uploading...</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary-500" />
          </div>
        </div>
      </div>
    </>
  );
}

function BulkReviewStep({
  selectedRows,
  onToggleRow,
  selectedCount,
  onCancel,
  onNext,
}: {
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
          We found {BULK_PREVIEW.length} instructors in your file.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-300">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-100 text-xs tracking-wider text-neutral-500 uppercase">
            <tr>
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3">Email Address</th>
              <th className="px-4 py-3">Track</th>
            </tr>
          </thead>
          <tbody>
            {BULK_PREVIEW.map((row, index) => (
              <tr key={row.email} className="border-t border-neutral-200">
                <td className="px-4 py-3">
                  <button
                    type="button"
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
                  {row.name}
                </td>
                <td className="px-4 py-3 text-neutral-500">{row.email}</td>
                <td className="px-4 py-3 text-neutral-500">{row.track}</td>
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
          You&apos;re about to send track invitations to {selectedCount}{" "}
          selected instructors.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 rounded-xl border border-neutral-300 p-5">
        <p className="mb-3 flex items-center gap-2 font-semibold text-neutral-900">
          <UserPlus className="h-4 w-4" />
          Selected instructors by Track
        </p>
        {tracksSummary.map(([track, count]) => (
          <div
            key={track}
            className="flex items-center justify-between border-t border-neutral-200 py-3 text-sm first:border-t-0"
          >
            <span className="text-neutral-900">{track}</span>
            <span className="text-neutral-500">
              {count} instructor{count > 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button variant="secondary" size="medium" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="medium" onClick={onSend}>
          Send Invitation
        </Button>
      </DialogFooter>
    </>
  );
}
