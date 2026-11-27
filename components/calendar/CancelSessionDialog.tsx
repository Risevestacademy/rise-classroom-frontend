"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ScopeChoice } from "@/components/calendar/LiveSessionForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CalendarEvent } from "@/lib/calendar";
import { deleteCalendarItem, type SeriesScope } from "@/lib/calendar-events";
import { liveSessionKeys } from "@/lib/live-sessions";

/** A calendar entry or a session from the Live Sessions list. */
type CancellableSession = Pick<CalendarEvent, "id" | "title" | "seriesId"> &
  Partial<Pick<CalendarEvent, "kind">>;

const copy = {
  live: {
    title: "Cancel live session",
    question: "Cancel",
    note: "Everyone invited will be told.",
    noun: "session",
    keep: "Keep session",
    confirm: "Cancel session",
    pending: "Cancelling…",
    failed: "We couldn't cancel the session. Please try again.",
  },
  event: {
    title: "Delete event",
    question: "Delete",
    note: "It's removed for everyone invited.",
    noun: "event",
    keep: "Keep event",
    confirm: "Delete event",
    pending: "Deleting…",
    failed: "We couldn't delete the event. Please try again.",
  },
  task: {
    title: "Delete task",
    question: "Delete",
    note: "It's removed for everyone invited.",
    noun: "task",
    keep: "Keep task",
    confirm: "Delete task",
    pending: "Deleting…",
    failed: "We couldn't delete the task. Please try again.",
  },
};

/**
 * Asks before cancelling a live session, since everyone invited is told, or
 * before deleting an event or task that repeats, to pick which occurrences go.
 */
export function CancelSessionDialog({
  event,
  onOpenChange,
  onCancelled,
}: {
  /** The entry to cancel; null keeps the dialog closed. */
  event: CancellableSession | null;
  onOpenChange: (open: boolean) => void;
  onCancelled: (title: string) => void;
}) {
  return (
    <Dialog open={event !== null} onOpenChange={onOpenChange}>
      <DialogContent className="w-130">
        {event && (
          <CancelSessionForm
            key={event.id}
            event={event}
            onClose={() => onOpenChange(false)}
            onCancelled={onCancelled}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CancelSessionForm({
  event,
  onClose,
  onCancelled,
}: {
  event: CancellableSession;
  onClose: () => void;
  onCancelled: (title: string) => void;
}) {
  const queryClient = useQueryClient();
  const [scope, setScope] = React.useState<SeriesScope>("this");
  const repeating = Boolean(event.seriesId);
  const text = copy[event.kind ?? "live"];

  const cancel = useMutation({
    mutationFn: () =>
      deleteCalendarItem(event.id, repeating ? scope : undefined),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: liveSessionKeys.all });
      onCancelled(event.title);
      onClose();
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{text.title}</DialogTitle>
        <DialogDescription>
          {text.question} &ldquo;{event.title}&rdquo;? {text.note}
        </DialogDescription>
      </DialogHeader>

      {repeating && (
        <div className="mt-5">
          <ScopeChoice
            label={text.question}
            options={[
              { value: "this", label: `This ${text.noun}` },
              { value: "following", label: `This and following ${text.noun}s` },
              { value: "all", label: `All ${text.noun}s` },
            ]}
            value={scope}
            onChange={setScope}
          />
        </div>
      )}

      {cancel.isError && (
        <p role="alert" className="mt-4 text-sm text-text-error">
          {cancel.error.message || text.failed}
        </p>
      )}

      <DialogFooter className="mt-6 sm:justify-end">
        <Button variant="secondary" size="medium" onClick={onClose}>
          {text.keep}
        </Button>
        <Button
          variant="primary"
          size="medium"
          disabled={cancel.isPending}
          onClick={() => cancel.mutate()}
        >
          {cancel.isPending ? text.pending : text.confirm}
        </Button>
      </DialogFooter>
    </>
  );
}
