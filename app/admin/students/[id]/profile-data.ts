// PENDING-BACKEND: the admin API has no curriculum progress, check-in,
// activity, attendance, assignment, mentorship or notes data for a student
// yet, so these tabs show the design's sample content until it does.

import type { AttendanceStatus } from "./overview-data";

export type LearningItemStatus =
  "attended" | "absent" | "graded" | "pending" | "notSubmitted";

export type LearningItem = {
  id: string;
  title: string;
  kind: "liveClass" | "assignment";
  status: LearningItemStatus;
  date: string;
  /** The second line under the date: a time, or where the work stands. */
  note: { text: string; tone?: "warning" | "error" };
  /** Assignments only. */
  score?: string;
};

export const trackProgress = {
  name: "Design Track",
  value: 84,
};

export const modules = [
  {
    id: "m1",
    label: "Module 1",
    name: "Introduction to Design",
    description:
      "Discover how product design turns user needs into useful, intuitive and meaningful experiences. Explore the core principles, process and tools designers use every day.",
    progress: 91,
    completed: 4,
    total: 6,
  },
  {
    id: "m2",
    label: "Module 2",
    name: "User research and analysis",
    progress: 82,
  },
  { id: "m3", label: "Module 3", name: "Design Layout", progress: 74 },
  { id: "m4", label: "Module 4", name: "Figma Fundamentals", progress: 74 },
  { id: "m5", label: "Module 5", name: "Grid in Design", progress: 74 },
  { id: "m6", label: "Module 6", name: "User Journey Mapping", progress: 74 },
  { id: "m7", label: "Module 7", name: "UX Laws", progress: null },
  { id: "m8", label: "Module 8", name: "Color Theory", progress: null },
] as {
  id: string;
  label: string;
  name: string;
  description?: string;
  progress: number | null;
  completed?: number;
  total?: number;
}[];

/** Learning items by module id. Only the first module has sample items. */
export const learningItems: Record<string, LearningItem[]> = {
  m1: [
    {
      id: "li1",
      title: "Inteoduction to Design",
      kind: "liveClass",
      status: "attended",
      date: "Sep 1, 2026",
      note: { text: "6:00 - 8:00 PM" },
    },
    {
      id: "li2",
      title: "Color & typography basics",
      kind: "liveClass",
      status: "attended",
      date: "Sep 1, 2026",
      note: { text: "6:00 - 8:00 PM" },
    },
    {
      id: "li3",
      title: "Visual Hierarchy",
      kind: "assignment",
      status: "graded",
      date: "Sep 6, 2026",
      note: { text: "Submittted" },
      score: "92/100",
    },
    {
      id: "li4",
      title: "Grid Layout",
      kind: "assignment",
      status: "pending",
      date: "Sep 6, 2026",
      note: { text: "Due in 3 days", tone: "warning" },
      score: "--/100",
    },
    {
      id: "li5",
      title: "Composition & layout",
      kind: "liveClass",
      status: "absent",
      date: "Sep 1, 2026",
      note: { text: "6:00 - 8:00 PM" },
    },
    {
      id: "li6",
      title: "Grid Layout",
      kind: "assignment",
      status: "notSubmitted",
      date: "Sep 6, 2026",
      note: { text: "Overdue", tone: "error" },
      score: "--/100",
    },
  ],
};

export type CheckInStatus = "ongoing" | "pending" | "overdue" | "submitted";

/** The control tower questions, in the order the design lists them. */
export const checkInQuestions = [
  { key: "focus", label: "What are you focusing on this week?" },
  { key: "achieve", label: "What do you want to achieve?" },
  {
    key: "meeting",
    label: "What came out of your meeting?",
    section: "Mentor Check-in",
  },
  { key: "progress", label: "How are you progressing?" },
  { key: "kpis", label: "Weekly KPIs" },
  { key: "wentWell", label: "What went well?", section: "Weekly Reflection" },
  { key: "didntGoWell", label: "What didn't go well?" },
  { key: "doDifferently", label: "What will you do differently?" },
] as const;

