/**
 * Calendar events for the admin calendar.
 *
 * The API has no events or calendar endpoints yet, so events live in the
 * page's state, seeded with `sampleEvents`. Swap the seed for a query once
 * the backend adds events.
 */

export type RepeatFrequency = "day" | "week" | "month" | "year";

export type RepeatEnd =
  | { type: "never" }
  | { type: "on"; date: string }
  | { type: "after"; count: number };

export type RepeatRule = {
  frequency: RepeatFrequency;
  interval: number;
  /** Days of the week (0 = Sunday) for weekly rules. */
  weekdays?: number[];
  /** Monthly rules repeat on the nth weekday (-1 = last) instead of the date. */
  monthlyOn?: "date" | "weekday";
  ends: RepeatEnd;
};

export type EventGuest = { id: string; name: string; email: string };

export type CalendarEvent = {
  id: string;
  kind: "event" | "task";
  title: string;
  /** First day, as YYYY-MM-DD. */
  date: string;
  endDate: string;
  /** HH:mm, 24-hour. */
  startTime: string;
  endTime: string;
  allDay: boolean;
  repeat: RepeatRule | null;
  /** The tracks the event is for; "all" includes tracks added later. */
  trackIds: string[] | "all";
  link: string;
  description: string;
  guests: EventGuest[];
  permissions: { modify: boolean; invite: boolean; seeGuests: boolean };
  /** Reminder offsets in minutes. */
  notifications: number[];
  color: string;
  organizer: string;
  attachments: string[];
};

export const eventColors = [
  "#080d38",
  "#2e7d32",
  "#2563a8",
  "#26ebe2",
  "#600baa",
  "#b322a0",
  "#9ab90d",
  "#0bde0b",
] as const;

export const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY = 86_400_000;

export function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Whole days from `a` to `b`, ignoring daylight-saving shifts. */
function daysBetween(a: Date, b: Date) {
  return Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) /
      DAY,
  );
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** The 42 days (six weeks, Sunday first) shown for a month. */
export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Which occurrence of its weekday a date is in its month (-1 = last). */
export function weekdayPosition(date: Date) {
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  if (date.getDate() + 7 > daysInMonth) return -1;
  return Math.ceil(date.getDate() / 7);
}

function matchesPattern(rule: RepeatRule, start: Date, date: Date) {
  const interval = Math.max(1, rule.interval);
  switch (rule.frequency) {
    case "day":
      return daysBetween(start, date) % interval === 0;
    case "week": {
      const weekdays = rule.weekdays?.length ? rule.weekdays : [start.getDay()];
      if (!weekdays.includes(date.getDay())) return false;
      const weeks = Math.floor(
        daysBetween(addDays(start, -start.getDay()), date) / 7,
      );
      return weeks % interval === 0;
    }
    case "month": {
      const months =
        (date.getFullYear() - start.getFullYear()) * 12 +
        date.getMonth() -
        start.getMonth();
      if (months % interval !== 0) return false;
      if (rule.monthlyOn === "weekday") {
        if (date.getDay() !== start.getDay()) return false;
        const position = weekdayPosition(start);
        return position === -1
          ? weekdayPosition(date) === -1
          : Math.ceil(date.getDate() / 7) === position;
      }
      return date.getDate() === start.getDate();
    }
    case "year":
      return (
        date.getMonth() === start.getMonth() &&
        date.getDate() === start.getDate() &&
        (date.getFullYear() - start.getFullYear()) % interval === 0
      );
  }
}

/** Whether `event` has an occurrence on `date`. */
export function occursOn(event: CalendarEvent, date: Date) {
  const start = fromDateKey(event.date);
  const offset = daysBetween(start, date);
  if (offset < 0) return false;

  const rule = event.repeat;
  if (!rule) return date <= fromDateKey(event.endDate);
  if (!matchesPattern(rule, start, date)) return false;

  const { ends } = rule;
  if (ends.type === "on") return date <= fromDateKey(ends.date);
  if (ends.type === "after") {
    let count = 0;
    for (let i = 0; i <= offset; i++) {
      if (matchesPattern(rule, start, addDays(start, i))) count++;
      if (count > ends.count) return false;
    }
  }
  return true;
}

