"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  MoreVertical,
  X,
} from "lucide-react";

import { Field } from "@base-ui/react/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  controlTowerKeys,
  controlTowerQueries,
  daysLeftIn,
  formatWeekRange,
  isSameWeek,
  mentorDisplay,
  saveWeeklyMetric,
  weekRangeFor,
  type ControlTowerMentor,
  type WeeklyMetric,
  type WeeklyMetricStatus,
} from "@/lib/control-tower";

/*
 * PENDING-BACKEND: "Weekly KPIs" (kpis), "What went well?" (wentWell) and
 * "What will you do differently?" (doDifferently) are hidden because the
 * weekly-metrics API has no field to store them yet. To bring them back,
 * search the project for PENDING-BACKEND and uncomment every match — this page
 * and lib/control-tower.ts. Check the field names with the backend first.
 */
type Answers = {
  focus: string;
  achieve: string;
  progress: string;
  // kpis: string; // PENDING-BACKEND(kpis)
  // wentWell: string; // PENDING-BACKEND(wentWell)
  didntGoWell: string;
  // doDifferently: string; // PENDING-BACKEND(doDifferently)
};

const EMPTY_ANSWERS: Answers = {
  focus: "",
  achieve: "",
  progress: "",
  // kpis: "", // PENDING-BACKEND(kpis)
  // wentWell: "", // PENDING-BACKEND(wentWell)
  didntGoWell: "",
  // doDifferently: "", // PENDING-BACKEND(doDifferently)
};

const PROMPT_COUNT = Object.keys(EMPTY_ANSWERS).length;

/** Prompt ↔ API field. The prompts are worded for students; the API isn't. */
function toAnswers(metric?: WeeklyMetric): Answers {
  return {
    focus: metric?.priorities ?? "",
    achieve: metric?.goalSummary ?? "",
    progress: metric?.progress ?? "",
    // kpis: metric?.kpis ?? "", // PENDING-BACKEND(kpis)
    // wentWell: metric?.wentWell ?? "", // PENDING-BACKEND(wentWell)
    didntGoWell: metric?.challenges ?? "",
    // doDifferently: metric?.doDifferently ?? "", // PENDING-BACKEND(doDifferently)
  };
}

function toPayload(answers: Answers) {
  return {
    priorities: answers.focus,
    goalSummary: answers.achieve,
    progress: answers.progress,
    // kpis: answers.kpis, // PENDING-BACKEND(kpis)
    // wentWell: answers.wentWell, // PENDING-BACKEND(wentWell)
    challenges: answers.didntGoWell,
    // doDifferently: answers.doDifferently, // PENDING-BACKEND(doDifferently)
  };
}

function countAnswered(answers: Answers) {
  return Object.values(answers).filter((value) => value.trim().length > 0)
    .length;
}

type View =
  | { name: "form" }
  | { name: "history" }
  | { name: "history-detail"; entry: WeeklyMetric };

export default function ControlTowerPage() {
  const tower = useQuery(controlTowerQueries.student());
  const profileId = tower.data?.student.id ?? "";
  const metrics = useQuery(controlTowerQueries.weeklyMetrics(profileId));

  // Fixed for the visit, so every save targets the same week.
  const [week] = React.useState(() => weekRangeFor());

  if (tower.isPending || (profileId && metrics.isPending)) {
    return <ControlTowerSkeleton />;
  }

  if (tower.isError || metrics.isError) {
    const error = tower.error ?? metrics.error;
    const notInCohort = error instanceof ApiError && error.status === 404;

    return (
      <ProblemPanel
        title={
          notInCohort ? "You're not in a cohort yet" : "Couldn't load Control Tower"
        }
        message={
          notInCohort
            ? "Control Tower opens once your program admin adds you to a cohort."
            : (error?.message ?? "Please try again shortly.")
        }
      />
    );
  }

  return (
    <ControlTower
      key={week.weekStart}
      week={week}
      profileId={profileId}
      mentor={tower.data?.mentor ?? null}
      metrics={metrics.data ?? []}
    />
  );
}

