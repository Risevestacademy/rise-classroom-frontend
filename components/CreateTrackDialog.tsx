"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Hash, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminKeys, createTrack, type CreateTrackInput } from "@/lib/admin";

type Step = "basics" | "review" | "success";

const STEP_WIDTH: Record<Step, string> = {
  basics: "w-[460px]",
  review: "w-[460px]",
  success: "w-[460px]",
};

const DESCRIPTION_MAX = 200;

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

export function CreateTrackDialog() {
  const queryClient = useQueryClient();

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("basics");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const createTrackMutation = useMutation({
    mutationFn: (input: CreateTrackInput) => createTrack(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.tracks() });
      setStep("success");
    },
  });

  function reset() {
    setStep("basics");
    setName("");
    setDescription("");
    createTrackMutation.reset();
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  const canContinue = name.trim().length > 0 && description.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Create track
      </Button>

      <DialogContent className={STEP_WIDTH[step]}>
        {step === "basics" && (
          <BasicsStep
            name={name}
            description={description}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            canContinue={canContinue}
            onCancel={() => handleOpenChange(false)}
            onNext={() => setStep("review")}
          />
        )}

        {step === "review" && (
          <ReviewStep
            name={name}
            description={description}
            isSending={createTrackMutation.isPending}
            error={createTrackMutation.error?.message ?? null}
            onBack={() => setStep("basics")}
            onCreate={() =>
              createTrackMutation.mutate({
                name: name.trim(),
                description: description.trim(),
              })
            }
          />
        )}

        {step === "success" && (
          <SuccessStep
            name={name.trim()}
            onCreateAnother={reset}
            onViewTracks={() => handleOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function BasicsStep({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  canContinue,
  onCancel,
  onNext,
}: {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  canContinue: boolean;
  onCancel: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Basic Information</DialogTitle>
        <DialogDescription>
          Let&apos;s start with the essentials
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col gap-6">
        <FormField
          label="Track name"
          required
          inputProps={{
            placeholder: "e.g Product Design",
            value: name,
            onChange: (e) => onNameChange(e.target.value),
            leadingIcon: null,
          }}
        />

        <Field.Root className="flex w-full flex-col">
          <Label required>Description</Label>
          <div className="mt-1.5">
            <Textarea
              placeholder="What will learners build or learn in this track?"
              value={description}
              maxLength={DESCRIPTION_MAX}
              showCount
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
          </div>
        </Field.Root>
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

function ReviewStep({
  name,
  description,
  isSending,
  error,
  onBack,
  onCreate,
}: {
  name: string;
  description: string;
  isSending: boolean;
  error: string | null;
  onBack: () => void;
  onCreate: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Review track</DialogTitle>
        <DialogDescription>
          Please review your track details before creating it
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 rounded-xl border border-neutral-300 p-5">
        <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <Hash className="h-5 w-5" />
          </span>
          <p className="truncate font-semibold text-neutral-900">{name}</p>
        </div>

        <div className="pt-4 text-sm">
          <span className="text-neutral-500">Description:</span>
          <p className="mt-1 text-neutral-900">
            {description.trim() || "No description added."}
          </p>
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
        <Button size="medium" disabled={isSending} onClick={onCreate}>
          {isSending ? "Creating…" : "Create track"}
        </Button>
      </DialogFooter>
    </>
  );
}

function SuccessStep({
  name,
  onCreateAnother,
  onViewTracks,
}: {
  name: string;
  onCreateAnother: () => void;
  onViewTracks: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-semantic-surface-success-badge">
        <CheckCircle2 className="h-10 w-10 text-semantic-text-success" />
      </span>
      <h2 className="mt-6 text-xl font-bold text-neutral-900">
        Track created successfully
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        The {name} track has been added to your program.
      </p>

      <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center">
        <Button
          variant="secondary"
          size="medium"
          onClick={onCreateAnother}
          className="w-full sm:w-auto"
        >
          Create another track
        </Button>
        <Button
          size="medium"
          onClick={onViewTracks}
          className="w-full sm:w-auto"
        >
          View track overview
        </Button>
      </div>
    </div>
  );
}
