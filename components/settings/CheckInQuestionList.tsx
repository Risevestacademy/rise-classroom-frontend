"use client";

import { useRouter } from "next/navigation";

import { MoreHorizontal } from "@/assets/icons";
import { DragGrip } from "@/components/settings/DragGrip";
import { settingsCardClass } from "@/components/settings/SettingsSection";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  questionTypeLabels,
  type CheckInQuestion,
  type CheckInQuestionGroup,
} from "@/lib/check-in-questions";
import { settingsRoutes } from "@/lib/settings";
import type { DragReorder } from "@/lib/use-drag-reorder";
import { cn } from "@/lib/utils";

type QuestionActions = {
  drag: DragReorder<CheckInQuestion>;
  onDuplicate: (question: CheckInQuestion) => void;
  onDelete: (question: CheckInQuestion) => void;
};

const menuItemClass = "cursor-pointer px-3 py-2 font-work";

/* The check-in questions, a card per category that has any. */
export function CheckInQuestionGroups({
  groups,
  ...actions
}: QuestionActions & {
  groups: CheckInQuestionGroup[];
}): React.JSX.Element {
  const filled = groups.filter((group) => group.questions.length > 0);

  if (filled.length === 0) {
    return (
      <p
        className={cn(
          settingsCardClass,
          "mt-3 p-6 text-center font-work text-sm text-text-secondary",
        )}
      >
        There are no check-in questions yet. Add one to get started.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {filled.map((group) => (
        <div key={group.category} className={cn(settingsCardClass, "p-4")}>
          <div className="flex items-center justify-between gap-3 py-4">
            <h4 className="text-base text-text-primary">{group.category}</h4>
            <Badge variant="light" status="info">
              {group.questions.length} Question
              {group.questions.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <ul className="divide-y divide-border-default">
            {group.questions.map((question) => (
              <QuestionRow key={question.id} question={question} {...actions} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function QuestionRow({
  question,
  drag,
  ...menu
}: QuestionActions & { question: CheckInQuestion }) {
  return (
    <li
      {...drag.itemProps(question.id)}
      className={cn(
        "flex min-h-17 items-center gap-4 rounded-sm py-3",
        drag.draggingId === question.id && "opacity-50",
      )}
    >
      <DragGrip {...drag.handleProps(question.id)} className="size-8" />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <p className="min-w-0 text-sm text-text-primary">{question.title}</p>
        <span className="shrink-0 rounded-full bg-surface-subtle px-2 py-1 font-work text-xs text-text-primary">
          {questionTypeLabels[question.type]}
        </span>
      </div>
      <QuestionRowMenu question={question} {...menu} />
    </li>
  );
}

function QuestionRowMenu({
  question,
  onDuplicate,
  onDelete,
}: Omit<QuestionActions, "drag"> & { question: CheckInQuestion }) {
  const router = useRouter();
  const editHref = `${settingsRoutes.editQuestions}?question=${question.id}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for "${question.title}"`}
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-icon-primary hover:bg-surface-subtle"
      >
        <MoreHorizontal className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          className={menuItemClass}
          onClick={() => router.push(editHref)}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          className={menuItemClass}
          onClick={() => onDuplicate(question)}
        >
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className={menuItemClass}
          onClick={() => onDelete(question)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
