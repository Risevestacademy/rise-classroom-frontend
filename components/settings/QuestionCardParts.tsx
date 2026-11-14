"use client";

import { Copy01, Delete02 } from "@/assets/icons";
import { FieldError } from "@/components/settings/QuestionOptions";
import { SelectInput } from "@/components/ui/select";
import {
  checkInCategories,
  questionTypeLabels,
  type QuestionDraft,
  type QuestionDraftErrors,
} from "@/lib/check-in-questions";
import type { DragReorder } from "@/lib/use-drag-reorder";
import { cn } from "@/lib/utils";

export type QuestionCardProps = {
  draft: QuestionDraft;
  errors: QuestionDraftErrors;
  isActive: boolean;
  canRemove: boolean;
  drag: DragReorder<QuestionDraft>;
  onActivate: () => void;
  onChange: (patch: Partial<QuestionDraft>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

const categoryOptions = checkInCategories.map((category) => ({
  value: category,
  label: category,
}));

function QuestionSelects({
  draft,
  errors,
  onChange,
}: Pick<QuestionCardProps, "draft" | "errors" | "onChange">) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <SelectInput
        aria-label="Question type"
        value={draft.type}
        onChange={(type) =>
          onChange({
            type,
            options: draft.options.length > 0 ? draft.options : [""],
          })
        }
        options={questionTypeLabels}
        className="h-11 px-3"
      />
      <div>
        <SelectInput
          aria-label="Category"
          value={draft.category}
          onChange={(category) => onChange({ category })}
          options={categoryOptions}
          placeholder="Select a category"
          className={cn("h-11 px-3", errors.category && "border-border-error")}
        />
        <FieldError>{errors.category}</FieldError>
      </div>
    </div>
  );
}

function IconAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        /* Keeps the card's own click from re-activating it. */
        event.stopPropagation();
        onClick();
      }}
      className="flex size-9 cursor-pointer items-center justify-center rounded-md text-icon-primary outline-none hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-border-focus disabled:cursor-not-allowed disabled:text-icon-disabled disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

/* What the question being worked on shows under its text: its type and
   category, and the duplicate and delete actions. */
export function QuestionCardControls({
  draft,
  errors,
  canRemove,
  onChange,
  onDuplicate,
  onRemove,
}: QuestionCardProps): React.JSX.Element {
  const name = draft.title.trim() || "Untitled question";

  return (
    <>
      <QuestionSelects draft={draft} errors={errors} onChange={onChange} />
      <hr className="mt-6 ml-10 border-border-default" />
      <div className="mt-3 flex justify-end gap-4">
        <IconAction label={`Duplicate "${name}"`} onClick={onDuplicate}>
          <Copy01 className="size-5" />
        </IconAction>
        <IconAction
          label={`Delete "${name}"`}
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Delete02 className="size-5" />
        </IconAction>
      </div>
    </>
  );
}