type Answers = Partial<
  Record<(typeof checkInQuestions)[number]["key"], string>
>;

const sampleAnswers: Answers = {
  focus: "Define the main thing you want to make progress on this week...",
  achieve: "Example: I want to develop my knowledge of the system architecture",
  meeting:
    "Example: My mentor was able to guide my understanding of the concept of system design",
  progress:
    "Example: My mentor was able to guide my understanding of the concept of system design",
  kpis: "Example: Build my portfolio",
  wentWell: "Example: Build my portfolio",
};

const fullAnswers: Answers = {
  ...sampleAnswers,
  didntGoWell:
    "Example: I spent too long on a problem I could have asked for help with sooner",
  doDifferently: "Example: Ask my mentor for feedback earlier in the week",
};

// The design repeats one date range for every week; these step back a week
// at a time from week 9 instead.
export const checkIns: {
  id: string;
  week: number;
  range: string;
  status: CheckInStatus;
  daysLeft?: number;
  answers: Answers;
}[] = [
  {
    id: "w9",
    week: 9,
    range: "Oct 12 - Oct 18, 2026",
    status: "ongoing",
    daysLeft: 3,
    answers: sampleAnswers,
  },
  {
    id: "w8",
    week: 8,
    range: "Oct 5 - Oct 11, 2026",
    status: "pending",
    answers: {},
  },
  {
    id: "w7",
    week: 7,
    range: "Sep 28 - Oct 4, 2026",
    status: "overdue",
    answers: fullAnswers,
  },
  {
    id: "w6",
    week: 6,
    range: "Sep 21 - Sep 27, 2026",
    status: "submitted",
    answers: fullAnswers,
  },
  {
    id: "w5",
    week: 5,
    range: "Sep 14 - Sep 20, 2026",
    status: "submitted",
    answers: fullAnswers,
  },
  {
    id: "w4",
    week: 4,
    range: "Sep 7 - Sep 13, 2026",
    status: "submitted",
    answers: fullAnswers,
  },
];

export type ActivityKind = "assignment" | "liveClass" | "checkIn" | "grade";

export const activityFilters = [
  { value: "all", label: "All activity" },
  { value: "assignment", label: "Assignments" },
  { value: "liveClass", label: "Live classes" },
  { value: "checkIn", label: "Check-ins" },
  { value: "grade", label: "Grades" },
] as const;

export const activityTimeline: {
  label: string;
  items: { time: string; title: string; detail: string; kind: ActivityKind }[];
}[] = [
  {
    label: "Today · Oct 18, 2026",
    items: [
      {
        time: "10:24 AM",
        title: "Assignment submitted",
        detail: "Design System Fundamentals · Module 2",
        kind: "assignment",
      },
      {
        time: "09:14 AM",
        title: "Weekly check-in submitted",
        detail: "Week 9",
        kind: "checkIn",
      },
    ],
  },
  {
    label: "Yesterday · Oct 17, 2026",
    items: [
      {
        time: "06:04 PM",
        title: "Attended live class",
        detail: "Via Rise Classroom",
        kind: "liveClass",
      },
      {
        time: "02:13 PM",
        title: "Watched live class recording",
        detail: "Module 1 · Week 7",
        kind: "liveClass",
      },
    ],
  },
];

export const activitySummary = [
  [
    { label: "Activities this week", value: "12", note: "Recorded events" },
    { label: "Last active", value: "10:44 AM", note: "Today" },
  ],
  [
    { label: "Assignment submitted", value: "3", note: "This week" },
    { label: "Live classes attended", value: "4", note: "This week" },
  ],
];

/** Sample sessions by "YYYY-M" (month is 0-based) and day of the month. */
export const attendanceByMonth: Record<
  string,
  Record<number, { status: AttendanceStatus; multiple?: boolean }>
