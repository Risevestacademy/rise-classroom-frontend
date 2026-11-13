"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  CONTROL_TOWER_PATH,
  ControlTowerColumn,
  Crumbs,
  LoadErrorPanel,
  NoPreviousWeeksPanel,
  WeekListSkeleton,
  WeekStatusBadge,
  previousWeekPath,
} from "@/components/control-tower/ControlTowerParts";
import { useControlTowerData } from "@/components/control-tower/hooks";
import { formatShortWeekRange, isWeekCompleted } from "@/lib/control-tower";

export default function PreviousWeeksPage() {
  const { weeks, isPending, error, retry } = useControlTowerData();

  return (
    <ControlTowerColumn>
      <div className="flex flex-col gap-6">
        <Crumbs
          backHref={CONTROL_TOWER_PATH}
          trail={[
            { label: "Control tower", href: CONTROL_TOWER_PATH },
            { label: "Previous weeks" },
          ]}
        />
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Previous weeks</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Review your goals, progress, mentor notes, and reflections from previous weeks.
          </p>
        </div>
      </div>

      {isPending ? (
        <WeekListSkeleton />
      ) : error || !weeks ? (
        <LoadErrorPanel title={"Couldn’t load previous weeks"} onRetry={retry} />
      ) : weeks.previous.length === 0 ? (
        <NoPreviousWeeksPanel />
      ) : (
        <ul className="flex flex-col gap-3">
          {weeks.previous.map((week) => (
            <li key={week.weekStart}>
              <Link
                href={previousWeekPath(week.weekStart)}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-4 transition-colors hover:bg-neutral-100/60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800">Week {week.number}</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {formatShortWeekRange(week.weekStart, week.weekEnd)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <WeekStatusBadge completed={isWeekCompleted(week.metric)} />
                  <ChevronRight className="h-4 w-4 text-neutral-500" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ControlTowerColumn>
  );
}
