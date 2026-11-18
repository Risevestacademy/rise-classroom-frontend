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
import { myMenteesQuery, toMyAssignedStudent } from "@/lib/mentors";
import { sessionQuery } from "@/lib/session-query";
import { greeting } from "@/lib/utils";
import { mentorActivity } from "@/app/admin/mentors/[id]/profile-data";

// PENDING-BACKEND: there are no sessions or activity yet, so those show sample
// data from the design. Mentors can't read their students' progress either, so
// it shows as "--".
const sessions: UpcomingSession[] = [
  { date: "Sat, Oct 27 2026", time: "6:00 PM - 7:00 PM", until: "Today", joinable: true },
  { date: "Sat, Nov 5 2026", time: "6:00 PM - 7:00 PM", until: "In 9 days" },
  { date: "Sat, Nov 5 2026", time: "6:00 PM - 7:00 PM", until: "In 16 days" },
];
const sessionsThisWeek = 1;

export default function MentorDashboardPage() {
  const session = useQuery(sessionQuery());
  const mentorName = session.data?.user.firstName ?? "Mentor";
  const [latestDay] = mentorActivity(mentorName);
  const mentees = useQuery(myMenteesQuery());
  const students = (mentees.data ?? []).map(toMyAssignedStudent);
  const studentsValue = mentees.isPending ? "--" : students.length;

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
              value={studentsValue}
              icon={UserMultiple}
              iconClassName="bg-surface-info-badge text-icon-info"
              className="min-h-[120px]"
            />
            <MetricCard
              title="Students needing attention"
              value="--"
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
              value="--"
              icon={Progress}
              iconClassName="bg-surface-warning-badge text-icon-warning"
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,759fr)_minmax(0,361fr)]">
            <StudentsProgressCard
              title="Students progress"
              students={students}
              loading={mentees.isPending}
              emptyMessage={
                mentees.error
                  ? `Couldn't load your students. ${mentees.error.message}`
                  : "No students assigned yet."
              }
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
