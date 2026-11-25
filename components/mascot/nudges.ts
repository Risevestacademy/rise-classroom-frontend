import { daysLeftIn, isWeekCompleted, type ControlTowerWeek } from "@/lib/control-tower";
import type { TrackProgress } from "@/lib/student";
import { assignmentHref, type StudentSubmission } from "@/lib/student-assignments";
import type { LiveSession } from "@/lib/live-sessions";
import type { ContinueLearning, Deadline } from "@/lib/student-dashboard";
import {
  LESSONS_BASE,
  isCompleted,
  lessonHref,
  topicAssignments,
  type CurriculumTopic,
} from "@/lib/student-lessons";
import type { MascotMood } from "./Mascot";

/** One thing the companion has to say, with at most one thing to do about it. */
export type Nudge = {
  /** Stable for the thing it is about, so "seen" survives a reload. */
  id: string;
  mood: MascotMood;
  message: string;
  action?: { label: string; href: string };
  /** Time-sensitive enough to be worth the daily pop-up. */
  urgent: boolean;
  /** The dashboard card this is about, where the companion can point. */
  target?: "deadlines";
};

const KINDS = [
  "live-now",
  "live-soon",
  "live-today",
  "due-today",
  "due-soon",
  "changes",
  "control-tower",
  "feedback",
  "welcome-back",
  "not-enrolled",
  "track-complete",
  "clear-week",
  "resume",
  "first-module",
  "all-clear",
];

/** The sort of nudge without the thing it is about, for counting which ones land. */
export function nudgeKind(nudge: Pick<Nudge, "id">) {
  return KINDS.find((kind) => nudge.id.startsWith(kind)) ?? "other";
}

