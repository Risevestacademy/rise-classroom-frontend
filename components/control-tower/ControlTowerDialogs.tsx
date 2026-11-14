"use client";

import { CircleAlert, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const steps = [
  { title: "Plan", body: "Set what you want to focus on and achieve this week." },
  {
    title: "Check in",
    body: "Note what came out of your mentor meeting and how you are progressing.",
  },
  {
    title: "Reflect",
    body: "Write what went well, what didn’t and what you will do differently.",
  },
];

export function HowItWorksDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="w-130 sm:p-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
          <Info className="h-6 w-6" />
        </span>
        <DialogTitle className="mt-6 text-lg font-semibold">
          How Control Tower works
        </DialogTitle>
        <DialogDescription className="mt-1 text-neutral-500">
          Control Tower is your weekly check-in. Fill it in once a week to plan,
          track your progress with your mentor and reflect.
        </DialogDescription>

        <ol className="mt-6 flex flex-col gap-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-800">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-neutral-800">{step.title}</p>
                <p className="mt-0.5 text-sm text-neutral-500">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-6 rounded-lg bg-neutral-100 px-3 py-2.5 text-xs/5 text-neutral-500">
          Save your entry before the end-of-week deadline to mark the week
          Completed. A week left empty is marked Missed, but you can still fill
          it in later.
        </p>

        <DialogClose render={<Button size="lg" className="mt-6 w-full" />}>
          Got it
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

export function DiscardChangesDialog({
  open,
  weekNumber,
  onKeepEditing,
  onDiscard,
}: {
  open: boolean;
  weekNumber: number;
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onKeepEditing()}>
      <DialogContent showClose={false} className="w-110 sm:p-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-warning-badge text-text-warning">
          <CircleAlert className="h-6 w-6" />
        </span>
        <DialogTitle className="mt-6 text-lg font-semibold">
          Discard your changes?
        </DialogTitle>
        <DialogDescription className="mt-1 text-neutral-500">
          You have unsaved changes on Week {weekNumber}. If you leave now, they
          won&apos;t be saved.
        </DialogDescription>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" onClick={onKeepEditing}>
            Keep editing
          </Button>
          <Button size="lg" onClick={onDiscard}>
            Discard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
