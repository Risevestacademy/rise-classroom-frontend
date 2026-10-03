"use client";

import * as React from "react";
import { ChevronLeft, Clock, MoreVertical, X } from "lucide-react";

import { Field } from "@base-ui/react/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";


const WEEK_LABEL = "Week 30 · Sep 21-27";
const DAYS_LEFT = 3;

/*
 * PENDING-BACKEND: "What went well?" (wentWell) and "What will you do
 * differently?" (doDifferently) are hidden because the weekly-metrics API has
 * no field to store them yet. To bring them back, search this file for
 * PENDING-BACKEND and uncomment every match (type, defaults, sample history,
 * form view and history view), then map them in the save payload.
 */
type Answers = {
  focus: string;
  achieve: string;
  mentorNotes: string;
  progress: string;
  kpis: string;
  // wentWell: string; // PENDING-BACKEND(wentWell)
  didntGoWell: string;
  // doDifferently: string; // PENDING-BACKEND(doDifferently)
};

const EMPTY_ANSWERS: Answers = {
  focus: "",
  achieve: "",
  mentorNotes: "",
  progress: "",
  kpis: "",
  // wentWell: "", // PENDING-BACKEND(wentWell)
  didntGoWell: "",
  // doDifferently: "", // PENDING-BACKEND(doDifferently)
};

const PROMPT_COUNT = Object.keys(EMPTY_ANSWERS).length;

type HistoryEntry = {
  id: string;
  week: string;
  dateRange: string;
  status: "completed" | "missed";
  answers?: Answers;
};

const HISTORY: HistoryEntry[] = [
  {
    id: "week-29",
    week: "Week 29",
    dateRange: "Sep 14-20",
    status: "completed",
    answers: {
      focus: "Finishing the component library handoff to engineering.",
      achieve: "I want to develop my knowledge of the system architecture.",
      mentorNotes:
        "My mentor was able to guide my understanding of the concept of system design.",
      progress: "On track — most components are documented and reviewed.",
      kpis: "Shipped 3 components to the design library.",
      // PENDING-BACKEND(wentWell)
      // wentWell: "I finally understood how variants work in the design system.",
      didntGoWell:
        "I spent too long on a problem I could have asked for help with sooner.",
      // PENDING-BACKEND(doDifferently)
      // doDifferently: "Ask my mentor for feedback earlier in the week.",
    },
  },
  {
    id: "week-28",
    week: "Week 28",
    dateRange: "Sep 7-13",
    status: "missed",
  },
];

type View =
  | { name: "form" }
  | { name: "history" }
  | { name: "history-detail"; entry: HistoryEntry };

