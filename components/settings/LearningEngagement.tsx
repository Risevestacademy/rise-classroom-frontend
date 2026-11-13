"use client";

import * as React from "react";
import Link from "next/link";

import { CheckInQuestionGroups } from "@/components/settings/CheckInQuestionList";
import { useSettings } from "@/components/settings/SettingsContext";
import {
  SettingsPageTitle,
  settingsCardClass,
} from "@/components/settings/SettingsSection";
import { buttonVariants } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  copyOfQuestion,
  groupQuestionsByCategory,
  insertQuestionAfter,
  moveQuestion,
  type CheckInQuestion,
} from "@/lib/check-in-questions";
import { settingsRoutes } from "@/lib/settings";
import { useDragReorder } from "@/lib/use-drag-reorder";
import { cn } from "@/lib/utils";

export function LearningEngagement(): React.JSX.Element {
  const { questions, setQuestions } = useSettings();
  const [deleting, setDeleting] = React.useState<CheckInQuestion | null>(null);
  /* A question dragged into another category joins it. */
  const drag = useDragReorder({
    items: questions,
    onReorder: setQuestions,
    move: (items, fromId, toId) => moveQuestion(items, fromId, toId, true),
  });

  const duplicate = (question: CheckInQuestion) =>
    setQuestions((current) =>
      insertQuestionAfter(current, question.id, copyOfQuestion(question)),
    );

  const confirmDelete = () => {
    setQuestions((current) =>
      current.filter((question) => question.id !== deleting?.id),
    );
    setDeleting(null);
  };

  return (
    <>
      <SettingsPageTitle>Learning and Engagement</SettingsPageTitle>
      <WeeklyCheckInSummary count={questions.length} />

      <section className="mt-8 max-w-[578px]">
        <QuestionsHeader canEdit={questions.length > 0} />
        <CheckInQuestionGroups
          groups={groupQuestionsByCategory(drag.ordered)}
          drag={drag}
          onDuplicate={duplicate}
          onDelete={setDeleting}
        />
      </section>

      <DeleteConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        itemName={deleting?.title ?? ""}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function WeeklyCheckInSummary({ count }: { count: number }) {
  return (
    <section className="mt-8">
      <h3 className="text-lg font-medium text-text-primary">Weekly check-ins</h3>
      <p className="mt-1 font-work text-xs text-text-secondary">
        Manage the questions students respond to during their weekly check-ins.
      </p>
      <div className={cn(settingsCardClass, "mt-3 w-44.5 rounded-xl p-5")}>
        <p className="text-2xl font-medium text-text-primary">{count}</p>
        <p className="mt-2 text-sm text-text-primary">
          Active Question{count === 1 ? "" : "s"}
        </p>
      </div>
    </section>
  );
}

function QuestionsHeader({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-medium text-text-primary">
          Check-in questions
        </h3>
        <p className="mt-1 font-work text-xs text-text-secondary">
          Add and edit the questions students answer weekly.
        </p>
      </div>
      <div className="flex shrink-0 gap-3">
        {canEdit && (
          <Link
            href={settingsRoutes.editQuestions}
            className={buttonVariants({ variant: "secondary" })}
          >
            Edit
          </Link>
        )}
        <Link
          href={settingsRoutes.addQuestion}
          className={buttonVariants({ variant: "primary" })}
        >
          Add question
        </Link>
      </div>
    </div>
  );
}
