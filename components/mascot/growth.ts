export const MASCOT_STAGES = [
  "Seed",
  "Sprout",
  "Seedling",
  "Growing",
  "Leafy",
  "Bloom",
] as const;

export type MascotStage = 0 | 1 | 2 | 3 | 4 | 5;

/** Share of the cohort elapsed, clamped to 0–1. */
export function cohortProgress(start: Date, end: Date, now: Date = new Date()) {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / total));
}

/** Bloom is reserved for the end of the cohort; the other stages split the rest evenly. */
export function stageFromProgress(progress: number): MascotStage {
  if (progress >= 1) return 5;
  return Math.min(4, Math.floor(progress * 5)) as MascotStage;
}
