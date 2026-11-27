/*
 * The admin setup guide: what to do first in a new academy, in the order the
 * app needs it. A student is invited into a cohort that hasn't ended and onto
 * an active track, so the cohort and a track come first.
 */

export type SetupItem = "cohort" | "track" | "student" | "team";

export const setupItems: SetupItem[] = ["cohort", "track", "student", "team"];

/** What already exists, read from the academy's data. */
export type SetupProgress = { cohort: boolean; track: boolean; student: boolean };

/** Where the guide is within a task that takes more than one step. */
export type GuidePosition = {
  /** The field being explained on the create-cohort form. */
  formStep: number;
  /** The "your track is ready" note was read. */
  trackNoteRead: boolean;
  /** The cohort picker on the Students page was explained. */
  cohortPickerRead: boolean;
  /** Instructors, then mentors. */
  teamStep: number;
};

export type GuideAction =
  | "form-next"
  | "form-back"
  | "track-note-read"
  | "picker-read"
  | "team-next"
  | "team-back"
  | "finish";

export type GuideStep = {
  item: SetupItem;
  /** The `data-tour` value to light up. */
  target: string;
  title: string;
  body: string;
  /** The admin does the thing being explained, so the page stays usable. */
  interactive: boolean;
  next?: { action: GuideAction; label: string };
  back?: GuideAction;
};

/** The first task still to do. Each one needs the one before it. */
export function currentItem(progress: SetupProgress): SetupItem {
  if (!progress.cohort) return "cohort";
  if (!progress.track) return "track";
  if (!progress.student) return "student";
  return "team";
}

const nav = (href: string) => `nav:${href}`;

const cohortFormSteps: Omit<GuideStep, "item" | "interactive">[] = [
  {
    target: "cohort-name",
    title: "Name your cohort",
    body: "Use a name your team will recognise, like “Cohort 2026”.",
  },
  {
    target: "cohort-dates",
    title: "Set its dates",
    body: "When the cohort starts and ends. The duration is worked out for you.",
  },
  {
    target: "cohort-status",
    title: "Choose a status",
    body: "Pick Upcoming or Active. Students can only be invited into a cohort that hasn't ended.",
  },
  {
    target: "cohort-submit",
    title: "Create it",
    body: "When the details look right, click Create cohort.",
  },
];

/** What the guide points at now, given the page the admin is on. */
export function guideStep(
  pathname: string,
  progress: SetupProgress,
  position: GuidePosition,
): GuideStep {
  const item = currentItem(progress);

  if (item === "cohort") {
    if (pathname === "/admin/cohorts/create") {
      const at = Math.min(position.formStep, cohortFormSteps.length - 1);
      const last = at === cohortFormSteps.length - 1;
      return {
        item,
        interactive: true,
        ...cohortFormSteps[at]!,
        next: last ? undefined : { action: "form-next", label: "Next" },
        back: at > 0 ? "form-back" : undefined,
      };
    }
    if (pathname === "/admin/cohorts") {
      return {
        item,
        interactive: true,
        target: "create-cohort",
        title: "Create your cohort",
        body: "Click Create cohort to set one up.",
      };
    }
    return {
      item,
      interactive: true,
      target: nav("/admin/cohorts"),
      title: "Start with a cohort",
      body: "A cohort is a group of students who learn together over the same dates. Open Cohorts to create your first one.",
    };
  }

  if (item === "track") {
    if (pathname === "/admin/tracks") {
      return {
        item,
        interactive: true,
        target: "create-track",
        title: "Create a track",
        body: "Running more than one programme? Create a track for each. You can add more at any time.",
      };
    }
    return {
      item,
      interactive: true,
      target: nav("/admin/tracks"),
      title: "Now add a track",
      body: "A track is what students learn, like Product Design. Every student joins one, so you need at least one before inviting anyone. Open Tracks.",
    };
  }

  if (item === "student") {
    if (pathname === "/admin/tracks" && !position.trackNoteRead) {
      return {
        item,
        interactive: false,
        target: "tracks-list",
        title: "Your track is ready",
        body: "It's listed here now. Add a track for each programme you run, now or any time later.",
        next: { action: "track-note-read", label: "Got it" },
      };
    }
    if (pathname === "/admin/students" && !position.cohortPickerRead) {
      return {
        item,
        interactive: false,
        target: "cohort-select",
        title: "Check the cohort",
        body: "New students join the cohort picked here at the top of the page. Your new cohort is already selected.",
        next: { action: "picker-read", label: "Next" },
      };
    }
    if (pathname === "/admin/students") {
      return {
        item,
        interactive: true,
        target: "invite-student",
        title: "Invite your first student",
        body: "Start with one person. You'll choose which track they join.",
      };
    }
    return {
      item,
      interactive: true,
      target: nav("/admin/students"),
      title: "Invite your first student",
      body: "Students are invited from the Students page. Open Students.",
    };
  }

  if (position.teamStep === 0) {
    return {
      item,
      interactive: false,
      target: nav("/admin/instructors"),
      title: "Invite your instructors",
      body: "Instructors teach a track in a cohort and build its curriculum. Invite them here when you're ready.",
      next: { action: "team-next", label: "Next" },
    };
  }
  return {
    item,
    interactive: false,
    target: nav("/admin/mentors"),
    title: "And your mentors",
    body: "Mentors guide students week to week. Invite them here too. That's your academy set up!",
    next: { action: "finish", label: "Done" },
    back: "team-back",
  };
}