> = {
  "2026-8": {
    2: { status: "attended", multiple: true },
    5: { status: "attended" },
    7: { status: "absent" },
    8: { status: "absent" },
    11: { status: "attended" },
    12: { status: "attended", multiple: true },
    14: { status: "attended" },
    16: { status: "attended" },
    18: { status: "attended" },
    19: { status: "absent" },
    24: { status: "attended", multiple: true },
  },
  "2026-9": {
    3: { status: "attended" },
    5: { status: "absent" },
    6: { status: "absent" },
    9: { status: "attended" },
    10: { status: "attended" },
    12: { status: "attended", multiple: true },
    14: { status: "attended" },
    16: { status: "attended", multiple: true },
    17: { status: "absent" },
    22: { status: "attended" },
    29: { status: "attended" },
  },
};

export type AssignmentStatus =
  | "notSubmitted"
  | "submitted"
  | "awaitingGrading"
  | "graded"
  | "overdue";

export const assignments: {
  id: string;
  title: string;
  kind: string;
  module: string;
  moduleName: string;
  /** ISO date, so the due date filter can compare it with today. */
  due: string;
  dueContext: string;
  status: AssignmentStatus;
  /** Graded assignments only. */
  score?: number;
  outOf?: number;
}[] = [
  {
    id: "a1",
    title: "Visual Hierarchy",
    kind: "Project · Individual",
    module: "Module 1",
    moduleName: "Introduction to Design",
    due: "2026-10-12",
    dueContext: "After lesson 3",
    status: "graded",
    score: 85,
    outOf: 100,
  },
  {
    id: "a2",
    title: "User Research Report",
    kind: "Report · Individual",
    module: "Module 2",
    moduleName: "User Research",
    due: "2026-10-21",
    dueContext: "After lesson 4",
    status: "submitted",
  },
  {
    id: "a3",
    title: "Visual Hierarchy",
    kind: "Project · Individual",
    module: "Module 1",
    moduleName: "Introduction to Design",
    due: "2026-10-12",
    dueContext: "After lesson 3",
    status: "overdue",
  },
  {
    id: "a4",
    title: "Visual Hierarchy",
    kind: "Project · Individual",
    module: "Module 1",
    moduleName: "Introduction to Design",
    due: "2026-10-12",
    dueContext: "After lesson 3",
    status: "graded",
    score: 92,
    outOf: 100,
  },
];

export const mentorship = {
  mentor: {
    name: "David Orobosa",
    role: "Senior Product Designer",
    track: "Design",
    status: "Active",
    cohort: "Cohort 2026",
  },
  sessions: { total: 12, attended: 8, missed: 4 },
  upcoming: [
    { date: "Mon, Oct 12 2026", time: "6:00 PM -7:00 PM" },
    { date: "Mon, Oct 12 2026", time: "6:50 PM -7:00 PM" },
  ],
};

export const profileNotes: {
  id: string;
  title: string;
  body: string;
  author: string;
  role: string;
  date: string;
  pinned: boolean;
}[] = [
  {
    id: "n1",
    title: "Needs additional support with API concepts",
    body: "Seyi is finding it challenging to grasp API integration concepts. Recommended assigning additional resources and a follow up session.",
    author: "David Orobosa",
    role: "Mentor",
    date: "Sep 28, 2026",
    pinned: true,
  },
  {
    id: "n2",
    title: "Great Progress on UI project",
    body: "Seyi showed significant improvement in the recent UI project review. Demonstrated strong problem-solving skills and good attention to detail.",
    author: "Aishat Lawal",
    role: "Instructor",
    date: "Sep 28, 2026",
    pinned: false,
  },
];

export type AttendanceSession = {
  name: string;
  time: string;
  status: "attended" | "absent";
};

/** The sessions behind a day on the attendance calendar, as in the design. */
export function sessionsOn(day: {
  status: AttendanceStatus;
  multiple?: boolean;
}): AttendanceSession[] {
  if (day.status === "none") return [];
  const liveClass: AttendanceSession = {
    name: "Rise Academy live class",
    time: "6:00 PM – 8:00 PM",
    status: day.status,
  };
  if (!day.multiple) return [liveClass];
  return [
    liveClass,
    { name: "Mentorship session", time: "6:00 PM – 8:00 PM", status: "absent" },
    { name: "Sprint session", time: "9:00 PM – 10:00 PM", status: "absent" },
  ];
}
