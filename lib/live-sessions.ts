import {
  fieldTime,
  fromDateKey,
  monthNames,
  weekdayNames,
  type CalendarEvent,
} from "@/lib/calendar";
import type { LessonRecording } from "@/lib/student-lessons";

/** A calendar event the mentor runs, plus its recording once it's over. */
export type LiveSession = Pick<
  CalendarEvent,
  "id" | "title" | "date" | "startTime" | "endTime" | "link" | "description" | "guests"
> & {
  status: "upcoming" | "completed";
  recordings: LessonRecording[];
};

/** "Sat, Nov 7 2026" */
export function sessionDate(dateKey: string) {
  const date = fromDateKey(dateKey);
  return `${weekdayNames[date.getDay()].slice(0, 3)}, ${monthNames[date.getMonth()].slice(0, 3)} ${date.getDate()} ${date.getFullYear()}`;
}

/** "7:00 PM - 8:00 PM" */
export function sessionTime(session: LiveSession) {
  const clock = (time: string) => fieldTime(time).replace(/(AM|PM)$/, " $1");
  return `${clock(session.startTime)} - ${clock(session.endTime)}`;
}

const guests = [
  { id: "g-1", name: "Ozavize Bello", email: "ozavizenotize123@gmail.com" },
  { id: "g-2", name: "James Okafor", email: "jammiefor123@gmail.com" },
  { id: "g-3", name: "Tola Adebayo", email: "tobayo123@gmail.com" },
  { id: "g-4", name: "Seyi Wakil", email: "seyiwawa@gmail.com" },
  { id: "g-5", name: "Peace Jane", email: "warbeforepeace0@gmail.com" },
];

const base = {
  title: "Rise academy mentorship session",
  startTime: "19:00",
  endTime: "20:00",
  link: "https://link.risecampus.com",
  description:
    "Weekly group check-in to review progress, blockers and goals for the week ahead.",
  recordings: [],
};

// PENDING-BACKEND: there are no live session or calendar endpoints yet, so
// mentors see the design's sample sessions. They mirror the admin calendar's
// events, which is where the description and guests will come from.
export const sampleSessions: LiveSession[] = [
  { ...base, id: "s-1", status: "upcoming", date: "2026-11-07", guests },
  { ...base, id: "s-2", status: "completed", date: "2026-10-24", guests },
  { ...base, id: "s-3", status: "completed", date: "2026-10-17", guests: guests.slice(0, 4) },
  { ...base, id: "s-4", status: "completed", date: "2026-10-10", guests },
  { ...base, id: "s-5", status: "completed", date: "2026-10-03", guests: guests.slice(0, 3) },
  { ...base, id: "s-6", status: "completed", date: "2026-09-26", guests: guests.slice(0, 1) },
];
