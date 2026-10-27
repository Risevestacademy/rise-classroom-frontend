// PENDING-BACKEND: admins can't list a mentor's students, sessions or
// activity yet, so the mentor profile shows this sample data from the design.

export type AssignedStudent = {
  id: string;
  name: string;
  email: string;
  status: "active" | "pending" | "inactive";
  progress: number;
};

export const assignedStudents: AssignedStudent[] = [
  { id: "1", name: "Seyi Wakil", email: "seyiwawa@gmail.com", status: "active", progress: 84 },
  { id: "2", name: "Tola Adebayo", email: "tobayo123@gmail.com", status: "active", progress: 72 },
  { id: "3", name: "James Okafor", email: "jammiefor123@gmail.com", status: "active", progress: 68 },
  { id: "4", name: "Peace Jane", email: "warbeforepeace0@gmail.com", status: "active", progress: 92 },
  { id: "5", name: "Ozavize Bello", email: "ozavizenotize123@gmail.com", status: "active", progress: 49 },
];

/** Below this overall progress a student is flagged as needing attention. */
export const attentionThreshold = 50;

export const upcomingSessions = [
  { date: "Mon, Oct 12 2026", time: "6:00 PM - 7:00 PM", until: "In 12 hours" },
  { date: "Wed, Oct 21 2026", time: "6:00 PM - 7:00 PM", until: "In 9 days" },
  { date: "Mon, Nov 5 2026", time: "6:00 PM - 7:00 PM", until: "In 21 days" },
];

export type MentorActivityKind = "session" | "note" | "student" | "profile";

export const mentorActivityFilters = [
  { value: "all", label: "All activity" },
  { value: "session", label: "Sessions" },
  { value: "note", label: "Notes" },
] as const;

export const mentorActivity = (
  mentorName: string,
): {
  label: string;
  items: { time: string; title: string; detail: string; kind: MentorActivityKind }[];
}[] => [
  {
    label: "Today · Oct 18, 2026",
    items: [
      {
        time: "10:24 AM",
        title: "Group mentoring session completed",
        detail: "Design Mentorship · 5 participants",
        kind: "session",
      },
      {
        time: "09:14 AM",
        title: "Student assigned",
        detail: `Ozavize Bello was assigned to ${mentorName}.`,
        kind: "student",
      },
    ],
  },
  {
    label: "Yesterday · Oct 17, 2026",
    items: [
      {
        time: "06:04 PM",
        title: "Note added",
        detail: "Added a note to Seyi Wakil's profile.",
        kind: "note",
      },
      {
        time: "02:12 PM",
        title: "Contact information updated",
        detail: "Updated the mentor's contact information.",
        kind: "profile",
      },
    ],
  },
  {
    label: "Wednesday · Oct 9, 2026",
    items: [
      {
        time: "06:04 PM",
        title: "Note pinned",
        detail: "Pinned an important note to James Okafor's profile.",
        kind: "note",
      },
      {
        time: "02:12 PM",
        title: "Student progress updated",
        detail: "Tola Adebayo's overall progress increased to 80%.",
        kind: "student",
      },
    ],
  },
];
