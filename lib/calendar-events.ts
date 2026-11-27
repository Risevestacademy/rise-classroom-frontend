import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope } from "@/lib/api";
import {
  eventColors,
  fromDateKey,
  fromRrule,
  toRrule,
  type CalendarEvent,
  type EventGuest,
} from "@/lib/calendar";
import {
  DEFAULT_TIME_ZONE,
  liveSessionKeys,
  zonedParts,
  zonedTimeToIso,
  type LiveSessionType,
} from "@/lib/live-sessions";

type NamedRef = { id: string; name: string };
type CalendarPerson = { id: string; name: string; image: string | null };

export type GuestPermissions = {
  modify: boolean;
  invite: boolean;
  seeGuestList: boolean;
};

/**
 * One entry from `GET /calendar/events`: a live session, a plain event, a
 * task, or a mentor's weekly task (read-only, on its due date). Anything that
 * repeats comes back once per occurrence.
 */
export type CalendarItem = {
  id: string;
  kind: "live_session" | "event" | "task";
  source: "LIVE_SESSION" | "CALENDAR_EVENT" | "CALENDAR_TASK" | "WEEKLY_TASK";
  type: LiveSessionType | null;
  title: string;
  description: string | null;
  start: string;
  end: string;
  allDay: boolean;
  timezone: string | null;
  isRecurring: boolean;
  seriesId: string | null;
  recurrence: { rrule: string; endsOn: string | null } | null;
  status: string;
  host: CalendarPerson | null;
  cohort: NamedRef | null;
  /** Empty when `allTracks` is set. */
  tracks: NamedRef[];
  allTracks: boolean;
  /** Events and tasks only. */
  meetingUrl: string | null;
  color: string | null;
  reminderMinutes: number[];
  guestPermissions: GuestPermissions | null;
  canEdit: boolean;
};

export type CalendarItemDetails = CalendarItem & {
  /** Null when the guest list is hidden from this person. */
  participants?: CalendarPerson[] | null;
  participantCount?: number;
  /** Events and tasks: the people invited by name rather than by track. */
  guestIds?: string[] | null;
  canInvite?: boolean;
};

type Range = { from: string; to: string };

// Under the live sessions key, so scheduling, editing or cancelling a
// session anywhere also refreshes the calendar.
export const calendarKeys = {
  all: [...liveSessionKeys.all, "calendar"] as const,
  range: (range: Range) => [...calendarKeys.all, range] as const,
  item: (id: string) => [...calendarKeys.all, "item", id] as const,
};

export const calendarQueries = {
  /** At most 62 days; the month grid asks for 42. */
  range: (range: Range) =>
    queryOptions({
      queryKey: calendarKeys.range(range),
      queryFn: async () =>
        (
          await api.get<Envelope<{ items: CalendarItem[] }>>(
            "/calendar/events",
            { query: range },
          )
        ).data.items,
    }),

  item: (id: string) =>
    queryOptions({
      queryKey: calendarKeys.item(id),
      queryFn: async () =>
        (await api.get<Envelope<CalendarItemDetails>>(`/calendar/events/${id}`))
          .data,
    }),
};

const LIVE_COLOR = "#e5484d";
const DEFAULT_COLOR = eventColors[0];

const kinds = {
  LIVE_SESSION: "live",
  CALENDAR_EVENT: "event",
  CALENDAR_TASK: "task",
  WEEKLY_TASK: "task",
} as const;

/** An API item as the month grid and details card show it; `basePath` is the area its Join link opens in. */
export function toCalendarEvent(
  item: CalendarItem,
  basePath = "/admin",
): CalendarEvent {
  const zone = item.timezone || DEFAULT_TIME_ZONE;
  const start = zonedParts(item.start, zone);
  const end = zonedParts(item.end, zone);
  const live = item.source === "LIVE_SESSION";
  const permissions = item.guestPermissions;

  return {
    id: item.id,
    kind: kinds[item.source],
    source: item.source,
    ownerId: item.host?.id,
    // Sessions that have started or ended can't be changed.
    canEdit: item.canEdit && (!live || item.status === "SCHEDULED"),
    done: item.source === "CALENDAR_TASK" && item.status === "DONE",
    seriesId: item.seriesId,
    cohortId: item.cohort?.id ?? null,
    liveSessionId: live ? item.id : undefined,
    title: item.title,
    date: start.date,
    endDate: end.date,
    startTime: start.time,
    endTime: end.time,
    allDay: item.allDay,
    repeat: item.recurrence
      ? fromRrule(
          item.recurrence.rrule,
          item.recurrence.endsOn &&
            zonedParts(item.recurrence.endsOn, zone).date,
        )
      : null,
    // Town halls, mentorship and invite-only sessions aren't tied to a track.
    trackIds:
      item.allTracks || (live && item.tracks.length === 0)
        ? "all"
        : item.tracks.map((track) => track.id),
    link: live ? `${basePath}/live/${item.id}` : (item.meetingUrl ?? ""),
    description: item.description ?? "",
    guests: [],
    permissions: {
      modify: permissions?.modify ?? false,
      invite: permissions?.invite ?? false,
      seeGuests: permissions?.seeGuestList ?? false,
    },
    notifications: item.reminderMinutes ?? [],
    color: live ? LIVE_COLOR : item.color || DEFAULT_COLOR,
    organizer: item.host?.name ?? "",
    attachments: [],
  };
}

