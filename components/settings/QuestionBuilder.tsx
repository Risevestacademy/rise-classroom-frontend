"use client";

import { useRouter } from "next/navigation";

import { Add01 } from "@/assets/icons";
import { QuestionCard } from "@/components/settings/QuestionCard";
import { SettingsPageTitle } from "@/components/settings/SettingsSection";
import {
  useQuestionDrafts,
  type QuestionBuilderMode,
  type QuestionDrafts,
} from "@/components/settings/useQuestionDrafts";
import { Button } from "@/components/ui/button";
import { validateQuestionDraft } from "@/lib/check-in-questions";
import { settingsRoutes } from "@/lib/settings";
import { useDragReorder } from "@/lib/use-drag-reorder";

const builderCopy: Record<
  QuestionBuilderMode,
  { title: string; description: string; save: string }
> = {
  add: {
    title: "Add question",
    description: "Create a new question for the weekly check-in.",
    save: "Save",
  },
  edit: {
    title: "Edit question",
    description: "Update the questions for the weekly check-in.",
    save: "Save changes",
  },
};

/* Writes one or more check-in questions. Adding starts from a blank
   question; editing opens the existing ones, or just `questionId`. */
export function QuestionBuilder({
  mode,
  questionId,
}: {
  mode: QuestionBuilderMode;
  questionId?: string;
}): React.JSX.Element {
  const router = useRouter();
  const builder = useQuestionDrafts(mode, questionId);
  const copy = builderCopy[mode];

  return (
    <>
      <SettingsPageTitle
        backHref={settingsRoutes.learning}
        backLabel="Back to Learning and Engagement"
      >
        Learning and Engagement / {copy.title}
      </SettingsPageTitle>

      <section className="mt-10 max-w-118">
        <h3 className="text-lg font-medium text-text-primary">{copy.title}</h3>
        <p className="mt-1 font-work text-xs text-text-secondary">
          {copy.description}
        </p>

        <BuilderCards builder={builder} />
        <BuilderActions
          saveLabel={copy.save}
          onAdd={builder.add}
          onSave={() => {
            if (builder.save()) router.push(settingsRoutes.learning);
          }}
        />
      </section>
    </>
  );
}

function BuilderCards({ builder }: { builder: QuestionDrafts }) {
  const drag = useDragReorder({
    items: builder.drafts,
    onReorder: builder.reorder,
  });

  return (
    <div className="mt-4 flex flex-col gap-4">
      {drag.ordered.map((draft) => (
        <QuestionCard
          key={draft.id}
          draft={draft}
          errors={builder.showErrors ? validateQuestionDraft(draft) : {}}
          isActive={draft.id === builder.activeId}
          canRemove={builder.drafts.length > 1}
          drag={drag}
          onActivate={() => builder.activate(draft.id)}
          onChange={(patch) => builder.update(draft.id, patch)}
          onDuplicate={() => builder.duplicate(draft)}
          onRemove={() => builder.remove(draft.id)}
        />
      ))}
    </div>
  );
}

function BuilderActions({
  saveLabel,
  onAdd,
  onSave,
}: {
  saveLabel: string;
  onAdd: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <Button variant="secondary" size="medium" onClick={onAdd}>
        <Add01 />
        Add
      </Button>
      {/* Not in the design, which has no way to keep what was written. */}
      <Button size="medium" onClick={onSave}>
        {saveLabel}
      </Button>
    </div>
  );
}
