/**
 * SAMPLE DATA — not real.
 *
 * PENDING-BACKEND: the module page design has an "Instructor" card and a
 * "Live classes" schedule, but no student endpoint returns the instructor or
 * scheduled live classes yet (recordings only come after a class, per lesson).
 * These helpers fill both cards so the layout can be reviewed against the
 * design.
 *
 * Only shown in local development (process.env.NODE_ENV === "development");
 * deployed builds show the cards' empty states.
 */

import type { CurriculumTopic } from "@/lib/student-lessons";

export const SHOW_MODULE_SAMPLE_DATA = process.env.NODE_ENV === "development";

export type ModuleInstructor = { name: string; email: string };

export type ScheduledClass = { id: string; title: string; startsAt: Date };

export function getSampleInstructor(): ModuleInstructor {
  return { name: "Tunde Bello", email: "tunde.bello@email.com" };
}

/** One class a week, named after the module's lessons. */
export function getSampleClasses(topic: CurriculumTopic): ScheduledClass[] {
  const titles = topic.lessons.length
    ? topic.lessons.map((lesson) => lesson.title)
    : ["Foundations", "Practice session", "Review"];
  const start = new Date();
  start.setHours(18, 0, 0, 0);
  return titles.slice(0, 3).map((title, index) => ({
    id: `sample-class-${index}`,
    title,
    startsAt: new Date(start.getTime() + (index * 7 + 2) * 24 * 60 * 60 * 1000),
  }));
}