/** The people an event or task invites by name, for its edit form. */
export function invitedGuests(details: CalendarItemDetails): EventGuest[] {
  const named = new Set(details.guestIds ?? []);
  return (details.participants ?? [])
    .filter((person) => named.has(person.id))
    .map((person) => ({ id: person.id, name: person.name, email: "" }));
}

/** Items in the picked cohort, plus those with no cohort (invite-only sessions). */
export function inCohort(item: CalendarItem, cohortId: string | undefined) {
  return !cohortId || !item.cohort || item.cohort.id === cohortId;
}

/** Which occurrences of something repeating a change or deletion covers. */
export type SeriesScope = "this" | "following" | "all";

/** What the event and task form holds. */
export type EntryFields = Pick<
  CalendarEvent,
  | "title"
  | "description"
  | "date"
  | "endDate"
  | "startTime"
  | "endTime"
  | "allDay"
  | "repeat"
  | "trackIds"
  | "link"
  | "guests"
  | "permissions"
  | "notifications"
  | "color"
>;

type EntryOptions = {
  /** Mentors can't invite tracks. */
  tracks: boolean;
  /** Only the owner may change the tracks and guest permissions. */
  owner: boolean;
};

function entryTimes(entry: EntryFields) {
  const start = zonedTimeToIso(
    entry.date,
    entry.allDay ? "00:00" : entry.startTime,
  );
  const end = entry.allDay
    ? zonedTimeToIso(entry.endDate, "00:00")
    : zonedTimeToIso(entry.endDate, entry.endTime);
  return { start, end, allDay: entry.allDay, timezone: DEFAULT_TIME_ZONE };
}

const entryRrule = (entry: Pick<EntryFields, "repeat" | "date">) =>
  entry.repeat && toRrule(entry.repeat, fromDateKey(entry.date));

// The API rejects fields it doesn't know, so only these are sent.
function entryBody(entry: EntryFields, { tracks, owner }: EntryOptions) {
  return {
    title: entry.title,
    ...entryTimes(entry),
    meetingUrl: entry.link || undefined,
    color: entry.color,
    reminderMinutes: entry.notifications,
    guestIds: entry.guests.map((guest) => guest.id),
    ...(tracks &&
      owner &&
      (entry.trackIds === "all"
        ? { allTracks: true }
        : { trackIds: entry.trackIds, allTracks: false })),
    ...(owner && {
      guestPermissions: {
        modify: entry.permissions.modify,
        invite: entry.permissions.invite,
        seeGuestList: entry.permissions.seeGuests,
      },
    }),
  };
}

export const createCalendarEntry = async (
  kind: "event" | "task",
  entry: EntryFields,
  cohortId: string,
  { tracks }: Pick<EntryOptions, "tracks">,
) => {
  const rrule = entryRrule(entry);
  const ends = entry.repeat?.ends;
  return (
    await api.post<Envelope<CalendarItemDetails>>("/calendar/events", {
      kind,
      ...entryBody(entry, { tracks, owner: true }),
      description: entry.description.trim() || undefined,
      cohortId,
      ...(rrule && {
        recurrence: {
          rrule,
          endsOn:
            ends?.type === "on"
              ? zonedTimeToIso(ends.date, "23:59")
              : undefined,
        },
      }),
    })
  ).data;
};

/**
 * Saves an event or task. `scope` is needed when it repeats. The repeat rule
 * is only sent when it changed, since that recreates the occurrences.
 */
export const updateCalendarEntry = async (
  id: string,
  entry: EntryFields,
  previous: Pick<CalendarEvent, "repeat" | "date">,
  { scope, ...options }: EntryOptions & { scope?: SeriesScope },
) => {
  const rrule = entryRrule(entry);
  return (
    await api.patch<Envelope<CalendarItemDetails>>(`/calendar/events/${id}`, {
      ...(scope && { scope }),
      ...entryBody(entry, options),
      description: entry.description.trim(),
      ...(rrule && rrule !== entryRrule(previous) && { rrule }),
    })
  ).data;
};

export const setTaskDone = async (
  id: string,
  done: boolean,
  scope?: SeriesScope,
) =>
  (
    await api.patch<Envelope<CalendarItem>>(`/calendar/events/${id}`, {
      ...(scope && { scope }),
      completed: done,
    })
  ).data;

/** Removes an event or task, or cancels a live session (everyone invited is told). */
export const deleteCalendarItem = (id: string, scope?: SeriesScope) =>
  api.delete(`/calendar/events/${id}`, { query: { scope } });
