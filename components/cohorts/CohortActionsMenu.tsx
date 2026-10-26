"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CircleCheck, RotateCcw } from "lucide-react";

import { MoreHorizontal } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCohortErrorMessage } from "@/lib/admin";
import { cohortKeys, setCohortStatus } from "@/lib/cohorts";
import { cn } from "@/lib/utils";
import type {
  CohortStatus,
  CohortSummary,
} from "@/app/admin/cohorts/cohort-data";

export type StatusAction = "complete" | "terminate" | "reactivate";

const statusActions: Record<
  StatusAction,
  {
    status: CohortStatus;
    menuLabel: string;
    title: string;
    description: (name: string) => string;
    confirmLabel: string;
    pendingLabel: string;
    doneTitle: string;
    doneMessage: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: "success" | "error" | "info";
  }
> = {
  complete: {
    status: "completed",
    menuLabel: "Mark as completed",
    title: "Mark cohort as completed?",
    description: (name) =>
      `“${name}” will move to completed cohorts and stop counting down.`,
    confirmLabel: "Yes, Complete",
    pendingLabel: "Completing…",
    doneTitle: "Cohort completed",
    doneMessage: "has been marked as completed",
    icon: CircleCheck,
    tone: "success",
  },
  terminate: {
    status: "terminated",
    menuLabel: "Terminate cohort",
    title: "Terminate cohort?",
    description: (name) =>
      `“${name}” will be ended early and marked as terminated. You can reactivate it later.`,
    confirmLabel: "Yes, Terminate",
    pendingLabel: "Terminating…",
    doneTitle: "Cohort terminated",
    doneMessage: "has been terminated",
    icon: Ban,
    tone: "error",
  },
  reactivate: {
    status: "active",
    menuLabel: "Reactivate cohort",
    title: "Reactivate cohort?",
    description: (name) =>
      `“${name}” will become active again, or upcoming if its start date is still ahead.`,
    confirmLabel: "Yes, Reactivate",
    pendingLabel: "Reactivating…",
    doneTitle: "Cohort reactivated",
    doneMessage: "is running again",
    icon: RotateCcw,
    tone: "info",
  },
};

const toneClass = {
  success: "bg-success-surface text-text-success",
  error: "bg-surface-error-badge text-text-error",
  info: "bg-info-surface text-text-info",
};

const itemClass =
  "flex cursor-pointer rounded-md px-3 py-2 text-neutral-700 outline-none data-highlighted:bg-neutral-100";

/** The "…" menu on a cohort card. */
export function CohortActionsMenu({
  cohort,
  onStatusChanged,
}: {
  cohort: CohortSummary;
  onStatusChanged: (toast: { title: string; message: string }) => void;
}) {
  const [action, setAction] = React.useState<StatusAction | null>(null);
  const ended = cohort.status === "completed" || cohort.status === "terminated";

  return (
    <>
      <Menu.Root>
        
        <Menu.Trigger
          aria-label={`${cohort.name} options`}
          className={cn(
            "relative z-10 flex size-8 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-neutral-100",
            cohort.status === "completed"
              ? "bg-success-surface"
              : cohort.status === "terminated"
                ? "bg-surface-error-badge"
                : cohort.status === "upcoming"
                  ? "bg-info-surface"
                  : "bg-brand-50",
          )}
        >
          <MoreHorizontal className="size-4" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={6} className="z-50">
            <Menu.Popup className="w-48 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none">
              <Menu.Item
                render={<Link href={`/admin/cohorts/${cohort.id}`} />}
                className={itemClass}
              >
                View details
              </Menu.Item>
              {ended ? (
                <Menu.Item
                  onClick={() => setAction("reactivate")}
                  className={itemClass}
                >
                  Reactivate cohort
                </Menu.Item>
              ) : (
                <>
                  <Menu.Item
                    onClick={() => setAction("complete")}
                    className={itemClass}
                  >
                    Mark as completed
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => setAction("terminate")}
                    className="flex cursor-pointer rounded-md px-3 py-2 text-text-error outline-none data-highlighted:bg-surface-error-badge"
                  >
                    Terminate cohort
                  </Menu.Item>
                </>
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <CohortStatusDialog
        cohort={cohort}
        action={action}
        onClose={() => setAction(null)}
        onStatusChanged={onStatusChanged}
      />
    </>
  );
}

/** Confirms completing, terminating or reactivating a cohort, then saves it. */
export function CohortStatusDialog({
  cohort,
  action,
  onClose,
  onStatusChanged,
}: {
  cohort: { id: string; name: string };
  action: StatusAction | null;
  onClose: () => void;
  onStatusChanged: (toast: { title: string; message: string }) => void;
}) {
  const queryClient = useQueryClient();
  const statusMutation = useMutation({
    mutationFn: (next: StatusAction) =>
      setCohortStatus(cohort.id, statusActions[next].status),
    onSuccess: (_, next) => {
      queryClient.invalidateQueries({ queryKey: cohortKeys.all() });
      onClose();
      onStatusChanged({
        title: statusActions[next].doneTitle,
        message: `“${cohort.name}” ${statusActions[next].doneMessage}`,
      });
    },
  });

  // Each opening starts without the previous attempt's error.
  const { reset } = statusMutation;
  React.useEffect(() => {
    if (action) reset();
  }, [action, reset]);

  const current = action ? statusActions[action] : null;

  return (
    <Dialog
      open={action !== null}
      onOpenChange={(open) => {
        if (!open && !statusMutation.isPending) onClose();
      }}
    >
      {current && action && (
        <DialogContent
          showClose={false}
          className="flex w-[370px] flex-col items-center text-center sm:p-6"
        >
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              toneClass[current.tone],
            )}
          >
            <current.icon className="h-4 w-4" />
          </span>
          <DialogTitle className="mt-5 text-base font-semibold">
            {current.title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-neutral-500">
            {current.description(cohort.name)}
          </DialogDescription>
          {statusMutation.isError && (
            <p className="mt-3 text-sm text-text-error">
              {getCohortErrorMessage(statusMutation.error)}
            </p>
          )}
          <div className="mt-5 flex gap-2">
            <DialogClose
              disabled={statusMutation.isPending}
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
              variant={current.tone === "error" ? "destructive" : "primary"}
              size="lg"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(action)}
            >
              {statusMutation.isPending
                ? current.pendingLabel
                : current.confirmLabel}
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
