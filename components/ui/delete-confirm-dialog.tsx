"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  isPending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  isPending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="flex w-[370px] flex-col items-center text-center sm:p-6"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-error-badge text-text-error">
          <Trash2 className="h-4 w-4" />
        </span>
        <DialogTitle className="mt-5 text-base font-semibold">
          Delete {itemName}?
        </DialogTitle>
        <DialogDescription className="mt-2 text-neutral-500">
          Are you sure you want to delete &ldquo;{itemName}&rdquo;? This action
          can&apos;t be undone.
        </DialogDescription>
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
            No, Keep it
          </DialogClose>
          <Button
            variant="destructive"
            size="lg"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? "Deleting…" : "Yes, Delete!"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