function ControlTower({
  week,
  profileId,
  mentor,
  metrics,
}: {
  week: { weekStart: string; weekEnd: string };
  profileId: string;
  mentor: ControlTowerMentor | null;
  metrics: WeeklyMetric[];
}) {
  const queryClient = useQueryClient();

  const current = metrics.find((metric) =>
    isSameWeek(metric.weekStart, week.weekStart)
  );
  const history = metrics
    .filter((metric) => !isSameWeek(metric.weekStart, week.weekStart))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  const [view, setView] = React.useState<View>({ name: "form" });
  // Seeded once from what's saved; the key on this component resets it if the
  // week changes.
  const [answers, setAnswers] = React.useState<Answers>(() => toAnswers(current));
  const [isDirty, setIsDirty] = React.useState(false);

  const save = useMutation({
    mutationFn: (status: "DRAFT" | "SUBMITTED") =>
      saveWeeklyMetric({ ...week, ...toPayload(answers), status }),
    onSuccess: (saved) => {
      setIsDirty(false);
      // Saving is an upsert, so swap the week into the cached list in place.
      queryClient.setQueryData<WeeklyMetric[]>(
        controlTowerKeys.weeklyMetrics(profileId),
        (list = []) => [
          saved,
          ...list.filter((metric) => metric.id !== saved.id),
        ]
      );
      queryClient.invalidateQueries({ queryKey: controlTowerKeys.student() });
    },
  });

  function update<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((existing) => ({ ...existing, [key]: value }));
    setIsDirty(true);
    save.reset();
  }

  const answeredCount = countAnswered(answers);
  const daysLeft = daysLeftIn(week.weekEnd);
  const weekLabel = formatWeekRange(week.weekStart, week.weekEnd);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Card chrome only from xl up; on mobile the content sits flat on the page. */}
        <div className="xl:col-span-2 xl:rounded-xl xl:border xl:border-neutral-200 xl:bg-white xl:p-6">
          {view.name === "form" && (
            <FormView
              weekLabel={weekLabel}
              daysLeft={daysLeft}
              current={current}
              answers={answers}
              update={update}
              isDirty={isDirty}
              isSaving={save.isPending}
              savedAs={save.isSuccess ? save.data.status : null}
              saveError={save.isError ? save.error.message : null}
              canSubmit={answeredCount === PROMPT_COUNT}
              onSave={() => save.mutate("DRAFT")}
              onSubmit={() => save.mutate("SUBMITTED")}
              onViewHistory={() => setView({ name: "history" })}
            />
          )}

          {view.name === "history" && (
            <HistoryListView
              history={history}
              onBack={() => setView({ name: "form" })}
              onSelect={(entry) => setView({ name: "history-detail", entry })}
            />
          )}

          {view.name === "history-detail" && (
            <HistoryDetailView
              entry={view.entry}
              onBack={() => setView({ name: "history" })}
            />
          )}
        </div>

        {/* Right-hand column is desktop only; mobile shows the status inline in FormView. */}
        <div className="hidden flex-col gap-6 xl:flex">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-sm font-semibold text-neutral-800">
              This week · {weekLabel}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-neutral-400">
              <Clock className="h-4 w-4" />
              {current && current.status !== "DRAFT"
                ? `Week ${statusMeta[current.status].label.toLowerCase()}`
                : `Week in progress · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
            </div>

            <div className="mt-4 h-2 w-full rounded-full bg-neutral-100">
              <div
                className="h-2 rounded-full bg-brand-primary"
                style={{ width: `${(answeredCount / PROMPT_COUNT) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              {answeredCount} of {PROMPT_COUNT} prompts answered
            </p>
          </div>

          <MentorCard mentor={mentor} />
        </div>
      </div>
    </div>
  );
}

