import { describe, expect, it } from "vitest";

import {
  applyQuestionDrafts,
  defaultCheckInQuestions,
  groupQuestionsByCategory,
  moveQuestion,
  newQuestionDraft,
  validateQuestionDraft,
  type QuestionDraft,
} from "@/lib/check-in-questions";
import { searchSettings } from "@/lib/settings";

const ids = (questions: { id: string }[]) => questions.map(({ id }) => id);

function draft(patch: Partial<QuestionDraft>): QuestionDraft {
  return { ...newQuestionDraft(), ...patch };
}

describe("defaultCheckInQuestions", () => {
  it("groups the control tower questions the way the design does", () => {
    const groups = groupQuestionsByCategory(defaultCheckInQuestions);
    expect(groups.map((group) => [group.category, ids(group.questions)])).toEqual([
      ["Weekly focus", ["focus", "achieve"]],
      ["Mentor Check-in", ["meeting", "progress", "kpis"]],
      ["Weekly Reflection", ["wentWell", "didntGoWell", "doDifferently"]],
    ]);
  });
});

describe("moveQuestion", () => {
  it("moves a question down to where another is", () => {
    const moved = moveQuestion(defaultCheckInQuestions, "focus", "achieve");
    expect(ids(moved).slice(0, 2)).toEqual(["achieve", "focus"]);
  });

  it("moves a question up to where another is", () => {
    const moved = moveQuestion(defaultCheckInQuestions, "kpis", "meeting");
    expect(ids(moved).slice(2, 5)).toEqual(["kpis", "meeting", "progress"]);
  });

  it("joins the other question's category when asked to", () => {
    const moved = moveQuestion(defaultCheckInQuestions, "focus", "wentWell", true);
    expect(moved.find((question) => question.id === "focus")?.category).toBe(
      "Weekly Reflection",
    );
  });

  it("leaves the list alone when there's nothing to move", () => {
    expect(moveQuestion(defaultCheckInQuestions, "focus", "focus")).toBe(
      defaultCheckInQuestions,
    );
    expect(moveQuestion(defaultCheckInQuestions, "focus", "missing")).toBe(
      defaultCheckInQuestions,
    );
  });
});

describe("validateQuestionDraft", () => {
  it("needs a title and a category", () => {
    expect(validateQuestionDraft(draft({ title: "  " }))).toEqual({
      title: "Enter the question.",
      category: "Select a category.",
    });
  });

  it("needs an option for a multiple choice question", () => {
    const question = draft({
      title: "How was your week?",
      category: "Weekly focus",
      type: "MULTIPLE_CHOICE",
      options: [" "],
    });
    expect(validateQuestionDraft(question)).toEqual({
      options: "Add at least one option.",
    });
    expect(validateQuestionDraft({ ...question, options: ["Good"] })).toEqual({});
  });
});

describe("applyQuestionDrafts", () => {
  it("adds new questions at the end, tidied up", () => {
    const added = draft({
      title: " How was your week? ",
      category: "Weekly focus",
      type: "MULTIPLE_CHOICE",
      description: "Ignored for multiple choice",
      options: [" Good ", "", "Bad"],
    });
    const result = applyQuestionDrafts(defaultCheckInQuestions, [], [added]);

    expect(result).toHaveLength(defaultCheckInQuestions.length + 1);
    expect(result.at(-1)).toEqual({
      ...added,
      title: "How was your week?",
      description: "",
      options: ["Good", "Bad"],
    });
  });

  it("swaps an edited question for its drafts in place", () => {
    const edited = { ...defaultCheckInQuestions[1], title: "What's the goal?" };
    const extra = draft({ title: "Anything else?", category: "Weekly focus" });
    const result = applyQuestionDrafts(
      defaultCheckInQuestions,
      ["achieve"],
      [edited, extra],
    );

    expect(ids(result).slice(0, 4)).toEqual([
      "focus",
      "achieve",
      extra.id,
      "meeting",
    ]);
    expect(result[1].title).toBe("What's the goal?");
  });

  it("drops edited questions that were deleted", () => {
    const result = applyQuestionDrafts(
      defaultCheckInQuestions,
      ids(defaultCheckInQuestions),
      defaultCheckInQuestions.slice(0, 2),
    );
    expect(ids(result)).toEqual(["focus", "achieve"]);
  });
});

describe("searchSettings", () => {
  it("finds settings by name or section", () => {
    expect(searchSettings("time zone")).toEqual([
      { label: "Time zone", section: "General", href: "/admin/settings/general" },
    ]);
    expect(searchSettings("appearance").map((entry) => entry.label)).toEqual([
      "Interface theme",
      "Workspace theme",
      "Reduce motion",
    ]);
  });

  it("finds nothing for a blank search", () => {
    expect(searchSettings("  ")).toEqual([]);
  });
});
