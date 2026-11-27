"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { Popover } from "@base-ui/react/popover";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";

import { Add01, ArrowDown01 } from "@/assets/icons";
import { useCalendarArea } from "@/components/calendar/CalendarArea";
import { DatePickerPopup } from "@/components/calendar/DatePickerPopup";
import { RecurrencePopup } from "@/components/calendar/RecurrencePopup";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectInput } from "@/components/ui/select";
import { adminQueries } from "@/lib/admin";
import { myMenteesQuery } from "@/lib/mentors";
import {
  describeRepeat,
  fieldTime,
  presetRule,
  repeatPresets,
  shortDate,
  type EventGuest,
  type RepeatRule,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

// The fields the calendar's event form and live session form share.

export const times = Array.from({ length: 96 }, (_, i) => {
  const hours = String(Math.floor(i / 4)).padStart(2, "0");
  const minutes = String((i % 4) * 15).padStart(2, "0");
  return `${hours}:${minutes}`;
});

export const chipClass =
  "h-[33px] rounded-lg border border-neutral-200 bg-transparent px-2 font-work text-xs text-text-muted outline-none hover:bg-neutral-100 focus-visible:border-brand-primary";

export const labelClass = "text-sm leading-6 font-medium text-text-primary";

export function minutesOf(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

type Times = { allDay: boolean; startTime: string; endTime: string };

export type FormKind = "event" | "task" | "live";

const kindLabels: Record<FormKind, string> = {
  event: "Event",
  task: "Task",
  live: "Live session",
};

/** The "Event / Task / Live session" switch under the title. */
export function KindToggle({
  value,
  kinds,
  onChange,
}: {
  value: FormKind;
  kinds: FormKind[];
  onChange: (kind: FormKind) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Type" className="mt-3 flex gap-2">
      {kinds.map((kind) => (
        <button
          key={kind}
          type="button"
          role="radio"
          aria-checked={value === kind}
          onClick={() => onChange(kind)}
          className={cn(
            "h-[27px] rounded-sm px-2.5 text-[10px]",
            value === kind
              ? "bg-brand-200 text-brand-primary"
              : "text-text-secondary hover:bg-neutral-100",
          )}
        >
          {kindLabels[kind]}
        </button>
      ))}
    </div>
  );
}

export function TitleField({
  value,
  onChange,
}: {
  value: string;
  onChange: (title: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelClass}>
        Title <span className="text-text-error">*</span>
      </span>
      <span className="flex h-9 items-center gap-2.5 rounded-lg border border-neutral-200 px-2 focus-within:border-brand-primary">
        <Add01 className="size-5 shrink-0 text-text-secondary" />
        <input
          required
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add title"
          className="w-full bg-transparent font-work text-sm text-text-primary outline-none placeholder:text-text-muted"
        />
      </span>
    </label>
  );
}

export function DescriptionField({
  value,
  onChange,
  limit = 200,
}: {
  value: string;
  onChange: (description: string) => void;
  limit?: number;
}) {
  return (
    <label className="mt-4 flex flex-col gap-1">
      <span className={labelClass}>Description</span>
      <span className="relative flex h-[100px] rounded-xl border border-neutral-200 focus-within:border-brand-primary">
        <textarea
          value={value}
          maxLength={limit}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Placeholder text..."
          className="w-full resize-none bg-transparent px-3 pt-3 pb-8 font-work text-sm text-text-primary outline-none placeholder:text-text-muted"
        />
        <span className="pointer-events-none absolute right-4 bottom-3 flex items-center gap-1.5 font-work text-sm text-text-primary">
          {value.length}/{limit}
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
  );
}

export function DateTimeRow({
  draft,
  start,
  end,
  hasEvents,
  onStartDate,
  onEndDate,
  onStartTime,
  onEndTime,
  timeZone = "Time zone",
}: {
  draft: Times;
  start: Date;
  end: Date;
  hasEvents: (date: Date) => boolean;
  onStartDate: (date: Date) => void;
  onEndDate: (date: Date) => void;
  onStartTime: (time: string) => void;
  onEndTime: (time: string) => void;
  timeZone?: string;
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
      {/* No time zone picker designed yet: events use the browser's zone,
        live sessions the academy's. */}
      <span className="ml-0.5 text-xs font-medium text-brand-primary">
        {timeZone}
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
export function RepeatField({
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

/**
 * "Add guests": admins pick admins, instructors and students to invite;
 * mentors pick from their own students.
 */
export function GuestsField({
  value,
  onChange,
}: {
  value: EventGuest[];
  onChange: (guests: EventGuest[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const asMentor = useCalendarArea() === "mentor";
  const usersQuery = useQuery({
    ...adminQueries.users({ search: search.trim() || undefined, limit: 20 }),
    enabled: open && !asMentor,
  });
  const menteesQuery = useQuery({ ...myMenteesQuery(), enabled: open && asMentor });
  const peopleQuery = asMentor ? menteesQuery : usersQuery;
  const wanted = search.trim().toLowerCase();
  const people: EventGuest[] = asMentor
    ? (menteesQuery.data ?? [])
        .map(({ student: { user } }) => ({
          id: user.id,
          name: user.name || user.email,
          email: user.email,
        }))
        .filter((person) =>
          `${person.name} ${person.email}`.toLowerCase().includes(wanted),
        )
    : (usersQuery.data?.items ?? []).map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        email: user.email,
      }));
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
              {peopleQuery.isPending && (
                <li className="px-2 py-3 text-center text-text-muted">
                  Loading…
                </li>
              )}
              {peopleQuery.isError && (
                <li className="px-2 py-3 text-center text-text-error">
                  We couldn&rsquo;t load people. Please try again.
                </li>
              )}
              {peopleQuery.isSuccess && people.length === 0 && (
                <li className="px-2 py-3 text-center text-text-muted">
                  No people found
                </li>
              )}
              {people.map((guest) => {
                return (
                  <li key={guest.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-neutral-100">
                      <Checkbox
                        checked={selected.has(guest.id)}
                        onCheckedChange={() => toggle(guest)}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-text-primary">
                          {guest.name}
                        </span>
                        <span className="block truncate text-xs text-text-muted">
                          {guest.email}
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
