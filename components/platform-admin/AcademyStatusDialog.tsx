"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PauseCircle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { platformKeys, updateAcademyStatus, type Academy } from "@/lib/platform";

export function AcademyStatusDialog({
  academy,
  open,
  onOpenChange,
}: {
  academy: Academy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const suspended = academy.status === "SUSPENDED";

  const statusMutation = useMutation({
    mutationFn: () =>
      updateAcademyStatus(academy.id, suspended ? "ACTIVE" : "SUSPENDED"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformKeys.academies });
      onOpenChange(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) statusMutation.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        showClose={false}
        className="flex w-[480px] flex-col items-center text-center sm:p-6"
      >
        <span
          className={
            suspended
              ? "flex size-10 items-center justify-center rounded-lg bg-surface-success-badge text-text-success"
              : "flex size-10 items-center justify-center rounded-lg bg-surface-error-badge text-text-error"
          }
        >
          {suspended ? <RotateCcw className="size-4" /> : <PauseCircle className="size-4" />}
        </span>
        <DialogTitle className="mt-5 text-base font-semibold">
          {suspended ? "Reactivate this academy?" : "Suspend this academy?"}
        </DialogTitle>
        <DialogDescription className="mt-2 text-neutral-500">
          {suspended
            ? `Reactivating ${academy.name} will restore access to Rise Classroom for all its users.`
            : `Suspending ${academy.name} will restrict access to Rise Classroom for its users. The academy's data will remain safe and can be restored later.`}
        </DialogDescription>
        {statusMutation.isError && (
          <p role="alert" className="mt-3 text-xs text-text-error">
            {statusMutation.error.message}
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
            variant={suspended ? "primary" : "destructive"}
            size="lg"
            disabled={statusMutation.isPending}
            onClick={() => statusMutation.mutate()}
          >
            {statusMutation.isPending
              ? suspended
                ? "Reactivating…"
                : "Suspending…"
              : suspended
                ? "Reactivate academy"
                : "Suspend academy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
