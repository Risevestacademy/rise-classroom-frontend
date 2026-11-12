import {
  fieldTime,
  fromDateKey,
  monthNames,
  weekdayNames,
  type CalendarEvent,
} from "@/lib/calendar";
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
