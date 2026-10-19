"use client";

import * as React from "react";
import { Popover } from "@base-ui/react/popover";

import {
  ArrowDown01,
  Calendar03,
  Cancel01,
  Copy01,
  Delete02,
  Edit02,
  MoreVertical,
  Notification02,
  UserMultiple,
  Video,
} from "@/assets/icons";
import {
  describeNotification,
  describeRepeat,
  fromDateKey,
  longDate,
  timeRange,
  type CalendarEvent,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

export type OpenEvent = {
  event: CalendarEvent;
  /** The occurrence that was clicked. */
  date: Date;
  anchor: HTMLElement;
};

const iconButton =
  "flex size-10 items-center justify-center rounded-lg text-icon-secondary hover:bg-neutral-200";

/** The card that opens from an event in the month grid. */
export function EventDetailsPopover({
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  open: OpenEvent | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}) {
  return (
    <Popover.Root
      open={open !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Popover.Portal>
        <Popover.Positioner
          anchor={open?.anchor}
          side="right"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-40"
        >
          <Popover.Popup className="w-[446px] max-w-[calc(100vw-2rem)] rounded-3xl bg-neutral-100 pb-6 shadow-[0_4px_4px_rgb(0_0_0/0.25)] outline-none">
            {open && (
              <EventDetails
                key={open.event.id}
                {...open}
                onClose={onClose}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function EventDetails({
  event,
  date,
  onClose,
  onEdit,
  onDelete,
}: OpenEvent & {
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}) {
  const [guestsOpen, setGuestsOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const linkLabel = event.link.replace(/^https?:\/\//, "");

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(event.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the link stays visible to copy by hand.
    }
  };

  return (
    <>
      <div className="flex justify-end pt-3.5 pr-3.5">
        <button
          type="button"
          aria-label="Edit event"
          onClick={() => onEdit(event)}
          className={iconButton}
        >
          <Edit02 className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Delete event"
          onClick={() => onDelete(event)}
          className={iconButton}
        >
          <Delete02 className="size-5" />
        </button>
        {/* Kept from the design; it has no menu designed yet. */}
        <button type="button" aria-label="More options" className={iconButton}>
          <MoreVertical className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className={iconButton}
        >
          <Cancel01 className="size-5" />
        </button>
      </div>

      <div className="mt-[13px] grid grid-cols-[39px_minmax(0,1fr)] px-6 text-text-primary">
        <span
          aria-hidden
          className="mt-px h-7 w-3.5 rounded-[3px]"
          style={{ backgroundColor: event.color }}
        />
        <div>
          <Popover.Title className="text-xl leading-7 font-semibold">
            {event.title}
          </Popover.Title>
          <p className="mt-0.5 font-work text-sm leading-[22px]">
            {longDate(date)}
            {!event.allDay && (
              <>
                <span className="mx-2">·</span>
                {timeRange(event.startTime, event.endTime)}
              </>
            )}
          </p>
          {event.repeat && (
            <p className="font-work text-sm leading-[22px]">
              {describeRepeat(event.repeat, fromDateKey(event.date))}
            </p>
          )}
        </div>

        {event.link && (
          <>
            <div className="col-start-2 mt-[13px] flex items-center justify-between gap-3">
              <a
                href={event.link}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center gap-2 rounded-full bg-brand-900 px-4 text-sm font-medium text-white hover:bg-brand-800"
              >
                <Video className="size-[17px]" />
                Join with Rise Campus
              </a>
              <button
                type="button"
                aria-label={copied ? "Link copied" : "Copy link"}
                title={copied ? "Copied" : "Copy link"}
                onClick={copyLink}
                className="rounded-md text-icon-secondary hover:text-text-primary"
              >
                <Copy01 className="size-6" />
              </button>
            </div>
            <p className="col-start-2 mt-2.5 truncate font-work text-[13px] leading-5 text-text-secondary">
              {copied ? "Link copied" : linkLabel}
            </p>
          </>
        )}

        <dl className="col-span-2 mt-[22px] grid grid-cols-[39px_minmax(0,1fr)] gap-y-3 font-work text-sm leading-5">
          {event.guests.length > 0 && (
            <>
              <dt className="flex h-5 items-center">
                <UserMultiple className="size-4 text-icon-secondary" />
                <span className="sr-only">Guests</span>
              </dt>
              <dd>
                <button
                  type="button"
                  aria-expanded={guestsOpen}
                  onClick={() => setGuestsOpen((o) => !o)}
                  className="flex w-full items-center justify-between"
                >
                  {event.guests.length} guest
                  {event.guests.length === 1 ? "" : "s"}
                  <ArrowDown01
                    className={cn(
                      "size-5 text-icon-secondary transition-transform",
                      guestsOpen && "rotate-180",
                    )}
                  />
                </button>
                {guestsOpen && (
                  <ul className="mt-2 flex max-h-[128px] flex-col gap-1 overflow-y-auto text-text-secondary">
                    {event.guests.map((guest) => (
                      <li key={guest.id} className="truncate">
                        {guest.name}
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </>
          )}

          {event.notifications.length > 0 && (
            <>
              <dt className="flex h-5 items-center">
                <Notification02 className="size-4 text-icon-secondary" />
                <span className="sr-only">Notification</span>
              </dt>
              <dd>
                {event.notifications.map(describeNotification).join(", ")}
              </dd>
            </>
          )}

          <dt className="flex h-5 items-center">
            <Calendar03 className="size-4 text-icon-secondary" />
            <span className="sr-only">Organizer</span>
          </dt>
          <dd className="truncate">{event.organizer}</dd>
        </dl>
      </div>
    </>
  );
}
