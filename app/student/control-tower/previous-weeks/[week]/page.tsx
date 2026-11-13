"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleAlert, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CONTROL_TOWER_PATH,
  ControlTowerColumn,
  Crumbs,
  LoadErrorPanel,
  PREVIOUS_WEEKS_PATH,
  WeekFields,
  WeekFieldsSkeleton,
  WeekStatusBadge,
} from "@/components/control-tower/ControlTowerParts";
import {
  useControlTowerData,
  useLeaveGuard,
  useWeekEditor,
} from "@/components/control-tower/hooks";
import {
  formatShortWeekRange,
  isWeekCompleted,
  type ControlTowerWeek,
} from "@/lib/control-tower";

export default function PreviousWeekPage() {
  const router = useRouter();
  const { week: weekParam } = useParams<{ week: string }>();
  const { profileId, weeks, isPending, error, retry } = useControlTowerData();

  const isCurrentWeek = weeks?.current.weekStart.slice(0, 10) === weekParam;
  React.useEffect(() => {
    if (isCurrentWeek) router.replace(CONTROL_TOWER_PATH);
  }, [isCurrentWeek, router]);

  const week = weeks?.previous.find((item) => item.weekStart.slice(0, 10) === weekParam);

  if (isPending || isCurrentWeek) {
    return (
      <ControlTowerColumn>
        <WeekCrumbs label="Week" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <WeekFieldsSkeleton />
      </ControlTowerColumn>
    );
  }

  if (error || !weeks || !week) {
    return (
      <ControlTowerColumn>
        <WeekCrumbs label="Week" />
        {error || !weeks ? (
          <LoadErrorPanel title={"Couldn’t load this week"} onRetry={retry} />
        ) : (
          <LoadErrorPanel
            title="This week isn't available"
            message="It may be outside your cohort's weeks. Pick a week from your previous weeks instead."
          />
        )}
      </ControlTowerColumn>
    );
  }

  return <PreviousWeek key={week.weekStart} profileId={profileId} week={week} />;
}

function WeekCrumbs({
  label,
  onNavigate,
}: {
  label: string;
  onNavigate?: (href: string) => void;
}) {
  return (
    <Crumbs
      backHref={PREVIOUS_WEEKS_PATH}
      onNavigate={onNavigate}
      trail={[
        { label: "Control tower", href: CONTROL_TOWER_PATH },
        { label: "Previous weeks", href: PREVIOUS_WEEKS_PATH },
        { label },
      ]}
    />
  );
}

function PreviousWeek({
  profileId,
  week,
}: {
  profileId: string;
  week: ControlTowerWeek;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = React.useState(false);
  const editor = useWeekEditor(profileId, week, () => setIsEditing(false));
  const leave = useLeaveGuard(editor.isDirty, week.number);

  const completed = isWeekCompleted(week.metric);
  // A missed week opens ready to fill in; a completed one needs the pencil.
  const editable = !completed || isEditing;

  const saveButton = (
    <Button
      size="medium"
      onClick={editor.save}
      disabled={!editor.isDirty || editor.isSaving}
    >
      {editor.isSaving ? "Saving…" : "Save"}
    </Button>
  );

  return (
    <ControlTowerColumn>
      <WeekCrumbs
        label={`Week ${week.number}`}
        onNavigate={(href) => leave.guard(() => router.push(href))}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-800">Week {week.number}</h1>
            <WeekStatusBadge completed={completed} />
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {formatShortWeekRange(week.weekStart, week.weekEnd)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!completed ? (
            saveButton
          ) : isEditing ? (
            <>
              <Button
                variant="secondary"
                size="medium"
                disabled={editor.isSaving}
                onClick={() =>
                  leave.guard(() => {
                    editor.reset();
                    setIsEditing(false);
                  })
                }
              >
                Cancel
              </Button>
              {saveButton}
            </>
          ) : (
            <button
              type="button"
              aria-label={`Edit week ${week.number}`}
              onClick={() => setIsEditing(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100"
            >
              <PencilLine className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {!completed && (
        <div className="flex gap-3 rounded-xl bg-surface-warning-badge px-4 py-3">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-text-warning" />
          <div className="text-sm">
            <p className="font-medium text-neutral-800">Deadline passed</p>
            <p className="mt-1 text-neutral-600">
              You can still fill this week in. It will be marked Completed once you save.
            </p>
          </div>
        </div>
      )}

      <WeekFields answers={editor.answers} onChange={editor.update} readOnly={!editable} />

      {leave.dialog}
      {editor.toast}
    </ControlTowerColumn>
  );
}
