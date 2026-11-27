"use client";

import { AdminTopNav } from "@/components/AdminTopNav";
import { CalendarScreen } from "@/components/calendar/CalendarScreen";
import { useSelectedCohort } from "@/lib/selected-cohort";

export default function CalendarPage() {
  const { cohortId } = useSelectedCohort();
  return (
    <CalendarScreen
      topNav={
        <AdminTopNav
          breadcrumb={["Overview", { label: "Calendar", href: "/admin/calendar" }]}
        />
      }
      cohortId={cohortId}
      taskCohortId={cohortId}
    />
  );
}
