export type AttendanceStatus = "attended" | "absent" | "none";

export const mentor = {
  name: "David Orobosa",
  role: "Senior Product Designer",
  nextSession: "Sep 30, 2026 · 6:00 PM -7:00 PM",
};

export const moduleProgress = [
  { label: "Design System", value: 91, tone: "primary" },
  { label: "Visual identity", value: 82, tone: "info" },
  { label: "UX Research", value: 74, tone: "success" },
  { label: "Prototyping", value: 88, tone: "accent" },
] as const;

export const deadlines = [
  {
    title: "UX Report",
    type: "Assignment",
    due: "Due in 3 days",
    tone: "error",
  },
  {
    title: "Talent Factory Africa",
    type: "Group project",
    due: "Due in 11 days",
    tone: "warning",
  },
  {
    title: "Design Systems",
    type: "Assignment",
    due: "Due in 21 days",
    tone: "neutral",
  },
] as const;

export const activityGroups = [
  {
    label: "Today",
    items: [
      {
        title: "Submitted assignment 4",
        detail: "UX Research Methods",
        time: "10:30 AM",
        kind: "assignment",
      },
      {
        title: "Completed Lesson 8",
        detail: "User Testing & Insights",
        time: "9:15 AM",
        kind: "lesson",
      },
      {
        title: "Attended mentorship session",
        detail: "with David Adeyemi",
        time: "8:00 AM",
        kind: "session",
      },
    ],
  },
  {
    label: "Yesterday",
    items: [
      {
        title: "Received feedback",
        detail: "Assignment 3 -Wireframes",
        time: "4:15 PM",
        kind: "assignment",
      },
      {
        title: "Completed Lesson 7",
        detail: "Design Systems",
        time: "2:45 PM",
        kind: "lesson",
      },
    ],
  },
] as const;

export const notes = [
  {
    date: "Sep 20, 2026",
    body: "Student is making good progress. Needs additional support with prototyping tools.",
    author: "By Instructor",
  },
];

// September 2026 starts on a Tuesday, so the grid opens with two blanks.
export const attendanceMonth = {
  label: "SEP",
  leadingBlanks: 2,
  days: [
    "none",
    "attended",
    "none",
    "none",
    "attended",
    "none",
    "none",
    "absent",
    "none",
    "none",
    "attended",
    "attended",
    "none",
    "absent",
    "none",
    "attended",
    "none",
    "attended",
    "absent",
    "none",
    "attended",
    "none",
    "none",
    "attended",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
  ] as AttendanceStatus[],
};