function MentorCard({ mentor }: { mentor: ControlTowerMentor | null }) {
  const person = mentor ? mentorDisplay(mentor) : null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-sm font-semibold text-neutral-800">Your mentor</p>
      {person ? (
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-brand text-sm font-semibold text-brand-primary">
            {person.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-800">
              {person.name}
            </p>
            {person.email && (
              <p className="truncate text-xs text-neutral-400">{person.email}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-neutral-400">
          You haven&apos;t been paired with a mentor yet. You can still fill in
          your week — they&apos;ll see it once you&apos;re matched.
        </p>
      )}
    </div>
  );
}

function FormView({
  weekLabel,
  daysLeft,
  current,
  answers,
  update,
  isDirty,
  isSaving,
  savedAs,
  saveError,
  canSubmit,
  onSave,
  onSubmit,
  onViewHistory,
}: {
  weekLabel: string;
  daysLeft: number;
  current?: WeeklyMetric;
  answers: Answers;
  update: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
  isDirty: boolean;
  isSaving: boolean;
  savedAs: WeeklyMetricStatus | null;
  saveError: string | null;
  canSubmit: boolean;
  onSave: () => void;
  onSubmit: () => void;
  onViewHistory: () => void;
}) {
  const [showHowItWorks, setShowHowItWorks] = React.useState(false);

  // Once submitted, the week belongs to the mentor's review.
  const locked = Boolean(current && current.status !== "DRAFT");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-neutral-800 sm:text-2xl">
              Control Tower
            </h1>
            {/* Mobile shows the week label (matches Figma); desktop shows the
                description since the week label lives in the side card. */}
            <p className="mt-0.5 text-sm text-neutral-400 xl:hidden">
              This week · {weekLabel}
            </p>
            <p className="mt-1 hidden text-sm text-neutral-400 xl:block">
              Set your goals, track your progress, and reflect on your week.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!locked && (
              <Button
                size="medium"
                className="gap-2 rounded-full px-6"
                onClick={onSave}
                disabled={!isDirty || isSaving}
              >
                {isSaving ? "Saving…" : savedAs === "DRAFT" && !isDirty ? "Saved" : "Save"}
              </Button>
            )}

            <HeaderMenu
              onViewHistory={onViewHistory}
              onHowItWorks={() => setShowHowItWorks(true)}
            />
          </div>
        </div>

        {/* Mobile week status (desktop has the side card). */}
        <div className="flex flex-col items-start gap-2 xl:hidden">
          <p className="text-sm text-neutral-600">
            {locked ? "Week submitted" : "Week in progress"}
          </p>
          {!locked && (
            <span className="rounded-full bg-surface-warning-badge px-2.5 py-1 text-xs font-medium text-text-warning">
              {daysLeft} day{daysLeft === 1 ? "" : "s"} left
            </span>
          )}
        </div>

        {showHowItWorks && (
          <div className="relative rounded-lg border border-neutral-200 bg-white p-4 pr-10 text-sm text-neutral-600">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="font-semibold text-neutral-800">
              How Control Tower works
            </p>
            <p className="mt-1">
              Answer each prompt to set your goals for the week and save as you
              go. When your week is ready, submit it — your mentor reviews it
              and adds notes from your check-in.
            </p>
          </div>
        )}

        {locked && current && (
          <p className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-text-success" />
            {current.status === "SUBMITTED"
              ? "You've submitted this week. Your mentor will review it and add notes from your check-in."
              : "Your mentor has reviewed this week."}
          </p>
        )}

        {saveError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-border-error bg-surface-error-badge px-4 py-3 text-sm text-text-error"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {saveError}
          </p>
        )}
      </div>

      <ReflectionField
        label="What are you focusing on this week?"
        placeholder="Define the main thing you want to make progress on this week..."
        value={answers.focus}
        onChange={(value) => update("focus", value)}
        disabled={locked}
      />

      <ReflectionField
        label="What do you want to achieve?"
        placeholder="Example: I want to develop my knowledge of the system architecture"
        value={answers.achieve}
        onChange={(value) => update("achieve", value)}
        disabled={locked}
      />

      <Section label="Mentor Check-in">
        <MentorNotes metric={current} />

        <ReflectionField
          label="How are you progressing?"
          placeholder="Share how this week has gone so far..."
          value={answers.progress}
          onChange={(value) => update("progress", value)}
          disabled={locked}
        />

        {/* PENDING-BACKEND(kpis): uncomment once weekly metrics store it.
        <ReflectionField
          label="Weekly KPIs"
          placeholder="Example: Ship 3 components to the design library"
          value={answers.kpis}
          onChange={(value) => update("kpis", value)}
          disabled={locked}
        />
        */}
      </Section>

      <Section label="Weekly Reflection">
        {/* PENDING-BACKEND(wentWell): uncomment once weekly metrics store it.
        <ReflectionField
          label="What went well?"
          placeholder="Example: I finally understood how variants work in the design system"
          value={answers.wentWell}
          onChange={(value) => update("wentWell", value)}
          disabled={locked}
        />
        */}

        <ReflectionField
          label="What didn't go well?"
          placeholder="Example: I spent too long on a problem I could have asked for help with sooner"
          value={answers.didntGoWell}
          onChange={(value) => update("didntGoWell", value)}
          disabled={locked}
        />

        {/* PENDING-BACKEND(doDifferently): uncomment once weekly metrics store it.
        <ReflectionField
          label="What will you do differently?"
          placeholder="Example: Ask my mentor for feedback earlier in the week"
          value={answers.doDifferently}
          onChange={(value) => update("doDifferently", value)}
          disabled={locked}
        />
        */}
      </Section>

      {!locked && (
        <div className="flex flex-col gap-2 border-t border-neutral-100 pt-6">
          <Button
            size="lg"
            className="w-full rounded-full"
            onClick={onSubmit}
            disabled={!canSubmit || isSaving}
          >
            {isSaving ? "Submitting…" : "Submit week"}
          </Button>
          <p className="text-center text-xs text-neutral-400">
            {canSubmit
              ? "Your mentor reviews it next — you won't be able to edit this week after submitting."
              : "Answer every prompt to submit your week."}
          </p>
        </div>
      )}
    </div>
  );
}

