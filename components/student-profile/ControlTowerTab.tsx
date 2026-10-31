"use client";

import { useQuery } from "@tanstack/react-query";

import { CheckInsView } from "@/components/control-tower/CheckIns";
import { GoalsAndKpis } from "@/components/control-tower/GoalsAndKpis";
import { Skeleton } from "@/components/ui/skeleton";
import { controlTowerKeys, controlTowerQueries } from "@/lib/control-tower";
import { Card } from "./shared";

/* A student's Control Tower as a super admin sees it: their weekly check-ins,
   and their goals and KPIs. Needs the student's profile id, not their user id. */
export function ControlTowerTab({
  studentProfileId,
  firstName,
  cohort,
}: {
  studentProfileId: string | undefined;
  firstName: string;
  cohort?: string;
}) {
  const profileId = studentProfileId ?? "";
  const towerQuery = useQuery(controlTowerQueries.forStudent(profileId));
  const metricsQuery = useQuery(controlTowerQueries.weeklyMetrics(profileId));

  if (!studentProfileId) {
    return (
      <Card>
        <p className="font-work text-sm text-text-secondary">
          {firstName} isn&apos;t in a cohort yet, so there&apos;s no Control Tower
          to show.
        </p>
      </Card>
    );
  }

  if (towerQuery.isPending || metricsQuery.isPending) {
    return (
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,391fr)_minmax(0,721fr)]">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-[480px] w-full rounded-xl" />
      </div>
    );
  }

  const error = towerQuery.error ?? metricsQuery.error;
  if (error) {
    return (
      <Card>
        <p role="alert" className="font-work text-sm text-text-error">
          Couldn&apos;t load {firstName}&apos;s Control Tower. {error.message}
        </p>
      </Card>
    );
  }

  const tower = towerQuery.data;
  /* Week numbers come from the cohort timeline, matched on the saved week. */
  const weekNumbers = new Map(
    (tower?.timeline ?? [])
      .filter((week) => week.metricId)
      .map((week) => [week.metricId!, week.weekNumber]),
  );

  return (
    <CheckInsView
      firstName={firstName}
      cohort={cohort}
      weeks={metricsQuery.data ?? []}
      weekNumbers={weekNumbers}
      side={
        <GoalsAndKpis
          studentProfileId={profileId}
          goals={tower?.goals ?? []}
          kpis={
            tower?.kpis?.items ?? (tower?.goals ?? []).flatMap((goal) => goal.kpis ?? [])
          }
          summary={tower?.kpis?.summary}
          editable={false}
          queryKey={controlTowerKeys.forStudent(profileId)}
        />
      }
    />
  );
}
