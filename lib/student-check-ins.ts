import {
  daysLeftIn,
  weekRangeFor,
  type WeeklyMetric,
} from "@/lib/control-tower";

export type CheckInStatus = "ongoing" | "overdue" | "submitted";

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

export type CheckInAnswers = Partial<
  Record<(typeof checkInQuestions)[number]["key"], string | null>
>;

export type CheckIn = {
  id: string;
  week: number;
  range: string;
  status: CheckInStatus;
  daysLeft?: number;
  answers: CheckInAnswers;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** The same fields the student's control tower saves each answer to. */
function answersFor(metric: WeeklyMetric | undefined): CheckInAnswers {
  if (!metric) return {};
  return {
    focus: metric.priorities,
    achieve: metric.goalSummary,
    meeting: metric.mentorMeetingOutcome,
    progress: metric.progress,
    // PENDING-BACKEND(kpis): weekly metrics don't store KPIs.
    wentWell: metric.whatWentWell,
    didntGoWell: metric.challenges,
    doDifferently: metric.whatIWillDoDifferently,
  };
}

export function answeredCount(answers: CheckInAnswers) {
  return Object.values(answers).filter((answer) => answer?.trim()).length;
}

/** "Oct 12 - Oct 18, 2026", in UTC to match the stored week. */
function formatRange(start: number) {
  const format = (time: number, year?: boolean) =>
    new Date(time).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: year ? "numeric" : undefined,
      timeZone: "UTC",
    });
  return `${format(start)} - ${format(start + WEEK_MS - 1, true)}`;
}

const weekOf = (date: string | Date) =>
  Date.parse(weekRangeFor(new Date(date)).weekStart);

/**
 * Every week of the cohort so far, newest first, with the student's answers
 * for it. A week that's over without being submitted is overdue.
 */
export function studentCheckIns(
  metrics: WeeklyMetric[],
  cohort?: { startDate: string; endDate: string },
  now = new Date(),
): CheckIn[] {
  const byWeek = new Map(metrics.map((metric) => [weekOf(metric.weekStart), metric]));
  const thisWeek = weekOf(now);
  const weeks = new Set(byWeek.keys());
  const first = cohort ? weekOf(cohort.startDate) : Math.min(...weeks);
  if (cohort) {
    const last = Math.min(thisWeek, weekOf(cohort.endDate));
    for (let week = first; week <= last; week += WEEK_MS) weeks.add(week);
  }

  return Array.from(weeks)
    .sort((a, b) => b - a)
    .map((week) => {
      const metric = byWeek.get(week);
      const isSubmitted = metric !== undefined && metric.status !== "DRAFT";
      const isOngoing = !isSubmitted && week === thisWeek;
      return {
        id: String(week),
        week: Math.round((week - first) / WEEK_MS) + 1,
        range: formatRange(week),
        status: isSubmitted ? "submitted" : isOngoing ? "ongoing" : "overdue",
        daysLeft: isOngoing
          ? daysLeftIn(new Date(week + WEEK_MS - 1).toISOString(), now)
          : undefined,
        answers: answersFor(metric),
      };
    });
}
