"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SuccessToast } from "@/components/ui/toast";
import {
  controlTowerKeys,
  controlTowerQueries,
  controlTowerWeeks,
  saveWeeklyMetric,
  type ControlTowerWeek,
  type WeeklyMetric,
} from "@/lib/control-tower";
import { DiscardChangesDialog } from "./ControlTowerDialogs";
import {
  sameAnswers,
  toAnswers,
  toPayload,
  type Answers,
} from "./week-answers";

/** The student's profile and every week of their Control Tower so far. */
export function useControlTowerData() {
  const tower = useQuery(controlTowerQueries.student());
  const profileId = tower.data?.student.id ?? "";
  const metrics = useQuery(controlTowerQueries.weeklyMetrics(profileId));

  // Fixed for the visit, so every save targets the same week.
  const [now] = React.useState(() => new Date());

  const weeks = React.useMemo(
    () =>
      tower.data && metrics.data
        ? controlTowerWeeks(metrics.data, tower.data.student.cohort?.startDate, now)
        : null,
    [tower.data, metrics.data, now]
  );

  return {
    profileId,
    weeks,
    isPending: tower.isPending || (profileId !== "" && metrics.isPending),
    error: tower.error ?? metrics.error,
    retry: () => {
      if (tower.isError) tower.refetch();
      if (metrics.isError) metrics.refetch();
    },
  };
}

type Toast = { tone: "success" | "error"; title: string; message: string };

/**
 * The answers being edited for one week, and saving them. Saving marks the
 * week Completed, whether it's this week or a missed one being caught up.
 */
export function useWeekEditor(
  profileId: string,
  week: ControlTowerWeek,
  onSaved?: () => void
) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = React.useState<Answers>(() => toAnswers(week.metric));
  const [answers, setAnswers] = React.useState<Answers>(saved);
  const [toast, setToast] = React.useState<Toast | null>(null);

  const save = useMutation({
    mutationFn: () =>
      saveWeeklyMetric({
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        ...toPayload(answers),
        status: "SUBMITTED",
      }),
    onSuccess: (metric) => {
      setSaved(toAnswers(metric));
      setAnswers(toAnswers(metric));
      setToast({
        tone: "success",
        title: "Week saved",
        message: `Your Control Tower entry for Week ${week.number} has been saved.`,
      });
      // Saving is an upsert, so swap the week into the cached list in place.
      queryClient.setQueryData<WeeklyMetric[]>(
        controlTowerKeys.weeklyMetrics(profileId),
        (list = []) => [metric, ...list.filter((item) => item.id !== metric.id)]
      );
      onSaved?.();
    },
    onError: () =>
      setToast({
        tone: "error",
        title: "Couldn’t save your entry",
        message: "Check your connection and try again. Your answers are kept on this page.",
      }),
  });

  const dismissToast = React.useCallback(() => setToast(null), []);

  return {
    answers,
    isDirty: !sameAnswers(answers, saved),
    update: (key: keyof Answers, value: string) =>
      setAnswers((current) => ({ ...current, [key]: value })),
    reset: () => setAnswers(saved),
    save: () => save.mutate(),
    isSaving: save.isPending,
    toast: toast && (
      <SuccessToast
        key={`${toast.tone}-${save.submittedAt}`}
        tone={toast.tone}
        title={toast.title}
        message={toast.message}
        onDismiss={dismissToast}
      />
    ),
  };
}

/**
 * Asks before throwing away unsaved answers: `guard(action)` runs the action
 * straight away when nothing has changed, or after the student confirms.
 * Closing or reloading the tab gets the browser's own prompt.
 */
export function useLeaveGuard(isDirty: boolean, weekNumber: number) {
  const [pending, setPending] = React.useState<(() => void) | null>(null);

  React.useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const guard = (action: () => void) => {
    if (isDirty) setPending(() => action);
    else action();
  };

  const dialog = (
    <DiscardChangesDialog
      open={pending !== null}
      weekNumber={weekNumber}
      onKeepEditing={() => setPending(null)}
      onDiscard={() => {
        const action = pending;
        setPending(null);
        action?.();
      }}
    />
  );

  return { guard, dialog };
}
