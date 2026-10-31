"use client";

import * as React from "react";

import { BrandBadge, Card, CardHeader } from "@/components/student-profile/shared";
import {
  formatWeekRange,
  isSameWeek,
  weekRangeFor,
  type WeeklyMetric,
} from "@/lib/control-tower";
import { cn } from "@/lib/utils";

/* How a week reads to an admin or mentor. A past week still in draft was never submitted. */
export type CheckInStatus = "ongoing" | "missed" | "submitted" | "reviewed" | "completed";

export const checkInStatus: Record<CheckInStatus, { label: string; text: string }> = {
  ongoing: { label: "Ongoing", text: "text-text-info" },
  missed: { label: "Missed", text: "text-text-error" },
  submitted: { label: "Submitted", text: "text-text-warning" },
  reviewed: { label: "Reviewed", text: "text-text-success" },
  completed: { label: "Completed", text: "text-text-success" },
};

export function statusOf(metric: WeeklyMetric, currentWeekStart: string): CheckInStatus {
  if (metric.status === "COMPLETED") return "completed";
  if (metric.status === "REVIEWED") return "reviewed";
  if (metric.status === "SUBMITTED") return "submitted";
  return isSameWeek(metric.weekStart, currentWeekStart) ? "ongoing" : "missed";
}

/* The student's prompts in the order the design lists them, read from the API's fields.
   The older progress and challenges fields stand in for weeks saved before the change. */
const questions: {
  key: string;
  label: string;
  section?: string;
  /* The mentor's own notes, which the review card edits instead when there is one. */
  mentor?: boolean;
  answer: (metric: WeeklyMetric) => string | null | undefined;
}[] = [
  {
    key: "focus",
    label: "What are you focusing on this week?",
    answer: (metric) => metric.priorities,
  },
  {
    key: "achieve",
    label: "What do you want to achieve?",
    answer: (metric) => metric.goalSummary,
  },
  {
    key: "meeting",
    label: "What came out of your meeting?",
    section: "Mentor Check-in",
    mentor: true,
    answer: (metric) => metric.mentorMeetingOutcome,
  },
  {
    key: "feedback",
    label: "Mentor feedback",
    mentor: true,
    answer: (metric) => metric.mentorFeedback,
  },
  {
    key: "wentWell",
    label: "What went well?",
    section: "Weekly Reflection",
    answer: (metric) => metric.whatWentWell ?? metric.progress,
  },
  {
    key: "doDifferently",
    label: "What will you do differently?",
    answer: (metric) => metric.whatIWillDoDifferently ?? metric.challenges,
  },
];

const studentQuestions = questions.filter((question) => !question.mentor);

function answeredCount(metric: WeeklyMetric) {
  return studentQuestions.filter((question) => question.answer(metric)?.trim()).length;
}

/* A student's weekly check-ins: the list of weeks on the left, the chosen week's
   answers on the right. `review` adds the mentor's review card for the chosen week. */
export function CheckInsView({
  firstName,
  cohort,
  weeks,
  weekNumbers,
  side,
  review,
}: {
  firstName: string;
  cohort?: string;
  weeks: WeeklyMetric[];
  /* Week numbers from the cohort timeline, keyed by the saved week's id. */
  weekNumbers?: Map<string, number>;
  /* Shown under the list of weeks, e.g. the student's goals and KPIs. */
  side?: React.ReactNode;
  review?: (week: WeeklyMetric) => React.ReactNode;
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [currentWeekStart] = React.useState(() => weekRangeFor().weekStart);
  const sorted = [...weeks].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const current = sorted.find((week) => week.id === selectedId) ?? sorted[0];

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,391fr)_minmax(0,721fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card className="gap-3">
          <CardHeader
            size="h4"
            title="Weekly check-ins"
            subtitle={cohort}
            subtitleClassName="text-[13px]/[18px]"
          />
          {sorted.length === 0 ? (
            <p className="font-work text-sm text-text-secondary">
              {firstName} hasn&apos;t filled in a week yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {sorted.map((week) => {
                const active = week.id === current?.id;
                const status = checkInStatus[statusOf(week, currentWeekStart)];
                const count = answeredCount(week);
                const number = weekNumbers?.get(week.id);
                return (
                  <li key={week.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedId(week.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg p-2 text-left",
                        active ? "bg-brand-100" : "hover:bg-surface-background",
                      )}
                    >
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-base font-medium text-text-primary">
                          {number ? `Week ${number}` : "Week"}
                        </span>
                        <span className="truncate font-work text-sm text-text-primary">
                          {formatWeekRange(week.weekStart, week.weekEnd)}
                        </span>
                      </span>
                      <span className="flex w-[85px] shrink-0 flex-col items-end gap-1">
                        <BrandBadge className={status.text}>{status.label}</BrandBadge>
                        <span className="font-work text-sm text-text-secondary">
                          {count === 0 ? "--" : `${count} answered`}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {side}
      </div>

      {current ? (
        <WeekDetail
          key={current.id}
          week={current}
          number={weekNumbers?.get(current.id)}
          status={statusOf(current, currentWeekStart)}
          firstName={firstName}
          review={review}
        />
      ) : (
        <Card>
          <p className="font-work text-sm text-text-secondary">
            {firstName}&apos;s answers will show here once they start a week.
          </p>
        </Card>
      )}
    </div>
  );
}

function WeekDetail({
  week,
  number,
  status,
  firstName,
  review,
}: {
  week: WeeklyMetric;
  number: number | undefined;
  status: CheckInStatus;
  firstName: string;
  review?: (week: WeeklyMetric) => React.ReactNode;
}) {
  /* With a review card, the mentor's notes are edited there instead of shown here. */
  const shown = review ? questions.filter((question) => !question.mentor) : questions;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Card className="flex-row items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-xl font-semibold text-text-primary">
            {number ? `Week ${number} check-in` : "Weekly check-in"}
          </h2>
          <p className="font-work text-sm text-text-primary">
            {formatWeekRange(week.weekStart, week.weekEnd)}
          </p>
        </div>
        <p className="shrink-0 text-base font-medium text-text-primary">
          {status === "ongoing"
            ? "Week in progress"
            : `Week ${checkInStatus[status].label.toLowerCase()}`}
        </p>
      </Card>

      {review?.(week)}

      <Card className="gap-3">
        <div className="flex items-start justify-between gap-4 border-b border-border-default pb-3">
          <CardHeader
            size="h4"
            title="Student responses"
            subtitle={`Here are ${firstName}’s answers for this week’s check-in.`}
          />
          <p className="shrink-0 font-work text-sm font-medium tracking-[-0.01em] text-text-primary">
            {answeredCount(week)}/{studentQuestions.length} Answered
          </p>
        </div>

        {shown.map((question) => (
          <React.Fragment key={question.key}>
            {question.section && (
              <BrandBadge className="w-fit text-text-info">{question.section}</BrandBadge>
            )}
            <div className="flex flex-col gap-1">
              <p className="py-0.5 text-sm font-medium text-text-primary">
                {question.label}
              </p>
              <p className="max-h-[160px] min-h-[60px] overflow-y-auto rounded-xl bg-surface-subtle p-3 font-work text-[13px]/[18px] whitespace-pre-line text-text-primary">
                {question.answer(week)?.trim() || "--"}
              </p>
            </div>
          </React.Fragment>
        ))}
      </Card>
    </div>
  );
}