export type NudgeInput = {
  now?: Date;
  enrollment?: TrackProgress;
  notEnrolled?: boolean;
  current: ContinueLearning | null;
  /** Soonest first, as `upcomingDeadlines` returns them. */
  deadlines: Deadline[];
  submissions: StudentSubmission[];
  controlTowerWeek?: ControlTowerWeek;
  /** Days since the student's visit before this one; 0 when unknown. */
  daysAway?: number;
  /** The curriculum, to tell whether an assignment's lesson has been watched. */
  topics?: CurriculumTopic[];
  /** The student's live classes around today, as the live sessions list returns them. */
  liveSessions?: LiveSession[];
  /** Which wording to use where there are several. Changes daily unless given. */
  variant?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** Feedback counts as news for this long after the review. */
const FRESH_FEEDBACK_DAYS = 3;
const SOON_DAYS = 3;
/** A gap this long earns a welcome back. A weekend off does not. */
const AWAY_DAYS = 4;

const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** A class this close is worth interrupting for. */
export const LIVE_HEADS_UP_MINUTES = 15;
/** Within this, the companion counts down to a class rather than naming its time. */
const LIVE_COUNTDOWN_MINUTES = 60;

const liveHref = (session: LiveSession) => `/student/live/${session.id}`;

/**
 * What to say about live classes: any that are live now, then the next one if
 * it's today. Ten minutes out reads "starts in 10 minutes"; this evening reads
 * "is at 6:00 PM today".
 */
function liveNudges(sessions: LiveSession[], now: Date, say: (...wordings: string[]) => string): Nudge[] {
  const at = now.getTime();
  const byStart = (a: LiveSession, b: LiveSession) => Date.parse(a.startsAt) - Date.parse(b.startsAt);
  const nudges: Nudge[] = sessions
    .filter((session) => session.status === "live")
    .sort(byStart)
    .map((session) => ({
      id: `live-now-${session.id}`,
      mood: "celebrate",
      message: say(`“${session.title}” is live now.`, `“${session.title}” has started. Come on in.`),
      action: { label: "Join now", href: liveHref(session) },
      urgent: true,
    }));

  const next = sessions
    .filter((session) => session.status === "upcoming" && Date.parse(session.endsAt) > at)
    .sort(byStart)[0];
  if (!next) return nudges;

  const minutes = Math.ceil((Date.parse(next.startsAt) - at) / 60_000);
  const setup = { label: "Check your setup", href: liveHref(next) };
  if (minutes <= 0) {
    nudges.push({
      id: `live-soon-${next.id}`,
      mood: "happy",
      message: `“${next.title}” should start any minute. You can join as soon as the host lets everyone in.`,
      action: setup,
      urgent: true,
    });
  } else if (minutes <= LIVE_COUNTDOWN_MINUTES) {
    const inTime = `in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
    nudges.push({
      id: `live-soon-${next.id}`,
      mood: "happy",
      message:
        minutes <= LIVE_HEADS_UP_MINUTES
          ? `“${next.title}” starts ${inTime}. Check your mic and camera while you wait.`
          : `“${next.title}” starts ${inTime}.`,
      action: setup,
      urgent: minutes <= LIVE_HEADS_UP_MINUTES,
    });
  } else if (new Date(next.startsAt).toDateString() === now.toDateString()) {
    nudges.push({
      id: `live-today-${next.id}`,
      mood: "happy",
      message: `“${next.title}” is at ${clock.format(new Date(next.startsAt))} today.`,
      action: { label: "See sessions", href: "/student/live" },
      urgent: false,
    });
  }
  return nudges;
}

function dueLabel(dueAt: string, now: Date) {
  const due = new Date(dueAt);
  const tomorrow = new Date(now.getTime() + DAY_MS);
  return due.toDateString() === tomorrow.toDateString()
    ? "tomorrow"
    : `on ${weekday.format(due)}`;
}

const open = (deadline: Deadline) =>
  deadline.href ? { label: "Open it", href: deadline.href } : undefined;

/** The lesson an assignment belongs to, when the student hasn't finished it yet. */
function unwatchedLesson(topics: CurriculumTopic[], deadline: Deadline) {
  for (const topic of topics) {
    for (const { assignment, lesson } of topicAssignments(topic)) {
      if (`assignment-${assignment.id}` !== deadline.key) continue;
      return lesson && !isCompleted(lesson) ? lesson : null;
    }
  }
  return null;
}

/**
 * Everything worth telling the student right now, most pressing first. The
 * first one is what the companion says; the rest fill its "Today" list.
 * Always returns at least one, so the companion is never lost for words.
 *
 * Where two facts bear on each other they are said together: a deadline whose
 * lesson is unwatched, a deadline alongside requested changes, a week with
 * nothing left in it.
 */
export function buildNudges({
  now = new Date(),
  enrollment,
  notEnrolled = false,
  current,
  deadlines,
  submissions,
  controlTowerWeek,
  daysAway = 0,
  topics = [],
  liveSessions = [],
  variant = Math.floor(now.getTime() / DAY_MS),
}: NudgeInput): Nudge[] {
  const nudges: Nudge[] = [];
  const say = (...wordings: string[]) => wordings[variant % wordings.length];
  const live = liveNudges(liveSessions, now, say);

  const changes = submissions.filter((item) => item.status === "CHANGES_REQUESTED");
  const titleOf = (submission: StudentSubmission, fallback: string) =>
    submission.assignment?.title ?? fallback;

  const dueToday = deadlines.filter((item) => item.state === "dueToday");
  if (dueToday.length > 0) {
    const [first] = dueToday;
    const lesson = unwatchedLesson(topics, first);

    let message: string;
    if (lesson) {
      message = `“${first.title}” is due today. Watch “${lesson.title}” first, it’s what the assignment is on.`;
    } else if (dueToday.length > 1) {
      message = `${dueToday.length} things are due today. Start with “${first.title}”.`;
    } else if (changes.length > 0) {
      message = `“${first.title}” is due today, so do that first. The changes on “${titleOf(changes[0], "your other work")}” can follow.`;
    } else {
      message = say(
        `“${first.title}” is due today.`,
        `Today’s the day for “${first.title}”.`,
        `“${first.title}” is due before the day ends.`,
      );
    }

    nudges.push({
      id: `due-today-${first.key}`,
      mood: "worried",
      message,
      action: lesson ? { label: "Watch the lesson", href: lessonHref(lesson.id) } : open(first),
      urgent: true,
      target: "deadlines",
    });
  }

  for (const submission of changes) {
    nudges.push({
      id: `changes-${submission.id}`,
      mood: "thinking",
      message: `Your reviewer asked for changes on “${titleOf(submission, "an assignment")}”.`,
      action: { label: "See what to fix", href: assignmentHref(submission.assignmentId) },
      urgent: true,
    });
  }

  const towerOpen = controlTowerWeek !== undefined && !isWeekCompleted(controlTowerWeek.metric);
  if (controlTowerWeek && towerOpen) {
    const daysLeft = daysLeftIn(controlTowerWeek.weekEnd, now);
    const closing = daysLeft <= 2;
    nudges.push({
      id: `control-tower-${controlTowerWeek.weekStart}`,
      mood: closing ? "worried" : "happy",
      message:
        daysLeft <= 1
          ? "This week’s Control Tower closes today."
          : closing
            ? `This week’s Control Tower closes in ${daysLeft} days.`
            : say(
                "This week’s Control Tower is open whenever you’re ready.",
                "Your Control Tower for the week is open.",
              ),
      action: { label: "Fill it in", href: "/student/control-tower" },
      urgent: closing,
    });
  }

  for (const submission of submissions) {
    const reviewed = submission.status === "GRADED" || submission.status === "REVIEWED";
    if (!reviewed || !submission.reviewedAt) continue;
    const age = now.getTime() - new Date(submission.reviewedAt).getTime();
    if (age > FRESH_FEEDBACK_DAYS * DAY_MS) continue;
    const title = titleOf(submission, "your assignment");
    nudges.push({
      id: `feedback-${submission.id}`,
      mood: "proud",
      message: say(`Feedback is in on “${title}”.`, `Your reviewer has replied on “${title}”.`),
      action: { label: "Read it", href: assignmentHref(submission.assignmentId) },
      urgent: false,
    });
  }

  const next = deadlines.find((item) => item.state !== "dueToday");
  const dueSoon =
    next && new Date(next.dueAt).getTime() - now.getTime() <= SOON_DAYS * DAY_MS ? next : null;
  if (dueSoon) {
    const lesson = unwatchedLesson(topics, dueSoon);
    const when = dueLabel(dueSoon.dueAt, now);
    nudges.push({
      id: `due-soon-${dueSoon.key}`,
      mood: "happy",
      message: lesson
        ? `“${dueSoon.title}” is due ${when}, and “${lesson.title}” is still to watch. Start there.`
        : `“${dueSoon.title}” is due ${when}.`,
      action: lesson ? { label: "Watch the lesson", href: lessonHref(lesson.id) } : open(dueSoon),
      urgent: false,
    });
  }

  // Said after anything pressing, and never as a telling-off.
  const welcomeBack = daysAway >= AWAY_DAYS && !notEnrolled;
  if (welcomeBack) {
    nudges.push({
      id: "welcome-back",
      mood: "proud",
      message:
        daysAway < 14
          ? say(
              `${daysAway} sunrises since you were last here. I kept your spot.`,
              `Good to see you. It has been ${daysAway} days, and your spot is just as you left it.`,
            )
          : "It has been a while. I kept growing right where you left me.",
      action:
        current && !current.trackComplete
          ? { label: "Pick up where you stopped", href: current.href }
          : undefined,
      urgent: false,
    });
  }

  // Nothing due, nothing to fix and the week's check-in done: room to get ahead.
  const clearWeek =
    nudges.length === 0 && controlTowerWeek !== undefined && !towerOpen && deadlines.length === 0;

  if (notEnrolled) {
    nudges.push({
      id: "not-enrolled",
      mood: "happy",
      message: "Your modules will show up here once you’re enrolled on a track.",
      urgent: false,
    });
  } else if (current?.trackComplete) {
    nudges.push({
      id: "track-complete",
      mood: "celebrate",
      message: `You’ve completed every lesson on ${enrollment?.track.name ?? "your track"}.`,
      action: { label: "Review track", href: current.href },
      urgent: false,
    });
  } else if (current && welcomeBack) {
    // The welcome back already offers to resume.
  } else if (current) {
    const lesson = current.lessonTitle ?? current.moduleTitle;
    nudges.push(
      clearWeek
        ? {
            id: `clear-week-${current.href}`,
            mood: "proud",
            message: `You’re clear for the week. A good moment to get ahead with ${lesson}.`,
            action: { label: "Get ahead", href: current.href },
            urgent: false,
          }
        : {
            id: `resume-${current.href}`,
            mood: "happy",
            message: say(
              `Pick up where you stopped: ${lesson}.`,
              `${lesson} is waiting where you left it.`,
              `Next up: ${lesson}.`,
            ),
            action: { label: "Resume", href: current.href },
            urgent: false,
          },
    );
  } else if (enrollment) {
    nudges.push({
      id: "first-module",
      mood: "happy",
      message: say(
        "Your first module is ready when you are.",
        "Everything starts with module one. It’s ready.",
      ),
      action: { label: "View curriculum", href: LESSONS_BASE },
      urgent: false,
    });
  }

  if (nudges.length === 0 && live.length === 0) {
    nudges.push({
      id: "all-clear",
      mood: "happy",
      message: say("Nothing needs you right now.", "All quiet today. Enjoy it."),
      urgent: false,
    });
  }

  // The welcome leads everything that isn't pressing.
  const welcome = nudges.findIndex((item) => item.id === "welcome-back");
  const firstCalm = nudges.findIndex((item) => !item.urgent);
  if (welcome > firstCalm) nudges.splice(firstCalm, 0, ...nudges.splice(welcome, 1));

  // A class about to start beats everything; one later today leads the calm things.
  const calmAt = nudges.findIndex((item) => !item.urgent);
  nudges.splice(calmAt === -1 ? nudges.length : calmAt, 0, ...live.filter((item) => !item.urgent));
  nudges.unshift(...live.filter((item) => item.urgent));

  return nudges;
}
