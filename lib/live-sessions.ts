import {
  fieldTime,
  fromDateKey,
  monthNames,
  toDateKey,
  weekdayNames,
  type CalendarEvent,
} from "@/lib/calendar";
import type { JoinBlock } from "@/lib/live-room";
import type { LessonRecording } from "@/lib/student-lessons";

/** A calendar event run for a track, plus its recording once it's over. */
export type LiveSession = Pick<
  CalendarEvent,
  "id" | "title" | "date" | "startTime" | "endTime" | "link" | "description" | "guests"
> & {
  status: "live" | "upcoming" | "completed";
  trackName: string;
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

/** "Wed, September 24 9:00 PM", as on the design's entrance screen. */
export function sessionWhen(session: LiveSession) {
  const date = fromDateKey(session.date);
  const time = fieldTime(session.startTime).replace(/(AM|PM)$/, " $1");
  return `${weekdayNames[date.getDay()].slice(0, 3)}, ${monthNames[date.getMonth()]} ${date.getDate()} ${time}`;
}

/** The session's start and end as moments in time. */
export function sessionSpan(session: LiveSession) {
  const at = (time: string) => new Date(`${session.date}T${time}`);
  return { start: at(session.startTime), end: at(session.endTime) };
}

// PENDING-BACKEND: `canJoin` from `GET /live-sessions/:id` will decide this.
export const joinBlockFor = (session: LiveSession): JoinBlock | undefined =>
  session.status === "upcoming" ? "too_early" : session.status === "completed" ? "ended" : undefined;

const people = [
  ["Ozavize Bello", "ozavizenotize123@gmail.com"],
  ["James Okafor", "jammiefor123@gmail.com"],
  ["Tola Adebayo", "tobayo123@gmail.com"],
  ["Seyi Wakil", "seyiwawa@gmail.com"],
  ["Peace Jane", "warbeforepeace0@gmail.com"],
  ["Hope Spring", "hopefulwinter@gmail.com"],
  ["Calm Waters", "calmwaters@gmail.com"],
  ["Sewon Sky", "sewonthesky@gmail.com"],
  ["Ada Nwosu", "adanwosu@gmail.com"],
  ["Kunle Bakare", "kunlebakare@gmail.com"],
  ["Ifeoma Eze", "ifeomaeze@gmail.com"],
  ["Musa Bello", "musabello@gmail.com"],
  ["Zainab Lawal", "zainablawal@gmail.com"],
  ["Chidi Obi", "chidiobi@gmail.com"],
  ["Ngozi Okeke", "ngoziokeke@gmail.com"],
  ["Femi Ade", "femiade@gmail.com"],
  ["Bola Ajayi", "bolaajayi@gmail.com"],
  ["Uche Nnaji", "uchennaji@gmail.com"],
  ["Ruth Daniel", "ruthdaniel@gmail.com"],
  ["Emeka Uba", "emekauba@gmail.com"],
];

const guests = (count: number) =>
  people.slice(0, count).map(([name, email], index) => ({
    id: `g-${index + 1}`,
    name,
    email,
  }));

const base = {
  startTime: "19:00",
  endTime: "20:00",
  link: "https://link.risecampus.com",
  description:
    "Description will show here if any was set by the admin on the calendar",
  recordings: [],
};

const liveClass = (track: string) => `Rise academy Live Class (${track})`;
const mentorship = "Rise academy mentorship session";

// PENDING-BACKEND: there are no live session or calendar endpoints yet, so
// admins and mentors see the design's sample sessions. They mirror the admin
// calendar's events, which is where the description and guests will come from.
export const sampleSessions: LiveSession[] = [
  { ...base, id: "s-1", status: "live", title: liveClass("UI/UX"), trackName: "Design", date: "2026-11-11", guests: guests(16) },
  { ...base, id: "s-2", status: "upcoming", title: mentorship, trackName: "Design", date: "2026-11-14", guests: guests(5) },
  { ...base, id: "s-3", status: "completed", title: liveClass("UI/UX"), trackName: "Design", date: "2026-11-07", guests: guests(16) },
  { ...base, id: "s-4", status: "completed", title: liveClass("UI/UX"), trackName: "Backend", date: "2026-10-31", guests: guests(16) },
  { ...base, id: "s-5", status: "completed", title: liveClass("Frontend"), trackName: "Mobile Engineering", date: "2026-10-24", guests: guests(20) },
  { ...base, id: "s-6", status: "completed", title: mentorship, trackName: "Frontend", date: "2026-10-17", guests: guests(3) },
  { ...base, id: "s-7", status: "completed", title: liveClass("UI/UX"), trackName: "Backend", date: "2026-10-10", guests: guests(16) },
  { ...base, id: "s-8", status: "completed", title: liveClass("Frontend"), trackName: "Mobile Engineering", date: "2026-10-03", guests: guests(20) },
];

const clockTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

/**
 * PENDING-BACKEND: the sample sessions with the live one and the next one
 * moved to today around `now`, so the join page can show "Live now" and
 * "In 45 Minutes" until the calendar endpoints exist.
 */
export function sampleSessionsAround(now: Date): LiveSession[] {
  const today = toDateKey(now);
  const at = (minutes: number) => {
    const time = new Date(now.getTime() + minutes * 60_000);
    // Keep the sample inside today so it stays on today's list.
    return toDateKey(time) === today ? clockTime(time) : "23:59";
  };

  return sampleSessions.map((session) => {
    if (session.id === "s-1") return { ...session, date: today, startTime: at(-30), endTime: at(30) };
    if (session.id === "s-2") return { ...session, date: today, startTime: at(45), endTime: at(105) };
    return session;
  });
}
