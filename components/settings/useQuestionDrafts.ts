"use client";

import * as React from "react";

import { useSettings } from "@/components/settings/SettingsContext";
import {
  applyQuestionDrafts,
  copyOfQuestion,
  insertQuestionAfter,
  newQuestionDraft,
  openQuestionDrafts,
  validateQuestionDraft,
  type QuestionDraft,
} from "@/lib/check-in-questions";

export type QuestionBuilderMode = "add" | "edit";

type DraftList = {
  drafts: QuestionDraft[];
  /* The question being worked on. */
  activeId: string;
  activate: (id: string) => void;
  update: (id: string, patch: Partial<QuestionDraft>) => void;
  add: () => void;
  duplicate: (draft: QuestionDraft) => void;
  remove: (id: string) => void;
  reorder: (drafts: QuestionDraft[]) => void;
};

export type QuestionDrafts = DraftList & {
  showErrors: boolean;
  /* False when a draft still needs fixing, in which case nothing is saved. */
  save: () => boolean;
};

function savedToast(
  mode: QuestionBuilderMode,
  count: number,
): { title: string; message: string } {
  if (mode === "edit") {
    return {
      title: "Changes saved",
      message: "The check-in questions have been updated.",
    };
  }
  return {
    title: count === 1 ? "Question added" : "Questions added",
    message: "Students will see the change in their weekly check-in.",
  };
}

function useDraftList(opened: QuestionDraft[]): DraftList {
  /* Editing a question that's gone still leaves something to fill in. */
  const [drafts, setDrafts] = React.useState(() =>
    opened.length > 0 ? opened : [newQuestionDraft()],
  );
  const [activeId, setActiveId] = React.useState(() => drafts[0].id);

  return {
    drafts,
    activeId,
    activate: setActiveId,
    update: (id, patch) =>
      setDrafts((current) =>
        current.map((draft) =>
          draft.id === id ? { ...draft, ...patch } : draft,
        ),
      ),
    add: () => {
      const draft = newQuestionDraft();
      setDrafts((current) => [...current, draft]);
      setActiveId(draft.id);
    },
    duplicate: (draft) => {
      const copy = copyOfQuestion(draft);
      setDrafts((current) => insertQuestionAfter(current, draft.id, copy));
      setActiveId(copy.id);
    },
    remove: (id) => {
      const index = drafts.findIndex((draft) => draft.id === id);
      const next = drafts.filter((draft) => draft.id !== id);
      setDrafts(next);
      setActiveId(next[Math.min(index, next.length - 1)].id);
    },
    reorder: setDrafts,
  };
}

/* The questions being written in the builder. Adding starts from a blank
   question; editing opens the existing ones, or just `questionId`. */
export function useQuestionDrafts(
  mode: QuestionBuilderMode,
  questionId?: string,
): QuestionDrafts {
  const { questions, setQuestions, setToast } = useSettings();
  const [opened] = React.useState(() =>
    mode === "edit" ? openQuestionDrafts(questions, questionId) : [],
  );
  const list = useDraftList(opened);
  const [showErrors, setShowErrors] = React.useState(false);

  const save = () => {
    const invalid = list.drafts.find(
      (draft) => Object.keys(validateQuestionDraft(draft)).length > 0,
    );
    if (invalid) {
      setShowErrors(true);
      list.activate(invalid.id);
      return false;
    }
    const openedIds = opened.map((question) => question.id);
    setQuestions((current) =>
      applyQuestionDrafts(current, openedIds, list.drafts),
    );
    setToast(savedToast(mode, list.drafts.length));
    return true;
  };

  return { ...list, showErrors, save };
}
