import type { SaveWeeklyMetricInput, WeeklyMetric } from "@/lib/control-tower";

/*
 * PENDING-BACKEND(kpis): the design has a "Weekly KPIs" prompt under Mentor
 * Check-in, but weekly metrics have no field to store it yet. Search the
 * project for PENDING-BACKEND(kpis) to bring it back once the API has one.
 */
export type Answers = {
  focus: string;
  achieve: string;
  meeting: string;
  progress: string;
  // kpis: string; // PENDING-BACKEND(kpis)
  wentWell: string;
  didntGoWell: string;
  doDifferently: string;
};

export type Prompt = { key: keyof Answers; label: string; placeholder: string };

export const promptGroups: { section?: string; prompts: Prompt[] }[] = [
  {
    prompts: [
      {
        key: "focus",
        label: "What are you focusing on this week?",
        placeholder: "Define the main thing you want to make progress on this week...",
      },
      {
        key: "achieve",
        label: "What do you want to achieve?",
        placeholder: "Example: I want to develop my knowledge of the system architecture",
      },
    ],
  },
  {
    section: "Mentor Check-in",
    prompts: [
      {
        key: "meeting",
        label: "What came out of your meeting?",
        placeholder:
          "Example: My mentor was able to guide my understanding of the concept of system design",
      },
      {
        key: "progress",
        label: "How are you progressing?",
        placeholder: "Example: On track. Buttons are done and text inputs are in progress",
      },
      // PENDING-BACKEND(kpis):
      // { key: "kpis", label: "Weekly KPIs", placeholder: "Example: Build my portfolio" },
    ],
  },
  {
    section: "Weekly Reflection",
    prompts: [
      {
        key: "wentWell",
        label: "What went well?",
        placeholder: "Example: I finished the button set ahead of schedule",
      },
      {
        key: "didntGoWell",
        label: "What didn’t go well?",
        placeholder: "Example: I spent too long on a problem I could have asked for help with sooner",
      },
      {
        key: "doDifferently",
        label: "What will you do differently?",
        placeholder: "Example: Ask my mentor for feedback earlier in the week",
      },
    ],
  },
];

/** Prompt ↔ API field. The prompts are worded for students; the API isn't. */
export function toAnswers(metric?: WeeklyMetric): Answers {
  return {
    focus: metric?.priorities ?? "",
    achieve: metric?.goalSummary ?? "",
    meeting: metric?.mentorMeetingOutcome ?? "",
    progress: metric?.progress ?? "",
    // kpis: metric?.kpis ?? "", // PENDING-BACKEND(kpis)
    wentWell: metric?.whatWentWell ?? "",
    didntGoWell: metric?.challenges ?? "",
    doDifferently: metric?.whatIWillDoDifferently ?? "",
  };
}

/** Every field is sent, so clearing an answer clears it on the server too. */
export function toPayload(
  answers: Answers
): Omit<SaveWeeklyMetricInput, "weekStart" | "weekEnd" | "status"> {
  return {
    priorities: answers.focus.trim(),
    goalSummary: answers.achieve.trim(),
    mentorMeetingOutcome: answers.meeting.trim(),
    progress: answers.progress.trim(),
    // kpis: answers.kpis.trim(), // PENDING-BACKEND(kpis)
    whatWentWell: answers.wentWell.trim(),
    challenges: answers.didntGoWell.trim(),
    whatIWillDoDifferently: answers.doDifferently.trim(),
  };
}

export function sameAnswers(a: Answers, b: Answers) {
  return (Object.keys(a) as (keyof Answers)[]).every(
    (key) => a[key].trim() === b[key].trim()
  );
}

export function hasAnyAnswer(answers: Answers) {
  return Object.values(answers).some((value) => value.trim().length > 0);
}
