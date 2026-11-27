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
import {
  calendarKeys,
  deleteCalendarItem,
  type SeriesScope,
} from "@/lib/calendar-events";

const scopes: { value: SeriesScope; label: string }[] = [
  { value: "this", label: "This session" },
  { value: "following", label: "This and following sessions" },
  { value: "all", label: "All sessions" },
];

/** Asks before cancelling a live session, since everyone invited is told. */
export function CancelSessionDialog({
  event,
  onOpenChange,
  onCancelled,
}: {
  /** The session to cancel; null keeps the dialog closed. */
  event: CalendarEvent | null;
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
  event: CalendarEvent;
  onClose: () => void;
  onCancelled: (title: string) => void;
}) {
  const queryClient = useQueryClient();
  const [scope, setScope] = React.useState<SeriesScope>("this");
  const repeating = Boolean(event.seriesId);

  const cancel = useMutation({
    mutationFn: () =>
      deleteCalendarItem(event.id, repeating ? scope : undefined),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      onCancelled(event.title);
      onClose();
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cancel live session</DialogTitle>
        <DialogDescription>
          Cancel &ldquo;{event.title}&rdquo;? Everyone invited will be told.
        </DialogDescription>
      </DialogHeader>

      {repeating && (
        <div className="mt-5">
          <ScopeChoice
            label="Cancel"
            options={scopes}
            value={scope}
            onChange={setScope}
          />
        </div>
      )}

      {cancel.isError && (
        <p role="alert" className="mt-4 text-sm text-text-error">
          {cancel.error.message ||
            "We couldn't cancel the session. Please try again."}
        </p>
      )}

      <DialogFooter className="mt-6 sm:justify-end">
        <Button variant="secondary" size="medium" onClick={onClose}>
          Keep session
        </Button>
        <Button
          variant="primary"
          size="medium"
          disabled={cancel.isPending}
          onClick={() => cancel.mutate()}
        >
          {cancel.isPending ? "Cancelling…" : "Cancel session"}
        </Button>
      </DialogFooter>
    </>
  );
}