export default function ControlTowerPage() {
  const [view, setView] = React.useState<View>({ name: "form" });
  const [answers, setAnswers] = React.useState<Answers>(EMPTY_ANSWERS);
  const [justSaved, setJustSaved] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  function update<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
    setJustSaved(false);
  }

  function handleSave() {
    // No backend yet — this is a stand-in for a future PATCH call.
    setJustSaved(true);
    setIsDirty(false);
  }

  const answeredCount = Object.values(answers).filter(
    (value) => value.trim().length > 0,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Card chrome only from xl up; on mobile the content sits flat on the page. */}
        <div className="xl:col-span-2 xl:rounded-xl xl:border xl:border-neutral-300 xl:bg-white xl:p-6">
          {view.name === "form" && (
            <FormView
              answers={answers}
              update={update}
              isDirty={isDirty}
              justSaved={justSaved}
              onSave={handleSave}
              onViewHistory={() => setView({ name: "history" })}
            />
          )}

          {view.name === "history" && (
            <HistoryListView
              onBack={() => setView({ name: "form" })}
              onSelect={(entry) =>
                entry.status === "completed" &&
                setView({ name: "history-detail", entry })
              }
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
          <div className="rounded-xl border border-neutral-300 bg-white p-5">
            <p className="text-sm font-semibold text-neutral-900">
              {WEEK_LABEL}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
              <Clock className="h-4 w-4" />
              Week in progress · {DAYS_LEFT} days left
            </div>

            <div className="mt-4 h-2 w-full rounded-full bg-neutral-200">
              <div
                className="h-2 rounded-full bg-primary-500"
                style={{ width: `${(answeredCount / PROMPT_COUNT) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              {answeredCount} of {PROMPT_COUNT} prompts answered
            </p>
          </div>

          <div className="rounded-xl border border-neutral-300 bg-white p-5">
            <p className="text-sm font-semibold text-neutral-900">
              Your mentor
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-500">
                MP
              </span>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Michael Peter
                </p>
                <p className="text-xs text-neutral-500">Design Systems Lead</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormView({
  answers,
  update,
  isDirty,
  justSaved,
  onSave,
  onViewHistory,
}: {
  answers: Answers;
  update: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
  isDirty: boolean;
  justSaved: boolean;
  onSave: () => void;
  onViewHistory: () => void;
}) {
  const [showHowItWorks, setShowHowItWorks] = React.useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
              Control Tower
            </h1>
            {/* Mobile shows the week label (matches Figma); desktop shows the
                description since the week label lives in the side card. */}
            <p className="mt-0.5 text-sm text-neutral-500 xl:hidden">
              {WEEK_LABEL}
            </p>
            <p className="mt-1 hidden text-sm text-neutral-500 xl:block">
              Set your goals, track your progress, and reflect on your week.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="medium"
              className="gap-2 rounded-full px-6"
              onClick={onSave}
              disabled={!isDirty && !justSaved}
            >
              {justSaved ? "Saved" : "Save"}
            </Button>

            <HeaderMenu
              onViewHistory={onViewHistory}
              onHowItWorks={() => setShowHowItWorks(true)}
            />
          </div>
        </div>

        {/* Mobile week status (desktop has the side card). */}
        <div className="flex flex-col items-start gap-2 xl:hidden">
          <p className="text-sm text-neutral-700">Week in progress</p>
          <span className="rounded-full bg-[#FFF3D6] px-2.5 py-1 text-xs font-medium text-[#8A5A00]">
            {DAYS_LEFT} days left
          </span>
        </div>

        {showHowItWorks && (
          <div className="relative rounded-lg border border-neutral-300 bg-white p-4 pr-10 text-sm text-neutral-700">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-200"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="font-semibold text-neutral-900">
              How Control Tower works
            </p>
            <p className="mt-1">
              Answer each prompt to set your goals for the week, then check
              back in as you make progress. Your mentor can see what you share
              here during your weekly check-ins.
            </p>
          </div>
        )}
      </div>

      <ReflectionField
        label="What are you focusing on this week?"
        placeholder="Define the main thing you want to make progress on this week..."
        value={answers.focus}
        onChange={(value) => update("focus", value)}
      />

      <ReflectionField
        label="What do you want to achieve?"
        placeholder="Example: I want to develop my knowledge of the system architecture"
        value={answers.achieve}
        onChange={(value) => update("achieve", value)}
      />

      <Section label="Mentor Check-in">
        <ReflectionField
          label="What came out of your meeting?"
          placeholder="Example: My mentor was able to guide my understanding of the concept of system design"
          value={answers.mentorNotes}
          onChange={(value) => update("mentorNotes", value)}
        />

        <ReflectionField
          label="How are you progressing?"
          placeholder="Share how this week has gone so far..."
          value={answers.progress}
          onChange={(value) => update("progress", value)}
        />

        <ReflectionField
          label="Weekly KPIs"
          placeholder="Example: Ship 3 components to the design library"
          value={answers.kpis}
          onChange={(value) => update("kpis", value)}
        />
      </Section>

      <Section label="Weekly Reflection">
        {/* PENDING-BACKEND(wentWell): uncomment once weekly metrics store it.
        <ReflectionField
          label="What went well?"
          placeholder="Example: I finally understood how variants work in the design system"
          value={answers.wentWell}
          onChange={(value) => update("wentWell", value)}
        />
        */}

        <ReflectionField
          label="What didn't go well?"
          placeholder="Example: I spent too long on a problem I could have asked for help with sooner"
          value={answers.didntGoWell}
          onChange={(value) => update("didntGoWell", value)}
        />

        {/* PENDING-BACKEND(doDifferently): uncomment once weekly metrics store it.
        <ReflectionField
          label="What will you do differently?"
          placeholder="Example: Ask my mentor for feedback earlier in the week"
          value={answers.doDifferently}
          onChange={(value) => update("doDifferently", value)}
        />
        */}
      </Section>
    </div>
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
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-200/60"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-2 w-64 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => choose(onViewHistory)}
            className="w-full rounded-xl px-4 py-3 text-left text-sm text-neutral-900 hover:bg-neutral-200/60"
          >
            View previous weeks
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => choose(onHowItWorks)}
            className="w-full rounded-xl px-4 py-3 text-left text-sm text-neutral-900 hover:bg-neutral-200/60"
          >
            How Control Tower works
          </button>
        </div>
      )}
    </div>
  );
}

function HistoryListView({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (entry: HistoryEntry) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            Previous weeks
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Review your goals, progress, mentor notes, and reflections from
            previous weeks.
          </p>
        </div>
      </div>

      {HISTORY.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-16 text-center">
          <p className="text-sm font-medium text-neutral-900">
            No previous weeks yet
          </p>
          <p className="max-w-xs text-sm text-neutral-500">
            Your completed weekly Control Tower entries will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {HISTORY.map((entry) => (
            <button
              key={entry.id}
              type="button"
              disabled={entry.status !== "completed"}
              onClick={() => onSelect(entry)}
              className={cn(
                "flex items-center justify-between rounded-lg border border-neutral-300 px-4 py-3 text-left",
                entry.status === "completed"
                  ? "hover:bg-neutral-200/60"
                  : "cursor-default opacity-80",
              )}
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {entry.week}
                </p>
                <p className="text-xs text-neutral-500">{entry.dateRange}</p>
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
  entry: HistoryEntry;
  onBack: () => void;
}) {
  const answers = entry.answers ?? EMPTY_ANSWERS;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {entry.week}
            </p>
            <p className="text-xs text-neutral-500">{entry.dateRange}</p>
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
        <ReflectionField
          label="What came out of your meeting?"
          placeholder=""
          value={answers.mentorNotes}
          onChange={() => {}}
          disabled
        />
        <ReflectionField
          label="How are you progressing?"
          placeholder=""
          value={answers.progress}
          onChange={() => {}}
          disabled
        />
        <ReflectionField
          label="Weekly KPIs"
          placeholder=""
          value={answers.kpis}
          onChange={() => {}}
          disabled
        />
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

function StatusBadge({ status }: { status: HistoryEntry["status"] }) {
  const isCompleted = status === "completed";

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
        isCompleted
          ? "bg-[#E8F5E9] text-semantic-text-success"
          : "bg-[#FDECEA] text-semantic-text-error",
      )}
    >
      {isCompleted ? "Completed" : "Missed"}
    </span>
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
    <div className="border-t border-neutral-200 pt-6">
      <p className="mb-4 text-sm font-semibold text-primary-500">{label}</p>
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