export function eventsOn(events: CalendarEvent[], date: Date) {
  return events
    .filter((event) => occursOn(event, date))
    .sort((a, b) =>
      a.allDay === b.allDay
        ? a.startTime.localeCompare(b.startTime)
        : a.allDay
          ? -1
          : 1,
    );
}

/** An empty list means no filtering on that field. */
export type CalendarFilters = {
  kinds: CalendarEvent["kind"][];
  trackIds: string[];
};

export const noFilters: CalendarFilters = { kinds: [], trackIds: [] };

export function filterEvents(events: CalendarEvent[], filters: CalendarFilters) {
  return events.filter(
    (event) =>
      (filters.kinds.length === 0 || filters.kinds.includes(event.kind)) &&
      (filters.trackIds.length === 0 ||
        event.trackIds === "all" ||
        event.trackIds.some((id) => filters.trackIds.includes(id))),
  );
}

function parseTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours, minutes };
}

/** "8pm", "8:30pm" — the label on an event in the month grid. */
export function shortTime(time: string) {
  const { hours, minutes } = parseTime(time);
  const period = hours < 12 ? "am" : "pm";
  const hour = hours % 12 || 12;
  return minutes
    ? `${hour}:${String(minutes).padStart(2, "0")}${period}`
    : `${hour}${period}`;
}

/** "7:00PM" — the time fields in the create form. */
export function fieldTime(time: string) {
  const { hours, minutes } = parseTime(time);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")}${hours < 12 ? "AM" : "PM"}`;
}

/** "8:00 – 8:30pm", dropping the first period when both share it. */
export function timeRange(start: string, end: string) {
  const a = parseTime(start);
  const b = parseTime(end);
  const clock = ({ hours, minutes }: { hours: number; minutes: number }) =>
    `${hours % 12 || 12}:${String(minutes).padStart(2, "0")}`;
  const period = (hours: number) => (hours < 12 ? "am" : "pm");
  const samePeriod = period(a.hours) === period(b.hours);
  return `${clock(a)}${samePeriod ? "" : period(a.hours)} – ${clock(b)}${period(b.hours)}`;
}

/** "Oct 16, 2026" */
export function shortDate(date: Date) {
  return `${monthNames[date.getMonth()].slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`;
}