/** The mentor writes these when reviewing the week, so students only read them. */
function MentorNotes({ metric }: { metric?: WeeklyMetric }) {
  return (
    <>
      <ReflectionField
        label="What came out of your meeting?"
        placeholder="Your mentor adds notes here after your check-in."
        value={metric?.mentorMeetingOutcome ?? ""}
        onChange={() => {}}
        disabled
      />
      {metric?.mentorFeedback && (
        <ReflectionField
          label="Mentor feedback"
          placeholder=""
          value={metric.mentorFeedback}
          onChange={() => {}}
          disabled
        />
      )}
    </>
  );
}

/**
 * Three-dots button + popover menu. Holds "View previous weeks" and
 * "How Control Tower works" so they no longer sit in the page body.
 * Closes on outside click, Escape, or after picking an item.
 */
function HeaderMenu({
  onViewHistory,
  onHowItWorks,
}: {
  onViewHistory: () => void;
  onHowItWorks: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function choose(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100/60"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-2 w-64 rounded-2xl border border-neutral-100 bg-white p-2 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => choose(onViewHistory)}
            className="w-full rounded-xl px-4 py-3 text-left text-sm text-neutral-800 hover:bg-neutral-100/60"
          >
            View previous weeks
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => choose(onHowItWorks)}
            className="w-full rounded-xl px-4 py-3 text-left text-sm text-neutral-800 hover:bg-neutral-100/60"
          >
            How Control Tower works
          </button>
        </div>
      )}
    </div>
  );
}

