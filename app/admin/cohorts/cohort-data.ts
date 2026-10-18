// Types and labels for the cohort screens. The data comes from lib/cohorts.ts.

export type CohortStatus = "active" | "upcoming" | "completed" | "terminated";

export type CohortSummary = {
  id: string;
  name: string;
  status: CohortStatus;
  startDate: string;
  endDate: string;
  students: number;
  tracks: number;
  progress: number;
  /** Days until the end date; only shown for active cohorts. */
  daysLeft: number;
  /** Days until the start date; only shown for upcoming cohorts. */
  daysToStart: number;
};

export const cohortStatusLabels: Record<CohortStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  completed: "Completed",
  terminated: "Terminated",
};

export type TrackKey = "design" | "frontend" | "backend" | "mobile";

export type StudentStatus = "onTrack" | "atRisk" | "needsAttention";

export const studentStatusLabels: Record<StudentStatus, string> = {
  onTrack: "On track",
  atRisk: "At risk",
  // Spelling kept from the design.
  needsAttention: "Needs atttention",
};

/** `avatar` is an image path; otherwise the initials are shown in `tone`. */
export type Person = {
  name: string;
  email: string;
  initials?: string;
  tone?: "warning" | "info" | "success" | "accent" | "error";
  avatar?: string;
};
