"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { ArrowDown01, Attachment, Cancel01, Track } from "@/assets/icons";
import {
  CalendarDialogActions,
  CalendarDialogHeader,
} from "@/components/calendar/CalendarDialog";
import {
  DateTimeRow,
  DescriptionField,
  GuestsField,
  KindToggle,
  labelClass,
  minutesOf,
  RepeatField,
  times,
  TitleField,
} from "@/components/calendar/EventFields";
import { LiveSessionForm } from "@/components/calendar/LiveSessionForm";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectInput, SelectInput } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { adminQueries } from "@/lib/admin";
import {
  addDays,
  describeNotification,
  eventColors,
  fromDateKey,
  toDateKey,
  type CalendarEvent,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

export type EventDraft = Omit<CalendarEvent, "id" | "organizer">;

const notificationOptions = [5, 10, 15, 30, 60, 1440, 10080];

/** A fresh event starting at the next half hour on `date`. */
export function blankDraft(date: Date): EventDraft {
  const now = new Date();
  const slot = Math.min(
    95,
    Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 2,
  );
  const startTime = times[slot];
  return {
    kind: "event",
    title: "",
    date: toDateKey(date),
    endDate: toDateKey(date),
    startTime,
    endTime: times[Math.min(95, slot + 2)],
    allDay: false,
    repeat: null,
    trackIds: [],
    link: "",
    description: "",
    guests: [],
    permissions: { modify: false, invite: false, seeGuests: true },
    notifications: [10],
    color: eventColors[0],
    attachments: [],
  };
}

/**
 * The "Create event" dialog. Editing an event reuses it with the event's
 * values and a different title and button. With `onLiveSessionCreated`, a
 * new event can be a live session instead, scheduled through the API.
 */
export function EventFormDialog({
  open,
  onOpenChange,
  initial,
  mode,
  onSubmit,
  hasEvents,
  onLiveSessionCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: EventDraft;
  mode: "create" | "edit";
  onSubmit: (draft: EventDraft) => void;
  hasEvents: (date: Date) => boolean;
  onLiveSessionCreated?: (title: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="max-h-[calc(100vh-2rem)] w-[805px] overflow-y-auto rounded-3xl border-0 bg-neutral-50 p-6 shadow-none sm:p-6"
      >
        {/* Remounting resets the fields each time the dialog opens. */}
        {open && (
          <EventDialogBody
            initial={initial}
            mode={mode}
            hasEvents={hasEvents}
            onSubmit={(draft) => {
              onSubmit(draft);
              onOpenChange(false);
            }}
            onLiveSessionCreated={
              onLiveSessionCreated &&
              ((title) => {
                onLiveSessionCreated(title);
                onOpenChange(false);
              })
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Switches between the event form and the live session form, keeping what was typed. */
function EventDialogBody({
  initial,
  mode,
  onSubmit,
  hasEvents,
  onLiveSessionCreated,
}: {
  initial: EventDraft;
  mode: "create" | "edit";
  onSubmit: (draft: EventDraft) => void;
  hasEvents: (date: Date) => boolean;
  onLiveSessionCreated?: (title: string) => void;
}) {
  const [draft, setDraft] = React.useState(initial);
  const [live, setLive] = React.useState(false);
  const offerLive = mode === "create" && onLiveSessionCreated !== undefined;

  if (live && onLiveSessionCreated) {
    return (
      <LiveSessionForm
        initial={draft}
        hasEvents={hasEvents}
        onCreated={onLiveSessionCreated}
        onKind={(kind, basics) => {
          setDraft({ ...draft, ...basics, kind });
          setLive(false);
        }}
      />
    );
  }

  return (
    <EventForm
      initial={draft}
      mode={mode}
      hasEvents={hasEvents}
      onSubmit={onSubmit}
      onLive={
        offerLive
          ? (current) => {
              setDraft(current);
              setLive(true);
            }
          : undefined
      }
    />
  );
}

function EventForm({
  initial,
  mode,
  onSubmit,
  hasEvents,
  onLive,
}: {
  initial: EventDraft;
  mode: "create" | "edit";
  onSubmit: (draft: EventDraft) => void;
  hasEvents: (date: Date) => boolean;
  /** Offers "Live session" as a type, handing over what's been typed so far. */
  onLive?: (draft: EventDraft) => void;
}) {
  const [draft, setDraft] = React.useState(initial);
  const set = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const tracksQuery = useQuery(adminQueries.tracks("ACTIVE"));
  const start = fromDateKey(draft.date);
  const end = fromDateKey(draft.endDate);
  const canSubmit = draft.title.trim().length > 0;

  // Moving the start keeps the event's length, like most calendars.
  const setStartDate = (date: Date) => {
    const length = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    setDraft((d) => ({
      ...d,
      date: toDateKey(date),
      endDate: toDateKey(addDays(date, Math.max(0, length))),
    }));
  };
  const setStartTime = (time: string) => {
    const length = minutesOf(draft.endTime) - minutesOf(draft.startTime);
    const endMinutes = Math.min(
      minutesOf(time) + Math.max(0, length),
      23 * 60 + 45,
    );
    setDraft((d) => ({
      ...d,
      startTime: time,
      endTime: times[endMinutes / 15],
    }));
  };
  const setEndDate = (date: Date) =>
    set("endDate", toDateKey(date < start ? start : date));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ ...draft, title: draft.title.trim() });
      }}
    >
      <CalendarDialogHeader
        title={mode === "create" ? "Create event" : "Edit event"}
      />

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,436px)_1px_minmax(0,272px)]">
        <div className="flex min-w-0 flex-col">
          <TitleField
            value={draft.title}
            onChange={(title) => set("title", title)}
          />

          <KindToggle
            value={draft.kind}
            kinds={onLive ? ["event", "task", "live"] : ["event", "task"]}
            onChange={(kind) =>
              kind === "live" ? onLive?.(draft) : set("kind", kind)
            }
          />

          <DateTimeRow
            draft={draft}
            start={start}
            end={end}
            hasEvents={hasEvents}
            onStartDate={setStartDate}
            onEndDate={setEndDate}
            onStartTime={setStartTime}
            onEndTime={(time) =>
              set(
                "endTime",
                draft.date === draft.endDate && time < draft.startTime
                  ? draft.startTime
                  : time,
              )
            }
          />

          <div className="mt-[11px] flex flex-wrap items-center pl-[30px]">
            <label className="flex items-center gap-3.5 text-sm text-brand-primary">
              <Checkbox
                checked={draft.allDay}
                onCheckedChange={(checked) => set("allDay", checked)}
                className="border-[1.5px] border-neutral-600"
              />
              All day
            </label>
            <RepeatField
              start={start}
              value={draft.repeat}
              onChange={(rule) => set("repeat", rule)}
            />
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <label htmlFor="event-tracks" className={labelClass}>
              Select track
            </label>
            <MultiSelectInput
              id="event-tracks"
              value={draft.trackIds}
              onChange={(trackIds) => set("trackIds", trackIds)}
              options={(tracksQuery.data ?? []).map((track) => ({
                value: track.id,
                label: track.name,
              }))}
              allLabel="All tracks"
              placeholder={
                tracksQuery.isPending ? "Loading tracks…" : "Select track"
              }
              leadingIcon={
                <Track className="size-[18px]! text-text-secondary" />
              }
              chevron={<ArrowDown01 className="size-5" />}
              chevronClassName="text-text-primary"
              className="h-9 gap-2 pr-3.5 pl-2.5 font-work text-text-primary"
            />
          </div>

          <label className="mt-4 flex flex-col gap-1">
            <span className={labelClass}>Add event link</span>
            <span className="flex h-9 overflow-hidden rounded-lg border border-neutral-200 font-work text-sm focus-within:border-brand-primary">
              <span className="flex items-center border-r border-neutral-200 px-5 text-text-muted">
                https://
              </span>
              <input
                value={draft.link.replace(/^https?:\/\//, "")}
                onChange={(e) =>
                  set(
                    "link",
                    e.target.value
                      ? `https://${e.target.value.replace(/^https?:\/\//, "")}`
                      : "",
                  )
                }
                placeholder="www.classroom.com"
                className="min-w-0 flex-1 bg-transparent px-4 text-text-primary outline-none placeholder:text-text-muted"
              />
            </span>
          </label>

          <DescriptionField
            value={draft.description}
            onChange={(description) => set("description", description)}
          />

          <AttachmentField
            files={draft.attachments}
            onChange={(files) => set("attachments", files)}
          />
        </div>

        <div aria-hidden className="hidden bg-[#e1e6ed] md:block" />

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Add guests</span>
            <GuestsField
              value={draft.guests}
              onChange={(guests) => set("guests", guests)}
            />
          </div>

          <p className="mt-3.5 text-sm leading-6 font-medium text-black">
            Guest permissions
          </p>
          <div className="mt-3 flex flex-col gap-3 font-work text-sm text-text-primary">
            {(
              [
                ["modify", "Modify event"],
                ["invite", "Invite others"],
                ["seeGuests", "See guest lists"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex h-5 items-center gap-4 pl-0.5">
                <Checkbox
                  checked={draft.permissions[key]}
                  onCheckedChange={(checked) =>
                    set("permissions", { ...draft.permissions, [key]: checked })
                  }
                  className="border-[1.5px] border-neutral-600"
                />
                {label}
              </label>
            ))}
          </div>

          <p className="mt-3 text-sm leading-6 font-medium text-black">
            Notification
          </p>
          <div className="mt-2.5 flex flex-col gap-2">
            {draft.notifications.map((minutes, index) => (
              <div key={index} className="flex items-center gap-2">
                <SelectInput
                  aria-label={`Notification ${index + 1}`}
                  value={String(minutes)}
                  onChange={(next) =>
                    set(
                      "notifications",
                      draft.notifications.map((m, i) =>
                        i === index ? Number(next) : m,
                      ),
                    )
                  }
                  options={notificationOptions.map((option) => ({
                    value: String(option),
                    label: describeNotification(option)
                      .replace(" before", "")
                      .replace(/^\w|\s\w/g, (c) => c.toUpperCase()),
                  }))}
                  chevron={<ArrowDown01 className="size-5" />}
                  chevronClassName="text-text-primary"
                  className="h-[33px] w-[112px] gap-1 pr-2.5 pl-2.5 font-work text-xs text-text-muted"
                />
                <span className="flex h-[33px] items-center rounded-lg bg-neutral-100 px-2.5 font-work text-xs text-text-secondary">
                  before
                </span>
              </div>
            ))}
          </div>
          {draft.notifications.length < 3 && (
            <button
              type="button"
              onClick={() => set("notifications", [...draft.notifications, 30])}
              className="mt-1.5 self-start text-xs font-medium text-brand-primary hover:underline"
            >
              + Add another notification
            </button>
          )}

          <p className="mt-4 text-sm leading-6 font-medium text-black">
            Event color
          </p>
          <div
            role="radiogroup"
            aria-label="Event color"
            className="mt-2.5 flex flex-wrap gap-1"
          >
            {eventColors.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={draft.color === color}
                aria-label={color}
                onClick={() => set("color", color)}
                style={{ backgroundColor: color }}
                className={cn(
                  "size-5 rounded-sm",
                  draft.color === color &&
                    "ring-2 ring-brand-300 ring-offset-1 ring-offset-neutral-50",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <CalendarDialogActions
        submitLabel={mode === "create" ? "Create event" : "Save changes"}
        disabled={!canSubmit}
        className="mt-[26px]"
      />
    </form>
  );
}

function AttachmentField({
  files,
  onChange,
}: {
  files: string[];
  onChange: (files: string[]) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-9 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-xs font-medium text-black hover:bg-neutral-200"
      >
        <Attachment className="size-5" />
        Add attachment
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const names = Array.from(e.target.files ?? [], (file) => file.name);
          onChange([
            ...files,
            ...names.filter((name) => !files.includes(name)),
          ]);
          e.target.value = "";
        }}
      />
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2 font-work text-xs text-text-secondary">
          {files.map((name) => (
            <li
              key={name}
              className="flex items-center gap-1 rounded-md bg-neutral-100 py-1 pr-1 pl-2"
            >
              {name}
              <button
                type="button"
                aria-label={`Remove ${name}`}
                onClick={() => onChange(files.filter((f) => f !== name))}
                className="rounded p-0.5 hover:bg-neutral-200"
              >
                <Cancel01 className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
