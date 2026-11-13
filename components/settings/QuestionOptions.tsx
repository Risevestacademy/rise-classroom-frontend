"use client";

import { X } from "lucide-react";

import type { QuestionCardProps } from "@/components/settings/QuestionCardParts";

const optionMark = (
  <span className="size-4 shrink-0 rounded-full border border-border-strong bg-surface-default" />
);

export function FieldError({
  children,
}: {
  children?: string;
}): React.JSX.Element | null {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1 font-work text-xs text-text-error">
      {children}
    </p>
  );
}

function OptionRow({
  index,
  value,
  onChange,
  onRemove,
}: {
  index: number;
  value: string;
  onChange: (value: string) => void;
  /* Left out when the option can't be removed. */
  onRemove?: () => void;
}) {
  return (
    <div className="flex h-11 items-center gap-3 px-1">
      {optionMark}
      <input
        aria-label={`Option ${index + 1}`}
        placeholder={`Option ${index + 1}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 min-w-0 flex-1 border-b border-transparent bg-transparent text-sm text-text-primary outline-none placeholder:text-text-primary focus:border-border-focus focus:placeholder:text-text-muted"
      />
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove option ${index + 1}`}
          onClick={onRemove}
          className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-icon-muted hover:bg-surface-subtle hover:text-icon-primary"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/* The answers of a multiple choice question. */
export function QuestionOptions({
  draft,
  errors,
  isActive,
  onChange,
}: QuestionCardProps): React.JSX.Element {
  const { options } = draft;
  const canRemove = isActive && options.length > 1;

  return (
    <div className="mt-2 flex flex-col">
      {options.map((option, index) => (
        <OptionRow
          key={index}
          index={index}
          value={option}
          onChange={(value) =>
            onChange({
              options: options.map((item, at) => (at === index ? value : item)),
            })
          }
          onRemove={
            canRemove
              ? () =>
                  onChange({ options: options.filter((_, at) => at !== index) })
              : undefined
          }
        />
      ))}
      {isActive && (
        <button
          type="button"
          onClick={() => onChange({ options: [...options, ""] })}
          className="flex h-11 cursor-pointer items-center gap-3 px-1 text-left text-sm text-text-secondary hover:text-text-primary"
        >
          {optionMark}
          Add option
        </button>
      )}
      <FieldError>{errors.options}</FieldError>
    </div>
  );
}
