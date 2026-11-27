"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanionCheer } from "@/components/mascot/Companion";
import { HowItWorksDialog } from "@/components/control-tower/ControlTowerDialogs";
import {
  ControlTowerTour,
  useControlTowerTour,
} from "@/components/control-tower/ControlTowerTour";
import { GoalsAndKpis } from "@/components/control-tower/GoalsAndKpis";
import {
  ControlTowerColumn,
  ControlTowerMenu,
  LoadErrorPanel,
  PREVIOUS_WEEKS_PATH,
  WeekFields,
  WeekFieldsSkeleton,
} from "@/components/control-tower/ControlTowerParts";
import {
  useControlTowerData,
  useLeaveGuard,
  useWeekEditor,
} from "@/components/control-tower/hooks";
import { ApiError } from "@/lib/api";
import {
  controlTowerKeys,
  controlTowerQueries,
  daysLeftIn,
  formatShortWeekRange,
  weekRangeFor,
  type ControlTowerWeek,
} from "@/lib/control-tower";

export default function ControlTowerPage() {
  const { profileId, weeks, isPending, error, retry } = useControlTowerData();

  if (isPending) {
    return (
      <ControlTowerColumn>
        <Header subtitle={<Skeleton className="mt-1 h-4 w-32" />} />
        <WeekFieldsSkeleton />
      </ControlTowerColumn>
    );
  }

  if (error || !weeks) {
    const notInCohort = error instanceof ApiError && error.status === 404;
    const { weekStart, weekEnd } = weekRangeFor();

    return (
      <ControlTowerColumn>
        <Header subtitle={formatShortWeekRange(weekStart, weekEnd)} />
        {notInCohort ? (
          <LoadErrorPanel
            title="You're not in a cohort yet"
            message="Control Tower opens once your program admin adds you to a cohort."
          />
        ) : (
          <LoadErrorPanel title={"Couldn’t load this week"} onRetry={retry} />
        )}
      </ControlTowerColumn>
    );
  }

  return (
    <CurrentWeek key={weeks.current.weekStart} profileId={profileId} week={weeks.current} />
  );
}

function Header({
  subtitle,
  actions,
}: {
  subtitle: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0" data-tour="header">
        <h1 className="text-2xl font-semibold text-neutral-800">Control Tower</h1>
        <div className="mt-1 text-sm text-neutral-500">{subtitle}</div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

function CurrentWeek({
  profileId,
  week,
}: {
  profileId: string;
  week: ControlTowerWeek;
}) {
  const router = useRouter();
  const cheer = useCompanionCheer();
  const editor = useWeekEditor(profileId, week, () =>
    cheer(`Week ${week.number} is in. See you next week.`)
  );
  const leave = useLeaveGuard(editor.isDirty, week.number);
  const [showHowItWorks, setShowHowItWorks] = React.useState(false);
  const tour = useControlTowerTour();

  const daysLeft = daysLeftIn(week.weekEnd);

  return (
    <ControlTowerColumn>
      <Header
        subtitle={`Week ${week.number} · ${formatShortWeekRange(week.weekStart, week.weekEnd)}`}
        actions={
          <>
            <Button
              data-tour="save"
              size="medium"
              onClick={editor.save}
              disabled={!editor.isDirty || editor.isSaving}
            >
              {editor.isSaving ? "Saving…" : "Save"}
            </Button>
            <ControlTowerMenu
              onViewPreviousWeeks={() =>
                leave.guard(() => router.push(PREVIOUS_WEEKS_PATH))
              }
              onHowItWorks={() => setShowHowItWorks(true)}
              onTakeTour={tour.start}
            />
          </>
        }
      />

      <WeekFields
        answers={editor.answers}
        onChange={editor.update}
        intro={
          <p className="-mb-2 flex items-center gap-2 text-sm text-neutral-800">
            Week in progress
            <Badge variant="light" status="warning" size="sm">
              {daysLeft} day{daysLeft === 1 ? "" : "s"} left
            </Badge>
          </p>
        }
      />

      <StudentGoals profileId={profileId} />

      <HowItWorksDialog open={showHowItWorks} onOpenChange={setShowHowItWorks} />
      {tour.open && <ControlTowerTour onClose={tour.close} />}
      {leave.dialog}
      {editor.toast}
    </ControlTowerColumn>
  );
}

/* Goals & KPIs */
function StudentGoals({ profileId }: { profileId: string }) {
  const tower = useQuery(controlTowerQueries.student());
  return (
    <div data-tour="goals">
      <GoalsAndKpis
        studentProfileId={profileId}
        goals={tower.data?.goals ?? []}
        kpis={tower.data?.kpis?.items ?? []}
        editable
        queryKey={controlTowerKeys.student()}
      />
    </div>
  );
}
