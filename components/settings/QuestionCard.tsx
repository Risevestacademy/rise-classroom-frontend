"use client";

import { DragGrip } from "@/components/settings/DragGrip";
import {
  QuestionCardControls,
  type QuestionCardProps,
} from "@/components/settings/QuestionCardParts";
import {
  FieldError,
  QuestionOptions,
} from "@/components/settings/QuestionOptions";
import { cn } from "@/lib/utils";

/* One question in the builder. Only the question being worked on shows its
   type, category and actions. */
export function QuestionCard(props: QuestionCardProps): React.JSX.Element {
  const { draft, errors, isActive, drag, onActivate, onChange } = props;

  return (
    <div
      {...drag.itemProps(draft.id)}
      onFocusCapture={onActivate}
      onClick={onActivate}
      className={cn(
        "relative rounded-xl bg-surface-default p-3",
        drag.draggingId === draft.id && "opacity-50",
      )}
    >
      {isActive && props.canRemove && (
        <DragGrip
          {...drag.handleProps(draft.id)}
          className="absolute top-2 right-full mr-1 h-8 w-6 max-sm:hidden"
        />
      )}

      <input
        aria-label="Question"
        aria-invalid={Boolean(errors.title)}
        placeholder="Untitled question"
        value={draft.title}
        onChange={(event) => onChange({ title: event.target.value })}
        className={cn(
          "w-full rounded-md border border-transparent bg-brand-50 px-3 text-sm text-text-primary outline-none placeholder:text-text-primary focus:border-border-focus focus:placeholder:text-text-muted",
          isActive ? "h-11" : "h-8",
          errors.title && "border-border-error",
        )}
      />
      <FieldError>{errors.title}</FieldError>

      {draft.type === "MULTIPLE_CHOICE" ? (
        <QuestionOptions {...props} />
      ) : (
        <textarea
          aria-label="Description"
          placeholder="Description"
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
          className="mt-1 block min-h-25 w-full resize-y rounded-xl border border-border-default bg-transparent p-3 font-work text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-border-focus"
        />
      )}

      {isActive && <QuestionCardControls {...props} />}
    </div>
  );
}
