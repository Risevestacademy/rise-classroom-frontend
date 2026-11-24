"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import {
  liveSessionQueries,
  sessionStanding,
  stillAhead,
  toUpcomingSession,
  upcomingRange,
} from "@/lib/live-sessions";
import { myMenteesQuery, toMyAssignedStudent } from "@/lib/mentors";
import { sessionQuery } from "@/lib/session-query";
import { useCurrentMinute } from "@/lib/use-current-minute";
import { greeting } from "@/lib/utils";
import { mentorActivity } from "@/app/admin/mentors/[id]/profile-data";

// PENDING-BACKEND: there's no activity feed yet, so that shows sample data
// from the design. Mentors can't read their students' progress either, so it
// shows as "--".

/** Sessions listed on the card before "View all". */
const VISIBLE_SESSIONS = 3;

/** The start of next Monday, so "this week" runs to Sunday night. */
function endOfWeek(now: number) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 7 - ((date.getDay() + 6) % 7));
  return date.getTime();
}

export default function MentorDashboardPage() {
  const session = useQuery(sessionQuery());
  const mentorName = session.data?.user.firstName ?? "Mentor";
  const [latestDay] = mentorActivity(mentorName);
  const mentees = useQuery(myMenteesQuery());
  const students = (mentees.data ?? []).map(toMyAssignedStudent);
  const studentsValue = mentees.isPending ? "--" : students.length;

  const router = useRouter();
  const now = useCurrentMinute();
  const [range] = React.useState(() => upcomingRange(Date.now()));
  const liveSessions = useQuery(liveSessionQueries.list(range));
  const ahead = now === null ? [] : stillAhead(liveSessions.data ?? [], now);
  const sessions: UpcomingSession[] = ahead
    .slice(0, VISIBLE_SESSIONS)
    .map((live) => ({
      ...toUpcomingSession(live, now ?? 0),
      joinable: now !== null && sessionStanding(live, now).joinable,
      href: `/mentor/live/${live.id}`,
    }));
  const sessionsLoading = liveSessions.isPending || now === null;
  const sessionsThisWeek = sessionsLoading
    ? "--"
    : ahead.filter((live) => Date.parse(live.startsAt) < endOfWeek(now)).length;

  return (
    <>
      <AppTopNav
        basePath="/mentor"
        breadcrumb={[
          "Overview",
          { label: "Dashboard", href: "/mentor/dashboard" },
        ]}
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
            />
            <div className="flex min-w-0 flex-col gap-4">
              <UpcomingSessionsCard
                sessions={sessions}
                loading={sessionsLoading}
                emptyMessage={
                  liveSessions.isError
                    ? "Couldn't load your sessions."
                    : "No upcoming sessions."
                }
                onViewAll={() => router.push("/mentor/live-sessions")}
              />
              <Card className="gap-4">
                <CardHeader size="h4" title="Most recent activity" />
                <ActivityTimeline
                  groups={[
                    { ...latestDay, items: latestDay.items.slice(0, 1) },
                  ]}
                />
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
