import { checkInQuestions } from "@/lib/student-check-ins";

/* PENDING-BACKEND: the API can't store check-in questions yet, so changes
   last until the page is reloaded. */

export type QuestionType = "LONG_ANSWER" | "MULTIPLE_CHOICE";

export const questionTypeLabels: Record<QuestionType, string> = {
  LONG_ANSWER: "Long answer",
  MULTIPLE_CHOICE: "Multiple choice",
};

export const checkInCategories = [
  "Weekly focus",
  "Mentor Check-in",
  "Weekly Reflection",
] as const;

export type CheckInCategory = (typeof checkInCategories)[number];

export type CheckInQuestion = {
  id: string;
  title: string;
  description: string;
  type: QuestionType;
  category: CheckInCategory;
  /* Only used by multiple choice questions. */
  options: string[];
};

/* A question still being written, so it may not have a category yet. */
export type QuestionDraft = Omit<CheckInQuestion, "category"> & {
  category: CheckInCategory | "";
};

export type QuestionDraftErrors = {
  title?: string;
  category?: string;
  options?: string;
};

/* The questions students answer today, grouped the way the control tower
   groups them. */
export const defaultCheckInQuestions: CheckInQuestion[] = (() => {
  let category: CheckInCategory = checkInCategories[0];
  return checkInQuestions.map((question) => {
    if ("section" in question) category = question.section;
    return {
      id: question.key,
      title: question.label,
      description: "",
      type: "LONG_ANSWER",
      category,
      options: [],
    };
  });
})();

export function newQuestionDraft(): QuestionDraft {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    type: "LONG_ANSWER",
    category: "",
    options: [""],
  };
}

export function copyOfQuestion<T extends QuestionDraft>(question: T): T {
  return {
    ...question,
    id: crypto.randomUUID(),
    options: [...question.options],
  };
}

export type CheckInQuestionGroup = {
  category: CheckInCategory;
  questions: CheckInQuestion[];
};

export function groupQuestionsByCategory(
  questions: CheckInQuestion[],
): CheckInQuestionGroup[] {
  return checkInCategories.map((category) => ({
    category,
    questions: questions.filter((question) => question.category === category),
  }));
}

/* Copies of the questions to edit: all of them, or just `questionId`. */
export function openQuestionDrafts(
  questions: CheckInQuestion[],
  questionId?: string,
): QuestionDraft[] {
  const opened = questionId
    ? questions.filter((question) => question.id === questionId)
    : questions;
  return opened.map((question) => ({
    ...question,
    options: [...question.options],
  }));
}

/* Puts `question` straight after the one with `afterId`. */
export function insertQuestionAfter<T extends QuestionDraft>(
  questions: T[],
  afterId: string,
  question: T,
): T[] {
  const index = questions.findIndex((item) => item.id === afterId);
  return [
    ...questions.slice(0, index + 1),
    question,
    ...questions.slice(index + 1),
  ];
}

/* Puts one question where another is. With `adoptCategory` it also joins that
   question's category, which is how a question is dragged between groups. */
export function moveQuestion<T extends QuestionDraft>(
  questions: T[],
  fromId: string,
  toId: string,
  adoptCategory = false,
): T[] {
  const from = questions.find((question) => question.id === fromId);
  const toIndex = questions.findIndex((question) => question.id === toId);
  if (!from || toIndex === -1 || fromId === toId) return questions;

  const next = questions.filter((question) => question.id !== fromId);
  next.splice(
    toIndex,
    0,
    adoptCategory ? { ...from, category: questions[toIndex].category } : from,
  );
  return next;
}

export function validateQuestionDraft(
  draft: QuestionDraft,
): QuestionDraftErrors {
  const errors: QuestionDraftErrors = {};
  if (!draft.title.trim()) errors.title = "Enter the question.";
  if (!draft.category) errors.category = "Select a category.";
  if (
    draft.type === "MULTIPLE_CHOICE" &&
    !draft.options.some((option) => option.trim())
  ) {
    errors.options = "Add at least one option.";
  }
  return errors;
}

/* Only call this with drafts that passed `validateQuestionDraft`. */
function toQuestion(draft: QuestionDraft): CheckInQuestion {
  const isChoice = draft.type === "MULTIPLE_CHOICE";
  return {
    ...draft,
    title: draft.title.trim(),
    description: isChoice ? "" : draft.description.trim(),
    category: draft.category as CheckInCategory,
    options: isChoice
      ? draft.options.map((option) => option.trim()).filter(Boolean)
      : [],
  };
}

/* Swaps the questions that were opened for editing (`editedIds`) for the
   drafts, in place. With nothing opened, the drafts go at the end. */
export function applyQuestionDrafts(
  questions: CheckInQuestion[],
  editedIds: readonly string[],
  drafts: QuestionDraft[],
): CheckInQuestion[] {
  const firstEdited = questions.findIndex((question) =>
    editedIds.includes(question.id),
  );
  const rest = questions.filter(
    (question) => !editedIds.includes(question.id),
  );
  const at = firstEdited === -1 ? rest.length : firstEdited;
  return [...rest.slice(0, at), ...drafts.map(toQuestion), ...rest.slice(at)];
}
