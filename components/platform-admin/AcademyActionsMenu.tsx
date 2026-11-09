"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, PauseCircle, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { platformKeys, updateAcademyStatus, type Academy } from "@/lib/platform";

export function AcademyActionsMenu({ academy }: { academy: Academy }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = React.useState(false);
  const suspended = academy.status === "SUSPENDED";

  const statusMutation = useMutation({
    mutationFn: () =>
      updateAcademyStatus(academy.id, suspended ? "ACTIVE" : "SUSPENDED"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformKeys.academies });
      setConfirming(false);
    },
  });

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          aria-label={`${academy.name} actions`}
          className="rounded-md p-1 text-neutral-800 hover:bg-neutral-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={6} className="z-50">
            <Menu.Popup className="w-44 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none">
              <Menu.Item
                onClick={() => setConfirming(true)}
                className="flex cursor-pointer rounded-md px-3 py-2 text-neutral-700 outline-none data-highlighted:bg-neutral-100"
              >
                {suspended ? "Reactivate academy" : "Suspend academy"}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          if (open) return;
          setConfirming(false);
          statusMutation.reset();
        }}
      >
        <DialogContent
          showClose={false}
          className="flex w-[370px] flex-col items-center text-center sm:p-6"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-warning-badge text-text-warning">
            {suspended ? (
              <PlayCircle className="h-4 w-4" />
            ) : (
              <PauseCircle className="h-4 w-4" />
            )}
          </span>
          <DialogTitle className="mt-5 text-base font-semibold">
            {suspended ? "Reactivate" : "Suspend"} {academy.name}?
          </DialogTitle>
          <DialogDescription className="mt-2 text-neutral-500">
            {suspended
              ? "Everyone at this academy will be able to sign in again, with all their data as they left it."
              : "Everyone at this academy will be blocked from signing in straight away. Their data is kept, and you can reactivate it at any time."}
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
                ? "Saving…"
                : suspended
                  ? "Yes, reactivate"
                  : "Yes, suspend"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
