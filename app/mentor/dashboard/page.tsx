"use client";

import { useQuery } from "@tanstack/react-query";

import {
  AlertCircle,
  Calendar03,
  Progress,
  UserMultiple,
} from "@/assets/icons";
import { AppTopNav } from "@/components/AppTopNav";
import { MetricCard } from "@/components/MetricCard";
import {
  needsAttention,
  StudentsProgressCard,
  UpcomingSessionsCard,
  type UpcomingSession,
} from "@/components/MentorOverviewCards";
import {
  ActivityTimeline,
  Card,
  CardHeader,
} from "@/components/student-profile/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionQuery } from "@/lib/session-query";
import { greeting } from "@/lib/utils";
import {
  assignedStudents,
  mentorActivity,
} from "@/app/admin/mentors/[id]/profile-data";

// PENDING-BACKEND: mentors can't list their students, sessions or activity yet,
// so the dashboard shows sample data from the design.
const sessions: UpcomingSession[] = [
  { date: "Sat, Oct 27 2026", time: "6:00 PM - 7:00 PM", until: "Today", joinable: true },
  { date: "Sat, Nov 5 2026", time: "6:00 PM - 7:00 PM", until: "In 9 days" },
  { date: "Sat, Nov 5 2026", time: "6:00 PM - 7:00 PM", until: "In 16 days" },
];
const sessionsThisWeek = 1;
const students = [...assignedStudents].sort((a, b) => a.progress - b.progress);
const averageProgress = Math.round(
  students.reduce((sum, student) => sum + student.progress, 0) /
    students.length,
);

export default function MentorDashboardPage() {
  const session = useQuery(sessionQuery());
  const mentorName = session.data?.user.firstName ?? "Mentor";
  const [latestDay] = mentorActivity(mentorName);

  return (
    <>
      <AppTopNav
        basePath="/mentor"
        breadcrumb={["Overview", { label: "Dashboard", href: "/mentor/dashboard" }]}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
          <div>
            <h1 className="text-2xl leading-8 font-semibold text-text-primary">
              {session.isPending ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                `${greeting()}, ${mentorName}`
              )}
            </h1>
            <p className="mt-1 font-work text-sm text-text-secondary">
              Here&apos;s what&apos;s happening with your students and mentoring
              activities.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="My students"
              value={students.length}
              icon={UserMultiple}
              iconClassName="bg-surface-info-badge text-icon-info"
              className="min-h-[120px]"
            />
            <MetricCard
              title="Students needing attention"
              value={students.filter(needsAttention).length}
              icon={AlertCircle}
              iconClassName="bg-surface-error-badge text-icon-error"
              className="min-h-[120px]"
            />
            <MetricCard
              title="Upcoming sessions"
              value={sessionsThisWeek}
              description="This week"
              icon={Calendar03}
              iconClassName="bg-surface-success-badge text-icon-success"
              className="min-h-[120px]"
            />
            <MetricCard
              title="Average student progress"
              value={`${averageProgress}%`}
              icon={Progress}
              iconClassName="bg-surface-warning-badge text-icon-warning"
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,759fr)_minmax(0,361fr)]">
            <StudentsProgressCard
              title="Students progress"
              students={students}
              studentHref={(student) => `/mentor/students/${student.id}`}
            />
            <div className="flex min-w-0 flex-col gap-4">
              <UpcomingSessionsCard sessions={sessions} />
              <Card className="gap-4">
                <CardHeader size="h4" title="Most recent activity" />
                <ActivityTimeline
                  groups={[{ ...latestDay, items: latestDay.items.slice(0, 1) }]}
                />
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
