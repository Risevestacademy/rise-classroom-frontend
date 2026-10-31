"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { AlertCircle, Pencil, Plus, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createGoal,
  createKpi,
  deleteKpi,
  kpiStatuses,
  updateGoal,
  updateKpi,
  type Goal,
  type GoalInput,
  type Kpi,
  type KpiInput,
  type KpiStatus,
  type KpiSummary,
} from "@/lib/control-tower";
import { cn } from "@/lib/utils";

const noGoal = "none";

const barTone: Record<(typeof kpiStatuses)[KpiStatus]["tone"], string> = {
  neutral: "bg-neutral-300",
  info: "bg-brand-primary",
  success: "bg-text-success",
  warning: "bg-text-warning",
  error: "bg-text-error",
};

/* Blank text fields are left out, so they aren't saved as "". */
function trimmed<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
      .filter(([, value]) => value !== ""),
  ) as T;
}

/* A student's goals with the KPIs that measure them. `editable` adds the
   add and edit actions; without it the card only reads. */
export function GoalsAndKpis({
  studentProfileId,
  goals,
  kpis,
  summary,
  editable,
  queryKey,
}: {
  studentProfileId: string;
  goals: Goal[];
  /* Every KPI, including ones that aren't tied to a goal. */
  kpis: Kpi[];
  summary?: KpiSummary;
  editable: boolean;
  /* Refreshed after every change. */
  queryKey: QueryKey;
}) {
  const [goalDialog, setGoalDialog] = React.useState<Goal | "new" | null>(null);
  const [kpiDialog, setKpiDialog] = React.useState<
    { kpi: Kpi | null; goalId: string | null } | null
  >(null);

  const activeGoals = goals.filter((goal) => goal.status !== "ARCHIVED");
  const goalIds = new Set(activeGoals.map((goal) => goal.id));
  /* KPIs come both nested in goals and in the full list; the full list wins. */
  const kpisFor = (goal: Goal) => {
    const fromList = kpis.filter((kpi) => kpi.goalId === goal.id);
    return fromList.length > 0 ? fromList : (goal.kpis ?? []);
  };
  const otherKpis = kpis.filter((kpi) => !kpi.goalId || !goalIds.has(kpi.goalId));
  const isEmpty = activeGoals.length === 0 && otherKpis.length === 0;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-800">Goals &amp; KPIs</p>
          {summary && summary.totalCount > 0 && (
            <p className="mt-1 text-xs text-neutral-400">
              {summary.achievedCount} of {summary.totalCount} KPIs achieved ·{" "}
              {summary.achievementRate}%
            </p>
          )}
        </div>
        {editable && !isEmpty && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setGoalDialog("new")}
            className="border-neutral-200 text-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Goal
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="mt-4 flex flex-col items-start gap-3">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-5 w-5 shrink-0 text-neutral-350" />
            <p className="text-sm text-neutral-400">
              {editable
                ? "Set a goal for the programme, then add KPIs to track how you're doing against it."
                : "No goals or KPIs have been set yet."}
            </p>
          </div>
          {editable && (
            <Button size="sm" onClick={() => setGoalDialog("new")}>
              <Plus className="h-4 w-4" />
              Add a goal
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-5">
          {activeGoals.map((goal) => (
            <section key={goal.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800">{goal.title}</p>
                  {goal.longTermGoal && (
                    <p className="mt-0.5 text-xs text-neutral-500">
                      Long-term: {goal.longTermGoal}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {goal.status === "COMPLETED" && (
                    <Badge variant="light" status="success">
                      Completed
                    </Badge>
                  )}
                  {editable && (
                    <button
                      type="button"
                      aria-label={`Edit ${goal.title}`}
                      onClick={() => setGoalDialog(goal)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <KpiList
                kpis={kpisFor(goal)}
                editable={editable}
                onEdit={(kpi) => setKpiDialog({ kpi, goalId: goal.id })}
              />
              {editable && (
                <button
                  type="button"
                  onClick={() => setKpiDialog({ kpi: null, goalId: goal.id })}
                  className="flex w-fit items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add KPI
                </button>
              )}
            </section>
          ))}

          {otherKpis.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-sm font-medium text-neutral-800">Other KPIs</p>
              <KpiList
                kpis={otherKpis}
                editable={editable}
                onEdit={(kpi) => setKpiDialog({ kpi, goalId: null })}
              />
            </section>
          )}
        </div>
      )}

      {goalDialog && (
        <GoalDialog
          key={goalDialog === "new" ? "new" : goalDialog.id}
          goal={goalDialog === "new" ? null : goalDialog}
          studentProfileId={studentProfileId}
          queryKey={queryKey}
          onClose={() => setGoalDialog(null)}
        />
      )}
      {kpiDialog && (
        <KpiDialog
          key={kpiDialog.kpi?.id ?? `new-${kpiDialog.goalId}`}
          kpi={kpiDialog.kpi}
          goalId={kpiDialog.goalId}
          goals={activeGoals}
          studentProfileId={studentProfileId}
          queryKey={queryKey}
          onClose={() => setKpiDialog(null)}
        />
      )}
    </div>
  );
}

function KpiList({
  kpis,
  editable,
  onEdit,
}: {
  kpis: Kpi[];
  editable: boolean;
  onEdit: (kpi: Kpi) => void;
}) {
  if (kpis.length === 0) {
    return <p className="text-xs text-neutral-400">No KPIs for this goal yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {kpis.map((kpi) => {
        const status = kpiStatuses[kpi.status];
        const progress = Math.min(100, Math.max(0, Math.round(kpi.progress ?? 0)));
        const values = [kpi.currentValue ?? "0", kpi.targetValue]
          .filter(Boolean)
          .join(" / ");
        const content = (
          <>
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-sm text-neutral-800">{kpi.name}</p>
              <Badge variant="light" status={status.tone} className="shrink-0">
                {status.label}
              </Badge>
            </div>
            <div
              role="img"
              aria-label={`${progress}% of the way there`}
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white"
            >
              <div
                className={cn("h-full rounded-full", barTone[status.tone])}
                style={{ width: `${progress}%` }}
              />
            </div>
            {kpi.targetValue && (
              <p className="mt-1.5 text-xs text-neutral-500">
                {values}
                {kpi.unit ? ` ${kpi.unit}` : ""}
              </p>
            )}
          </>
        );
        return (
          <li key={kpi.id}>
            {editable ? (
              <button
                type="button"
                onClick={() => onEdit(kpi)}
                aria-label={`Update ${kpi.name}`}
                className="w-full rounded-lg bg-neutral-100 p-3 text-left hover:bg-neutral-200/60"
              >
                {content}
              </button>
            ) : (
              <div className="rounded-lg bg-neutral-100 p-3">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-4 flex items-start gap-2 rounded-lg border border-border-error bg-surface-error-badge px-4 py-3 text-sm text-text-error"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function GoalDialog({
  goal,
  studentProfileId,
  queryKey,
  onClose,
}: {
  goal: Goal | null;
  studentProfileId: string;
  queryKey: QueryKey;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState(goal?.title ?? "");
  const [description, setDescription] = React.useState(goal?.description ?? "");
  const [longTermGoal, setLongTermGoal] = React.useState(goal?.longTermGoal ?? "");

  const save = useMutation({
    mutationFn: (input: GoalInput) =>
      goal ? updateGoal(goal.id, input) : createGoal(studentProfileId, trimmed(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onClose();
    },
  });

  const fields = { title: title.trim(), description, longTermGoal };
  const canSave = fields.title.length > 0 && !save.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[460px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) save.mutate(fields);
          }}
        >
          <DialogHeader>
            <DialogTitle>{goal ? "Edit goal" : "Add a goal"}</DialogTitle>
            <DialogDescription>
              What you&apos;re working towards. Add KPIs to measure it.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col gap-5">
            <FormField
              label="Goal"
              required
              inputProps={{
                placeholder: "e.g. Land a junior product design role",
                value: title,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(event.target.value),
                leadingIcon: null,
              }}
            />
            <FormField
              label="Long-term goal"
              inputProps={{
                placeholder: "Where this leads after the programme",
                value: longTermGoal,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  setLongTermGoal(event.target.value),
                leadingIcon: null,
              }}
            />
            <Field.Root className="flex w-full flex-col">
              <Label>Description</Label>
              <div className="mt-1.5">
                <Textarea
                  placeholder="Why this matters to you"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
            </Field.Root>
          </div>

          {save.isError && <ErrorNote message={save.error.message} />}

          <DialogFooter className="sm:justify-between">
            {goal && goal.status === "ACTIVE" ? (
              <Button
                type="button"
                variant="secondary"
                size="medium"
                disabled={save.isPending}
                onClick={() => save.mutate({ ...fields, status: "COMPLETED" })}
              >
                Mark as completed
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="medium" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="medium" disabled={!canSave}>
                {save.isPending ? "Saving…" : goal ? "Save changes" : "Add goal"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KpiDialog({
  kpi,
  goalId,
  goals,
  studentProfileId,
  queryKey,
  onClose,
}: {
  kpi: Kpi | null;
  goalId: string | null;
  goals: Goal[];
  studentProfileId: string;
  queryKey: QueryKey;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState(kpi?.name ?? "");
  const [currentValue, setCurrentValue] = React.useState(kpi?.currentValue ?? "");
  const [targetValue, setTargetValue] = React.useState(kpi?.targetValue ?? "");
  const [unit, setUnit] = React.useState(kpi?.unit ?? "");
  const [status, setStatus] = React.useState<KpiStatus>(kpi?.status ?? "NOT_STARTED");
  const [goal, setGoal] = React.useState(kpi?.goalId ?? goalId ?? noGoal);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey });
    onClose();
  };

  const save = useMutation({
    mutationFn: (input: KpiInput) =>
      kpi ? updateKpi(kpi.id, input) : createKpi(studentProfileId, trimmed(input)),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () => deleteKpi(kpi!.id),
    onSuccess: refresh,
  });

  const busy = save.isPending || remove.isPending;
  const canSave = name.trim().length > 0 && !busy;
  const error = save.error ?? remove.error;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[460px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSave) return;
            save.mutate({
              name: name.trim(),
              currentValue,
              targetValue,
              unit,
              status,
              goalId: goal === noGoal ? null : goal,
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{kpi ? "Update KPI" : "Add a KPI"}</DialogTitle>
            <DialogDescription>
              Something you can count, like components shipped or interviews booked.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col gap-5">
            <FormField
              label="KPI"
              required
              inputProps={{
                placeholder: "e.g. Ship components to the design library",
                value: name,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  setName(event.target.value),
                leadingIcon: null,
              }}
            />
            <div className="grid grid-cols-3 gap-3">
              <FormField
                label="Current"
                inputProps={{
                  placeholder: "0",
                  value: currentValue,
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                    setCurrentValue(event.target.value),
                  leadingIcon: null,
                }}
              />
              <FormField
                label="Target"
                inputProps={{
                  placeholder: "3",
                  value: targetValue,
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                    setTargetValue(event.target.value),
                  leadingIcon: null,
                }}
              />
              <FormField
                label="Unit"
                inputProps={{
                  placeholder: "components",
                  value: unit,
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                    setUnit(event.target.value),
                  leadingIcon: null,
                }}
              />
            </div>
            <Select
              label="Status"
              value={status}
              onChange={setStatus}
              options={(Object.keys(kpiStatuses) as KpiStatus[]).map((value) => ({
                value,
                label: kpiStatuses[value].label,
              }))}
            />
            {goals.length > 0 && (
              <Select
                label="Goal"
                value={goal}
                onChange={setGoal}
                options={[
                  { value: noGoal, label: "Not tied to a goal" },
                  ...goals.map((item) => ({ value: item.id, label: item.title })),
                ]}
              />
            )}
          </div>

          {error && <ErrorNote message={error.message} />}

          <DialogFooter className="sm:justify-between">
            {kpi ? (
              <Button
                type="button"
                variant="secondary"
                size="medium"
                disabled={busy}
                onClick={() => remove.mutate()}
                className="text-text-error"
              >
                {remove.isPending ? "Deleting…" : "Delete KPI"}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="medium" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="medium" disabled={!canSave}>
                {save.isPending ? "Saving…" : kpi ? "Save" : "Add KPI"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
