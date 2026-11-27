"use client";

import { useQuery } from "@tanstack/react-query";

import { AppTopNav } from "@/components/AppTopNav";
import { CalendarScreen } from "@/components/calendar/CalendarScreen";
import { myMenteesQuery } from "@/lib/mentors";

export default function MentorCalendarPage() {
  // The API needs a cohort for each task, so a mentor's go in their students'.
  const mentees = useQuery(myMenteesQuery());
  return (
    <CalendarScreen
      topNav={
        <AppTopNav
          basePath="/mentor"
          breadcrumb={["Overview", { label: "Calendar", href: "/mentor/calendar" }]}
        />
      }
      taskCohortId={mentees.data?.[0]?.student.cohort.id}
      noTaskCohort="Tasks are kept in your students' cohort, and you don't have any students yet."
    />
  );
}
