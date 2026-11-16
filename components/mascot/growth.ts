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

/** Share of the cohort elapsed, clamped to 0–1. */
export function cohortProgress(start: Date, end: Date, now: Date = new Date()) {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / total));
}

/**
 * Growth as a number from 0 (seed) to 6 (bloom). The whole part is the stage;
 * the fraction is how far the plant has grown towards the next one, so every
 * step of progress shows. Bloom is reserved for the very end.
 */
export function growthFromProgress(progress: number) {
  if (progress >= 1) return BLOOM;
  return Math.min(BLOOM - 0.01, Math.max(0, progress) * BLOOM);
}

export function stageFromProgress(progress: number): MascotStage {
  return Math.floor(growthFromProgress(progress)) as MascotStage;
}

/** Growth earned from lessons completed. Completed lessons never drop, so it never wilts. */
export function growthFromLessons(completed: number, total: number) {
  return total <= 0 ? 0 : growthFromProgress(completed / total);
}

export function stageFromLessons(completed: number, total: number): MascotStage {
  return Math.floor(growthFromLessons(completed, total)) as MascotStage;
}

/** Lessons still to complete before the plant reaches its next stage; 0 once in bloom. */
export function lessonsToNextStage(completed: number, total: number) {
  const stage = stageFromLessons(completed, total);
  if (stage === BLOOM) return 0;
  return Math.max(1, Math.ceil((total * (stage + 1)) / BLOOM) - completed);
}
