"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MessageCircleQuestion, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  approveApplication,
  declineApplication,
  platformKeys,
  requestApplicationInfo,
  type OrganizationApplication,
} from "@/lib/platform";
import { cn } from "@/lib/utils";

export type ApplicationDecision = "approve" | "decline" | "request-info";

/* The API's limit for a decline reason and for a question. */
const messageLimit = 2000;

type DecisionCopy = {
  title: string;
  action: string;
  working: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "positive" | "negative";
  describe: (application: OrganizationApplication) => string;
  /* What the admin has to write before going ahead, if anything. */
  message?: { label: string; placeholder: string };
  send: (applicationId: string, message: string) => Promise<unknown>;
};

const decisions: Record<ApplicationDecision, DecisionCopy> = {
  approve: {
    title: "Approve this application?",
    action: "Approve application",
    working: "Approving…",
    icon: CheckCircle2,
    tone: "positive",
    describe: ({ academyName, fullName }) =>
      `This creates ${academyName} and emails ${fullName} a link to set it up. The link is valid for 7 days.`,
    send: (id) => approveApplication(id),
  },
  decline: {
    title: "Decline this application?",
    action: "Decline application",
    working: "Declining…",
    icon: XCircle,
    tone: "negative",
    describe: ({ academyName, fullName }) =>
      `${academyName} won't be created. ${fullName} isn't emailed, and can apply again.`,
    message: {
      label: "Reason for declining",
      placeholder: "Only you and other platform admins see this",
    },
    send: declineApplication,
  },
  "request-info": {
    title: "Ask for more information?",
    action: "Send question",
    working: "Sending…",
    icon: MessageCircleQuestion,
    tone: "positive",
    describe: ({ fullName }) =>
      `${fullName} is emailed your question with a link to answer it, valid for 7 days. You can still approve or decline while you wait.`,
    message: {
      label: "Your question",
      placeholder: "The applicant sees this in the email and on the answer page",
    },
    send: requestApplicationInfo,
  },
};

/* Asks before approving or declining an application, or asking its applicant
   a question. Declining needs a reason and asking needs the question; both
   are kept in the application's history. */
export function ApplicationDecisionDialog({
  application,
  decision,
  onClose,
}: {
  application: OrganizationApplication;
  /* Null while the dialog is closed. */
  decision: ApplicationDecision | null;
  onClose: () => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const [message, setMessage] = React.useState("");
  /* Keeps the wording steady while the dialog closes. */
  const [shown, setShown] = React.useState<ApplicationDecision>("approve");
  if (decision && decision !== shown) {
    setShown(decision);
    setMessage("");
  }
  const copy = decisions[shown];
  const Icon = copy.icon;
  const negative = copy.tone === "negative";

  const decide = useMutation({
    mutationFn: () => copy.send(application.id, message.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformKeys.all });
      setMessage("");
      onClose();
    },
  });

  return (
    <Dialog
      open={decision !== null}
      onOpenChange={(open) => {
        if (open) return;
        decide.reset();
        onClose();
      }}
    >
      <DialogContent
        showClose={false}
        className="flex w-[480px] flex-col items-center text-center sm:p-6"
      >
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            negative
              ? "bg-surface-error-badge text-text-error"
              : "bg-surface-success-badge text-text-success",
          )}
        >
          <Icon className="size-4" />
        </span>
        <DialogTitle className="mt-5 text-base font-semibold">
          {copy.title}
        </DialogTitle>
        <DialogDescription className="mt-2 text-neutral-500">
          {copy.describe(application)}
        </DialogDescription>

        {copy.message && (
          <label className="mt-4 flex w-full flex-col gap-1 text-left">
            <span className="font-work text-sm font-medium text-text-primary">
              {copy.message.label}
            </span>
            <textarea
              value={message}
              maxLength={messageLimit}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={copy.message.placeholder}
              className="min-h-24 w-full resize-y rounded-lg border border-neutral-200 p-3 font-work text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary"
            />
          </label>
        )}

        {decide.isError && (
          <p role="alert" className="mt-3 text-xs text-text-error">
            {decide.error.message}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <DialogClose
            render={
              <Button
                variant="secondary"
                size="lg"
                className="border-neutral-200 text-neutral-800"
              />
            }
          >
            Cancel
          </DialogClose>
          <Button
            variant={negative ? "destructive" : "primary"}
            size="lg"
            disabled={
              decide.isPending || (Boolean(copy.message) && !message.trim())
            }
            onClick={() => decide.mutate()}
          >
            {decide.isPending ? copy.working : copy.action}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
