"use client";

import * as React from "react";
import Image from "next/image";
import { Field } from "@base-ui/react/field";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileDropzone, type UploadedFile } from "@/components/ui/file-upload";
import { Hint, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  experienceRatings,
  feedbackImageExtensions,
  feedbackImageMaxBytes,
  feedbackTopics,
  submitFeedback,
  type FeedbackKind,
} from "@/lib/feedback";
import { cn } from "@/lib/utils";

const copy: Record<
  FeedbackKind,
  {
    title: string;
    description: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitLabel: string;
  }
> = {
  problem: {
    title: "Report a problem",
    description: "Tell us what's happening. We'll look into it",
    messageLabel: "Description",
    messagePlaceholder: "Describe the problem",
    submitLabel: "Submit",
  },
  improvement: {
    title: "Suggest an improvement",
    description: "Have an idea? We'd love to hear it",
    messageLabel: "Tell us more",
    messagePlaceholder: "Describe your idea and how it would help",
    submitLabel: "Submit feedback",
  },
  experience: {
    title: "Share your experience",
    description: "Tell us what you think about using Rise Classroom.",
    messageLabel: "What's going well? What could be better?",
    messagePlaceholder: "Tell us what's working for you and what isn't",
    submitLabel: "Submit feedback",
  },
};

type Screenshot = UploadedFile & { file: File };

/* One dialog for the three "Help & Feedback" forms. Problem reports and suggestions need a message; the experience form needs a rating instead.*/
export function FeedbackDialog({
  kind,
  onOpenChange,
  onSubmitted,
}: {
  /** The form to show, or null when closed. */
  kind: FeedbackKind | null;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}) {
  return (
    <Dialog open={kind !== null} onOpenChange={onOpenChange}>
      <DialogContent className="w-130">
        {/* Keyed so each opening starts from an empty form. */}
        {kind && (
          <FeedbackForm key={kind} kind={kind} onSubmitted={onSubmitted} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FeedbackForm({
  kind,
  onSubmitted,
}: {
  kind: FeedbackKind;
  onSubmitted: () => void;
}) {
  const text = copy[kind];
  const isExperience = kind === "experience";

  const [topic, setTopic] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const [rating, setRating] = React.useState<number | null>(null);
  const [screenshots, setScreenshots] = React.useState<Screenshot[]>([]);

  const submit = useMutation({
    mutationFn: () =>
      submitFeedback({
        kind,
        topic,
        message: message.trim(),
        rating: rating ?? undefined,
        image: screenshots[0]?.file,
      }),
    onSuccess: onSubmitted,
  });

  const canSubmit =
    !submit.isPending &&
    (isExperience
      ? rating !== null
      : topic !== null && message.trim().length > 0);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSubmit) submit.mutate();
  }

  const topics = (
    <div
      role="group"
      aria-label={isExperience ? "What area is this about" : "Topic"}
      className="flex flex-wrap gap-2"
    >
      {feedbackTopics[kind].map((option) => {
        const active = option === topic;
        return (
          <Button
            key={option}
            type="button"
            variant={active ? "primary" : "secondary"}
            size="sm"
            pill
            aria-pressed={active}
            // Picking the selected chip again clears it.
            onClick={() => setTopic(active ? null : option)}
          >
            {option}
          </Button>
        );
      })}
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{text.title}</DialogTitle>
        <DialogDescription>{text.description}</DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col gap-6">
        {isExperience ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-medium text-neutral-700">
              How would you rate your overall experience?
            </legend>
            <div className="grid grid-cols-5 gap-2">
              {experienceRatings.map((option) => {
                const active = option.value === rating;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setRating(option.value)}
                    className="group flex cursor-pointer flex-col items-center gap-2 rounded-lg py-1 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full transition-colors",
                        active
                          ? "bg-interactive-primary-default"
                          : "bg-surface-subtle group-hover:bg-neutral-200",
                      )}
                    >
                      <Image src={option.image} alt="" width={24} height={24} />
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        active
                          ? "font-medium text-text-primary"
                          : "text-text-secondary",
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : (
          topics
        )}

        <Field.Root>
          <Label required={!isExperience}>{text.messageLabel}</Label>
          <div className="mt-1.5">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={text.messagePlaceholder}
              className="min-h-24"
            />
          </div>
          {kind === "problem" && (
            <Hint>
              Please avoid sharing passwords or sensitive information.
            </Hint>
          )}
        </Field.Root>

        {isExperience ? (
          <div className="flex flex-col gap-3">
            <span className="flex items-center gap-1 text-sm font-medium text-neutral-700">
              What area is this about?
              <span className="text-xs text-neutral-300">(Optional)</span>
            </span>
            {topics}
          </div>
        ) : (
          <FileDropzone
            label="Add a screenshot or reference"
            optional
            files={screenshots}
            onChange={setScreenshots}
            createFile={(file) => ({
              id: crypto.randomUUID(),
              name: file.name,
              sizeBytes: file.size,
              file,
            })}
            extensions={feedbackImageExtensions}
            maxBytes={feedbackImageMaxBytes}
            formatsLabel="JPEG or PNG"
            multiple={false}
          />
        )}
      </div>

      {submit.isError && (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-lg border border-border-error bg-surface-error-badge px-4 py-3 text-sm text-text-error"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {submit.error instanceof Error && submit.error.message
              ? submit.error.message
              : "Something went wrong. Please try again."}
          </span>
        </p>
      )}

      <DialogFooter className="sm:justify-end">
        <Button type="submit" disabled={!canSubmit}>
          {submit.isPending ? "Sending…" : text.submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
