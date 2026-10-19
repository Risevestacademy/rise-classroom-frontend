"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { Popover } from "@base-ui/react/popover";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";

import {
  Add01,
  ArrowDown01,
  Attachment,
  Cancel01,
  Track,
} from "@/assets/icons";
import { DatePickerPopup } from "@/components/calendar/DatePickerPopup";
import { RecurrencePopup } from "@/components/calendar/RecurrencePopup";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectInput, SelectInput } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminQueries } from "@/lib/admin";
import {
  addDays,
  describeNotification,
  describeRepeat,
  eventColors,
  fieldTime,
  fromDateKey,
  presetRule,
  repeatPresets,
  shortDate,
  toDateKey,
  type CalendarEvent,
  type EventGuest,
  type RepeatRule,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

export type EventDraft = Omit<CalendarEvent, "id" | "organizer">;

const DESCRIPTION_LIMIT = 200;

const times = Array.from({ length: 96 }, (_, i) => {
  const hours = String(Math.floor(i / 4)).padStart(2, "0");
  const minutes = String((i % 4) * 15).padStart(2, "0");
  return `${hours}:${minutes}`;
});

const notificationOptions = [5, 10, 15, 30, 60, 1440, 10080];

const chipClass =
  "h-[33px] rounded-lg border border-neutral-200 bg-transparent px-2 font-work text-xs text-text-muted outline-none hover:bg-neutral-100 focus-visible:border-brand-primary";

const labelClass = "text-sm leading-6 font-medium text-text-primary";

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

function minutesOf(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * The "Create event" dialog. Editing an event reuses it with the event's
 * values and a different title and button.
 */
export function EventFormDialog({
  open,
  onOpenChange,
  initial,
  mode,
  onSubmit,
  hasEvents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: EventDraft;
  mode: "create" | "edit";
  onSubmit: (draft: EventDraft) => void;
  hasEvents: (date: Date) => boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="max-h-[calc(100vh-2rem)] w-[805px] rounded-3xl border-0 bg-neutral-50 p-6 shadow-none sm:p-6"
      >
        {/* Remounting resets the fields each time the dialog opens. */}
        {open && (
          <EventForm
            initial={initial}
            mode={mode}
            hasEvents={hasEvents}
            onSubmit={(draft) => {
              onSubmit(draft);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EventForm({
  initial,
  mode,
  onSubmit,
  hasEvents,
}: {
  initial: EventDraft;
  mode: "create" | "edit";
  onSubmit: (draft: EventDraft) => void;
  hasEvents: (date: Date) => boolean;
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
      <div className="flex items-center justify-between">
        <DialogTitle className="text-xl leading-7 font-semibold text-text-primary">
          {mode === "create" ? "Create event" : "Edit event"}
        </DialogTitle>
        <DialogClose
          aria-label="Close"
          className="flex size-10 items-center justify-center rounded-lg bg-white text-text-primary hover:bg-neutral-100"
        >
          <Cancel01 className="size-5" />
        </DialogClose>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,436px)_1px_minmax(0,272px)]">
        <div className="flex min-w-0 flex-col">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              Title <span className="text-text-error">*</span>
            </span>
            <span className="flex h-9 items-center gap-2.5 rounded-lg border border-neutral-200 px-2 focus-within:border-brand-primary">
              <Add01 className="size-5 shrink-0 text-text-secondary" />
              <input
                required
                autoFocus
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Add title"
                className="w-full bg-transparent font-work text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </span>
          </label>

          <div role="radiogroup" aria-label="Type" className="mt-3 flex gap-2">
            {(["event", "task"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={draft.kind === kind}
                onClick={() => set("kind", kind)}
                className={cn(
                  "h-[27px] rounded-sm px-2.5 text-[10px] capitalize",
                  draft.kind === kind
                    ? "bg-brand-200 text-brand-primary"
                    : "text-text-secondary hover:bg-neutral-100",
                )}
              >
                {kind}
              </button>
            ))}
          </div>

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

          <label className="mt-4 flex flex-col gap-1">
            <span className={labelClass}>Description</span>
            <span className="relative flex h-[100px] rounded-xl border border-neutral-200 focus-within:border-brand-primary">
              <textarea
                value={draft.description}
                maxLength={DESCRIPTION_LIMIT}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Placeholder text..."
                className="w-full resize-none bg-transparent px-3 pt-3 pb-8 font-work text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
              <span className="pointer-events-none absolute right-4 bottom-3 flex items-center gap-1.5 font-work text-sm text-text-primary">
                {draft.description.length}/{DESCRIPTION_LIMIT}
                <svg
                  viewBox="0 0 10 10"
                  aria-hidden
                  className="size-2.5 stroke-text-muted"
                >
                  <path d="M9 1 1 9M9 5 5 9" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          </label>

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

      <div className="mt-[26px] flex justify-end gap-4">
        <DialogClose
          render={
            <Button
              variant="secondary"
              size="lg"
              className="border-neutral-200 text-base font-normal text-text-secondary"
            />
          }
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
          className="text-base disabled:bg-brand-200 disabled:text-white"
        >
          {mode === "create" ? "Create event" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function DateTimeRow({
  draft,
  start,
  end,
  hasEvents,
  onStartDate,
  onEndDate,
  onStartTime,
  onEndTime,
}: {
  draft: EventDraft;
  start: Date;
  end: Date;
  hasEvents: (date: Date) => boolean;
  onStartDate: (date: Date) => void;
  onEndDate: (date: Date) => void;
  onStartTime: (time: string) => void;
  onEndTime: (time: string) => void;
}) {
  const [picking, setPicking] = React.useState<"start" | "end" | null>(null);
  const startRef = React.useRef<HTMLButtonElement>(null);
  const endRef = React.useRef<HTMLButtonElement>(null);

  return (
    <div className="mt-[15px] flex flex-wrap items-center gap-[7px]">
      <Clock aria-hidden className="mr-[5px] size-4 text-text-secondary" />
      <button
        ref={startRef}
        type="button"
        aria-label={`Starts ${shortDate(start)}`}
        onClick={() => setPicking("start")}
        className={chipClass}
      >
        {shortDate(start)}
      </button>
      {!draft.allDay && (
        <TimeSelect
          label="Start time"
          value={draft.startTime}
          onChange={onStartTime}
        />
      )}
      <span className="text-sm text-text-secondary">to</span>
      {!draft.allDay && (
        <TimeSelect
          label="End time"
          value={draft.endTime}
          onChange={onEndTime}
        />
      )}
      <button
        ref={endRef}
        type="button"
        aria-label={`Ends ${shortDate(end)}`}
        onClick={() => setPicking("end")}
        className={chipClass}
      >
        {shortDate(end)}
      </button>
      {/* No time zone design or data yet: events use the browser's zone. */}
      <span className="ml-0.5 text-xs font-medium text-brand-primary">
        Time zone
      </span>

      <DatePickerPopup
        open={picking === "start"}
        onOpenChange={(open) => setPicking(open ? "start" : null)}
        anchor={startRef}
        value={start}
        onApply={onStartDate}
        hasEvents={hasEvents}
      />
      <DatePickerPopup
        open={picking === "end"}
        onOpenChange={(open) => setPicking(open ? "end" : null)}
        anchor={endRef}
        value={end}
        onApply={onEndDate}
        hasEvents={hasEvents}
      />
    </div>
  );
}

function TimeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
}) {
  return (
    <SelectInput
      aria-label={label}
      value={value}
      onChange={onChange}
      options={times.map((time) => ({ value: time, label: fieldTime(time) }))}
      showChevron={false}
      className={cn(chipClass, "w-auto justify-center text-center")}
      popupClassName="max-h-60"
    />
  );
}

/** "Does not repeat" field: a menu of presets, plus "Custom…" for the full form. */
function RepeatField({
  start,
  value,
  onChange,
}: {
  start: Date;
  value: RepeatRule | null;
  onChange: (rule: RepeatRule | null) => void;
}) {
  const [customOpen, setCustomOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const presets = repeatPresets(start);
  const label = value ? describeRepeat(value, start) : "Do not repeat";
  const selectedPreset = value
    ? presets.find(
        (p) =>
          JSON.stringify(presetRule(p.value, start)) === JSON.stringify(value),
      )?.value
    : "none";

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          ref={triggerRef}
          className="ml-3 flex h-[33px] max-w-full items-center gap-3 rounded-lg border border-neutral-200 pr-2 pl-2.5 font-work text-xs text-text-muted outline-none hover:bg-neutral-100 focus-visible:border-brand-primary data-popup-open:border-brand-primary"
        >
          <span className="truncate">{label}</span>
          <ArrowDown01 className="size-5 shrink-0 text-text-primary" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="start" sideOffset={6} className="z-50">
            <Menu.Popup className="w-[250px] rounded-sm bg-neutral-50 py-2 font-work text-sm text-text-primary shadow-[0_2px_6px_rgb(0_0_0/0.19),0_0_1px_rgb(0_0_0/0.25)] outline-none">
              {presets.map((preset) => (
                <Menu.Item
                  key={preset.value}
                  onClick={() => onChange(presetRule(preset.value, start))}
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center px-4 py-1.5 outline-none data-highlighted:bg-brand-100",
                    selectedPreset === preset.value && "bg-brand-100",
                  )}
                >
                  {preset.label}
                </Menu.Item>
              ))}
              <Menu.Item
                onClick={() => setCustomOpen(true)}
                className={cn(
                  "flex min-h-10 cursor-pointer items-center px-4 py-1.5 outline-none data-highlighted:bg-brand-100",
                  value && !selectedPreset && "bg-brand-100",
                )}
              >
                Custom...
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <RecurrencePopup
        open={customOpen}
        onOpenChange={setCustomOpen}
        anchor={triggerRef}
        start={start}
        value={value}
        onDone={onChange}
      />
    </>
  );
}

/** "Add guests": pick admins, instructors and students to invite. */
function GuestsField({
  value,
  onChange,
}: {
  value: EventGuest[];
  onChange: (guests: EventGuest[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const usersQuery = useQuery({
    ...adminQueries.users({ search: search.trim() || undefined, limit: 20 }),
    enabled: open,
  });
  const users = usersQuery.data?.items ?? [];
  const selected = new Set(value.map((guest) => guest.id));

  const toggle = (guest: EventGuest) =>
    onChange(
      selected.has(guest.id)
        ? value.filter((g) => g.id !== guest.id)
        : [...value, guest],
    );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 pr-3.5 pl-3 text-left font-work text-sm outline-none hover:bg-neutral-100 focus-visible:border-brand-primary data-popup-open:border-brand-primary">
        <span
          className={cn(
            "truncate",
            value.length ? "text-text-primary" : "text-text-muted",
          )}
        >
          {value.length
            ? value.map((guest) => guest.name).join(", ")
            : "Add guests"}
        </span>
        <ArrowDown01 className="size-5 shrink-0 text-text-primary" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          className="z-50"
        >
          <Popover.Popup className="w-(--anchor-width) overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50 font-work text-sm shadow-lg outline-none">
            <div className="border-b border-neutral-100 p-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people"
                className="w-full bg-transparent px-1 outline-none placeholder:text-text-muted"
              />
            </div>
            <ul className="max-h-60 overflow-y-auto p-1">
              {usersQuery.isPending && (
                <li className="px-2 py-3 text-center text-text-muted">
                  Loading…
                </li>
              )}
              {usersQuery.isError && (
                <li className="px-2 py-3 text-center text-text-error">
                  We couldn&rsquo;t load people. Please try again.
                </li>
              )}
              {usersQuery.isSuccess && users.length === 0 && (
                <li className="px-2 py-3 text-center text-text-muted">
                  No people found
                </li>
              )}
              {users.map((user) => {
                const guest = {
                  id: user.id,
                  name:
                    `${user.firstName} ${user.lastName}`.trim() || user.email,
                  email: user.email,
                };
                return (
                  <li key={user.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-neutral-100">
                      <Checkbox
                        checked={selected.has(user.id)}
                        onCheckedChange={() => toggle(guest)}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-text-primary">
                          {guest.name}
                        </span>
                        <span className="block truncate text-xs text-text-muted">
                          {user.email}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
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