function HistoryListView({
  history,
  onBack,
  onSelect,
}: {
  history: WeeklyMetric[];
  onBack: () => void;
  onSelect: (entry: WeeklyMetric) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-neutral-800">
            Previous weeks
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Review your goals, progress, mentor notes, and reflections from
            previous weeks.
          </p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-16 text-center">
          <p className="text-sm font-medium text-neutral-800">
            No previous weeks yet
          </p>
          <p className="max-w-xs text-sm text-neutral-400">
            Weeks you&apos;ve filled in will appear here once they&apos;re over.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(entry)}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-left hover:bg-neutral-100/60"
            >
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  Week of {formatWeekRange(entry.weekStart, entry.weekEnd)}
                </p>
                <p className="text-xs text-neutral-400">
                  {countAnswered(toAnswers(entry))} of {PROMPT_COUNT} prompts
                  answered
                </p>
              </div>
              <StatusBadge status={entry.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryDetailView({
  entry,
  onBack,
}: {
  entry: WeeklyMetric;
  onBack: () => void;
}) {
  const answers = toAnswers(entry);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-800">
              Week of {formatWeekRange(entry.weekStart, entry.weekEnd)}
            </p>
          </div>
          <StatusBadge status={entry.status} />
        </div>
      </div>

      <ReflectionField
        label="What are you focusing on this week?"
        placeholder=""
        value={answers.focus}
        onChange={() => {}}
        disabled
      />

      <ReflectionField
        label="What do you want to achieve?"
        placeholder=""
        value={answers.achieve}
        onChange={() => {}}
        disabled
      />

      <Section label="Mentor Check-in">
        <MentorNotes metric={entry} />
        <ReflectionField
          label="How are you progressing?"
          placeholder=""
          value={answers.progress}
          onChange={() => {}}
          disabled
        />
        {/* PENDING-BACKEND(kpis): uncomment once weekly metrics store it.
        <ReflectionField
          label="Weekly KPIs"
          placeholder=""
          value={answers.kpis}
          onChange={() => {}}
          disabled
        />
        */}
      </Section>

      <Section label="Weekly Reflection">
        {/* PENDING-BACKEND(wentWell): uncomment once weekly metrics store it.
        <ReflectionField
          label="What went well?"
          placeholder=""
          value={answers.wentWell}
          onChange={() => {}}
          disabled
        />
        */}
        <ReflectionField
          label="What didn't go well?"
          placeholder=""
          value={answers.didntGoWell}
          onChange={() => {}}
          disabled
        />
        {/* PENDING-BACKEND(doDifferently): uncomment once weekly metrics store it.
        <ReflectionField
          label="What will you do differently?"
          placeholder=""
          value={answers.doDifferently}
          onChange={() => {}}
          disabled
        />
        */}
      </Section>
    </div>
  );
}

/**
 * A past week still in DRAFT was never submitted, so it reads as missed.
 * Weeks with nothing saved at all have no record, so they don't appear.
 */
const statusMeta: Record<WeeklyMetricStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Missed",
    className: "bg-surface-error-badge text-text-error",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-surface-info-badge text-text-info",
  },
  REVIEWED: {
    label: "Reviewed",
    className: "bg-surface-success-badge text-text-success",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-surface-success-badge text-text-success",
  },
};

function StatusBadge({ status }: { status: WeeklyMetricStatus }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
        statusMeta[status].className
      )}
    >
      {statusMeta[status].label}
    </span>
  );
}

function ControlTowerSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="flex flex-col gap-6 xl:col-span-2 xl:rounded-xl xl:border xl:border-neutral-200 xl:bg-white xl:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="hidden flex-col gap-6 xl:flex">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

function ProblemPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-neutral-200 bg-white px-6 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-neutral-200" />
      <p className="font-semibold text-neutral-800">{title}</p>
      <p className="max-w-sm text-sm text-neutral-400">{message}</p>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-neutral-100 pt-6">
      <p className="mb-4 text-sm font-semibold text-brand-primary">{label}</p>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}

function ReflectionField({
  label,
  placeholder,
  value,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Field.Root className="flex w-full flex-col">
      <Label required={!disabled}>{label}</Label>
      <div className="mt-1.5">
        <Textarea
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </Field.Root>
  );
}
