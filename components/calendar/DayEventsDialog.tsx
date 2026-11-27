"use client";

import * as React from "react";

import { Add01, ArrowRight01, Calendar03 } from "@/assets/icons";
import { CalendarDialogHeader } from "@/components/calendar/CalendarDialog";
import {
  EventDetailsPopover,
  type OpenEvent,
} from "@/components/calendar/EventDetailsPopover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { longDate, timeRange, type CalendarEvent } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const kindLabels: Record<CalendarEvent["kind"], string> = {
  event: "Event",
  task: "Task",
  live: "Live session",
};

/** The open card with the latest copy of its event, e.g. once a task is ticked off. */
export function freshOpen(open: OpenEvent | null, events: CalendarEvent[]) {
  if (!open) return null;
  const event = events.find((e) => e.id === open.event.id);
  return event ? { ...open, event } : open;
}

/** Every event on one day of the month grid; each opens the usual details card. */
export function DayEventsDialog({
  date,
  events,
  onClose,
  onCreate,
  onEdit,
  onDelete,
  onToggleDone,
}: {
  date: Date | null;
  events: CalendarEvent[];
  onClose: () => void;
  /* Left out where nothing can be created, which hides the button. */
  onCreate?: (date: Date) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  onToggleDone?: (event: CalendarEvent, done: boolean) => void;
}) {
  const [openEvent, setOpenEvent] = React.useState<OpenEvent | null>(null);
  // Keep the last day while the dialog animates out.
  const [shown, setShown] = React.useState(date);
  if (date && date !== shown) setShown(date);

  return (
    <Dialog
      open={date !== null}
      onOpenChange={(open) => {
        if (!open) {
          setOpenEvent(null);
          onClose();
        }
      }}
    >
      <DialogContent showClose={false} className="w-[480px] bg-neutral-100 p-0 sm:p-0">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <CalendarDialogHeader title={shown ? longDate(shown) : ""} />
          <p className="mt-1 font-work text-sm text-text-muted">
            {events.length === 0
              ? "Nothing scheduled"
              : `${events.length} ${events.length === 1 ? "event" : "events"}`}
          </p>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-white text-icon-secondary">
              <Calendar03 className="size-5" />
            </span>
            <p className="mt-3 font-work text-sm text-text-secondary">
              There are no events on this day yet.
            </p>
          </div>
        ) : (
          <ul className="mt-4 flex max-h-[min(420px,55vh)] flex-col gap-2 overflow-y-auto px-5 sm:px-6">
            {events.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={(e) =>
                    shown &&
                    setOpenEvent({ event, date: shown, anchor: e.currentTarget })
                  }
                  className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:outline-none"
                >
                  <span
                    aria-hidden
                    className="h-10 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium text-text-primary",
                        event.done && "text-text-muted line-through",
                      )}
                    >
                      {event.title}
                    </span>
                    <span className="mt-0.5 block truncate font-work text-xs text-text-muted">
                      {event.allDay ? "All day" : timeRange(event.startTime, event.endTime)}
                      <span className="mx-1.5">·</span>
                      {kindLabels[event.kind]}
                    </span>
                  </span>
                  <ArrowRight01 className="size-4 shrink-0 text-icon-secondary" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {onCreate ? (
          <div className="mt-5 flex justify-end border-t border-neutral-200 px-5 py-4 sm:px-6">
            <Button
              size="medium"
              className="gap-1.5"
              onClick={() => shown && onCreate(shown)}
            >
              <Add01 className="size-5" />
              Create event
            </Button>
          </div>
        ) : (
          <div className="h-5 sm:h-6" />
        )}

        <EventDetailsPopover
          open={freshOpen(openEvent, events)}
          onClose={() => setOpenEvent(null)}
          onEdit={onEdit}
          onToggleDone={onToggleDone}
          onDelete={(event) => {
            setOpenEvent(null);
            onDelete(event);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
