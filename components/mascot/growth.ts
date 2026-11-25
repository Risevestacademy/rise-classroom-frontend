export const MASCOT_STAGES = [
  "Seed",
  "Sprout",
  "Seedling",
  "Growing",
  "Lush",
  "Bud",
  "Bloom",
] as const;

export type MascotStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const BLOOM = 6;

/**
 * Share of the track's lessons each stage starts at. Early stages come fast so
 * new students get quick wins; Bloom comes before the end so they get to enjoy it.
 */
export const STAGE_STARTS = [0, 0.05, 0.15, 0.3, 0.5, 0.7, 0.85] as const;

/** How far towards the next stage the plant grows between stages; the rest is the stage's jump. */
const BETWEEN_STAGES = 0.25;

/** Share of the cohort elapsed, clamped to 0–1. */
export function cohortProgress(start: Date, end: Date, now: Date = new Date()) {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / total));
}

export function stageFromProgress(progress: number): MascotStage {
  let stage = 0;
  while (stage < BLOOM && progress >= STAGE_STARTS[stage + 1]) stage += 1;
  return stage as MascotStage;
}

/**
 * Growth as a number from 0 (seed) to 6 (bloom). The whole part is the stage.
 * Between stages the plant only grows a little, so reaching a stage is a
 * visible jump rather than one more small step.
 */
export function growthFromProgress(progress: number) {
  const stage = stageFromProgress(progress);
  if (stage === BLOOM) return BLOOM;
  const start = STAGE_STARTS[stage];
  const towardsNext = (progress - start) / (STAGE_STARTS[stage + 1] - start);
  return stage + Math.max(0, towardsNext) * BETWEEN_STAGES;
}

/** Growth earned from lessons completed. Completed lessons never drop, so it never wilts. */
export function growthFromLessons(completed: number, total: number) {
  return total <= 0 ? 0 : growthFromProgress(completed / total);
}

export function stageFromLessons(completed: number, total: number): MascotStage {
  return total <= 0 ? 0 : stageFromProgress(completed / total);
}

/** Lessons still to complete before the plant reaches its next stage; 0 once in bloom. */
export function lessonsToNextStage(completed: number, total: number) {
  const stage = stageFromLessons(completed, total);
  if (stage === BLOOM) return 0;
  // The small nudge keeps float error (20 × 0.15 = 3.0000000000000004) from adding a lesson.
  return Math.max(1, Math.ceil(total * STAGE_STARTS[stage + 1] - 1e-9) - completed);
}
