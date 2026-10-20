"use client";

import { X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
} from "@/components/ui/dialog";

/** Bottom sheet that slides up over the page; the caller renders a DialogTitle inside. */
export function DetailSheet({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showClose={false}
        className="top-auto bottom-0 h-[calc(100dvh-10rem)] max-h-none w-[min(1100px,calc(100vw-2rem))] translate-y-0 overflow-visible rounded-b-none rounded-t-3xl border-none p-0 sm:p-0"
      >
        <DialogClose
          aria-label="Close"
          className="absolute -top-14 right-0 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-neutral-800 shadow-sm hover:bg-neutral-100"
        >
          <X className="h-5 w-5" />
        </DialogClose>
        <div className="h-full overflow-y-auto p-5 sm:p-10">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

/** Label/value rows used in the sheets' details cards. */
export function DetailRows({
  rows,
}: {
  rows: { label: string; value: React.ReactNode }[];
}) {
  return (
    <dl className="mt-4 flex flex-col gap-6 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4">
          <dt className="text-neutral-500">{row.label}:</dt>
          <dd className="text-right font-medium text-neutral-700">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