/** "Sunday, October 18" */
export function longDate(date: Date) {
  return `${weekdayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
}

const ordinals = ["first", "second", "third", "fourth", "fifth"];

function weekdayPositionLabel(date: Date) {
  const position = weekdayPosition(date);
  return `${position === -1 ? "last" : ordinals[position - 1]} ${weekdayNames[date.getDay()]}`;
}

export type RepeatPreset =
  "none" | "daily" | "weekly" | "monthly" | "annually" | "weekdays";

/** The quick options in the repeat menu, worded for the event's start date. */
export function repeatPresets(start: Date) {
  return [
    { value: "none", label: "Does not repeat" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: `Weekly on ${weekdayNames[start.getDay()]}` },
    {
      value: "monthly",
      label: `Monthly on the ${weekdayPositionLabel(start)}`,
    },
    {
      value: "annually",
      label: `Annually on ${monthNames[start.getMonth()]} ${start.getDate()}`,
    },
    { value: "weekdays", label: "Every weekday (Monday to Friday)" },
  ] as const satisfies { value: RepeatPreset; label: string }[];
}

export function presetRule(
  preset: RepeatPreset,
  start: Date,
): RepeatRule | null {
  const never = { type: "never" } as const;
  switch (preset) {
    case "none":
      return null;
    case "daily":
      return { frequency: "day", interval: 1, ends: never };
    case "weekly":
      return {
        frequency: "week",
        interval: 1,
        weekdays: [start.getDay()],
        ends: never,
      };
    case "monthly":
      return {
        frequency: "month",
        interval: 1,
        monthlyOn: "weekday",
        ends: never,
      };
    case "annually":
      return { frequency: "year", interval: 1, ends: never };
    case "weekdays":
      return {
        frequency: "week",
        interval: 1,
        weekdays: [1, 2, 3, 4, 5],
        ends: never,
      };
  }
}

function listWeekdays(days: number[]) {
  const names = [...days].sort().map((day) => weekdayNames[day]);
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** "Weekly on Sunday, until Dec 6, 2026" */
export function describeRepeat(rule: RepeatRule, start: Date) {
  const every = (unit: string, adverb: string) =>
    rule.interval > 1 ? `Every ${rule.interval} ${unit}s` : adverb;

  let text: string;
  switch (rule.frequency) {
    case "day":
      text = every("day", "Daily");
      break;
    case "week": {
      const days = rule.weekdays?.length ? rule.weekdays : [start.getDay()];
      text =
        rule.interval === 1 && days.join() === "1,2,3,4,5"
          ? "Every weekday"
          : `${every("week", "Weekly")} on ${listWeekdays(days)}`;
      break;
    }
    case "month":
      text = `${every("month", "Monthly")} on ${
        rule.monthlyOn === "weekday"
          ? `the ${weekdayPositionLabel(start)}`
          : `day ${start.getDate()}`
      }`;
      break;
    case "year":
      text = `${every("year", "Annually")} on ${monthNames[start.getMonth()]} ${start.getDate()}`;
      break;
  }

  if (rule.ends.type === "on")
    return `${text}, until ${shortDate(fromDateKey(rule.ends.date))}`;
  if (rule.ends.type === "after")
    return `${text}, ${rule.ends.count} time${rule.ends.count === 1 ? "" : "s"}`;
  return text;
}

export function describeNotification(minutes: number) {
  if (minutes % 10080 === 0 && minutes > 0)
    return `${minutes / 10080} week${minutes === 10080 ? "" : "s"} before`;
  if (minutes % 1440 === 0 && minutes > 0)
    return `${minutes / 1440} day${minutes === 1440 ? "" : "s"} before`;
  if (minutes % 60 === 0 && minutes > 0)
    return `${minutes / 60} hour${minutes === 60 ? "" : "s"} before`;
  return `${minutes} minutes before`;
}

const sampleBase = {
  kind: "event",
  allDay: false,
  trackIds: [],
  link: "https://link.risecampus.com",
  description: "",
  guests: [],
  permissions: { modify: false, invite: false, seeGuests: true },
  notifications: [30],
  organizer: "admin@gmail.com",
  attachments: [],
} satisfies Partial<CalendarEvent>;

const weekly = (weekdays: number[]): RepeatRule => ({
  frequency: "week",
  interval: 1,
  weekdays,
  ends: { type: "never" },
});

/** Placeholder events from the design, shown until the API serves events. */
export const sampleEvents: CalendarEvent[] = [
  {
    ...sampleBase,
    id: "sample-rise-classroom",
    title: "Rise classroom",
    date: "2026-09-02",
    endDate: "2026-09-02",
    startTime: "20:00",
    endTime: "21:00",
    repeat: weekly([0, 3]),
    color: "#2e7d32",
  },
  {
    ...sampleBase,
    id: "sample-mentorship",
    title: "Mentorship session",
    date: "2026-09-01",
    endDate: "2026-09-01",
    startTime: "20:00",
    endTime: "21:00",
    repeat: weekly([2]),
    color: "#2253dd",
  },
  {
    ...sampleBase,
    id: "sample-check-in",
    title: "weekly check-in",
    date: "2026-09-04",
    endDate: "2026-09-04",
    startTime: "19:00",
    endTime: "19:30",
    repeat: weekly([5]),
    color: "#22dd92",
  },
  {
    ...sampleBase,
    id: "sample-classroom-session",
    title: "Rise Classroom session",
    date: "2026-09-04",
    endDate: "2026-09-04",
    startTime: "20:00",
    endTime: "21:00",
    repeat: weekly([5]),
    color: "#932a6e",
  },
  {
    ...sampleBase,
    id: "sample-academy-catch-up",
    title: "Rise Academy catch-up",
    date: "2026-09-05",
    endDate: "2026-09-05",
    startTime: "18:00",
    endTime: "19:00",
    repeat: weekly([6]),
    color: "#2e7d32",
  },
  {
    ...sampleBase,
    id: "sample-live-class",
    title: "Rise Academy Live Class",
    date: "2026-10-18",
    endDate: "2026-10-18",
    startTime: "20:00",
    endTime: "20:30",
    repeat: { ...weekly([0]), ends: { type: "on", date: "2026-12-06" } },
    color: "#2563a8",
  },
  {
    ...sampleBase,
    id: "sample-admin-testing",
    title: "Admin Testing",
    date: "2026-10-17",
    endDate: "2026-10-17",
    startTime: "21:00",
    endTime: "22:00",
    repeat: null,
    color: "#2563a8",
  },
];
