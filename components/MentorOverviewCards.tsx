import Link from "next/link";

import { Calendar03 } from "@/assets/icons";
import { StatusPill } from "@/components/cohorts/CohortPeopleTable";
import { PersonAvatar } from "@/components/PersonAvatar";
import {
  Card,
  CardHeader,
  ProgressBar,
} from "@/components/student-profile/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  attentionThreshold,
  type AssignedStudent,
} from "@/app/admin/mentors/[id]/profile-data";

export type UpcomingSession = {
  date: string;
  time: string;
  until: string;
  joinable?: boolean;
};

export const studentStatusPill = {
  active: { label: "Active", status: "success" },
  pending: { label: "Pending", status: "warning" },
  inactive: { label: "Inactive", status: "error" },
} as const;

export function needsAttention(student: AssignedStudent) {
  return student.progress < attentionThreshold;
}

export function progressTone(student: AssignedStudent) {
  return needsAttention(student)
    ? { text: "text-text-error", bar: "bg-icon-error" }
    : { text: "text-text-primary", bar: "bg-interactive-primary-default" };
}

/** A student's name, starred in red when they need attention. */
export function StudentName({
  student,
  href,
}: {
  student: AssignedStudent;
  href: string;
}) {
  return (
    <Link href={href} className="truncate text-base font-medium text-text-primary">
      {student.name}
      {needsAttention(student) && (
        <>
          {" "}
          <span aria-hidden className="text-text-error">
            *
          </span>
          <span className="sr-only">(needs attention)</span>
        </>
      )}
    </Link>
  );
}

export function StudentsProgressCard({
  title,
  students,
  studentHref,
}: {
  title: string;
  students: AssignedStudent[];
  studentHref: (student: AssignedStudent) => string;
}) {
  return (
    <Card>
      <CardHeader
        title={title}
        action={
          <Button variant="tertiary" size="sm">
            View all
          </Button>
        }
      />
      <ul className="flex flex-col gap-3">
        {students.map((student) => {
          const tone = progressTone(student);
          return (
            <li
              key={student.email}
              className="flex min-h-[68px] items-center justify-between gap-4 pl-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <PersonAvatar
                  name={student.name}
                  colorKey={student.id}
                  size={40}
                />
                <div className="min-w-0">
                  <StudentName student={student} href={studentHref(student)} />
                  <p className="truncate font-work text-sm text-text-secondary">
                    {student.email}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-6 sm:gap-20">
                <StatusPill status={studentStatusPill[student.status].status}>
                  {studentStatusPill[student.status].label}
                </StatusPill>
                <div className="flex w-[152px] flex-col gap-2">
                  <div>
                    <p className={cn("text-lg/6 font-semibold", tone.text)}>
                      {student.progress}%
                    </p>
                    <p className="font-work text-[13px]/[18px] text-text-muted">
                      Overall progress
                    </p>
                  </div>
                  <ProgressBar
                    value={student.progress}
                    fillClassName={tone.bar}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function UpcomingSessionsCard({
  sessions,
}: {
  sessions: UpcomingSession[];
}) {
  return (
    <Card className="gap-3">
      <CardHeader
        size="h4"
        title="Upcoming sessions"
        action={
          <Button variant="tertiary" size="sm">
            View all
          </Button>
        }
      />
      <ul className="flex flex-col gap-3">
        {sessions.map((session) => (
          <li
            key={session.date + session.until}
            className="flex items-center justify-between gap-3 border-b border-border-default py-3 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-info-badge text-icon-info">
                <Calendar03 className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="truncate font-work text-sm font-medium tracking-[-0.01em] text-text-primary">
                  {session.date}
                </p>
                <p className="font-work text-xs text-text-secondary">
                  {session.time}
                </p>
              </div>
            </div>
            {session.joinable ? (
              <Button variant="tertiary" size="sm">
                Join
              </Button>
            ) : (
              <span className="shrink-0 font-work text-[13px]/[18px] text-text-secondary">
                {session.until}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
