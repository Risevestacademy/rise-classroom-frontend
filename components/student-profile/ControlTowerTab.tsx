"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  checkInQuestions,
  checkIns,
  type CheckInStatus,
} from "@/app/admin/students/[id]/profile-data";
import { Card, CardHeader } from "./shared";

const checkInStatus: Record<
  CheckInStatus,
  { label: string; badge: "neutral" | "warning" | "error" | "success" }
> = {
  ongoing: { label: "Ongoing", badge: "neutral" },
  pending: { label: "Pending", badge: "warning" },
  overdue: { label: "Overdue", badge: "error" },
  submitted: { label: "Submitted", badge: "success" },
};

function answeredCount(answers: Record<string, string | undefined>) {
  return Object.values(answers).filter(Boolean).length;
}

export function ControlTowerTab({
  firstName,
  cohort,
}: {
  firstName: string;
  cohort?: string;
}) {
  const [weekId, setWeekId] = React.useState(checkIns[0].id);
  const current = checkIns.find((item) => item.id === weekId) ?? checkIns[0];
  const answered = answeredCount(current.answers);

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,391fr)_minmax(0,721fr)]">
      <Card className="gap-3">
        <CardHeader
          size="h4"
          title="Weekly check-ins"
          subtitle={cohort}
          subtitleClassName="text-[13px]/[18px]"
        />
        <ul className="flex flex-col">
          {checkIns.map((item) => {
            const active = item.id === current.id;
            const status = checkInStatus[item.status];
            const count = answeredCount(item.answers);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setWeekId(item.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg p-2 text-left",
                    active ? "bg-brand-100" : "hover:bg-surface-background",
                  )}
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-base font-medium text-text-primary">
                      Week {item.week}
                    </span>
                    <span className="truncate font-work text-sm text-text-primary">
                      {item.range}
                    </span>
                  </span>
                  <span className="flex w-[85px] shrink-0 flex-col items-end gap-1">
                    <Badge variant="light" status={status.badge}>
                      {status.label}
                    </Badge>
                    <span className="font-work text-sm text-text-secondary">
                      {count === 0 ? "--" : `${count} answered`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <Card className="flex-row items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-xl font-semibold text-text-primary">
              Week {current.week} check-in
            </h2>
            <p className="font-work text-sm text-text-primary">
              {current.range}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-1">
            <p className="text-base font-medium text-text-primary">
              {current.status === "ongoing"
                ? "Week in progress"
                : `Week ${checkInStatus[current.status].label.toLowerCase()}`}
            </p>
            {current.daysLeft !== undefined && (
              <Badge variant="light" status="warning" size="lg">
                {current.daysLeft} days left
              </Badge>
            )}
          </div>
        </Card>

        <Card className="gap-3">
          <div className="flex items-start justify-between gap-4 border-b border-border-default pb-3">
            <CardHeader
              size="h4"
              title="Student responses"
              subtitle={`Here are ${firstName}’s answers for this week’s check-in.`}
            />
            <p className="shrink-0 font-work text-sm font-medium tracking-[-0.01em] text-text-primary">
              {answered}/{checkInQuestions.length} Answered
            </p>
          </div>

          {checkInQuestions.map((question) => (
            <React.Fragment key={question.key}>
              {"section" in question && (
                <Badge variant="light" status="info">
                  {question.section}
                </Badge>
              )}
              <div className="flex flex-col gap-1">
                <p className="py-0.5 text-sm font-medium text-text-primary">
                  {question.label}
                </p>
                <p className="h-[100px] overflow-y-auto rounded-xl bg-surface-subtle p-3 font-work text-[13px]/[18px] whitespace-pre-line text-text-primary">
                  {current.answers[question.key] || "--"}
                </p>
              </div>
            </React.Fragment>
          ))}
        </Card>
      </div>
    </div>
  );
}
