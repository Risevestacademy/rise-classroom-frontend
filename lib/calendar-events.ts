import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope } from "@/lib/api";
import { eventColors, type CalendarEvent } from "@/lib/calendar";
import {
  DEFAULT_TIME_ZONE,
  liveSessionKeys,
  zonedParts,
  zonedTimeToIso,
  type LiveSessionType,
} from "@/lib/live-sessions";

type NamedRef = { id: string; name: string };
type CalendarPerson = { id: string; name: string; image: string | null };

/**
 * One entry from `GET /calendar/events`: a live session, a mentor's weekly
 * task (read-only, on its due date) or someone's own calendar task.
 */
export type CalendarItem = {
  id: string;
  kind: "event" | "task";
  source: "LIVE_SESSION" | "WEEKLY_TASK" | "CALENDAR_TASK";
  type: LiveSessionType | null;
  title: string;
  description: string | null;
  start: string;
  end: string;
  allDay: boolean;
  timezone: string | null;
  isRecurring: boolean;
  seriesId: string | null;
  status: string;
  host: CalendarPerson | null;
  cohort: NamedRef | null;
  track: NamedRef | null;
  canEdit: boolean;
};

export type CalendarItemDetails = CalendarItem & {
  participants?: CalendarPerson[];
  participantCount?: number;
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
const TASK_COLOR = eventColors[0];

/** An API item as the month grid and details card show it; `basePath` is the area its Join link opens in. */
export function toCalendarEvent(item: CalendarItem, basePath = "/admin"): CalendarEvent {
  const zone = item.timezone || DEFAULT_TIME_ZONE;
  const start = zonedParts(item.start, zone);
  const end = zonedParts(item.end, zone);
  const live = item.source === "LIVE_SESSION";

  return {
    id: item.id,
    kind: live ? "live" : "task",
    source: item.source,
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
    repeat: null,
    // Town halls, mentorship and invite-only sessions aren't tied to a track.
    trackIds: item.track ? [item.track.id] : "all",
    link: live ? `${basePath}/live/${item.id}` : "",
    description: item.description ?? "",
    guests: [],
    permissions: { modify: false, invite: false, seeGuests: false },
    notifications: [],
    color: live ? LIVE_COLOR : TASK_COLOR,
    organizer: item.host?.name ?? (item.source === "CALENDAR_TASK" ? "You" : ""),
    attachments: [],
  };
}

/** Items in the picked cohort, plus those with no cohort (invite-only sessions). */
export function inCohort(item: CalendarItem, cohortId: string | undefined) {
  return !cohortId || !item.cohort || item.cohort.id === cohortId;
}

/** The fields of a calendar task the API keeps. */
export type TaskFields = Pick<
  CalendarEvent,
  "title" | "description" | "date" | "endDate" | "startTime" | "endTime" | "allDay"
>;

function taskTimes(task: TaskFields) {
  const start = zonedTimeToIso(task.date, task.allDay ? "00:00" : task.startTime);
  const end = task.allDay
    ? zonedTimeToIso(task.endDate, "00:00")
    : zonedTimeToIso(task.endDate, task.endTime);
  return { start, end, allDay: task.allDay };
}

export const createCalendarTask = async (task: TaskFields, cohortId: string) =>
  (
    await api.post<Envelope<CalendarItem>>("/calendar/events", {
      kind: "task",
      title: task.title,
      description: task.description.trim() || undefined,
      cohortId,
      ...taskTimes(task),
    })
  ).data;

export const updateCalendarTask = async (id: string, task: TaskFields) =>
  (
    await api.patch<Envelope<CalendarItem>>(`/calendar/events/${id}`, {
      title: task.title,
      description: task.description.trim(),
      ...taskTimes(task),
    })
  ).data;

export const setTaskDone = async (id: string, done: boolean) =>
  (
    await api.patch<Envelope<CalendarItem>>(`/calendar/events/${id}`, {
      completed: done,
    })
  ).data;

/** Which occurrences of a repeating event a change or cancellation covers. */
export type SeriesScope = "this" | "following" | "all";

/** Removes a task, or cancels a live session (everyone invited is told). */
export const deleteCalendarItem = (id: string, scope?: SeriesScope) =>
  api.delete(`/calendar/events/${id}`, { query: { scope } });
