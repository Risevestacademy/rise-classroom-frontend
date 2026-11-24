"use client";

import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { ContinueLearningCard } from "@/components/student-dashboard/ContinueLearningCard";
import { RecentActivityCard } from "@/components/student-dashboard/RecentActivityCard";
import { UpcomingDeadlinesCard } from "@/components/student-dashboard/UpcomingDeadlinesCard";
import { UpcomingEvents } from "@/components/student-dashboard/UpcomingEvents";
import { sessionQuery } from "@/lib/session-query";
import { continueLearning } from "@/lib/student-dashboard";
import { useStudentCurriculum } from "@/lib/student-lessons";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function StudentDashboardPage() {
  const session = useQuery(sessionQuery());
  // Shared with the cards and the learning pages, so this is one request.
  const curriculum = useStudentCurriculum();

  const user = session.data?.user;
  const firstName = (user?.displayName ?? user?.name ?? "").split(" ")[0];
  const hasStarted = Boolean(
    curriculum.enrollment && continueLearning(curriculum.enrollment, curriculum.topics)
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        {session.isPending ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-medium text-neutral-800">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
        )}
        <p className="mt-1 text-sm text-neutral-500">
          {curriculum.isPending || hasStarted
            ? "Here’s what’s happening in your learning journey"
            : "Your learning journey starts here"}
        </p>
      </div>

      {/* Two rows, so Recent Activity and Upcoming deadlines line up and share a height. */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <ContinueLearningCard />
        <div className="xl:border-b xl:border-neutral-200 xl:pb-4">
          <UpcomingEvents />
        </div>
        <RecentActivityCard className="min-h-72 xl:min-h-120" />
        <UpcomingDeadlinesCard className="min-h-72 xl:min-h-120" />
      </div>
    </div>
  );
}
