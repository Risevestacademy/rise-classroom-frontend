/**
 * Who's in the studio on the home page. Invented people — nobody here is real
 * — but the mix is Rise Academy's: four tracks, instructors, mentors and
 * students working side by side.
 */

export const TRACKS = ["Design", "Frontend", "Backend", "Mobile"] as const;
export type Track = (typeof TRACKS)[number];

export type StudioRole = "Instructor" | "Mentor" | "Student";

export type StudioPerson = {
  name: string;
  role: StudioRole;
  /** The piece of work they spend most of their time on. */
  track: Track;
};

export const STUDIO_PEOPLE: StudioPerson[] = [
  { name: "Mac David", role: "Instructor", track: "Backend" },
  { name: "Peace", role: "Mentor", track: "Frontend" },
  { name: "Olasupo", role: "Mentor", track: "Design" },
  { name: "Chinyere", role: "Student", track: "Backend" },
  { name: "Chijioke", role: "Student", track: "Frontend" },
  { name: "Gabriel", role: "Student", track: "Mobile" },
  { name: "Etim", role: "Student", track: "Design" },
  { name: "Micheal", role: "Instructor", track: "Mobile" },
  { name: "Iyobosa", role: "Student", track: "Frontend" },
  { name: "Zainab", role: "Student", track: "Design" },
  { name: "Ada", role: "Mentor", track: "Backend" },
];

/** "Ada · Mentor", or "Zainab · Frontend" for a student. */
export function tagFor(person: StudioPerson) {
  return `${person.name} · ${person.role === "Student" ? person.track : person.role}`;
}

export function isStaff(person: StudioPerson) {
  return person.role !== "Student";
}
